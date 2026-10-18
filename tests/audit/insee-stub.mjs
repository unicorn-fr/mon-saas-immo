// Environnement de test sans accès à internet : l'API de l'INSEE (IRL) est remplacée par des valeurs de test.
// Chargé seulement par l'API locale de l'audit : NODE_OPTIONS="--import ./tests/audit/insee-stub.mjs".
const real = globalThis.fetch
const quarters = [['2026-Q2', 146.68], ['2026-Q1', 146.15], ['2025-Q4', 145.78], ['2025-Q3', 145.77], ['2025-Q2', 145.17], ['2025-Q1', 145.47], ['2024-Q4', 144.64], ['2024-Q3', 144.51], ['2024-Q2', 145.17]]
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.insee.fr')) {
    const obs = quarters.map(([q, v]) => `<Obs TIME_PERIOD="${q}" OBS_VALUE="${v}" DATE_JO="2026-07-15"/>`).join('')
    return new Response(`<?xml version="1.0"?><message>${obs}</message>`, { status: 200, headers: { 'Content-Type': 'application/xml' } })
  }
  return real(url, init)
}
