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
