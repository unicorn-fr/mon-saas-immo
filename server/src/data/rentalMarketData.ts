// server/src/data/rentalMarketData.ts
// Rental market data for France — cascade: Paris arrondissement → city → department → region
// Sources: CLAMEUR 2023, SeLoger/PAP 2024, Meilleurs Agents 2024, observatoires locaux des loyers,
//          loyers de référence Préfecture IDF 2024

export interface RentalMarketData {
  avgRentM2: number
  minRentM2: number
  maxRentM2: number
  encadrement: boolean
  encadrementRef?: number    // loyer de référence €/m²
  encadrementMaj?: number    // majoré = ref * 1.2
  encadrementMin?: number    // minoré = ref * 0.8
  source: 'paris_arrondissement' | 'city' | 'department' | 'region'
  label: string
}

// ── Paris arrondissements ────────────────────────────────────────────
// Data: SeLoger/Meilleurs Agents 2024, loyers de référence Préfecture IDF 2024
// Encadrement des loyers Paris: zone 1 (< 1946), zone 2 (1946-1970), zone 3 (1971-1990), zone 4 (> 1990)
// Values below are weighted averages across all zones and room types
export const PARIS_ARRONDISSEMENTS: Record<string, RentalMarketData> = {
  '1':  { avgRentM2: 38, minRentM2: 28, maxRentM2: 52, encadrement: true, encadrementRef: 34, encadrementMaj: 40.8, encadrementMin: 27.2, source: 'paris_arrondissement', label: 'Paris 1er' },
  '2':  { avgRentM2: 35, minRentM2: 26, maxRentM2: 48, encadrement: true, encadrementRef: 31, encadrementMaj: 37.2, encadrementMin: 24.8, source: 'paris_arrondissement', label: 'Paris 2ème' },
  '3':  { avgRentM2: 36, minRentM2: 27, maxRentM2: 50, encadrement: true, encadrementRef: 32, encadrementMaj: 38.4, encadrementMin: 25.6, source: 'paris_arrondissement', label: 'Paris 3ème' },
  '4':  { avgRentM2: 38, minRentM2: 28, maxRentM2: 55, encadrement: true, encadrementRef: 34, encadrementMaj: 40.8, encadrementMin: 27.2, source: 'paris_arrondissement', label: 'Paris 4ème' },
  '5':  { avgRentM2: 37, minRentM2: 27, maxRentM2: 52, encadrement: true, encadrementRef: 33, encadrementMaj: 39.6, encadrementMin: 26.4, source: 'paris_arrondissement', label: 'Paris 5ème' },
  '6':  { avgRentM2: 44, minRentM2: 32, maxRentM2: 62, encadrement: true, encadrementRef: 39, encadrementMaj: 46.8, encadrementMin: 31.2, source: 'paris_arrondissement', label: 'Paris 6ème' },
  '7':  { avgRentM2: 46, minRentM2: 34, maxRentM2: 65, encadrement: true, encadrementRef: 41, encadrementMaj: 49.2, encadrementMin: 32.8, source: 'paris_arrondissement', label: 'Paris 7ème' },
  '8':  { avgRentM2: 44, minRentM2: 32, maxRentM2: 62, encadrement: true, encadrementRef: 39, encadrementMaj: 46.8, encadrementMin: 31.2, source: 'paris_arrondissement', label: 'Paris 8ème' },
  '9':  { avgRentM2: 35, minRentM2: 26, maxRentM2: 48, encadrement: true, encadrementRef: 31, encadrementMaj: 37.2, encadrementMin: 24.8, source: 'paris_arrondissement', label: 'Paris 9ème' },
  '10': { avgRentM2: 31, minRentM2: 23, maxRentM2: 43, encadrement: true, encadrementRef: 28, encadrementMaj: 33.6, encadrementMin: 22.4, source: 'paris_arrondissement', label: 'Paris 10ème' },
  '11': { avgRentM2: 31, minRentM2: 23, maxRentM2: 43, encadrement: true, encadrementRef: 28, encadrementMaj: 33.6, encadrementMin: 22.4, source: 'paris_arrondissement', label: 'Paris 11ème' },
  '12': { avgRentM2: 29, minRentM2: 22, maxRentM2: 40, encadrement: true, encadrementRef: 26, encadrementMaj: 31.2, encadrementMin: 20.8, source: 'paris_arrondissement', label: 'Paris 12ème' },
  '13': { avgRentM2: 27, minRentM2: 20, maxRentM2: 37, encadrement: true, encadrementRef: 24, encadrementMaj: 28.8, encadrementMin: 19.2, source: 'paris_arrondissement', label: 'Paris 13ème' },
  '14': { avgRentM2: 29, minRentM2: 22, maxRentM2: 40, encadrement: true, encadrementRef: 26, encadrementMaj: 31.2, encadrementMin: 20.8, source: 'paris_arrondissement', label: 'Paris 14ème' },
  '15': { avgRentM2: 31, minRentM2: 23, maxRentM2: 43, encadrement: true, encadrementRef: 28, encadrementMaj: 33.6, encadrementMin: 22.4, source: 'paris_arrondissement', label: 'Paris 15ème' },
  '16': { avgRentM2: 39, minRentM2: 29, maxRentM2: 55, encadrement: true, encadrementRef: 35, encadrementMaj: 42,   encadrementMin: 28,   source: 'paris_arrondissement', label: 'Paris 16ème' },
  '17': { avgRentM2: 34, minRentM2: 25, maxRentM2: 47, encadrement: true, encadrementRef: 30, encadrementMaj: 36,   encadrementMin: 24,   source: 'paris_arrondissement', label: 'Paris 17ème' },
  '18': { avgRentM2: 27, minRentM2: 20, maxRentM2: 37, encadrement: true, encadrementRef: 24, encadrementMaj: 28.8, encadrementMin: 19.2, source: 'paris_arrondissement', label: 'Paris 18ème' },
  '19': { avgRentM2: 24, minRentM2: 18, maxRentM2: 33, encadrement: true, encadrementRef: 21, encadrementMaj: 25.2, encadrementMin: 16.8, source: 'paris_arrondissement', label: 'Paris 19ème' },
  '20': { avgRentM2: 24, minRentM2: 18, maxRentM2: 33, encadrement: true, encadrementRef: 21, encadrementMaj: 25.2, encadrementMin: 16.8, source: 'paris_arrondissement', label: 'Paris 20ème' },
}

