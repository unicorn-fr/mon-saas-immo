// Parcours complets et formulaires (données valides, vides, invalides, très longues, accents, apostrophes, emojis), sur chaque appareil.
// Usage : AUDIT_DEVICES=iphone-portrait node tests/audit/parcours.mjs
import { BASE, Results, anomalyShot, closeBrowsers, contextFor, fromLog, logSize, readSeed, selectedConfigs, settle, watch } from './lib.mjs'

const seed = readSeed()
const LONG = 'Très long texte '.repeat(40)
const SPECIAL = 'Zoé-Anaïs D’Artagnan 😀'

async function step(res, config, page, name, element, action, expected, fn, severity = 'Bloquant') {
  try {
    const actual = await fn()
    res.ok(name, element, config.label, action, expected, actual || 'Conforme')
    return true
  } catch (e) {
    res.ko(name, element, config.label, action, expected, e.message.split('\n')[0].slice(0, 220), severity, { screenshot: await anomalyShot(page, config, `${name}-${element}`) })
    return false
  }
}

const visible = async (loc, timeout = 8000) => {
  await loc.first().waitFor({ state: 'visible', timeout })
  return true
}

async function run(config) {
  const res = new Results(`parcours-${config.id}`)
  const D = config.label
  const mobile = config.kind === 'Smartphone'

  // P1 — Découvrir : accueil → Tarif → FAQ → pied de page.
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page)
    const P = 'P1 Découvrir le site'
    await page.goto(BASE + '/')
    await settle(page)
    await step(res, config, page, P, 'Action principale', 'Voir sans défiler', '« Créer mon bail » visible dès l’arrivée', async () => {
      const btn = page.getByRole('link', { name: /Créer mon bail/ }).filter({ visible: true }).first()
      const box = await btn.boundingBox()
      const vh = page.viewportSize().height
      if (!box || box.y + box.height > vh) throw new Error(`Bouton sous la ligne de flottaison (y = ${Math.round(box?.y ?? -1)} px, écran ${vh} px)`)
      return `visible à ${Math.round(box.y)} px`
    }, 'Mineur')
    await step(res, config, page, P, 'Lien « Tarif »', 'Clic', 'La section des tarifs s’affiche', async () => {
      const tarif = page.locator('a[href="#tarifs"], a[href="/#tarifs"]').filter({ visible: true }).first()
      if (!(await tarif.count())) throw new Error('Lien « Tarif » absent à cette taille d’écran')
      await tarif.click()
      await page.waitForTimeout(900)
      const inView = await page.locator('#tarifs').evaluate((el) => { const b = el.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0 })
      if (!inView) throw new Error('Section #tarifs hors de l’écran après le clic')
    }, 'Mineur')
    await step(res, config, page, P, 'FAQ', 'Ouvrir une question', 'La réponse s’affiche', async () => {
      const q = page.locator('.faq summary, .faq button').first()
      if (!(await q.count())) return 'FAQ toujours dépliée (pas d’accordéon)'
      await q.scrollIntoViewIfNeeded()
      await q.click()
      await page.waitForTimeout(300)
      return 'ouverte'
    }, 'Mineur')
    await step(res, config, page, P, 'Simulation du loyer', 'Choisir un type, saisir un loyer', 'Le calcul se met à jour', async () => {
      const tabs = page.locator('.tabs-live button')
      if (!(await tabs.count())) return 'absent'
      await tabs.nth(1).click()
      const input = page.locator('.live input').first()
      await input.fill('850')
      await page.waitForTimeout(300)
      return `onglet « ${(await tabs.nth(1).innerText()).trim()} »`
    }, 'Mineur')
    await step(res, config, page, P, 'Erreurs', 'Parcours de l’accueil', 'Aucune erreur', async () => {
      if (errors.length) throw new Error(errors.join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  // P2 — Créer son bail sans compte, écran par écran (action principale).
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page, { allow: ['/api/geo/', 'api-adresse'] })
    const P = 'P2 Créer son bail (tunnel)'
    const t0 = Date.now()
    let clicks = 0
    const click = async (loc) => { clicks++; await loc.click() }
    await page.goto(BASE + '/')
    await settle(page)
    let ok = await step(res, config, page, P, 'Accueil → tunnel', 'Clic sur « Créer mon bail »', 'Étape 1 « Votre logement est… »', async () => {
      await click(page.getByRole('link', { name: /Créer mon bail/ }).filter({ visible: true }).first())
      await page.waitForURL(/\/commencer$/)
      await visible(page.getByRole('heading', { name: /Votre logement est/ }))
    })
    ok &&= await step(res, config, page, P, 'Étape 1 Type', 'Choisir « Vide »', 'Étape 2 Logement', async () => {
      await click(page.getByRole('button', { name: /^Vide/ }))
      await page.waitForURL(/\/commencer\/logement/)
    })
    if (ok) {
      await step(res, config, page, P, 'Étape 2 — envoi vide', 'Clic « Continuer » sans rien remplir', 'Messages d’erreur, on reste sur l’étape', async () => {
        await click(page.getByRole('button', { name: 'Continuer' }))
        await visible(page.getByText('Indiquez l\'adresse du logement.'))
        await visible(page.getByText('Indiquez la surface habitable.'))
        if (!/\/commencer\/logement/.test(page.url())) throw new Error('A quitté l’étape')
        return 'adresse, surface, pièces… signalées'
      }, 'Majeur')
      await step(res, config, page, P, 'Étape 2 — format invalide', 'Surface « abc »', 'Lettres refusées', async () => {
        await page.getByLabel('Surface habitable').fill('abc')
        const v = await page.getByLabel('Surface habitable').inputValue()
        if (v !== '') throw new Error(`Valeur gardée : « ${v} »`)
      }, 'Mineur')
      ok = await step(res, config, page, P, 'Étape 2 Logement', 'Remplir avec accents et apostrophes', 'Étape 3 Personnes', async () => {
        await page.getByLabel('Adresse', { exact: true }).fill('12 rue de l’Église, 34000 Montpellier')
        await page.keyboard.press('Escape')
        await page.getByLabel('Surface habitable').fill('42,5')
        await click(page.getByRole('button', { name: '2', exact: true }))
        await page.getByLabel('Bâtiment, étage, porte (facultatif)').fill(LONG.slice(0, 200))
        for (const name of ['Un appartement', 'Oui', 'Depuis 2005', 'Individuel', 'Électricité', 'Individuelle']) await click(page.getByRole('button', { name, exact: true }))
        // Les erreurs disparaissent et la saisie est gardée
        if ((await page.getByLabel('Surface habitable').inputValue()) !== '42,5') throw new Error('Surface effacée')
        await click(page.getByRole('button', { name: 'Continuer' }))
        await page.waitForURL(/\/commencer\/personnes/, { timeout: 10000 })
      })
    }
    if (ok) {
      await step(res, config, page, P, 'Étape 3 — envoi vide', 'Clic « Continuer » sans rien remplir', 'Messages d’erreur', async () => {
        await click(page.getByRole('button', { name: 'Continuer' }))
        await page.waitForTimeout(400)
        if (!/\/commencer\/personnes/.test(page.url())) throw new Error('A quitté l’étape sans prénom ni nom')
        const msgs = await page.locator('[id$="-error"], [role=alert]').count()
        return `${msgs} message(s)`
      }, 'Majeur')
      ok = await step(res, config, page, P, 'Étape 3 Personnes', 'Prénom avec emoji, nom avec apostrophe, email invalide puis valide', 'Étape 4 Loyer', async () => {
        const firsts = page.getByLabel('Prénom', { exact: true })
        const lasts = page.getByLabel('Nom', { exact: true })
        await firsts.nth(0).fill(SPECIAL)
        await lasts.nth(0).fill('D’Artagnan-Lefèvre')
        await page.getByLabel('Votre adresse').fill('8 avenue Foch, 75116 Paris')
        await page.keyboard.press('Escape')
        await firsts.nth(1).fill('Marie')
        await lasts.nth(1).fill('O’Connor')
        const email = page.getByLabel('Son email')
        await email.fill('pas-un-email')
        await click(page.getByRole('button', { name: 'Continuer' }))
        await page.waitForTimeout(400)
        const stayed = /\/commencer\/personnes/.test(page.url())
        if (!stayed) throw new Error('Email invalide accepté')
        if ((await firsts.nth(0).inputValue()) !== SPECIAL) throw new Error('Formulaire vidé après l’erreur')
        await email.fill('marie.oconnor@example.fr')
        await click(page.getByRole('button', { name: 'Continuer' }))
        await page.waitForURL(/\/commencer\/loyer/, { timeout: 10000 })
        return 'email invalide refusé, saisie gardée'
      })
    }
    if (ok) {
      await step(res, config, page, P, 'Étape 4 — dépôt trop élevé', 'Loyer 780 €, dépôt modifié au-delà du plafond', 'Refus avec le plafond légal', async () => {
        await page.getByLabel('Loyer hors charges').fill('780')
        await page.getByLabel('Charges').fill('60')
        const modify = page.getByRole('button', { name: 'Modifier' }).first()
        if (await modify.count()) {
          await modify.click()
          const dep = page.getByLabel('Montant du dépôt de garantie')
          if (await dep.count()) {
            await dep.fill('5000')
            await click(page.getByRole('button', { name: 'Continuer' }))
            await page.waitForTimeout(400)
            if (!/\/commencer\/loyer/.test(page.url())) throw new Error('Dépôt de 5 000 € accepté')
            const back = page.getByRole('button', { name: 'Revenir au maximum' })
            if (await back.count()) await back.click()
            else await dep.fill('780')
          }
        }
        return 'plafond appliqué'
      }, 'Majeur')
      ok = await step(res, config, page, P, 'Étape 4 Loyer', 'Date d’entrée et continuer', 'Étape 5 Relecture', async () => {
        await page.getByLabel('Date d\'entrée du locataire').fill('2026-11-15')
        await click(page.getByRole('button', { name: 'Continuer' }))
        await page.waitForURL(/\/commencer\/relecture/, { timeout: 10000 })
      })
    }
    if (ok) {
      await step(res, config, page, P, 'Étape 5 Relecture', 'Les saisies sont reprises', 'Prénom avec emoji et apostrophes affichés tels quels', async () => {
        await visible(page.getByText('D’Artagnan-Lefèvre').first())
        await visible(page.getByText(/O’Connor/).first())
      }, 'Majeur')
      await step(res, config, page, P, 'Rafraîchissement du tunnel', 'Recharger l’étape 5', 'Rien n’est perdu (brouillon enregistré)', async () => {
        await page.reload()
        await settle(page)
        await visible(page.getByText('D’Artagnan-Lefèvre').first())
      }, 'Majeur')
      await step(res, config, page, P, 'Retour du navigateur', 'Bouton retour depuis l’étape 5', 'Étape 4 avec le loyer gardé', async () => {
        await page.goBack()
        await page.waitForURL(/\/commencer\/loyer/)
        const v = await page.getByLabel('Loyer hors charges').inputValue()
        if (!v.includes('780')) throw new Error(`Loyer affiché : « ${v} »`)
        await page.goForward()
        await page.waitForURL(/\/commencer\/relecture/)
      }, 'Majeur')
      ok = await step(res, config, page, P, 'Étape 5 Relecture', 'Clic « Mon bail est correct »', 'Étape « Recevoir »', async () => {
        await click(page.getByRole('button', { name: 'Mon bail est correct' }))
        await page.waitForURL(/\/commencer\/recevoir/, { timeout: 10000 })
      })
    }
    if (ok) {
      await step(res, config, page, P, 'Recevoir — email invalide', 'Email « abc@ »', 'Message clair, saisie gardée', async () => {
        await page.getByLabel('Votre email').fill('abc@')
        await click(page.getByRole('button', { name: 'Continuer mon bail' }))
        await page.waitForTimeout(600)
        if (await page.getByText('Regardez vos emails.').count()) throw new Error('Email invalide accepté')
        if ((await page.getByLabel('Votre email').inputValue()) !== 'abc@') throw new Error('Champ vidé')
        const valid = await page.getByLabel('Votre email').evaluate((el) => el.validationMessage || '')
        return valid ? `message du navigateur : « ${valid} »` : 'refusé'
      }, 'Majeur')
      const email = `audit+${config.id}-${Date.now()}@example.fr`
      const before = logSize()
      ok = await step(res, config, page, P, 'Recevoir', 'Email valide', '« Regardez vos emails. » (email simulé, écrit dans le journal de l’API)', async () => {
        await page.getByLabel('Votre email').fill(email)
        await click(page.getByRole('button', { name: 'Continuer mon bail' }))
        await visible(page.getByText('Regardez vos emails.'))
      })
      if (ok) {
        ok = await step(res, config, page, P, 'Lien reçu par email', 'Ouvrir le lien', 'Bail enregistré dans l’espace (/bienvenue)', async () => {
          const [m] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
          clicks++
          await page.goto(m[1].replace(/^http:\/\/[^/]+/, BASE))
          await page.waitForURL(/\/bienvenue\//, { timeout: 15000 })
          await visible(page.getByText('Votre bail est enregistré'))
          return `${clicks} clics, ${Math.round((Date.now() - t0) / 1000)} s (automatisé)`
        })
      }
    }
    await step(res, config, page, P, 'Erreurs', 'Tout le tunnel', 'Aucune erreur console ni réseau', async () => {
      if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  // P5 — Connexion, navigation dans l'espace, menus, déconnexion.
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page)
    const P = 'P5 Connexion et déconnexion'
    await page.goto(BASE + '/connexion')
    await settle(page)
    await step(res, config, page, P, 'Email vide', 'Clic « Recevoir mon lien »', 'Message « Indiquez une adresse email valide. »', async () => {
      await page.getByRole('button', { name: /Recevoir mon lien/ }).click()
      await visible(page.getByText('Indiquez une adresse email valide.'))
    }, 'Majeur')
    await step(res, config, page, P, 'Email très long avec emoji', 'Saisie', 'Refus clair, saisie gardée', async () => {
      const v = `${'a'.repeat(300)}😀@exemple`
      await page.getByLabel('Email').fill(v)
      await page.getByRole('button', { name: /Recevoir mon lien/ }).click()
      await visible(page.getByText('Indiquez une adresse email valide.'))
      if ((await page.getByLabel('Email').inputValue()) !== v) throw new Error('Champ vidé')
    }, 'Majeur')
    const before = logSize()
    let ok = await step(res, config, page, P, 'Email valide', 'Demander le lien', '« Regardez vos emails. » et bouton vers la messagerie', async () => {
      await page.getByLabel('Email').fill(seed.owner.email)
      await page.getByRole('button', { name: /Recevoir mon lien/ }).click()
      await visible(page.getByText('Regardez vos emails.'))
    })
    if (ok) {
      ok = await step(res, config, page, P, 'Lien reçu', 'Ouvrir le lien', 'Espace « Aujourd’hui »', async () => {
        const [m] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
        await page.goto(m[1].replace(/^http:\/\/[^/]+/, BASE))
        await page.waitForURL(/\/espace$/, { timeout: 15000 })
        await settle(page)
      })
    }
    if (ok) {
      if (mobile) {
        await step(res, config, page, P, 'Barre du bas', 'Toucher « Logements »', 'Page Logements', async () => {
          await page.locator('.bottom-nav').getByRole('link', { name: 'Logements' }).tap()
          await page.waitForURL(/\/espace\/logements$/)
        }, 'Bloquant')
        await step(res, config, page, P, 'Bouton « + »', 'Toucher puis fermer', 'La fenêtre « Ajouter » s’ouvre et se ferme', async () => {
          await page.locator('.bottom-nav').getByRole('button', { name: 'Ajouter' }).tap()
          await visible(page.getByRole('dialog'))
          await page.getByRole('dialog').getByRole('button', { name: 'Fermer' }).tap()
          await page.waitForTimeout(300)
          if (await page.getByRole('dialog').count()) throw new Error('Fenêtre toujours ouverte')
        }, 'Majeur')
        await step(res, config, page, P, 'En-tête mobile', 'Toucher « Mon compte »', 'Page Mon compte', async () => {
          await page.getByRole('link', { name: 'Mon compte' }).filter({ visible: true }).first().tap()
          await page.waitForURL(/\/espace\/compte$/)
        }, 'Majeur')
        await step(res, config, page, P, 'Menu « Carnet » et « Que se passe-t-il ? »', 'Trouver ces pages sur téléphone', 'Accessibles depuis le menu', async () => {
          await page.goto(BASE + '/espace')
          await settle(page)
          const n = await page.locator('a[href="/espace/carnet"]').filter({ visible: true }).count()
          const s = await page.locator('a[href="/espace/situations"]').filter({ visible: true }).count()
          if (!n) throw new Error(`« Carnet » absent du menu mobile${s ? '' : ' ; « Que se passe-t-il ? » aussi'}`)
          return 'présents'
        }, 'Mineur')
      } else {
        await step(res, config, page, P, 'Menu latéral', 'Clic sur chaque entrée', 'Chaque page s’ouvre', async () => {
          for (const name of ['Logements', 'Locataires', 'Documents', 'Argent', 'Carnet', 'Que se passe-t-il ?', 'Aujourd’hui']) {
            await page.locator('.sidebar').getByRole('link', { name }).click()
            await settle(page, 100)
            if (await page.getByText('Page introuvable').count()) throw new Error(`${name} : page introuvable`)
          }
        }, 'Bloquant')
        await step(res, config, page, P, 'Clavier', 'Tab au chargement', 'Premier arrêt « Aller au contenu », contour visible, Entrée → contenu', async () => {
          await page.goto(BASE + '/espace')
          await settle(page)
          await page.keyboard.press('Tab')
          const f = await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { text: a?.textContent?.trim(), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, shadow: s.boxShadow !== 'none' } })
          if (f.text !== 'Aller au contenu') throw new Error(`Premier arrêt : « ${f.text} »`)
          if (!f.outline && !f.shadow) throw new Error('Pas de contour de focus visible')
          await page.keyboard.press('Enter')
          const inMain = await page.evaluate(() => document.activeElement?.tagName === 'MAIN' || Boolean(document.activeElement?.closest('main')))
          if (!inMain) throw new Error('Le focus n’est pas passé au contenu')
        }, 'Majeur')
        await step(res, config, page, P, 'Clavier', 'Ouvrir et fermer « Ajouter » au clavier', 'Fenêtre ouverte par Entrée, fermée par Échap, focus rendu', async () => {
          const add = page.locator('.sidebar').getByRole('button', { name: 'Ajouter' })
          await add.focus()
          await page.keyboard.press('Enter')
          await visible(page.getByRole('dialog'))
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)
          if (await page.getByRole('dialog').count()) throw new Error('Échap ne ferme pas la fenêtre')
          const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
          if (!/Ajouter/.test(back ?? '')) return `fermée ; focus sur « ${back} » (au lieu du bouton Ajouter)`
        }, 'Mineur')
      }
      await step(res, config, page, P, 'Déconnexion', 'Mon compte → « Se déconnecter »', 'Retour à l’accueil, espace fermé', async () => {
        await page.goto(BASE + '/espace/compte')
        await settle(page)
        // Session de test séparée : la déconnexion ne ferme que ce navigateur.
        await page.getByRole('button', { name: 'Se déconnecter' }).click()
        await page.waitForURL((u) => u.pathname === '/', { timeout: 10000 })
        await page.goto(BASE + '/espace')
        await page.waitForURL(/\/connexion/, { timeout: 10000 })
      })
    }
    await step(res, config, page, P, 'Erreurs', 'Tout le parcours', 'Aucune erreur', async () => {
      if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  // P6 — Page protégée sans être connecté : connexion puis retour à la page demandée.
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const P = 'P6 Page protégée'
    await page.goto(BASE + '/espace/argent')
    await settle(page)
    await step(res, config, page, P, 'Redirection', 'Ouvrir /espace/argent sans session', 'Page de connexion', async () => {
      if (!page.url().includes('/connexion')) throw new Error(`Resté sur ${page.url()}`)
    })
    const before = logSize()
    await step(res, config, page, P, 'Retour après connexion', 'Lien reçu par email ouvert', 'Arrivée sur /espace/argent (la page demandée)', async () => {
      await page.getByLabel('Email').fill(seed.owner.email)
      await page.getByRole('button', { name: /Recevoir mon lien/ }).click()
      await visible(page.getByText('Regardez vos emails.'))
      const [m] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
      // Comme dans la vraie vie : le lien de l'email s'ouvre dans un nouvel onglet.
      const tab = await ctx.newPage()
      await tab.goto(m[1].replace(/^http:\/\/[^/]+/, BASE))
      await tab.waitForURL(/\/espace/, { timeout: 15000 })
      await settle(tab)
      const path = new URL(tab.url()).pathname
      if (path !== '/espace/argent') throw new Error(`Arrivée sur ${path} : la page demandée est perdue`)
    }, 'Majeur')
    await ctx.close()
  }

  // P9 — Candidature (formulaire public).
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page)
    const P = 'P9 Candidature'
    await page.goto(BASE + seed.public.candidature)
    await settle(page)
    await step(res, config, page, P, 'Envoi vide', 'Clic « Envoyer ma candidature »', 'Message qui dit quoi remplir', async () => {
      await page.getByRole('button', { name: 'Envoyer ma candidature' }).click()
      await visible(page.getByText('Indiquez vos nom, prénom et email.'))
    }, 'Majeur')
    await step(res, config, page, P, 'Envoi complet', 'Accents, apostrophes, emoji, message très long', 'Confirmation', async () => {
      await page.getByLabel('Prénom', { exact: true }).fill(SPECIAL)
      await page.getByLabel('Nom', { exact: true }).fill('L’Hôpital')
      await page.getByLabel('Email').fill(`candidat+${config.id}${Date.now()}@example.fr`)
      await page.getByLabel('Téléphone').fill('06 12 34 56 78')
      await page.getByRole('button', { name: 'Salarié' }).click().catch(() => page.getByLabel('Situation professionnelle').selectOption({ label: 'Salarié' }))
      await page.getByLabel('Revenus nets du foyer, par mois').fill('2600')
      await page.getByRole('button', { name: 'Garantie Visale' }).click().catch(() => page.getByLabel('Garantie').selectOption({ label: 'Garantie Visale' }))
      await page.getByLabel('Message').fill(LONG)
      await page.getByText('J’ai compris que ces informations').click()
      await page.getByRole('button', { name: 'Envoyer ma candidature' }).click()
      await visible(page.getByText(/candidature (a bien été|est) (envoyée|reçue)|pièces|Merci/i), 15000)
    })
    await step(res, config, page, P, 'Erreurs', 'Formulaire', 'Aucune erreur', async () => {
      if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  // P13 — Le locataire signale un problème depuis son lien.
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page)
    const P = 'P13 Signalement du locataire'
    await page.goto(BASE + seed.public.locataire)
    await settle(page)
    await step(res, config, page, P, 'Assistant', 'Signaler un problème en 3 écrans', '« Signalement envoyé à votre bailleur »', async () => {
      await page.getByRole('button', { name: /Signaler (un|un autre) problème/ }).click()
      await page.getByRole('button', { name: 'Continuer' }).click()
      await visible(page.getByText('Choisissez le type de problème.'))
      await page.locator('button[aria-pressed]').first().click()
      await page.getByRole('button', { name: 'Continuer' }).click()
      await page.getByLabel('Ce qui se passe').fill('a')
      await page.getByRole('button', { name: 'Continuer' }).click()
      await visible(page.getByText('Décrivez le problème en quelques mots.'))
      await page.getByLabel('Où ? (facultatif)').fill('Salle d’eau 🚿')
      await page.getByLabel('Ce qui se passe').fill('Le robinet fuit depuis hier, l’eau coule sous l’évier.')
      await page.getByRole('button', { name: 'Continuer' }).click()
      await page.getByRole('button', { name: 'Envoyer le signalement' }).click()
      await visible(page.getByText('Signalement envoyé à votre bailleur'), 15000)
    })
    await step(res, config, page, P, 'Erreurs', 'Assistant', 'Aucune erreur', async () => {
      if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  // Dossier du locataire : envoi vide puis complet.
  {
    const ctx = await contextFor(config)
    const page = await ctx.newPage()
    const errors = watch(page)
    const P = 'P8 Dossier du locataire'
    await page.goto(BASE + seed.public.dossier)
    await settle(page)
    await step(res, config, page, P, 'Formulaire', 'Remplir l’identité avec accents et emoji, enregistrer', 'Saisie gardée après rechargement', async () => {
      const first = page.getByLabel('Prénom(s)').first()
      await first.fill(SPECIAL)
      await page.getByLabel('Nom de naissance').first().fill('Lefèvre')
      const save = page.getByRole('button', { name: 'Enregistrer' }).first()
      if (await save.count()) await save.click()
      await page.waitForTimeout(1500)
      await page.reload()
      await settle(page)
      const v = await page.getByLabel('Prénom(s)').first().inputValue()
      if (v !== SPECIAL) throw new Error(`Après rechargement : « ${v} »`)
    }, 'Majeur')
    await step(res, config, page, P, 'Erreurs', 'Formulaire', 'Aucune erreur', async () => {
      if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join(' ; '))
    }, 'Majeur')
    await ctx.close()
  }

  res.save()
}

for (const config of selectedConfigs()) {
  console.log(`→ ${config.label}`)
  await run(config)
}
await closeBrowsers()
