// Environnement de test sans accès à internet : l'INSEE (IRL) et la Géoplateforme (adresses) sont remplacées par des valeurs de test.
// Chargé seulement par l'API locale de l'audit : NODE_OPTIONS="--import ./tests/audit/insee-stub.mjs".
const real = globalThis.fetch
const quarters = [['2026-Q2', 146.68], ['2026-Q1', 146.15], ['2025-Q4', 145.78], ['2025-Q3', 145.77], ['2025-Q2', 145.17], ['2025-Q1', 145.47], ['2024-Q4', 144.64], ['2024-Q3', 144.51], ['2024-Q2', 145.17]]
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.insee.fr')) {
    const obs = quarters.map(([q, v]) => `<Obs TIME_PERIOD="${q}" OBS_VALUE="${v}" DATE_JO="2026-07-15"/>`).join('')
    return new Response(`<?xml version="1.0"?><message>${obs}</message>`, { status: 200, headers: { 'Content-Type': 'application/xml' } })
  }
  // Géoplateforme (suggestions d'adresses) : deux adresses de test.
  if (String(url).includes('data.geopf.fr/geocodage')) {
    const features = [['12 Rue de la Loge 34000 Montpellier', '34000', 'Montpellier', '34172'], ['12 Rue de la République 34000 Montpellier', '34000', 'Montpellier', '34172']].map(([label, postcode, city, citycode], i) => ({ properties: { label, postcode, city, citycode, id: `34172_test_${i}` } }))
    return new Response(JSON.stringify({ features }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return real(url, init)
}
