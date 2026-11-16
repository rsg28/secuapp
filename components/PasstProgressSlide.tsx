import React, { forwardRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export interface PasstProgressSlideProps {
  year: number;
  monthlyCounts: number[];
  totalInspections: number;
  progressPercent: number;
  numerator: number;
  denominator: number;
  scope: 'organization' | 'personal';
  kpiLabel?: string;
  captureWidth?: number;
}

const PasstProgressSlide = forwardRef<View, PasstProgressSlideProps>(function PasstProgressSlide(
  {
    year,
    monthlyCounts,
    totalInspections,
    progressPercent,
    numerator,
    denominator,
    scope,
    kpiLabel = 'Empresas',
    captureWidth,
  },
  ref
) {
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = captureWidth ?? Math.min(windowWidth - 32, 420);
  const chartWidth = Math.max(slideWidth - 24, 260);
  const chartHeight = 180;
  const padX = 12;
  const padTop = 28;
  const padBottom = 8;
  const usableH = chartHeight - padTop - padBottom;
  const usableW = chartWidth - padX * 2;
  const counts = monthlyCounts?.length === 12 ? monthlyCounts : Array(12).fill(0);
  const maxCount = Math.max(...counts, 1);

  const points = counts.map((count, index) => {
    const x = padX + (index / 11) * usableW;
    const y = padTop + usableH - (count / maxCount) * usableH;
    return { x, y, count };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const percentLabel = Number.isInteger(progressPercent)
    ? String(progressPercent)
    : progressPercent.toFixed(1);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width: slideWidth }]}>
      <Text style={styles.title}>Checklists {year}</Text>
      <Text style={styles.subtitle}>{totalInspections} inspecciones cerradas en el año</Text>

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        {[0, 0.5, 1].map((t) => {
          const y = padTop + usableH * (1 - t);
          return (
            <Line
              key={`g-${t}`}
              x1={padX}
              y1={y}
              x2={chartWidth - padX}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}
        <Path d={pathData} stroke="#2563EB" strokeWidth="2.5" fill="none" />
        {points.map((p, i) => (
          <React.Fragment key={`pt-${i}`}>
            <Circle cx={p.x} cy={p.y} r="4" fill="#FBBF24" stroke="#2563EB" strokeWidth="1.5" />
            {p.count > 0 ? (
              <SvgText
                x={p.x}
                y={p.y - 10}
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                {String(p.count)}
              </SvgText>
            ) : null}
          </React.Fragment>
        ))}
      </Svg>

      <View style={[styles.monthRow, { width: chartWidth }]}>
        {MONTH_SHORT.map((label) => (
          <Text key={label} style={styles.monthLabel} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.kpiRow}>
        {scope === 'organization' ? (
          <>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{percentLabel}%</Text>
              <Text style={styles.kpiCaption}>Avance</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>
                {numerator}/{denominator}
              </Text>
              <Text style={styles.kpiCaption}>{kpiLabel} con checklist</Text>
            </View>
          </>
        ) : (
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{totalInspections}</Text>
            <Text style={styles.kpiCaption}>Tus checklists cerrados</Text>
          </View>
        )}
      </View>
    </View>
  );
});

export default PasstProgressSlide;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  chart: {
    alignSelf: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  monthLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E40AF',
  },
  kpiCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
});
