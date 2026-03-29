#!/usr/bin/env node
/**
 * Bailio — Script de test automatisé de la waitlist
 *
 * Usage :
 *   node scripts/test-waitlist.mjs
 *
 * Variables d'environnement (optionnel — sinon valeurs par défaut localhost) :
 *   API_URL=https://mon-backend.up.railway.app/api/v1
 *   NOTIFY_SECRET=mon-secret
 *   TEST_EMAIL=test@example.com
 *
 * Requires : Node 18+ (fetch natif)
 */

// ── Config ────────────────────────────────────────────────────────────────────

const API   = process.env.API_URL      || 'http://localhost:3000/api/v1'
const SECRET = process.env.NOTIFY_SECRET || 'change-me-with-a-strong-random-secret'
const EMAIL  = process.env.TEST_EMAIL  || `waitlist-test-${Date.now()}@example.com`
const EMAIL2 = `waitlist-test2-${Date.now()}@example.com`

// ── Terminal colors ───────────────────────────────────────────────────────────

const C = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
}

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
let createdId = null

function pass(name, detail = '') {
  passed++
  console.log(`  ${C.green('✓')} ${name}${detail ? C.dim('  — ' + detail) : ''}`)
}

function fail(name, reason) {
  failed++
  console.log(`  ${C.red('✗')} ${name}`)
  console.log(`    ${C.red('→')} ${reason}`)
}

