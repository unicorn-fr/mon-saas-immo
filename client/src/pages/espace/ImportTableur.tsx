import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Crumbs, Pill, TextLink, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { eurosCents, plural } from '../../lib/format'

interface Row {
  line: number
  lines: number[]
  property: { label?: string; address?: string; postalCode?: string; city?: string; kind: 'VIDE' | 'MEUBLE' | 'PARKING'; rentCents?: number; chargesCents?: number }
  tenants: Array<{ firstNames?: string; lastName?: string; email?: string }>
  issues: string[]
  blocking: boolean
}
interface Preview {
  rows: Row[]
  columns: { detected: Array<{ header: string; field: string; label: string }>; ignored: string[] }
}
interface Done {
  properties: number
  tenants: number
  skipped: number
  failed: Array<{ line?: number; address: string; message: string }>
}

const KIND = { VIDE: 'Vide', MEUBLE: 'Meublé', PARKING: 'Garage ou place' } as const
const th = { textAlign: 'left', fontSize: 13, fontWeight: 700, color: BAI.inkSoft, padding: '8px 10px', whiteSpace: 'nowrap' } as const
const td = { padding: '10px', verticalAlign: 'top', fontSize: 14, lineHeight: 1.4, borderTop: `1px solid ${BAI.dividerSoft}` } as const

const tenantLabel = (t: Row['tenants'][number]) => [t.firstNames, t.lastName].filter(Boolean).join(' ') || t.email || ''

/**
 * Tous les logements et locataires d'un coup, depuis le fichier d'un ancien logiciel ou d'un tableur (CSV ou Excel).
 * Le fichier est lu sur le serveur, jamais enregistré ; seules les lignes cochées créent des fiches. Pas de bail créé.
 */
