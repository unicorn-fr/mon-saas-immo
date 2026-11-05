import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'
import { TextField, display } from '../components/ui'
import { api } from '../lib/api'

// Mêmes clés que server/src/domain/testerFeedback.ts : le serveur refuse une autre clé.
const PROFILE = [
  { value: 'OWNER', label: 'Je loue un ou plusieurs logements' },
  { value: 'SOON', label: 'Je vais bientôt louer' },
  { value: 'PRO', label: 'Je suis un professionnel de l’immobilier' },
  { value: 'CREATOR', label: 'Je crée du contenu sur l’immobilier' },
] as const
const TRIED = [
  { value: 'PROPERTY', label: 'Ajouter un logement' },
  { value: 'TENANT', label: 'Ajouter un locataire' },
  { value: 'LEASE', label: 'Créer un bail' },
  { value: 'ESIGN', label: 'Signature en ligne' },
  { value: 'INVENTORY', label: 'État des lieux' },
  { value: 'RENT', label: 'Loyers et quittances' },
  { value: 'LETTERS', label: 'Courriers' },
  { value: 'AD', label: 'Annonce et candidats' },
  { value: 'TAX', label: 'Déclaration des revenus' },
  { value: 'OTHER', label: 'Autre chose' },
] as const
const EASE = [
  { value: 'VERY_EASY', label: 'Très facile' },
  { value: 'EASY', label: 'Facile' },
  { value: 'OK', label: 'Moyen' },
  { value: 'HARD', label: 'Difficile' },
  { value: 'VERY_HARD', label: 'Très difficile' },
] as const
const DESIGN = [
  { value: 'GREAT', label: 'Très réussi' },
  { value: 'GOOD', label: 'Réussi' },
  { value: 'OK', label: 'Correct' },
  { value: 'REDO', label: 'À revoir' },
] as const
const SPEED = [
  { value: 'FAST', label: 'Rapide' },
  { value: 'OK', label: 'Correcte' },
  { value: 'SLOW', label: 'Lente' },
] as const
const PRICE = [
  { value: 'FREE', label: 'Seulement si c’est gratuit' },
  { value: 'UP_TO_5', label: 'Jusqu’à 5 € par mois' },
  { value: 'UP_TO_10', label: '5 à 10 € par mois' },
  { value: 'UP_TO_20', label: '10 à 20 € par mois' },
  { value: 'MORE', label: 'Plus de 20 € par mois' },
] as const

type Key<T extends ReadonlyArray<{ value: string }>> = T[number]['value']
type TextKey = 'liked' | 'annoying' | 'add' | 'remove' | 'bugs'

/** Questions ouvertes, toutes facultatives (« Passer »). */
const OPEN: Array<{ key: TextKey; title: string; placeholder: string }> = [
  { key: 'liked', title: 'Qu’avez-vous le plus aimé ?', placeholder: 'Une fonction, un écran, un détail…' },
  { key: 'annoying', title: 'Qu’est-ce qui vous a gêné ou semblé confus ?', placeholder: 'Un mot pas clair, une étape trop longue…' },
  { key: 'add', title: 'Quelle fonction aimeriez-vous trouver ?', placeholder: 'Ce qui vous manque pour gérer vos locations' },
  { key: 'remove', title: 'Que faudrait-il retirer ou simplifier ?', placeholder: 'Ce qui ne vous sert pas ou complique' },
  { key: 'bugs', title: 'Avez-vous rencontré un bug ?', placeholder: 'Ce que vous faisiez, ce qui s’est passé, sur téléphone ou ordinateur' },
]

const COUNT = 13
const INSTAGRAM = 'https://www.instagram.com/bailio.fr/'

/**
 * Questionnaire des testeurs (lien envoyé après l'essai) : une question par écran, comme tout formulaire public.
 * Recommandation de 0 à 10, profil, parcours essayés, facilité, design, rapidité, questions ouvertes, prix, contact.
 * Les réponses partent par email à l'équipe ; rien n'est enregistré.
 */