async function api(method, path, { body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers['Authorization'] = `Bearer ${SECRET}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data
  try { data = await res.json() } catch { data = null }
  return { status: res.status, data }
}

function section(title) {
  console.log(`\n${C.bold(C.cyan('── ' + title + ' ──'))}`)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(C.bold('\nBailio — Waitlist API Tests'))
  console.log(C.dim(`API   : ${API}`))
  console.log(C.dim(`Email : ${EMAIL}`))
  console.log(C.dim(`Secret: ${SECRET.slice(0, 4)}${'*'.repeat(Math.max(0, SECRET.length - 4))}`))

  // ── 1. Endpoint sanity ──────────────────────────────────────────────────────
  section('1. Sanity — API accessible')

  try {
    const { status, data } = await api('GET', '/waitlist/count')
    if (status === 200 && data?.success) {
      pass('GET /waitlist/count répond 200', `total = ${data.data.total}`)
    } else {
      fail('GET /waitlist/count', `status ${status}, success=${data?.success}`)
    }
  } catch (e) {
    fail('GET /waitlist/count', `Connexion refusée — le serveur est-il démarré ? (${e.message})`)
    console.log(C.red('\n  Impossible de contacter le serveur. Arrêt des tests.\n'))
    process.exit(1)
  }

  // ── 2. Inscription valide ───────────────────────────────────────────────────
  section('2. POST /waitlist/join — cas nominaux')

  const countBefore = await api('GET', '/waitlist/count')
  const totalBefore = countBefore.data?.data?.total ?? 0

  const { status: s1, data: d1 } = await api('POST', '/waitlist/join', { body: { email: EMAIL } })
  if (s1 === 201 && d1?.success && typeof d1.data?.position === 'number') {
    pass('Email valide → 201 Created', `position #${d1.data.position}, earlyAccess=${d1.data.isEarlyAccess}`)
    createdId = null // will find via list later
  } else {
    fail('Email valide → 201 Created', `status=${s1}, data=${JSON.stringify(d1)}`)
  }

  const countAfter = await api('GET', '/waitlist/count')
  const totalAfter = countAfter.data?.data?.total ?? 0
  if (totalAfter === totalBefore + 1) {
    pass('Compteur s\'incrémente après inscription', `${totalBefore} → ${totalAfter}`)
  } else {
    fail('Compteur s\'incrémente', `avant=${totalBefore}, après=${totalAfter}`)
  }

  // ── 3. Doublon ──────────────────────────────────────────────────────────────
  section('3. POST /waitlist/join — email déjà inscrit')

  const { status: s2, data: d2 } = await api('POST', '/waitlist/join', { body: { email: EMAIL } })
  if (s2 === 200 && d2?.success && d2.data?.alreadyRegistered === true) {
    pass('Doublon → 200 + alreadyRegistered=true', `position #${d2.data.position}`)
  } else {
    fail('Doublon → 200 + alreadyRegistered=true', `status=${s2}, data=${JSON.stringify(d2)}`)
  }

  const countDup = await api('GET', '/waitlist/count')
  if (countDup.data?.data?.total === totalAfter) {
    pass('Doublon ne crée pas d\'entrée supplémentaire')
  } else {
    fail('Doublon ne crée pas d\'entrée supplémentaire', `total inattendu: ${countDup.data?.data?.total}`)
  }

  // ── 4. Emails invalides ─────────────────────────────────────────────────────
  section('4. POST /waitlist/join — validation email')

  const invalidEmails = [
    { email: 'pasunemail',       label: 'sans @' },
    { email: 'test@',            label: 'sans domaine' },
    { email: '',                 label: 'vide' },
    { email: '   ',              label: 'espaces seulement' },
  ]

  for (const { email, label } of invalidEmails) {
    const { status, data } = await api('POST', '/waitlist/join', { body: { email } })
    if (status === 400 && !data?.success) {
      pass(`Email invalide (${label}) → 400`)
    } else {
      fail(`Email invalide (${label}) → 400`, `status=${status}, success=${data?.success}`)
    }
  }

  // ── 5. Admin — auth ─────────────────────────────────────────────────────────
  section('5. Admin — protection par Bearer token')

  const { status: s5a } = await api('GET', '/waitlist/admin/stats')
  if (s5a === 401) {
    pass('GET /admin/stats sans token → 401')
  } else {
    fail('GET /admin/stats sans token → 401', `status=${s5a}`)
  }

  const { status: s5b } = await api('GET', '/waitlist/admin/stats', {
    auth: false,
    // Override: pass wrong token manually
  })
  // Test with wrong bearer
  const resBad = await fetch(`${API}/waitlist/admin/stats`, {
    headers: { Authorization: 'Bearer mauvais-secret-totalement-faux' },
  })
  if (resBad.status === 401) {
    pass('GET /admin/stats avec mauvais token → 401')
  } else {
    fail('GET /admin/stats avec mauvais token → 401', `status=${resBad.status}`)
  }

  const { status: s5c, data: d5c } = await api('GET', '/waitlist/admin/stats', { auth: true })
  if (s5c === 200 && d5c?.success) {
    pass('GET /admin/stats avec bon token → 200', `total=${d5c.data.total}`)
  } else {
    fail('GET /admin/stats avec bon token → 200', `status=${s5c}`)
  }

  // ── 6. Admin — stats cohérentes ─────────────────────────────────────────────
  section('6. Admin — cohérence des statistiques')

  const { data: statsData } = await api('GET', '/waitlist/admin/stats', { auth: true })
  const stats = statsData?.data

  if (stats) {
    if (typeof stats.total === 'number' && stats.total >= 0) {
      pass('stats.total est un nombre positif', `${stats.total}`)
    } else {
      fail('stats.total est un nombre positif', JSON.stringify(stats.total))
    }

    if (stats.earlyAccessTaken + stats.earlyAccessRemaining === 150 || stats.earlyAccessTaken >= 150) {
      pass('earlyAccessTaken + earlyAccessRemaining = 150')
    } else {
      fail('earlyAccessTaken + earlyAccessRemaining = 150',
        `${stats.earlyAccessTaken} + ${stats.earlyAccessRemaining} ≠ 150`)
    }

    if (Array.isArray(stats.signupsByDay)) {
      pass('signupsByDay est un tableau', `${stats.signupsByDay.length} jour(s)`)
    } else {
      fail('signupsByDay est un tableau', typeof stats.signupsByDay)
    }
  }

  // ── 7. Admin — liste paginée ────────────────────────────────────────────────
  section('7. Admin — liste paginée')

  const { status: s7, data: d7 } = await api('GET', '/waitlist/admin/list?page=1&limit=20', { auth: true })
  if (s7 === 200 && d7?.success && Array.isArray(d7.data?.entries)) {
    pass('GET /admin/list → 200 + tableau', `${d7.data.entries.length} entrée(s) sur ${d7.data.total}`)

    const entry = d7.data.entries.find((e) => e.email.startsWith(EMAIL[0]))
    if (entry) {
      if (/^.\*\*\*@/.test(entry.email)) {
        pass('Email masqué correctement', entry.email)
      } else {
        fail('Email masqué correctement', `email brut exposé : ${entry.email}`)
      }
      if (typeof entry.position === 'number') {
        pass('position est un nombre')
      } else {
        fail('position est un nombre', typeof entry.position)
      }
      createdId = entry.id
    } else {
      console.log(C.yellow('  ~ Email de test non trouvé en page 1 (position élevée ?)'))
    }
  } else {
    fail('GET /admin/list → 200', `status=${s7}`)
  }

  // ── 8. Admin — ajout manuel ─────────────────────────────────────────────────
  section('8. Admin — ajout manuel')

  const { status: s8, data: d8 } = await api('POST', '/waitlist/admin/add',
    { body: { email: EMAIL2 }, auth: true })
  if (s8 === 201 && d8?.success && typeof d8.data?.position === 'number') {
    pass('POST /admin/add → 201 Created', `position #${d8.data.position}`)
  } else {
    fail('POST /admin/add → 201 Created', `status=${s8}, data=${JSON.stringify(d8)}`)
  }

  // ── 9. Admin — suppression ──────────────────────────────────────────────────
  section('9. Admin — suppression (RGPD)')

  if (createdId) {
    const { status: s9 } = await api('DELETE', `/waitlist/admin/${createdId}`, { auth: true })
    if (s9 === 200) {
      pass(`DELETE /admin/${createdId.slice(0, 8)}... → 200`)
    } else {
      fail(`DELETE /admin/:id → 200`, `status=${s9}`)
    }
  } else {
    console.log(C.yellow('  ~ Suppression ignorée (id non récupéré en étape 7)'))
  }

  // Supprimer EMAIL2 aussi (nettoyage)
  const listClean = await api('GET', '/waitlist/admin/list?page=1&limit=100', { auth: true })
  const e2entry = listClean.data?.data?.entries?.find((e) => e.email.startsWith(EMAIL2[0]))
  if (e2entry?.id) {
    await api('DELETE', `/waitlist/admin/${e2entry.id}`, { auth: true })
  }

  // ── 10. notify-all — protection ────────────────────────────────────────────
  section('10. POST /waitlist/notify-all — protection')

  const { status: s10a } = await api('POST', '/waitlist/notify-all')
  if (s10a === 401) {
    pass('POST /notify-all sans token → 401')
  } else {
    fail('POST /notify-all sans token → 401', `status=${s10a}`)
  }

  // NOTE: on ne déclenche PAS le vrai envoi ici, juste la vérification auth
  console.log(C.dim('  ~ Envoi réel non déclenché (protège vos emails)'))

  // ── Export ──────────────────────────────────────────────────────────────────
  section('11. GET /admin/export — CSV')

  const resExport = await fetch(`${API}/waitlist/admin/export`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  })
  if (resExport.status === 200) {
    const ct = resExport.headers.get('content-type') ?? ''
    if (ct.includes('text/csv')) {
      const text = await resExport.text()
      const lines = text.trim().split('\n')
      if (lines[0]?.includes('email') && lines[0]?.includes('position')) {
        pass('GET /admin/export → CSV valide', `${lines.length - 1} ligne(s) + header`)
      } else {
        fail('GET /admin/export → CSV valide', `Header inattendu: ${lines[0]}`)
      }
    } else {
      fail('Content-Type: text/csv', `reçu: ${ct}`)
    }
  } else {
    fail('GET /admin/export → 200', `status=${resExport.status}`)
  }

  // ── Résumé ──────────────────────────────────────────────────────────────────
  const total = passed + failed
  console.log(`\n${'─'.repeat(44)}`)
  console.log(C.bold(`Résultats : ${C.green(passed + ' ✓')}  ${failed > 0 ? C.red(failed + ' ✗') : '0 ✗'}  sur ${total} tests`))

  if (failed === 0) {
    console.log(C.green(C.bold('\nTous les tests passent. API prête pour la production.')))
  } else {
    console.log(C.red(C.bold(`\n${failed} test(s) échoué(s). Corrigez avant de déployer.`)))
    process.exit(1)
  }
  console.log()
}

runTests().catch((err) => {
  console.error(C.red('\nErreur inattendue :'), err)
  process.exit(1)
})
