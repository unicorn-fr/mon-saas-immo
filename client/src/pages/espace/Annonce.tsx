import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Chips, Crumbs, Input, LoadError, Loader, Money, TextArea, TextLink, useLoad, useToast } from '../../components/kit'
import { Check, Circle } from '../../components/Icons'
import { api } from '../../lib/api'

interface AdSettings {
  title?: string | null
  description?: string | null
  rentCents?: number | null
  chargesCents?: number | null
  chargesMode?: 'PROVISION' | 'FORFAIT' | null
  depositCents?: number | null
  complementCents?: number | null
  availableFrom?: string | null
  highlights?: string | null
  tenantFeesCents?: number | null
}
interface AdView {
  settings: AdSettings
  ad: { title: string; text: string; checks: Array<{ label: string; ok: boolean; hint?: string }>; warnings: string[] }
  prompt: string
  habitat: 'COLLECTIVE' | 'INDIVIDUAL' | null
  parking?: boolean
  saved: boolean
}

/**
 * Annonce de mise en location : les montants sont repris du dernier bail, la description du logement de sa
 * fiche ; chaque modification est enregistrée et l'annonce se met à jour avec ses mentions obligatoires.
 */
export default function Annonce() {
  const { id = '' } = useParams()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<AdView>(`/properties/${id}/ad`), [id])
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [view, setView] = useState<AdView['ad'] | null>(null)
  const [prompt, setPrompt] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (data) {
      setSettings(data.settings)
      setView(data.ad)
      setPrompt(data.prompt)
    }
  }, [data])
  useEffect(() => {
    if (!dirty.current || !settings) return
    const t = setTimeout(() => {
      api<AdView>(`/properties/${id}/ad`, { method: 'PUT', body: settings })
        .then((r) => {
          setView(r.ad)
          setPrompt(r.prompt)
          setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
        })
        .catch(toast.error)
    }, 600)
    return () => clearTimeout(t)
  }, [settings, id, toast])

  if (loading && !data) return <AppShell><Loader /></AppShell>
  if (error || !data || !settings || !view) return <AppShell><LoadError message={error ?? ''} retry={reload} /></AppShell>
  const set = (patch: Partial<AdSettings>) => {
    dirty.current = true
    setSettings({ ...settings, ...patch })
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${view.title}\n\n${view.text}`)
      toast.show('Annonce copiée. Collez-la sur le site de votre choix.')
    } catch {
      toast.show('Sélectionnez le texte de l’annonce puis copiez-le.', 'error')
    }
  }
  const missing = view.checks.filter((c) => !c.ok)

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Le logement', to: `/espace/logements/${id}` }, { label: 'Annonce' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Votre annonce</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Bailio reprend la fiche du logement et ajoute les mentions obligatoires. Copiez le texte sur le site d’annonces de votre choix.</span>
      </div>
      {view.warnings.map((w) => (
        <Callout key={w} tone="warn">
          {w}
        </Callout>
      ))}
      <div className="split-aside" style={{ gap: 24 }}>
        <div className="grow">
          <Card title="Loyer et conditions">
            <Fields>
              <Money label="Loyer hors charges, par mois" cents={settings.rentCents} onChange={(c) => set({ rentCents: c })} />
              <Money label="Charges, par mois" cents={settings.chargesCents} onChange={(c) => set({ chargesCents: c })} />
            </Fields>
            <Chips
              legend="Les charges sont"
              value={settings.chargesMode ?? 'PROVISION'}
              onChange={(v) => set({ chargesMode: v })}
              options={[
                { value: 'PROVISION', label: 'Une provision, régularisée chaque année' },
                { value: 'FORFAIT', label: 'Un forfait' },
              ]}
            />
            <Fields>
              <Money label="Dépôt de garantie" cents={settings.depositCents} onChange={(c) => set({ depositCents: c })} />
              <Input label="Disponible à partir du" type="date" value={settings.availableFrom ?? ''} onChange={(v) => set({ availableFrom: v || null })} />
            </Fields>
            {view.checks.some((c) => c.label === 'Honoraires à la charge du locataire') ? (
              <Money label="Honoraires du mandataire à la charge du locataire (TTC)" cents={settings.tenantFeesCents} onChange={(c) => set({ tenantFeesCents: c })} hint="Mention obligatoire de l’annonce quand un mandataire s’occupe de la location. 0 s’il n’y en a pas." />
            ) : null}
{data.parking ? null : (
            <Money label="Dont complément de loyer (zone d’encadrement)" cents={settings.complementCents} onChange={(c) => set({ complementCents: c })} hint="Seulement si la commune encadre les loyers et que le logement le justifie. Sinon, laissez vide." />
            )}
          </Card>
          <Writer
            id={id}
            prompt={prompt}
            highlights={settings.highlights ?? ''}
            onHighlights={(v) => set({ highlights: v || null })}
            onPasted={(r) => {
              dirty.current = false
              setSettings(r.settings)
              setView(r.ad)
              setPrompt(r.prompt)
            }}
          />
          <Card title="Présentation">
            <Input label="Titre" value={settings.title ?? ''} onChange={(v) => set({ title: v || null })} placeholder={view.title} hint="Laissez vide pour le titre proposé par Bailio." />
            <TextArea label="Description" value={settings.description ?? ''} onChange={(v) => set({ description: v || null })} rows={8} maxLength={3000} placeholder="Lumineux, au calme, proche des commerces et des transports." hint="Écrivez-la vous-même ou collez le texte d’une IA ci-dessus. Décrivez le logement, sans critère sur le futur locataire : la loi interdit toute discrimination." />
          </Card>
          {savedAt ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>Enregistré automatiquement à {savedAt}.</span> : null}
        </div>
        <aside className="aside" style={{ width: 460 }}>
          <Card title="Aperçu" action={<Btn size="sm" onClick={() => void copy()}>Copier l’annonce</Btn>}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{view.title}</span>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6, color: BAI.inkMid }}>{view.text}</div>
          </Card>
          <Card title="Publier votre annonce">
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>Copiez l’annonce, puis collez-la sur un ou plusieurs de ces sites. Ajoutez vos photos sur le site.</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {adSites(data.habitat).map((a) => (
                <Btn key={a.label} variant="outline" size="sm" href={a.href} newTab>
                  {a.label}
                </Btn>
              ))}
            </div>
            <TextLink to={`/espace/logements/${id}/candidats`} style={{ fontSize: 14 }}>
              Ensuite : le message avec votre lien de candidature, à envoyer aux personnes intéressées
            </TextLink>
          </Card>
          <Card title="Mentions obligatoires" action={<span style={{ fontSize: 14, color: missing.length ? BAI.caramelInk : BAI.green, fontWeight: 600 }}>{missing.length ? `${missing.length} à compléter` : 'Complètes'}</span>}>
            {view.checks.map((c) => (
              <div key={c.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                {c.ok ? <Check size={18} /> : <Circle size={18} />}
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  {!c.ok && c.hint ? <span style={{ color: BAI.inkSoft }}>{c.hint}</span> : null}
                </span>
              </div>
            ))}
            {missing.some((c) => /fiche/.test(c.hint ?? '')) ? (
              <TextLink to={`/espace/logements/${id}/fiche#diagnostics`} style={{ fontSize: 14 }}>
                Compléter la fiche du logement
              </TextLink>
            ) : null}
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}

