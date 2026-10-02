import { useEffect, useRef, useState } from 'react'
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
}
interface AdView {
  settings: AdSettings
  ad: { title: string; text: string; checks: Array<{ label: string; ok: boolean; hint?: string }>; warnings: string[] }
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
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (data) {
      setSettings(data.settings)
      setView(data.ad)
    }
  }, [data])
  useEffect(() => {
    if (!dirty.current || !settings) return
    const t = setTimeout(() => {
      api<AdView>(`/properties/${id}/ad`, { method: 'PUT', body: settings })
        .then((r) => {
          setView(r.ad)
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
            <Money label="Dont complément de loyer (zone d’encadrement)" cents={settings.complementCents} onChange={(c) => set({ complementCents: c })} hint="Seulement si la commune encadre les loyers et que le logement le justifie. Sinon, laissez vide." />
          </Card>
          <Card title="Présentation">
            <Input label="Titre" value={settings.title ?? ''} onChange={(v) => set({ title: v || null })} placeholder={view.title} hint="Laissez vide pour le titre proposé par Bailio." />
            <TextArea label="Description" value={settings.description ?? ''} onChange={(v) => set({ description: v || null })} rows={5} placeholder="Lumineux, au calme, proche des commerces et des transports." hint="Décrivez le logement, sans critère sur le futur locataire : la loi interdit toute discrimination." />
          </Card>
          {savedAt ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>Enregistré automatiquement à {savedAt}.</span> : null}
        </div>
        <aside className="aside" style={{ width: 460 }}>
          <Card title="Aperçu" action={<Btn size="sm" onClick={() => void copy()}>Copier l’annonce</Btn>}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{view.title}</span>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6, color: BAI.inkMid }}>{view.text}</div>
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