export default function ImportTableur() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const [done, setDone] = useState<Done | null>(null)

  const read = async (file: File) => {
    setBusy(true)
    setDone(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await api<Preview>('/import/table/preview', { method: 'POST', form })
      setPreview(r)
      setChosen(new Set(r.rows.map((x, i) => (x.blocking ? -1 : i)).filter((i) => i >= 0)))
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!preview) return
    const rows = preview.rows.filter((_, i) => chosen.has(i)).map((r) => ({ line: r.line, property: r.property, tenants: r.tenants }))
    if (!rows.length) return
    setBusy(true)
    try {
      setDone(await api<Done>('/import/table/confirm', { method: 'POST', body: { rows } }))
      setPreview(null)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  const chosenTenants = preview ? preview.rows.filter((_, i) => chosen.has(i)).reduce((a, r) => a + r.tenants.length, 0) : 0

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Importer depuis un fichier' }]} />
      <h1 style={display('clamp(26px, 3.2vw, 34px)')}>
        Tous vos logements, <em>d’un coup</em>
      </h1>

      {done ? (
        <>
          <Card>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {plural(done.properties, 'logement')} et {plural(done.tenants, 'locataire')} ajouté{done.properties > 1 || done.tenants > 1 ? 's' : ''}
            </h2>
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Pour chaque bail déjà signé, utilisez « J’ai déjà un bail » ; pour un nouveau bail, « Créer un bail » reprend ces fiches.</span>
            <div>
              <Btn to="/espace/logements">Voir mes logements</Btn>
            </div>
          </Card>
          {done.failed.length ? (
            <Callout tone="warn" title={`${plural(done.failed.length, 'ligne')} non ajoutée${done.failed.length > 1 ? 's' : ''}`}>
              {done.failed.map((f) => `${f.address}${f.line ? ` (ligne ${f.line})` : ''} : ${f.message}`).join(' · ')}
            </Callout>
          ) : null}
        </>
      ) : null}

      {!preview && !done ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Déposez votre fichier</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Exportez vos biens et locataires depuis votre ancien logiciel ou votre tableur, puis déposez le fichier ici.</span>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, color: BAI.ink, minHeight: 44, lineHeight: '44px' }}>Depuis Qalimo, Rentila ou un tableur</summary>
            <span style={{ display: 'block', fontSize: 15, color: BAI.inkMid, lineHeight: 1.5, marginTop: 4 }}>
              Cherchez « Exporter » ou « Télécharger » dans la liste de vos biens ou de vos locataires (format CSV ou Excel). Une ligne par logement, avec des colonnes nommées par exemple « Adresse », « Loyer », « Locataire », « Email » : Bailio les reconnaît seul.
            </span>
          </details>
          <label className="drop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 16px', border: `2px dashed ${BAI.borderStrong}`, borderRadius: 18, background: BAI.bg, cursor: busy ? 'wait' : 'pointer', textAlign: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{busy ? 'Lecture en cours…' : 'Choisir le fichier'}</span>
            <span style={{ fontSize: 14, color: BAI.inkSoft }}>CSV ou Excel, 200 lignes au plus. Lu sur notre serveur, jamais enregistré.</span>
            <input
              type="file"
              accept=".csv,.xlsx,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy}
              className="sr-only"
              aria-label="Fichier des logements et des locataires"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void read(f)
              }}
            />
          </label>
        </Card>
      ) : null}

      {preview ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Vérifiez avant d’ajouter</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
            {plural(preview.rows.length, 'logement')} lu{preview.rows.length > 1 ? 's' : ''}. Décochez ceux que vous ne voulez pas ajouter.
          </span>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <caption className="sr-only">Logements et locataires lus dans le fichier</caption>
              <thead>
                <tr>
                  <th scope="col" style={th}>
                    <span className="sr-only">Ajouter</span>
                  </th>
                  <th scope="col" style={th}>
                    Logement
                  </th>
                  <th scope="col" style={th}>
                    Loyer
                  </th>
                  <th scope="col" style={th}>
                    Locataire
                  </th>
                  <th scope="col" style={th}>
                    À savoir
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => {
                  const name = r.property.address ?? `ligne ${r.line}`
                  return (
                    <tr key={i}>
                      <td style={td}>
                        <input
                          type="checkbox"
                          checked={chosen.has(i)}
                          disabled={r.blocking}
                          aria-label={`Ajouter ${name}`}
                          onChange={(e) => {
                            const next = new Set(chosen)
                            if (e.target.checked) next.add(i)
                            else next.delete(i)
                            setChosen(next)
                          }}
                          style={{ width: 24, height: 24, margin: 0, accentColor: BAI.owner }}
                        />
                      </td>
                      <td style={td}>
                        <strong>{r.property.label || r.property.address || 'Adresse manquante'}</strong>
                        <br />
                        <span style={{ color: BAI.inkSoft }}>
                          {[r.property.label ? r.property.address : '', [r.property.postalCode, r.property.city].filter(Boolean).join(' '), KIND[r.property.kind]].filter(Boolean).join(' · ')}
                        </span>
                      </td>
                      <td style={td}>
                        {r.property.rentCents != null ? eurosCents(r.property.rentCents) : '—'}
                        {r.property.chargesCents ? <span style={{ color: BAI.inkSoft }}> + {eurosCents(r.property.chargesCents)}</span> : null}
                      </td>
                      <td style={td}>{r.tenants.length ? r.tenants.map((t, k) => <div key={k}>{tenantLabel(t)}</div>) : '—'}</td>
                      <td style={td}>
                        {r.issues.length ? (
                          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {r.issues.map((x) => (
                              <Pill key={x} tone={r.blocking && x === 'adresse manquante' ? 'error' : 'accent'} style={{ whiteSpace: 'normal' }}>
                                {x.charAt(0).toUpperCase() + x.slice(1)}
                              </Pill>
                            ))}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, minHeight: 44, lineHeight: '44px' }}>Colonnes reconnues et ignorées</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
              <span>
                <strong>Reconnues :</strong> {preview.columns.detected.map((c) => `${c.header} (${c.label})`).join(', ')}.
              </span>
              <span>
                <strong>Ignorées :</strong> {preview.columns.ignored.length ? preview.columns.ignored.join(', ') : 'aucune'}.
              </span>
            </div>
          </details>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Btn onClick={() => void confirm()} disabled={busy || !chosen.size} loading={busy}>
              Ajouter {plural(chosen.size, 'logement')}
            </Btn>
            <Btn
              variant="outline"
              onClick={() => {
                setPreview(null)
                setChosen(new Set())
              }}
              disabled={busy}
            >
              Choisir un autre fichier
            </Btn>
            {chosenTenants ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>avec {plural(chosenTenants, 'locataire')}</span> : null}
          </div>
        </Card>
      ) : null}

      <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>
        <TextLink to="/espace/logements" style={{ fontSize: 14 }}>
          Retour à Logements
        </TextLink>
      </span>
    </AppShell>
  )
}