export default function AvisTesteur() {
  const { q, go } = useQuestion(COUNT + 1)
  const [nps, setNps] = useState<number | null>(null)
  const [profile, setProfile] = useState<Key<typeof PROFILE> | null>(null)
  const [tried, setTried] = useState<Array<Key<typeof TRIED>>>([])
  const [ease, setEase] = useState<Key<typeof EASE> | null>(null)
  const [design, setDesign] = useState<Key<typeof DESIGN> | null>(null)
  const [speed, setSpeed] = useState<Key<typeof SPEED> | null>(null)
  const [texts, setTexts] = useState<Record<TextKey, string>>({ liked: '', annoying: '', add: '', remove: '', bugs: '' })
  const [price, setPrice] = useState<Key<typeof PRICE> | null>(null)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (nps === null) return go(1)
    setBusy(true)
    setError(null)
    try {
      await api('/tester-feedback', { method: 'POST', body: { nps, profile, tried, ease, design, speed, ...texts, price, name: name || null, contact: contact || null, website } })
      go(COUNT + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'L’envoi n’a pas abouti. Réessayez dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  // Lien ouvert au milieu (retour du navigateur, rechargement) sans la première réponse : on recommence au début.
  const step = nps === null ? 1 : q
  const pick = <T,>(set: (v: T) => void, next: number) => (v: T) => {
    set(v)
    go(next)
  }

  let screen
  if (step === COUNT + 1)
    screen = (
      <div data-question style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 tabIndex={-1} style={display('clamp(28px, 4.4vw, 38px)', { outline: 'none' })}>
          Merci, <em>vraiment</em>.
        </h2>
        <p style={{ margin: 0 }}>Vos réponses sont arrivées. Elles décident de ce que nous améliorons en premier.</p>
        <p style={{ margin: 0 }}>
          Suivez la suite sur Instagram :{' '}
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ color: BAI.owner, fontWeight: 600 }}>
            @bailio.fr<span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
        </p>
      </div>
    )
  else if (step === 1)
    screen = (
      <QuestionScreen q={1} count={COUNT} title="Recommanderiez-vous Bailio à un propriétaire ?" hint="0 : pas du tout, 10 : sans hésiter." hideNext>
        <div role="group" aria-label="Note de 0 à 10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 8 }}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              aria-pressed={nps === n}
              onClick={() => {
                setNps(n)
                go(2)
              }}
              style={{ minHeight: 56, borderRadius: 14, border: nps === n ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: nps === n ? BAI.ownerLight : BAI.surface, color: nps === n ? BAI.owner : BAI.ink, fontSize: 18, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {n}
            </button>
          ))}
        </div>
      </QuestionScreen>
    )
  else if (step === 2)
    screen = (
      <QuestionScreen q={2} count={COUNT} title="Qui êtes-vous ?" onBack={() => go(1)} skip={() => go(3)} hideNext>
        <Choices legend="Qui êtes-vous ?" columns value={profile} options={[...PROFILE]} onPick={pick(setProfile, 3)} />
      </QuestionScreen>
    )
  else if (step === 3)
    screen = (
      <QuestionScreen q={3} count={COUNT} title="Qu’avez-vous essayé ?" hint="Plusieurs réponses possibles." onBack={() => go(2)} onNext={() => go(4)}>
        <div role="group" aria-label="Qu’avez-vous essayé ?" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {TRIED.map((t) => {
            const on = tried.includes(t.value)
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => setTried(on ? tried.filter((x) => x !== t.value) : [...tried, t.value])}
                style={{ minHeight: 48, padding: '0 18px', borderRadius: 999, border: on ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: on ? BAI.ownerLight : BAI.surface, color: on ? BAI.owner : BAI.ink, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {on ? '✓ ' : ''}
                {t.label}
              </button>
            )
          })}
        </div>
      </QuestionScreen>
    )
  else if (step === 4)
    screen = (
      <QuestionScreen q={4} count={COUNT} title="Était-ce facile ?" onBack={() => go(3)} skip={() => go(5)} hideNext>
        <Choices legend="Était-ce facile ?" value={ease} options={[...EASE]} onPick={pick(setEase, 5)} />
      </QuestionScreen>
    )
  else if (step === 5)
    screen = (
      <QuestionScreen q={5} count={COUNT} title="Que pensez-vous du design ?" hint="Couleurs, lisibilité, clarté des écrans." onBack={() => go(4)} skip={() => go(6)} hideNext>
        <Choices legend="Que pensez-vous du design ?" value={design} options={[...DESIGN]} onPick={pick(setDesign, 6)} />
      </QuestionScreen>
    )
  else if (step === 6)
    screen = (
      <QuestionScreen q={6} count={COUNT} title="Et la rapidité ?" onBack={() => go(5)} skip={() => go(7)} hideNext>
        <Choices legend="Et la rapidité ?" value={speed} options={[...SPEED]} onPick={pick(setSpeed, 7)} />
      </QuestionScreen>
    )
  else if (step >= 7 && step <= 11) {
    const o = OPEN[step - 7]
    screen = (
      <QuestionScreen q={step} count={COUNT} title={o.title} onBack={() => go(step - 1)} onNext={() => go(step + 1)} skip={texts[o.key] ? undefined : () => go(step + 1)}>
        <textarea
          aria-label={o.title}
          value={texts[o.key]}
          onChange={(e) => setTexts({ ...texts, [o.key]: e.target.value })}
          placeholder={o.placeholder}
          rows={5}
          maxLength={2000}
          style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${BAI.borderStrong}`, borderRadius: 14, padding: '14px 16px', fontSize: 16, fontFamily: 'inherit', color: BAI.ink, background: BAI.surface, resize: 'vertical', lineHeight: 1.5 }}
        />
      </QuestionScreen>
    )
  } else if (step === 12)
    screen = (
      <QuestionScreen q={12} count={COUNT} title="Combien paieriez-vous pour Bailio ?" onBack={() => go(11)} skip={() => go(13)} hideNext>
        <Choices legend="Combien paieriez-vous pour Bailio ?" columns value={price} options={[...PRICE]} onPick={pick(setPrice, 13)} />
      </QuestionScreen>
    )
  else
    screen = (
      <QuestionScreen
        q={13}
        count={COUNT}
        title="Pouvons-nous vous recontacter ?"
        hint="Facultatif. Pour vous poser une question sur vos réponses."
        onBack={() => go(12)}
        onNext={() => void send()}
        nextLabel="Envoyer mes réponses"
        busy={busy}
        footer={
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
            Vos réponses partent par email à l’équipe Bailio, qui s’en sert seulement pour améliorer le service. Rien n’est enregistré sur le site (<Link to="/confidentialite">confidentialité</Link>).
          </span>
        }
      >
        <TextField label="Votre nom ou compte Instagram" name="tester-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Votre email ou téléphone" name="tester-contact" autoComplete="email" value={contact} error={error ?? undefined} onChange={(e) => setContact(e.target.value)} />
        {/* Champ invisible : les robots le remplissent, pas les personnes. */}
        <input tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
      </QuestionScreen>
    )

  return (
    <SimplePage title="Votre avis sur Bailio">
      <p style={{ margin: '-12px 0 24px' }}>Deux minutes, une question à la fois. Merci d’avoir testé.</p>
      <div style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, padding: 'clamp(20px, 4vw, 32px)' }}>{screen}</div>
    </SimplePage>
  )
}
