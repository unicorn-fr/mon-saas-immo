import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'
import { TextField } from '../components/ui'
import { MODELES, SIMULATEUR_REVISION, letterText, modelePath, type Modele } from '../content/modeles'
import { NotFound } from './legal/Legal'

/** Description de la page pour les moteurs de recherche, remise comme avant en quittant la page. */
function useDescription(text: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) return
    const before = meta.content
    meta.content = text
    return () => {
      meta.content = before
    }
  }, [text])
}

const card = { background: BAI.bg, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)' } as const
const h2 = { margin: '36px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink } as const

export function ModelesList() {
  useDescription('Modèles de lettres gratuits pour les propriétaires bailleurs : mise en demeure de payer, révision du loyer, congé pour vendre. Et le simulateur de révision du loyer avec l’IRL.')
  return (
    <SimplePage title="Modèles de lettres gratuits">
      <p style={{ margin: '0 0 28px' }}>À copier et compléter, avec les règles vérifiées sur les sources officielles.</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <li style={{ ...card, background: BAI.sky }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
            <Link to={SIMULATEUR_REVISION} style={{ color: BAI.ink }}>
              Simulateur de révision du loyer
            </Link>
          </h2>
          <p style={{ margin: 0, fontSize: 16 }}>Votre nouveau loyer avec le dernier indice publié, en trois questions.</p>
        </li>
        {MODELES.map((m) => (
          <li key={m.slug} style={card}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
              <Link to={modelePath(m)} style={{ color: BAI.ink }}>
                {m.title}
              </Link>
            </h2>
            <p style={{ margin: 0, fontSize: 16 }}>{m.lead}</p>
          </li>
        ))}
      </ul>
    </SimplePage>
  )
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 2500)
        })
      }}
      style={{ alignSelf: 'flex-start', minHeight: 48, padding: '0 24px', borderRadius: 999, border: `1.5px solid ${BAI.owner}`, background: BAI.surface, color: BAI.owner, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
    >
      {done ? 'Copiée' : 'Copier la lettre'}
    </button>
  )
}