/** Sites où un particulier publie une annonce de location (liens de dépôt vérifiés en octobre 2026). */
const adSites = (habitat: AdView['habitat']) => [
  { label: 'Leboncoin', href: 'https://www.leboncoin.fr/deposer-une-annonce' },
  { label: 'SeLoger', href: 'https://www.seloger.com/depot-annonce/location' },
  { label: 'PAP', href: `https://www.pap.fr/publier-annonce/location/${habitat === 'INDIVIDUAL' ? 'maison' : 'appartement'}` },
  { label: 'Facebook Marketplace', href: 'https://www.facebook.com/marketplace/create/rental' },
]

const ASSISTANTS = [
  { label: 'ChatGPT', href: 'https://chatgpt.com/' },
  { label: 'Gemini', href: 'https://gemini.google.com/' },
  { label: 'Claude', href: 'https://claude.ai/' },
  { label: 'Le Chat', href: 'https://chat.mistral.ai/' },
]

/**
 * Rédaction avec l'assistant d'IA de son choix : Bailio prépare la consigne à partir de la fiche du logement
 * (sans adresse ni nom), le propriétaire la copie, puis colle la réponse ici. Rien n'est envoyé par Bailio.
 */
function Writer({ id, prompt, highlights, onHighlights, onPasted }: { id: string; prompt: string; highlights: string; onHighlights: (v: string) => void; onPasted: (r: AdView) => void }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.show('Consigne copiée. Collez-la dans l’assistant de votre choix.')
    } catch {
      toast.show('Sélectionnez le texte de la consigne puis copiez-le.', 'error')
    }
  }
  const use = async () => {
    setBusy(true)
    try {
      onPasted(await api<AdView>(`/properties/${id}/ad/paste`, { method: 'POST', body: { text: pasted } }))
      setPasted('')
      toast.show('Texte repris dans votre annonce. Relisez-le et retouchez-le si besoin.')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title="Rédiger avec une IA" action={<TextLink onClick={() => setOpen(!open)}>{open ? 'Masquer' : 'Ouvrir'}</TextLink>}>
      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
        Facultatif. ChatGPT, Gemini, Claude ou Le Chat peuvent écrire la présentation pour vous, à partir de la fiche du logement. Vous préférez écrire vous-même ? Utilisez la rubrique « Présentation » plus bas.
      </span>
      {open ? (
        <>
          <Input label="Ce que vous aimez dans ce logement (facultatif)" value={highlights} onChange={onHighlights} placeholder="Très lumineux, rue calme, cuisine refaite en 2024" hint="Ajouté à la consigne. Rien d’autre n’est inventé." />
          <Step n={1} title="Copiez la consigne">
            <div aria-label="Consigne pour l’IA" style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.5, color: BAI.inkMid, background: BAI.bg, border: `1px solid ${BAI.divider}`, borderRadius: 14, padding: 14, maxHeight: 220, overflowY: 'auto' }}>
              {prompt}
            </div>
            <Btn variant="outline" size="sm" onClick={() => void copyPrompt()} style={{ alignSelf: 'flex-start' }}>
              Copier la consigne
            </Btn>
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>Elle ne contient ni l’adresse exacte, ni votre nom, ni vos coordonnées.</span>
          </Step>
          <Step n={2} title="Collez-la dans l’assistant de votre choix">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ASSISTANTS.map((a) => (
                <Btn key={a.label} variant="outline" size="sm" href={a.href} newTab>
                  {a.label}
                </Btn>
              ))}
            </div>
          </Step>
          <Step n={3} title="Collez sa réponse ici">
            <TextArea label="Réponse de l’IA" value={pasted} onChange={setPasted} rows={6} maxLength={6000} placeholder="Titre : …" />
            <Btn variant="outline" onClick={() => void use()} loading={busy} disabled={!pasted.trim()} style={{ alignSelf: 'flex-start' }}>
              Utiliser ce texte
            </Btn>
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>Le loyer, les charges, le dépôt et le DPE sont ajoutés par Bailio à la suite : ce sont les mentions obligatoires.</span>
          </Step>
        </>
      ) : null}
    </Card>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>
        {n}. {title}
      </span>
      {children}
    </div>
  )
}
