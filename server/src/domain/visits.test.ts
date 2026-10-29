import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeAudience, countedPath, DIRECT, isBot, parisDay, visitSource, type VisitRow } from './visits.js'

const OWN = ['bailio.fr', 'bailio.eu', 'localhost']

test('audience : seules les pages publiques sont comptées, jamais un lien privé', () => {
  assert.equal(countedPath('/'), '/')
  assert.equal(countedPath('/commencer/loyer/'), '/commencer/loyer')
  assert.equal(countedPath('/?utm_source=leboncoin'), '/')
  assert.equal(countedPath('/espace'), null)
  assert.equal(countedPath('/signer/abc123'), null)
  assert.equal(countedPath('/locataire/abc'), null)
  assert.equal(countedPath('/connexion/lien?jeton=secret'), null)
  assert.equal(countedPath('/guides'), '/guides')
  assert.equal(countedPath('/guides/depot-de-garantie?utm_source=pinterest'), '/guides/depot-de-garantie')
  assert.equal(countedPath('/guides/Depot_de_garantie'), null)
  assert.equal(countedPath('/guides/a/b'), null)
})

test('audience : provenance regroupée, lien marqué, accès direct, rechargement', () => {
  assert.equal(visitSource('https://www.google.fr/', undefined, OWN), 'Google')
  assert.equal(visitSource('https://www.google.com/search?q=bail', undefined, OWN), 'Google')
  assert.equal(visitSource('https://gemini.google.com/app', undefined, OWN), 'Gemini')
  assert.equal(visitSource('https://mail.google.com/mail/u/0/', undefined, OWN), 'Messagerie')
  assert.equal(visitSource('https://l.facebook.com/l.php?u=x', undefined, OWN), 'Facebook')
  assert.equal(visitSource('https://www.leboncoin.fr/ad/locations/1', undefined, OWN), 'Leboncoin')
  assert.equal(visitSource('https://chatgpt.com/', undefined, OWN), 'ChatGPT')
  assert.equal(visitSource('https://forum.exemple.org/sujet', undefined, OWN), 'forum.exemple.org')
  // Le paramètre utm_source du lien l'emporte.
  assert.equal(visitSource('https://www.google.fr/', 'Newsletter', OWN), 'newsletter')
  assert.equal(visitSource(undefined, '<script>', OWN), DIRECT)
  assert.equal(visitSource(undefined, undefined, OWN), DIRECT)
  assert.equal(visitSource('pas une adresse', undefined, OWN), DIRECT)
  // Venu du site lui-même : pas une nouvelle visite.
  assert.equal(visitSource('https://bailio.fr/conditions', undefined, OWN), null)
  assert.equal(visitSource('https://www.bailio.eu/', undefined, OWN), null)
})

test('audience : robots et aperçus de liens écartés', () => {
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true)
  assert.equal(isBot('facebookexternalhit/1.1'), true)
  assert.equal(isBot(undefined), true)
  assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'), false)
})

test('audience : jour à l’heure de Paris', () => {
  assert.equal(parisDay(new Date('2026-10-22T22:30:00Z')), '2026-10-23')
  assert.equal(parisDay(new Date('2026-10-22T21:30:00Z')), '2026-10-22')
})

test('audience : visites, provenances, parcours et semaines', () => {
  const now = new Date('2026-10-21T12:00:00Z')
  const day = (s: string) => new Date(`${s}T00:00:00Z`)
  const rows: VisitRow[] = [
    { day: day('2026-10-20'), path: '/', source: 'Google', views: 6, entries: 6 },
    { day: day('2026-10-20'), path: '/', source: DIRECT, views: 3, entries: 3 },
    { day: day('2026-10-20'), path: '/', source: 'Dans le site', views: 1, entries: 0 },
    { day: day('2026-10-19'), path: '/securite', source: 'Leboncoin', views: 1, entries: 1 },
    { day: day('2026-10-19'), path: '/commencer', source: 'Dans le site', views: 5, entries: 0 },
    { day: day('2026-10-19'), path: '/commencer/recevoir', source: 'Dans le site', views: 2, entries: 0 },
    // Plus de 30 jours : hors des chiffres du mois, mais dans le tableau des semaines.
    { day: day('2026-09-10'), path: '/', source: 'Google', views: 4, entries: 4 },
  ]
  const a = computeAudience(rows, now, ['2026-09-07', '2026-10-19'])
  assert.equal(a.visits30, 10)
  assert.equal(a.visits7, 10)
  assert.equal(a.homeViews30, 10)
  assert.deepEqual(a.sources[0], { source: 'Google', visits: 6, percent: 60 })
  assert.equal(a.sources.length, 3)
  assert.deepEqual(a.landings[0], { path: '/', visits: 9 })
  assert.equal(a.tunnel[0].views, 10)
  assert.equal(a.tunnel[1].percent, 50)
  assert.equal(a.tunnel.at(-1)!.views, 2)
  assert.deepEqual(a.weeks, [{ week: '2026-09-07', visits: 4 }, { week: '2026-10-19', visits: 10 }])
  // Rien encore : des zéros, pas d'erreur.
  assert.equal(computeAudience([], now, []).tunnel[1].percent, 0)
})