function ModelePage({ m }: { m: Modele }) {
  useDescription(m.description)
  const others = MODELES.filter((x) => x.slug !== m.slug)
  return (
    <SimplePage title={m.title}>
      <p style={{ margin: '-16px 0 24px', fontSize: 18 }}>{m.lead}</p>
      <h2 style={h2}>Avant d’envoyer</h2>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        {m.rules.map((r) => (
          <li key={r} style={{ marginBottom: 6 }}>
            {r}
          </li>
        ))}
      </ul>
      <h2 style={h2}>La lettre</h2>
      <div className="fold fold--ear" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 24, padding: 'clamp(20px, 4vw, 36px)', color: BAI.ink, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>Objet : {m.letter.subject}</p>
        <p style={{ margin: 0 }}>Madame, Monsieur,</p>
        {m.letter.paragraphs.map((p) => (
          <p key={p} style={{ margin: 0 }}>
            {p}
          </p>
        ))}
        <p style={{ margin: 0 }}>Je vous prie d’agréer, Madame, Monsieur, mes salutations distinguées.</p>
        <p style={{ margin: 0 }}>[Signature]</p>
        <CopyButton text={letterText(m)} />
      </div>
      {m.letter.annexes ? (
        <>
          <h2 style={h2}>À joindre</h2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            {m.letter.annexes.map((a) => (
              <li key={a} style={{ marginBottom: 6 }}>
                {a}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <h2 style={h2}>Comment l’envoyer</h2>
      <p style={{ margin: 0 }}>{m.send}</p>
      <p style={{ margin: '28px 0', background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(18px, 3vw, 24px)' }}>
        <strong>Avec Bailio : </strong>
        {m.bailio}
      </p>
      <h2 style={{ ...h2, fontSize: 18 }}>Sources</h2>
      <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
        {m.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>{' '}
            (vérifié le {s.checked})
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 20, fontSize: 15 }}>Ce modèle donne les règles générales. Il ne remplace pas un conseil juridique adapté à votre situation.</p>
      <h2 style={{ ...h2, fontSize: 18 }}>Autres modèles</h2>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        {others.map((x) => (
          <li key={x.slug}>
            <Link to={modelePath(x)}>{x.title}</Link>
          </li>
        ))}
        <li>
          <Link to={SIMULATEUR_REVISION}>Simulateur de révision du loyer</Link>
        </li>
      </ul>
    </SimplePage>
  )
}

export function ModeleArticle() {
  const { slug } = useParams()
  const m = MODELES.find((x) => x.slug === slug)
  return m ? <ModelePage m={m} /> : <NotFound />
}

// ── Simulateur de révision du loyer ────────────────────────────────────────

interface IrlPoint {
  quarter: string
  value: number
  publishedAt: string | null
}

const QUARTERS = [
  { value: 1, label: '1er trimestre' },
  { value: 2, label: '2e trimestre' },
  { value: 3, label: '3e trimestre' },
  { value: 4, label: '4e trimestre' },
]
const qLabel = (quarter: string) => `${QUARTERS[Number(quarter.slice(-1)) - 1].label} ${quarter.slice(0, 4)}`
const num = (v: number) => String(v).replace('.', ',')
const eur = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/** Nouveau loyer : loyer × IRL du dernier trimestre publié ÷ IRL du même trimestre un an plus tôt, arrondi au centime. */
export function revision(rentCents: number, quarter: number, points: IrlPoint[]) {
  const sorted = [...points].sort((a, b) => b.quarter.localeCompare(a.quarter))
  const latest = sorted.find((p) => p.quarter.endsWith(`Q${quarter}`))
  if (!latest) return null
  const ref = sorted.find((p) => p.quarter === `${Number(latest.quarter.slice(0, 4)) - 1}-Q${quarter}`)
  if (!ref) return null
  return { latest, ref, newCents: Math.round((rentCents * latest.value) / ref.value) }
}

export function SimulateurRevision() {
  useDescription('Simulateur gratuit de révision du loyer : votre nouveau loyer avec le dernier indice de référence des loyers (IRL) publié par l’Insee, et la lettre à envoyer.')
  const { q, go } = useQuestion(4)
  const [dpe, setDpe] = useState<'OK' | 'FG' | null>(null)
  const [rent, setRent] = useState('')
  const [quarter, setQuarter] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<IrlPoint[] | null>(null)

  useEffect(() => {
    fetch('/api/geo/irl/series')
      .then((r) => r.json())
      .then((j: { data?: IrlPoint[] }) => setPoints(j.data ?? []))
      .catch(() => setPoints([]))
  }, [])

  const rentCents = Math.round(Number(rent.replace(/\s/g, '').replace(',', '.')) * 100)
  const step = !dpe ? 1 : dpe === 'FG' ? 4 : q === 3 && !(rentCents > 0) ? 2 : q === 4 && !quarter ? 3 : q

  let body
  if (step === 1)
    body = (
      <QuestionScreen q={1} count={3} title="Quelle est la classe énergie du logement ?" hint="Elle est sur le diagnostic de performance énergétique (DPE)." hideNext>
        <Choices
          legend="Classe énergie du logement"
          columns
          value={dpe}
          options={[
            { value: 'OK', label: 'De A à E', hint: 'ou je ne sais pas' },
            { value: 'FG', label: 'F ou G' },
          ]}
          onPick={(v) => {
            setDpe(v)
            go(v === 'FG' ? 4 : 2)
          }}
        />
      </QuestionScreen>
    )
  else if (step === 2)
    body = (
      <QuestionScreen
        q={2}
        count={3}
        title="Quel est le loyer actuel, sans les charges ?"
        onBack={() => go(1)}
        onNext={() => {
          if (!(rentCents >= 1000 && rentCents <= 2_000_000)) return setError('Indiquez un loyer entre 10 € et 20 000 €.')
          go(3)
        }}
      >
        <TextField
          label="Loyer hors charges, en euros par mois"
          name="rent"
          inputMode="decimal"
          value={rent}
          error={error ?? undefined}
          onChange={(e) => {
            setRent(e.target.value)
            setError(null)
          }}
        />
      </QuestionScreen>
    )
  else if (step === 3)
    body = (
      <QuestionScreen q={3} count={3} title="Quel trimestre de référence est écrit dans le bail ?" hint="Dans la clause de révision : « IRL du … trimestre »." onBack={() => go(2)} hideNext>
        <Choices
          legend="Trimestre de référence de l’IRL"
          columns
          value={quarter}
          options={QUARTERS}
          onPick={(v) => {
            setQuarter(v)
            go(4)
          }}
        />
      </QuestionScreen>
    )
  else if (dpe === 'FG')
    body = (
      <section aria-labelledby="sim-result" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 id="sim-result" style={{ ...h2, margin: 0 }}>
          La révision est interdite
        </h2>
        <p style={{ margin: 0 }}>
          En métropole, un logement classé F ou G ne peut plus voir son loyer révisé, pour un bail signé, renouvelé ou reconduit depuis le 24 août 2022. Des travaux qui font passer le logement en E ou mieux rouvrent ce droit.
        </p>
        <button type="button" onClick={() => (setDpe(null), go(1))} style={linkButton}>
          Recommencer
        </button>
      </section>
    )
  else {
    const r = points && quarter ? revision(rentCents, quarter, points) : null
    body = (
      <section aria-labelledby="sim-result" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!points ? (
          <p>Calcul en cours…</p>
        ) : !r ? (
          <>
            <h2 id="sim-result" style={{ ...h2, margin: 0 }}>
              Indice pas encore disponible
            </h2>
            <p style={{ margin: 0 }}>L’indice de ce trimestre n’est pas disponible pour l’instant. Réessayez dans quelques minutes, ou consultez la série « IRL » sur insee.fr.</p>
          </>
        ) : (
          <>
            <h2 id="sim-result" style={{ ...h2, margin: 0 }}>
              Nouveau loyer : {eur(r.newCents)}
            </h2>
            <div className="fold fold--ear" style={{ background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0 }}>
                <strong>+ {eur(r.newCents - rentCents)} par mois</strong>, soit {eur((r.newCents - rentCents) * 12)} par an.
              </p>
              <p style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {eur(rentCents)} × {num(r.latest.value)} ÷ {num(r.ref.value)} = {eur(r.newCents)}
              </p>
              <p style={{ margin: 0, fontSize: 15 }}>
                IRL du {qLabel(r.latest.quarter)} ({num(r.latest.value)}) comparé à celui du {qLabel(r.ref.quarter)} ({num(r.ref.value)}), Insee.
              </p>
            </div>
            <p style={{ margin: 0 }}>Le loyer change à la date de révision prévue au bail, et seulement après votre demande écrite : rien en arrière.</p>
            <p style={{ margin: 0 }}>
              <Link to="/modeles/lettre-revision-loyer">Le modèle de lettre de révision, gratuit</Link>
            </p>
          </>
        )}
        <button type="button" onClick={() => (setDpe(null), setQuarter(null), setRent(''), go(1))} style={linkButton}>
          Faire un autre calcul
        </button>
      </section>
    )
  }

  return (
    <SimplePage title="Simulateur de révision du loyer">
      <div style={{ maxWidth: 560 }}>{body}</div>
      <p style={{ marginTop: 40, fontSize: 15 }}>
        Avec Bailio, la lettre de révision est prête à la date anniversaire, avec le bon indice, et le nouveau loyer passe dans les quittances. <Link to="/commencer">Préparer mon bail, gratuitement</Link>
      </p>
      <p style={{ fontSize: 15 }}>
        Source :{' '}
        <a href="https://www.service-public.fr/particuliers/vosdroits/F1311" target="_blank" rel="noopener noreferrer">
          Service-public.fr, augmentation et révision du loyer en cours de bail
        </a>{' '}
        (vérifié le 3 novembre 2026). <Link to="/modeles">Tous les modèles</Link>
      </p>
    </SimplePage>
  )
}

const linkButton = { alignSelf: 'flex-start', background: 'none', border: 'none', padding: '12px 0', fontSize: 16, fontWeight: 600, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' } as const
