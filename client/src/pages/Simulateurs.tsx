import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'
import { TextField } from '../components/ui'

const h2 = { margin: 0, fontSize: 22, fontWeight: 700, color: BAI.ink } as const
const box = { background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 8 } as const
const linkButton = { alignSelf: 'flex-start', background: 'none', border: 'none', padding: '12px 0', fontSize: 16, fontWeight: 600, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' } as const
const frDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Même jour, n mois plus tôt (dernier jour du mois si ce jour n'existe pas). */
export function monthsBefore(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 - months, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10)
}
const daysBefore = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)

function Sources({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 40, fontSize: 15 }}>
      {children} <Link to="/modeles">Tous les modèles et outils</Link>
    </p>
  )
}

/** Date limite du congé du bailleur (loi du 6 juillet 1989, art. 15 et 25-8) : 6 mois avant la fin en vide, 3 mois en meublé. */
export function SimulateurConge() {
  const { q, go } = useQuestion(3)
  const [kind, setKind] = useState<'VIDE' | 'MEUBLE' | null>(null)
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const step = !kind ? 1 : q === 3 && !end ? 2 : q
  const months = kind === 'MEUBLE' ? 3 : 6
  let body
  if (step === 1)
    body = (
      <QuestionScreen q={1} count={2} title="Le logement est loué…" hideNext>
        <Choices legend="Type de location" columns value={kind} options={[{ value: 'VIDE', label: 'Vide', hint: 'sans meubles' }, { value: 'MEUBLE', label: 'Meublé' }]} onPick={(v) => (setKind(v), go(2))} />
      </QuestionScreen>
    )
  else if (step === 2)
    body = (
      <QuestionScreen
        q={2}
        count={2}
        title="Quand le bail prend-il fin ?"
        hint="La date de fin écrite au bail, ou celle de la reconduction en cours."
        onBack={() => go(1)}
        onNext={() => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return setError('Indiquez la date de fin du bail.')
          go(3)
        }}
      >
        <TextField label="Date de fin du bail" name="end" type="date" value={end} error={error ?? undefined} onChange={(e) => (setEnd(e.target.value), setError(null))} />
      </QuestionScreen>
    )
  else {
    const limit = monthsBefore(end, months)
    const safe = daysBefore(limit, 21)
    const late = limit < new Date().toISOString().slice(0, 10)
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={h2}>
          À recevoir au plus tard le {frDate(limit)}
        </h2>
        <div className="fold fold--ear" style={box}>
          <p style={{ margin: 0 }}>
            <strong>{months} mois</strong> avant la fin du bail ({frDate(end)}), en location {kind === 'MEUBLE' ? 'meublée' : 'vide'}. Le délai compte à partir du jour où votre locataire <strong>reçoit</strong> la lettre.
          </p>
          <p style={{ margin: 0 }}>Envoyez-la vers le {frDate(safe)} pour garder trois semaines de marge.</p>
        </div>
        {late ? <p style={{ margin: 0, color: BAI.ink }}>Cette date est passée : un congé reçu maintenant ne vaut que pour la fin du bail suivante.</p> : null}
        <p style={{ margin: 0 }}>Motifs possibles : vendre, reprendre le logement pour y habiter ou y loger un proche, ou un motif légitime et sérieux. Par lettre recommandée avec avis de réception, acte de commissaire de justice ou remise en main propre contre signature, à chaque locataire.</p>
        <p style={{ margin: 0 }}>
          <Link to="/modeles/conge-proprietaire-vente">Le modèle de congé pour vendre, gratuit</Link>
        </p>
        <button type="button" onClick={() => (setKind(null), setEnd(''), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }
  return (
    <SimplePage title="Date limite du congé du propriétaire">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <Sources>
        Source :{' '}
        <a href="https://www.service-public.fr/particuliers/vosdroits/F929" target="_blank" rel="noopener noreferrer">
          Service-public.fr, préavis et formalités du congé donné par le propriétaire
        </a>{' '}
        (vérifié le 29 octobre 2026) et notice d’information du bail (arrêté du 9 octobre 2026), § 3.1.2.
      </Sources>
    </SimplePage>
  )
}

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
type Dpe = (typeof CLASSES)[number]
/** Interdiction de louer (logement non décent) aux nouveaux baux, renouvellements et reconductions : notice d'information, § 2.1. */
export const FORBIDDEN_FROM: Record<'METRO' | 'DOM', Partial<Record<Dpe, string>>> = {
  METRO: { G: '2025-01-01', F: '2028-01-01', E: '2034-01-01' },
  DOM: { G: '2028-01-01', F: '2031-01-01' },
}

/** Logement interdit à la location selon le DPE (loi du 6 juillet 1989, art. 6 ; calendrier de la notice d'information). */
export function SimulateurDpe() {
  const { q, go } = useQuestion(3)
  const [where, setWhere] = useState<'METRO' | 'DOM' | null>(null)
  const [dpe, setDpe] = useState<Dpe | null>(null)
  const step = !where ? 1 : q === 3 && !dpe ? 2 : q
  let body
  if (step === 1)
    body = (
      <QuestionScreen q={1} count={2} title="Où se trouve le logement ?" hideNext>
        <Choices legend="Lieu du logement" columns value={where} options={[{ value: 'METRO', label: 'En France métropolitaine' }, { value: 'DOM', label: 'Guadeloupe, Martinique, Guyane, La Réunion ou Mayotte' }]} onPick={(v) => (setWhere(v), go(2))} />
      </QuestionScreen>
    )
  else if (step === 2)
    body = (
      <QuestionScreen q={2} count={2} title="Quelle est sa classe énergie (DPE) ?" hint="La lettre de A à G du diagnostic de performance énergétique." onBack={() => go(1)} hideNext>
        <Choices legend="Classe DPE" value={dpe} options={CLASSES.map((c) => ({ value: c, label: c }))} onPick={(v) => (setDpe(v), go(3))} />
      </QuestionScreen>
    )
  else {
    const from = FORBIDDEN_FROM[where!][dpe!]
    const today = new Date().toISOString().slice(0, 10)
    const forbidden = Boolean(from && from <= today)
    const fg = dpe === 'F' || dpe === 'G'
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={h2}>
          {forbidden ? `Classe ${dpe} : location interdite depuis le ${frDate(from!)}` : from ? `Classe ${dpe} : louable jusqu’au ${frDate(daysBefore(from, 1))}` : `Classe ${dpe} : aucune interdiction prévue`}
        </h2>
        <div className="fold fold--ear" style={box}>
          {forbidden ? (
            <p style={{ margin: 0 }}>Le logement est jugé non décent : vous ne pouvez plus signer, renouveler ni laisser se reconduire un bail tant que des travaux ne l’ont pas fait passer dans une meilleure classe. Le locataire en place peut demander la mise en conformité.</p>
          ) : from ? (
            <p style={{ margin: 0 }}>À partir du {frDate(from)}, un nouveau bail, un renouvellement ou une reconduction ne sera plus possible sans travaux. Anticipez : les aides à la rénovation se demandent avant les travaux.</p>
          ) : (
            <p style={{ margin: 0 }}>Le calendrier actuel ne prévoit pas d’interdiction pour cette classe.</p>
          )}
          {fg ? <p style={{ margin: 0 }}>Déjà interdit en {dpe} : augmenter le loyer entre deux locataires, le réviser chaque année (baux depuis le 24 août 2022) ou le réévaluer au renouvellement.</p> : null}
        </div>
        <p style={{ margin: 0 }}>Un DPE réalisé entre 2018 et le 30 juin 2021 n’est plus valable depuis le 1er janvier 2025 : refaites-le avant de louer.</p>
        <button type="button" onClick={() => (setWhere(null), setDpe(null), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }
  return (
    <SimplePage title="DPE : mon logement peut-il être loué ?">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <Sources>
        Source : notice d’information du bail (arrêté du 29 mai 2015 modifié par l’arrêté du 9 octobre 2026), § 1.3.1 et 2.1, sur{' '}
        <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030649902" target="_blank" rel="noopener noreferrer">
          Légifrance
        </a>{' '}
        (vérifié le 6 novembre 2026).
      </Sources>
    </SimplePage>
  )
}

/** Même jour, n mois plus tard (dernier jour du mois si ce jour n'existe pas). */
export const monthsAfter = (iso: string, months: number) => monthsBefore(iso, -months)
const today = () => new Date().toISOString().slice(0, 10)
const eur = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const NOTICE_SOURCE = (
  <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030649902" target="_blank" rel="noopener noreferrer">
    notice d’information du bail (arrêté du 9 octobre 2026), Légifrance
  </a>
)

function DateQuestion({ q, count, title, hint, label, value, onChange, onBack, onNext }: { q: number; count: number; title: string; hint?: string; label: string; value: string; onChange: (v: string) => void; onBack: () => void; onNext: () => void }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <QuestionScreen q={q} count={count} title={title} hint={hint} onBack={onBack} onNext={() => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? onNext() : setError('Indiquez la date.'))}>
      <TextField label={label} name="date" type="date" value={value} error={error ?? undefined} onChange={(e) => (onChange(e.target.value), setError(null))} />
    </QuestionScreen>
  )
}

/** Fin du préavis du locataire (art. 15 et 25-8 ; notice d'information, § 3.1.1). */
export function SimulateurPreavis() {
  const { q, go } = useQuestion(4)
  const [kind, setKind] = useState<'VIDE' | 'MEUBLE' | null>(null)
  const [reduced, setReduced] = useState<boolean | null>(null)
  const [received, setReceived] = useState('')
  const count = kind === 'MEUBLE' ? 2 : 3
  const step = !kind ? 1 : kind === 'VIDE' && reduced === null && q >= 2 ? 2 : q === 4 && !received ? 3 : q
  let body
  if (step === 1)
    body = (
      <QuestionScreen q={1} count={count} title="Le logement est loué…" hideNext>
        <Choices legend="Type de location" columns value={kind} options={[{ value: 'VIDE', label: 'Vide', hint: 'sans meubles' }, { value: 'MEUBLE', label: 'Meublé' }]} onPick={(v) => (setKind(v), setReduced(v === 'MEUBLE' ? true : null), go(v === 'MEUBLE' ? 3 : 2))} />
      </QuestionScreen>
    )
  else if (step === 2)
    body = (
      <QuestionScreen q={2} count={3} title="Le préavis est-il réduit à un mois ?" hint="En zone tendue, ou si le locataire indique et justifie un motif prévu par la loi : premier emploi, mutation, perte d’emploi, nouvel emploi après une perte d’emploi, santé, RSA, AAH, logement social, violences familiales." onBack={() => go(1)} hideNext>
        <Choices legend="Préavis réduit" columns value={reduced === null ? null : reduced ? 'YES' : 'NO'} options={[{ value: 'YES', label: 'Oui, un mois' }, { value: 'NO', label: 'Non, trois mois' }]} onPick={(v) => (setReduced(v === 'YES'), go(3))} />
      </QuestionScreen>
    )
  else if (step === 3)
    body = <DateQuestion q={count} count={count} title="Quand avez-vous reçu sa lettre ?" hint="Le jour de la réception (avis de réception, remise en main propre), pas celui de l’envoi." label="Date de réception du congé" value={received} onChange={setReceived} onBack={() => go(kind === 'MEUBLE' ? 1 : 2)} onNext={() => go(4)} />
  else {
    const months = kind === 'VIDE' && !reduced ? 3 : 1
    const end = monthsAfter(received, months)
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={h2}>
          Fin du préavis : le {frDate(end)}
        </h2>
        <div className="fold fold--ear" style={box}>
          <p style={{ margin: 0 }}>
            <strong>{months === 3 ? 'Trois mois' : 'Un mois'}</strong> à partir de la réception de la lettre, le {frDate(received)}.
          </p>
          <p style={{ margin: 0 }}>Le loyer et les charges restent dus jusqu’à cette date, même si le locataire part avant, sauf si un nouveau locataire entre plus tôt avec votre accord.</p>
        </div>
        <p style={{ margin: 0 }}>Ensuite : état des lieux de sortie à la remise des clés, puis restitution du dépôt de garantie dans un ou deux mois.</p>
        <p style={{ margin: 0 }}>
          <Link to="/modeles/accuse-reception-conge-locataire">Le modèle de réponse au congé, gratuit</Link>
        </p>
        <button type="button" onClick={() => (setKind(null), setReduced(null), setReceived(''), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }
  return (
    <SimplePage title="Préavis du locataire : date de fin">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <Sources>Source : {NOTICE_SOURCE}, § 3.1.1 (vérifié le 6 novembre 2026).</Sources>
    </SimplePage>
  )
}

/** Restitution du dépôt de garantie (art. 22 ; notice d'information, § 3.2.2). */
export function SimulateurDepot() {
  const { q, go } = useQuestion(4)
  const [keys, setKeys] = useState('')
  const [conform, setConform] = useState<boolean | null>(null)
  const [rent, setRent] = useState('')
  const step = !keys && q > 1 ? 1 : conform === null && q > 2 ? 2 : q
  let body
  if (step === 1) body = <DateQuestion q={1} count={3} title="Quand les clés ont-elles été rendues ?" label="Date de remise des clés" value={keys} onChange={setKeys} onBack={() => undefined} onNext={() => go(2)} />
  else if (step === 2)
    body = (
      <QuestionScreen q={2} count={3} title="L’état des lieux de sortie est-il conforme à celui d’entrée ?" onBack={() => go(1)} hideNext>
        <Choices legend="État des lieux conforme" columns value={conform === null ? null : conform ? 'YES' : 'NO'} options={[{ value: 'YES', label: 'Oui, rien n’a changé' }, { value: 'NO', label: 'Non, il y a des différences' }]} onPick={(v) => (setConform(v === 'YES'), go(3))} />
      </QuestionScreen>
    )
  else if (step === 3)
    body = (
      <QuestionScreen q={3} count={3} title="Quel est le loyer mensuel, sans les charges ?" hint="Pour calculer la pénalité en cas de retard." onBack={() => go(2)} onNext={() => go(4)} skip={() => (setRent(''), go(4))}>
        <TextField label="Loyer hors charges, en euros par mois" name="rent" inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} />
      </QuestionScreen>
    )
  else {
    const deadline = monthsAfter(keys, conform ? 1 : 2)
    const now = today()
    const rentCents = Math.round(Number(rent.replace(/\s/g, '').replace(',', '.')) * 100) || 0
    let late = 0
    if (now > deadline) {
      const [y1, m1, d1] = deadline.split('-').map(Number)
      const [y2, m2, d2] = now.split('-').map(Number)
      late = Math.max(1, (y2 - y1) * 12 + (m2 - m1) + (d2 > d1 ? 1 : 0))
    }
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={h2}>
          À rendre au plus tard le {frDate(deadline)}
        </h2>
        <div className="fold fold--ear" style={box}>
          <p style={{ margin: 0 }}>
            <strong>{conform ? 'Un mois' : 'Deux mois'}</strong> après la remise des clés ({frDate(keys)}), déduction faite des sommes dues et justifiées : factures, devis, états des lieux.
          </p>
          {late ? (
            <p style={{ margin: 0 }}>
              La date est passée : la somme due est majorée de 10 % du loyer mensuel par mois de retard commencé, soit {late} mois{rentCents ? `, ${eur(Math.round(rentCents * 0.1) * late)} à ce jour` : ''}.
            </p>
          ) : (
            <p style={{ margin: 0 }}>En retard, la somme due serait majorée de 10 % du loyer mensuel{rentCents ? ` (${eur(Math.round(rentCents * 0.1))})` : ''} par mois de retard commencé, sauf si le locataire ne vous a pas donné sa nouvelle adresse.</p>
          )}
        </div>
        <p style={{ margin: 0 }}>En immeuble collectif, vous pouvez garder 20 % au plus jusqu’au mois qui suit l’approbation des comptes de l’immeuble.</p>
        <p style={{ margin: 0 }}>
          <Link to="/modeles/restitution-depot-de-garantie">Le modèle de lettre de restitution, gratuit</Link>
        </p>
        <button type="button" onClick={() => (setKeys(''), setConform(null), setRent(''), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }
  return (
    <SimplePage title="Dépôt de garantie : date limite de restitution">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <Sources>Source : {NOTICE_SOURCE}, § 3.2.2 (vérifié le 6 novembre 2026).</Sources>
    </SimplePage>
  )
}

/** Micro-foncier (abattement de 30 %, loyers ≤ 15 000 €) ou régime réel, pour une location vide. */
export function SimulateurMicroReel() {
  const { q, go } = useQuestion(3)
  const [rents, setRents] = useState('')
  const [costs, setCosts] = useState('')
  const [error, setError] = useState<string | null>(null)
  const num = (v: string) => Math.round(Number(v.replace(/\s/g, '').replace(',', '.')) * 100)
  const rentsCents = num(rents)
  const costsCents = num(costs)
  const step = q === 2 && !(rentsCents > 0) ? 1 : q === 3 && !(rentsCents > 0 && costsCents >= 0 && costs !== '') ? (rentsCents > 0 ? 2 : 1) : q
  let body
  if (step === 1)
    body = (
      <QuestionScreen q={1} count={2} title="Combien de loyers avez-vous encaissés sur l’année ?" hint="Loyers hors charges récupérables, location vide, tous logements loués nus." onBack={() => undefined} onNext={() => (rentsCents > 0 ? go(2) : setError('Indiquez le montant des loyers.'))}>
        <TextField label="Loyers de l’année, en euros" name="rents" inputMode="decimal" value={rents} error={error ?? undefined} onChange={(e) => (setRents(e.target.value), setError(null))} />
      </QuestionScreen>
    )
  else if (step === 2)
    body = (
      <QuestionScreen q={2} count={2} title="Combien de charges déductibles avez-vous payées ?" hint="Intérêts d’emprunt, taxe foncière (hors ordures ménagères), assurance, frais de gestion, travaux d’entretien et d’amélioration, charges de copropriété non récupérables." onBack={() => go(1)} onNext={() => (costs !== '' && costsCents >= 0 ? go(3) : setError('Indiquez le montant, ou 0.'))}>
        <TextField label="Charges déductibles de l’année, en euros" name="costs" inputMode="decimal" value={costs} error={error ?? undefined} onChange={(e) => (setCosts(e.target.value), setError(null))} />
      </QuestionScreen>
    )
  else {
    const microAllowed = rentsCents <= 1_500_000
    const micro = Math.round(rentsCents * 0.7)
    const real = rentsCents - costsCents
    const best = !microAllowed || real < micro ? 'REEL' : 'MICRO'
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={h2}>
          {best === 'REEL' ? 'Le régime réel est le plus avantageux' : 'Le micro-foncier est le plus avantageux'}
        </h2>
        <div className="fold fold--ear" style={box}>
          <p style={{ margin: 0 }}>{microAllowed ? <>Micro-foncier : <strong>{eur(micro)}</strong> imposables (loyers moins 30 %).</> : 'Micro-foncier : impossible au-delà de 15 000 € de loyers par an.'}</p>
          <p style={{ margin: 0 }}>
            Réel : <strong>{real >= 0 ? `${eur(real)} imposables` : `${eur(-real)} de déficit foncier`}</strong> (loyers moins charges réelles).
          </p>
        </div>
        {real < 0 ? <p style={{ margin: 0 }}>Un déficit foncier, hors intérêts d’emprunt, se déduit de votre revenu global dans la limite de 10 700 € par an ; le reste se reporte sur les années suivantes.</p> : null}
        <p style={{ margin: 0 }}>Au réel, vous remplissez la déclaration 2044. Avec Bailio, elle sort pré-remplie et vous recopiez les cases.</p>
        <button type="button" onClick={() => (setRents(''), setCosts(''), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }
  return (
    <SimplePage title="Micro-foncier ou régime réel : le comparatif">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <Sources>
        Source :{' '}
        <a href="https://www.service-public.fr/particuliers/vosdroits/F32744" target="_blank" rel="noopener noreferrer">
          Service-public.fr, revenus fonciers : micro-foncier et régime réel
        </a>
        . Estimation avant impôt : votre taux d’imposition et les prélèvements sociaux s’appliquent ensuite.
      </Sources>
    </SimplePage>
  )
}
