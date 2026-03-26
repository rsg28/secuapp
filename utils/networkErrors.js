/**
 * Fallo de transporte (sin Wi‑Fi real, DNS, timeout, etc.).
 * No incluye HTTP 4xx/5xx: esos vienen como response.ok === false.
 */
function isNetworkFailure(err) {
  const m = err && err.message ? String(err.message) : '';
  const l = m.toLowerCase();
  return (
    m === 'Network request failed' ||
    l.includes('network request failed') ||
    l.includes('failed to fetch') ||
    l.includes('network error')
  );
}

module.exports = { isNetworkFailure };