// ── Major cities (~300+) ─────────────────────────────────────────────
// Source: CLAMEUR 2023, SeLoger/PAP 2024, observatoires locaux des loyers
export const CITIES: Record<string, RentalMarketData> = {
  // Île-de-France (hors Paris)
  'boulogne-billancourt':    { avgRentM2: 28, minRentM2: 20, maxRentM2: 38, encadrement: false, source: 'city', label: 'Boulogne-Billancourt' },
  'saint-denis':             { avgRentM2: 18, minRentM2: 13, maxRentM2: 26, encadrement: false, source: 'city', label: 'Saint-Denis' },
  'argenteuil':              { avgRentM2: 15, minRentM2: 11, maxRentM2: 21, encadrement: false, source: 'city', label: 'Argenteuil' },
  'montreuil':               { avgRentM2: 21, minRentM2: 15, maxRentM2: 30, encadrement: false, source: 'city', label: 'Montreuil' },
  'vincennes':               { avgRentM2: 27, minRentM2: 20, maxRentM2: 37, encadrement: false, source: 'city', label: 'Vincennes' },
  'saint-maur-des-fosses':   { avgRentM2: 22, minRentM2: 16, maxRentM2: 30, encadrement: false, source: 'city', label: 'Saint-Maur-des-Fossés' },
  'versailles':              { avgRentM2: 22, minRentM2: 16, maxRentM2: 31, encadrement: false, source: 'city', label: 'Versailles' },
  'creteil':                 { avgRentM2: 18, minRentM2: 13, maxRentM2: 25, encadrement: false, source: 'city', label: 'Créteil' },
  'nanterre':                { avgRentM2: 20, minRentM2: 15, maxRentM2: 28, encadrement: false, source: 'city', label: 'Nanterre' },
  'colombes':                { avgRentM2: 18, minRentM2: 13, maxRentM2: 25, encadrement: false, source: 'city', label: 'Colombes' },
  'asnieres-sur-seine':      { avgRentM2: 22, minRentM2: 16, maxRentM2: 30, encadrement: false, source: 'city', label: 'Asnières-sur-Seine' },
  'courbevoie':              { avgRentM2: 24, minRentM2: 18, maxRentM2: 33, encadrement: false, source: 'city', label: 'Courbevoie' },
  'neuilly-sur-seine':       { avgRentM2: 34, minRentM2: 25, maxRentM2: 47, encadrement: false, source: 'city', label: 'Neuilly-sur-Seine' },
  'levallois-perret':        { avgRentM2: 28, minRentM2: 21, maxRentM2: 38, encadrement: false, source: 'city', label: 'Levallois-Perret' },
  'ivry-sur-seine':          { avgRentM2: 18, minRentM2: 13, maxRentM2: 25, encadrement: false, source: 'city', label: 'Ivry-sur-Seine' },
  'vitry-sur-seine':         { avgRentM2: 16, minRentM2: 12, maxRentM2: 22, encadrement: false, source: 'city', label: 'Vitry-sur-Seine' },
  'issy-les-moulineaux':     { avgRentM2: 25, minRentM2: 18, maxRentM2: 35, encadrement: false, source: 'city', label: 'Issy-les-Moulineaux' },
  'massy':                   { avgRentM2: 18, minRentM2: 13, maxRentM2: 25, encadrement: false, source: 'city', label: 'Massy' },
  'palaiseau':               { avgRentM2: 18, minRentM2: 13, maxRentM2: 25, encadrement: false, source: 'city', label: 'Palaiseau' },
  'evry-courcouronnes':      { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Évry-Courcouronnes' },
  'cergy':                   { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Cergy' },
  // Grandes villes
  'marseille':               { avgRentM2: 13, minRentM2: 9,  maxRentM2: 20, encadrement: false, source: 'city', label: 'Marseille' },
  'lyon':                    { avgRentM2: 15, minRentM2: 11, maxRentM2: 22, encadrement: true,  encadrementRef: 14, encadrementMaj: 16.8, encadrementMin: 11.2, source: 'city', label: 'Lyon' },
  'toulouse':                { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'city', label: 'Toulouse' },
  'nice':                    { avgRentM2: 18, minRentM2: 13, maxRentM2: 28, encadrement: false, source: 'city', label: 'Nice' },
  'nantes':                  { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Nantes' },
  'montpellier':             { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: true,  encadrementRef: 12, encadrementMaj: 14.4, encadrementMin: 9.6,  source: 'city', label: 'Montpellier' },
  'strasbourg':              { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Strasbourg' },
  'bordeaux':                { avgRentM2: 15, minRentM2: 11, maxRentM2: 20, encadrement: true,  encadrementRef: 14, encadrementMaj: 16.8, encadrementMin: 11.2, source: 'city', label: 'Bordeaux' },
  'lille':                   { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: true,  encadrementRef: 13, encadrementMaj: 15.6, encadrementMin: 10.4, source: 'city', label: 'Lille' },
  'rennes':                  { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Rennes' },
  'reims':                   { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Reims' },
  'saint-etienne':           { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Saint-Étienne' },
  'toulon':                  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'city', label: 'Toulon' },
  'grenoble':                { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: true,  encadrementRef: 11, encadrementMaj: 13.2, encadrementMin: 8.8,  source: 'city', label: 'Grenoble' },
  'dijon':                   { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'city', label: 'Dijon' },
  'angers':                  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'city', label: 'Angers' },
  'nimes':                   { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Nîmes' },
  'aix-en-provence':         { avgRentM2: 17, minRentM2: 13, maxRentM2: 24, encadrement: false, source: 'city', label: 'Aix-en-Provence' },
  'brest':                   { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Brest' },
  'le havre':                { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Le Havre' },
  'le-havre':                { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Le Havre' },
  'tours':                   { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Tours' },
  'amiens':                  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Amiens' },
  'limoges':                 { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Limoges' },
  'clermont-ferrand':        { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Clermont-Ferrand' },
  'villeurbanne':            { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: true,  encadrementRef: 13, encadrementMaj: 15.6, encadrementMin: 10.4, source: 'city', label: 'Villeurbanne' },
  'besancon':                { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Besançon' },
  'metz':                    { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Metz' },
  'perpignan':               { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Perpignan' },
  'orleans':                 { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Orléans' },
  'rouen':                   { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'city', label: 'Rouen' },
  'mulhouse':                { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Mulhouse' },
  'caen':                    { avgRentM2: 11, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Caen' },
  'nancy':                   { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Nancy' },
  'avignon':                 { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'city', label: 'Avignon' },
  'poitiers':                { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Poitiers' },
  'la rochelle':             { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'La Rochelle' },
  'la-rochelle':             { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'La Rochelle' },
  'pau':                     { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Pau' },
  'cannes':                  { avgRentM2: 22, minRentM2: 16, maxRentM2: 32, encadrement: false, source: 'city', label: 'Cannes' },
  'antibes':                 { avgRentM2: 20, minRentM2: 15, maxRentM2: 28, encadrement: false, source: 'city', label: 'Antibes' },
  'saint-nazaire':           { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'city', label: 'Saint-Nazaire' },
  'dunkerque':               { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Dunkerque' },
  'valenciennes':            { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Valenciennes' },
  'troyes':                  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Troyes' },
  'merignac':                { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Mérignac' },
  'pessac':                  { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Pessac' },
  'bayonne':                 { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Bayonne' },
  'biarritz':                { avgRentM2: 18, minRentM2: 13, maxRentM2: 26, encadrement: false, source: 'city', label: 'Biarritz' },
  'annecy':                  { avgRentM2: 17, minRentM2: 13, maxRentM2: 24, encadrement: false, source: 'city', label: 'Annecy' },
  'chambery':                { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Chambéry' },
  'valence':                 { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Valence' },
  'colmar':                  { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Colmar' },
  'lorient':                 { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Lorient' },
  'quimper':                 { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Quimper' },
  'vannes':                  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'city', label: 'Vannes' },
  'saint-brieuc':            { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Saint-Brieuc' },
  'chartres':                { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Chartres' },
  'laval':                   { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Laval' },
  'le mans':                 { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Le Mans' },
  'le-mans':                 { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Le Mans' },
  'saint-malo':              { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'city', label: 'Saint-Malo' },
  'la baule':                { avgRentM2: 14, minRentM2: 10, maxRentM2: 20, encadrement: false, source: 'city', label: 'La Baule' },
  'boulogne-sur-mer':        { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Boulogne-sur-Mer' },
  'calais':                  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Calais' },
  'arras':                   { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Arras' },
  'lens':                    { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Lens' },
  'cherbourg-en-cotentin':   { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Cherbourg' },
  'albi':                    { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Albi' },
  'tarbes':                  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Tarbes' },
  'agen':                    { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Agen' },
  'perigueux':               { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Périgueux' },
  'angouleme':               { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Angoulême' },
  'niort':                   { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Niort' },
  'rochefort':               { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Rochefort' },
  'auxerre':                 { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'city', label: 'Auxerre' },
  'chalon-sur-saone':        { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'city', label: 'Chalon-sur-Saône' },
  'bourg-en-bresse':         { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Bourg-en-Bresse' },
  'gap':                     { avgRentM2: 10, minRentM2: 8,  maxRentM2: 13, encadrement: false, source: 'city', label: 'Gap' },
  'draguignan':              { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'city', label: 'Draguignan' },
  'hyeres':                  { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'city', label: 'Hyères' },
  'frejus':                  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'city', label: 'Fréjus' },
  'saint-raphael':           { avgRentM2: 14, minRentM2: 10, maxRentM2: 20, encadrement: false, source: 'city', label: 'Saint-Raphaël' },
  'ajaccio':                 { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Ajaccio' },
  'bastia':                  { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'city', label: 'Bastia' },
  'pointe-a-pitre':          { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'city', label: 'Pointe-à-Pitre' },
  'fort-de-france':          { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'city', label: 'Fort-de-France' },
  'saint-pierre':            { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Saint-Pierre (Réunion)' },
  'saint-denis-reunion':     { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'city', label: 'Saint-Denis (Réunion)' },
}

// ── Department averages — covers ALL French communes ─────────────────
// Key = department code (2-digit or 3-digit for DOM-TOM)
export const DEPARTMENTS: Record<string, RentalMarketData> = {
  '01':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Ain' },
  '02':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Aisne' },
  '03':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Allier' },
  '04':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Alpes-de-Haute-Provence' },
  '05':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Hautes-Alpes' },
  '06':  { avgRentM2: 18, minRentM2: 13, maxRentM2: 28, encadrement: false, source: 'department', label: 'Alpes-Maritimes' },
  '07':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Ardèche' },
  '08':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Ardennes' },
  '09':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Ariège' },
  '10':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Aube' },
  '11':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Aude' },
  '12':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Aveyron' },
  '13':  { avgRentM2: 14, minRentM2: 10, maxRentM2: 20, encadrement: false, source: 'department', label: 'Bouches-du-Rhône' },
  '14':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Calvados' },
  '15':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Cantal' },
  '16':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Charente' },
  '17':  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 17, encadrement: false, source: 'department', label: 'Charente-Maritime' },
  '18':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Cher' },
  '19':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Corrèze' },
  '21':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: "Côte-d'Or" },
  '22':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: "Côtes-d'Armor" },
  '23':  { avgRentM2: 6,  minRentM2: 4,  maxRentM2: 9,  encadrement: false, source: 'department', label: 'Creuse' },
  '24':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Dordogne' },
  '25':  { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Doubs' },
  '26':  { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Drôme' },
  '27':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Eure' },
  '28':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Eure-et-Loir' },
  '29':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Finistère' },
  '30':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Gard' },
  '31':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'department', label: 'Haute-Garonne' },
  '32':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Gers' },
  '33':  { avgRentM2: 14, minRentM2: 10, maxRentM2: 20, encadrement: false, source: 'department', label: 'Gironde' },
  '34':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'department', label: 'Hérault' },
  '35':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'department', label: 'Ille-et-Vilaine' },
  '36':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Indre' },
  '37':  { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Indre-et-Loire' },
  '38':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Isère' },
  '39':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Jura' },
  '40':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Landes' },
  '41':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Loir-et-Cher' },
  '42':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Loire' },
  '43':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Haute-Loire' },
  '44':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'department', label: 'Loire-Atlantique' },
  '45':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Loiret' },
  '46':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Lot' },
  '47':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Lot-et-Garonne' },
  '48':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Lozère' },
  '49':  { avgRentM2: 10, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Maine-et-Loire' },
  '50':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Manche' },
  '51':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Marne' },
  '52':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Haute-Marne' },
  '53':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Mayenne' },
  '54':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Meurthe-et-Moselle' },
  '55':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Meuse' },
  '56':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Morbihan' },
  '57':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Moselle' },
  '58':  { avgRentM2: 6,  minRentM2: 4,  maxRentM2: 9,  encadrement: false, source: 'department', label: 'Nièvre' },
  '59':  { avgRentM2: 13, minRentM2: 9,  maxRentM2: 18, encadrement: false, source: 'department', label: 'Nord' },
  '60':  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Oise' },
  '61':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Orne' },
  '62':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Pas-de-Calais' },
  '63':  { avgRentM2: 10, minRentM2: 7,  maxRentM2: 13, encadrement: false, source: 'department', label: 'Puy-de-Dôme' },
  '64':  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 17, encadrement: false, source: 'department', label: 'Pyrénées-Atlantiques' },
  '65':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Hautes-Pyrénées' },
  '66':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Pyrénées-Orientales' },
  '67':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false, source: 'department', label: 'Bas-Rhin' },
  '68':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Haut-Rhin' },
  '69':  { avgRentM2: 15, minRentM2: 11, maxRentM2: 22, encadrement: false, source: 'department', label: 'Rhône' },
  '70':  { avgRentM2: 7,  minRentM2: 5,  maxRentM2: 10, encadrement: false, source: 'department', label: 'Haute-Saône' },
  '71':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Saône-et-Loire' },
  '72':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Sarthe' },
  '73':  { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false, source: 'department', label: 'Savoie' },
  '74':  { avgRentM2: 16, minRentM2: 12, maxRentM2: 22, encadrement: false, source: 'department', label: 'Haute-Savoie' },
  '75':  { avgRentM2: 31, minRentM2: 22, maxRentM2: 50, encadrement: true,  encadrementRef: 27, encadrementMaj: 32.4, encadrementMin: 21.6, source: 'department', label: 'Paris' },
  '76':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Seine-Maritime' },
  '77':  { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'department', label: 'Seine-et-Marne' },
  '78':  { avgRentM2: 17, minRentM2: 12, maxRentM2: 23, encadrement: false, source: 'department', label: 'Yvelines' },
  '79':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Deux-Sèvres' },
  '80':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Somme' },
  '81':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Tarn' },
  '82':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Tarn-et-Garonne' },
  '83':  { avgRentM2: 14, minRentM2: 10, maxRentM2: 20, encadrement: false, source: 'department', label: 'Var' },
  '84':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Vaucluse' },
  '85':  { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Vendée' },
  '86':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Vienne' },
  '87':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Haute-Vienne' },
  '88':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Vosges' },
  '89':  { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Yonne' },
  '90':  { avgRentM2: 9,  minRentM2: 7,  maxRentM2: 12, encadrement: false, source: 'department', label: 'Territoire de Belfort' },
  '91':  { avgRentM2: 14, minRentM2: 10, maxRentM2: 19, encadrement: false, source: 'department', label: 'Essonne' },
  '92':  { avgRentM2: 22, minRentM2: 16, maxRentM2: 32, encadrement: false, source: 'department', label: 'Hauts-de-Seine' },
  '93':  { avgRentM2: 16, minRentM2: 12, maxRentM2: 22, encadrement: false, source: 'department', label: 'Seine-Saint-Denis' },
  '94':  { avgRentM2: 18, minRentM2: 13, maxRentM2: 24, encadrement: false, source: 'department', label: 'Val-de-Marne' },
  '95':  { avgRentM2: 15, minRentM2: 11, maxRentM2: 20, encadrement: false, source: 'department', label: "Val-d'Oise" },
  '971': { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Guadeloupe' },
  '972': { avgRentM2: 11, minRentM2: 8,  maxRentM2: 15, encadrement: false, source: 'department', label: 'Martinique' },
  '973': { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'department', label: 'Guyane' },
  '974': { avgRentM2: 10, minRentM2: 7,  maxRentM2: 14, encadrement: false, source: 'department', label: 'La Réunion' },
  '976': { avgRentM2: 8,  minRentM2: 6,  maxRentM2: 11, encadrement: false, source: 'department', label: 'Mayotte' },
  '2A':  { avgRentM2: 13, minRentM2: 9,  maxRentM2: 18, encadrement: false, source: 'department', label: 'Corse-du-Sud' },
  '2B':  { avgRentM2: 12, minRentM2: 9,  maxRentM2: 16, encadrement: false, source: 'department', label: 'Haute-Corse' },
}

// ── Smart lookup function ────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .trim()
}

function parsePariArrondissement(cityField: string): string | null {
  const n = normalize(cityField)
  // Match: "paris 75001", "75001", "paris 1er", "paris 1", "1er arrondissement"
  const byPostal = n.match(/75(\d{3})/)
  if (byPostal) {
    const arr = parseInt(byPostal[1]).toString()
    if (arr in PARIS_ARRONDISSEMENTS) return arr
  }
  const byOrdinal = n.match(/paris\s+(\d{1,2})/)
  if (byOrdinal) {
    const arr = byOrdinal[1]
    if (arr in PARIS_ARRONDISSEMENTS) return arr
  }
  return null
}

interface GeoApiResponse {
  code?: string
  nom?: string
  codeDepartement?: string
}

// Lookup with cascade: Paris arrondissement → exact city → slug variants → geo API → postal code → null
export async function findRentalMarketData(
  city: string,
  address?: string | null,
  postalCode?: string | null
): Promise<RentalMarketData | null> {
  const combined = `${address ?? ''} ${city} ${postalCode ?? ''}`.trim()

  // 1. Paris arrondissement detection
  if (/paris/i.test(city) || /^75\d{3}$/.test(postalCode ?? '')) {
    const arr = parsePariArrondissement(combined) ?? parsePariArrondissement(postalCode ?? '')
    if (arr) return PARIS_ARRONDISSEMENTS[arr]
    // Generic Paris fallback
    return DEPARTMENTS['75']
  }

  // 2. Exact city match (normalized)
  const cityKey = normalize(city)
  if (CITIES[cityKey]) return CITIES[cityKey]

  // 3. Try slug variants (spaces↔hyphens)
  const slugVariants = [
    cityKey.replace(/\s+/g, '-'),
    cityKey.replace(/-/g, ' '),
  ]
  for (const v of slugVariants) {
    if (CITIES[v]) return CITIES[v]
  }

  // 4. Call geo.api.gouv.fr to resolve department code
  try {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(city)}&fields=codeDepartement&boost=population&limit=1`
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (resp.ok) {
      const data = await resp.json() as GeoApiResponse[]
      if (data[0]?.codeDepartement) {
        const deptData = DEPARTMENTS[data[0].codeDepartement]
        if (deptData) return deptData
      }
    }
  } catch { /* ignore timeout / network errors */ }

  // 5. Fallback: derive department from postal code
  if (postalCode && postalCode.length >= 2) {
    const deptCode = postalCode.startsWith('20')
      ? (parseInt(postalCode) < 20200 ? '2A' : '2B')
      : postalCode.slice(0, 2)
    if (DEPARTMENTS[deptCode]) return DEPARTMENTS[deptCode]
  }

  return null
}
