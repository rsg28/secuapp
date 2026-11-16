import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { parseSignature, signatureViewBox } from '../components/SignaturePad';
import {
  formatDateTime,
  formatVisitDate,
  mapsUrl,
  toNumber,
  Visit,
  VISIT_STATUS_LABELS,
} from '../services/visits';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const multiline = (value: string | null) => (value ? escapeHtml(value).replace(/\n/g, '<br/>') : '—');

function durationText(visit: Visit): string {
  if (!visit.check_in_at || !visit.check_out_at) return '—';
  const minutes = Math.round((new Date(visit.check_out_at).getTime() - new Date(visit.check_in_at).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function locationCell(lat: Visit['check_in_lat'], lng: Visit['check_in_lng'], accuracy: Visit['check_in_accuracy']) {
  const url = mapsUrl(lat, lng);
  if (!url) return 'Sin ubicación registrada';
  const acc = toNumber(accuracy);
  const coords = `${toNumber(lat)?.toFixed(6)}, ${toNumber(lng)?.toFixed(6)}`;
  return `<a href="${url}">${coords}</a>${acc !== null ? ` <span class="muted">(±${Math.round(acc)} m)</span>` : ''}`;
}

function signatureSvg(raw: string | null | undefined): string {
  const sig = parseSignature(raw);
  if (!sig) return '<div class="no-signature">Sin firma</div>';
  const paths = sig.paths
    .map((d) => `<path d="${escapeHtml(d)}" stroke="#111827" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return `<svg viewBox="${signatureViewBox(sig)}" preserveAspectRatio="xMidYMid meet" class="signature">${paths}</svg>`;
}

export function buildVisitHtml(visit: Visit): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; margin: 32px; }
  h1 { font-size: 20px; color: #1e40af; margin: 0 0 4px; }
  h2 { font-size: 14px; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 4px; margin: 20px 0 8px; }
  .subtitle { color: #6b7280; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  td.label { width: 32%; background: #f8fafc; font-weight: bold; }
  .muted { color: #6b7280; }
  .box { border: 1px solid #e5e7eb; padding: 10px; min-height: 40px; line-height: 1.5; }
  .signature-block { margin-top: 12px; width: 60%; }
  .signature { width: 100%; height: 120px; border-bottom: 1px solid #9ca3af; }
  .no-signature { height: 60px; border-bottom: 1px solid #9ca3af; color: #9ca3af; }
  .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>Informe de visita de supervisión</h1>
  <div class="subtitle">${escapeHtml(visit.company_name ?? '')} · ${escapeHtml(formatVisitDate(visit.scheduled_date))}</div>

  <h2>Datos de la visita</h2>
  <table>
    <tr><td class="label">Empresa / centro de trabajo</td><td>${escapeHtml(visit.company_name ?? '—')}</td></tr>
    <tr><td class="label">Dirección</td><td>${escapeHtml(visit.company_address || '—')}</td></tr>
    <tr><td class="label">Motivo</td><td>${escapeHtml(visit.purpose)}</td></tr>
    <tr><td class="label">Fecha programada</td><td>${escapeHtml(formatVisitDate(visit.scheduled_date))}${visit.scheduled_time ? ` · ${escapeHtml(visit.scheduled_time)}` : ''}</td></tr>
    <tr><td class="label">Responsable de la visita</td><td>${escapeHtml(visit.inspector_name || '—')}</td></tr>
    <tr><td class="label">Estado</td><td>${escapeHtml(VISIT_STATUS_LABELS[visit.status] ?? visit.status)}</td></tr>
  </table>

  <h2>Registro de asistencia</h2>
  <table>
    <tr><td class="label">Llegada (check-in)</td><td>${escapeHtml(formatDateTime(visit.check_in_at))}</td></tr>
    <tr><td class="label">Ubicación de llegada</td><td>${locationCell(visit.check_in_lat, visit.check_in_lng, visit.check_in_accuracy)}</td></tr>
    <tr><td class="label">Salida (check-out)</td><td>${escapeHtml(formatDateTime(visit.check_out_at))}</td></tr>
    <tr><td class="label">Ubicación de salida</td><td>${locationCell(visit.check_out_lat, visit.check_out_lng, visit.check_out_accuracy)}</td></tr>
    <tr><td class="label">Duración</td><td>${escapeHtml(durationText(visit))}</td></tr>
  </table>

  ${visit.notes ? `<h2>Indicaciones previas</h2><div class="box">${multiline(visit.notes)}</div>` : ''}

  <h2>Observaciones / hallazgos</h2>
  <div class="box">${multiline(visit.findings)}</div>

  <h2>Recomendaciones</h2>
  <div class="box">${multiline(visit.recommendations)}</div>

  <h2>Conformidad de la empresa</h2>
  <div class="signature-block">
    ${signatureSvg(visit.responsible_signature)}
    <div><strong>${escapeHtml(visit.responsible_name || '—')}</strong></div>
    <div class="muted">${escapeHtml(visit.responsible_position || '')}</div>
  </div>

  <div class="footer">Generado con SecuApp el ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
</body>
</html>`;
}

const safeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

/** Genera el PDF en el teléfono (funciona sin internet) y abre el menú para compartirlo. */
export async function shareVisitPdf(visit: Visit): Promise<void> {
  const html = buildVisitHtml(visit);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const fileName = `Visita_${safeFileName(visit.company_name || 'empresa')}_${visit.scheduled_date}.pdf`;
  const target = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: target });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartir archivos no está disponible en este dispositivo');
  }
  await Sharing.shareAsync(target, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartir informe de visita',
  });
}
