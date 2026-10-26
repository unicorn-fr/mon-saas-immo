import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Crumbs, Input, LoadError, Loader, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { downloadDoc } from '../../lib/docs'

interface Item {
  id: 'occupancy' | 'inpi' | 'cfe'
  title: string
  why: string
  deadline: string
  steps: string[]
  copy: Array<{ label: string; value: string }>
  link: { label: string; url: string }
  form?: 'CFE'
  doneAt: string | null
}
interface View {
  leaseId: string
  propertyId: string
  place: string
  mode: 'ARRIVAL' | 'DEPARTURE'
  items: Item[]
  siret: string | null
}

const frDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Déclarer ce bail aux impôts, dès la signature (ou au départ du locataire) : la déclaration d'occupation du logement
 * et, pour une première location meublée, le début d'activité (SIRET) et la CFE pré-remplie. Chaque valeur se copie,
 * chaque démarche se coche ; le SIRET donné ici sert ensuite partout.
 */
export default function ImpotsBail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'DEPARTURE' ? 'DEPARTURE' : params.get('mode') === 'ARRIVAL' ? 'ARRIVAL' : null
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<View>(`/money/leases/${id}/tax${mode ? `?mode=${mode}` : ''}`), [id, mode])
  const [siret, setSiret] = useState('')

  const mark = (item: Item['id'], done: boolean) =>
    api(`/money/leases/${id}/tax`, { method: 'PUT', body: { mode: data!.mode, item, done } })
      .then(() => {
        toast.show(done ? 'C’est noté.' : 'Remis à faire.')
        reload()
      })
      .catch(toast.error)
  const saveSiret = () => {
    const value = siret.replace(/\s/g, '')
    if (!/^\d{14}$/.test(value)) return toast.show('Le SIRET compte 14 chiffres.', 'error')
    return api('/money/tax/progress', { method: 'PUT', body: { year: new Date().getFullYear(), info: { siret: value } } })
      .then(() => {
        toast.show('SIRET enregistré : il sera repris dans vos déclarations.')
        reload()
      })
      .catch(toast.error)
  }
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.show(`${label} copié : ${value}`)
    } catch {
      toast.show('Sélectionnez le texte puis copiez-le.', 'error')
    }
  }

  const first = data?.items.find((i) => !i.doneAt)
  return (
    <AppShell>
      <Crumbs items={[{ label: data?.place ?? 'Bail', to: `/espace/baux/${id}` }, { label: 'Impôts' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(32px, 5vw, 44px)')}>
          Déclarer ce bail <em>aux impôts.</em>
        </h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>
          {data?.mode === 'DEPARTURE' ? 'Votre locataire est parti' : 'Un locataire arrive'} : les impôts doivent le savoir. Quelques minutes en ligne, tout est prêt à copier. Les loyers, eux, se déclareront au printemps.
        </span>
      </div>
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          {data.items.map((item, n) => (
            <Card key={item.id} title={<h2 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>{`${n + 1}. ${item.title}`}</h2>}>
              <span style={{ fontSize: 15, lineHeight: 1.6 }}>{item.why}</span>
              <span style={{ fontSize: 15, color: BAI.accentInk, fontWeight: 600 }}>{item.deadline}</span>
              <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.6 }}>
                {item.steps.map((st) => (
                  <li key={st}>{st}</li>
                ))}
              </ol>
              {item.copy.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.copy.map((c) => (
                    <div key={c.label} className="copy-row copy-row--text" style={{ background: BAI.bg, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: '12px 14px' }}>
                      <span className="copy-box" style={{ fontWeight: 700, fontSize: 15, color: BAI.owner }}>
                        {c.label}
                      </span>
                      <span className="copy-label" />
                      <strong className="copy-value" style={{ fontSize: 16, overflowWrap: 'anywhere' }}>
                        {c.value}
                      </strong>
                      <span className="copy-btn">
                        <Btn variant="outline" size="sm" onClick={() => copy(c.value, c.label)} title={`Copier : ${c.label}`}>
                          Copier
                        </Btn>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {item.id === 'occupancy' && !item.copy.some((c) => c.label.startsWith('Identifiant')) ? (
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
                  L’identifiant fiscal du logement (numéro invariant) figure sur l’avis de taxe foncière. Ajoutez-le à la fiche du logement : il sera repris ici. <TextLink to={`/espace/logements/${data.propertyId}`} style={{ fontSize: 14 }}>Fiche du logement</TextLink>
                </span>
              ) : null}
              {item.id !== 'occupancy' ? (
                data.siret ? (
                  <span style={{ fontSize: 15 }}>
                    Votre SIRET : <strong>{data.siret}</strong>
                  </span>
                ) : (
                  <div className="col-md" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Input label="Votre SIRET, dès que vous l’avez (14 chiffres)" value={siret} onChange={setSiret} inputMode="numeric" />
                    </div>
                    <Btn variant="outline" onClick={saveSiret}>
                      Enregistrer
                    </Btn>
                  </div>
                )
              ) : null}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {item.form === 'CFE' ? (
                  <Btn variant="outline" onClick={() => downloadDoc(`/money/tax/1447-c-sd.pdf?propertyId=${data.propertyId}`, '1447-c-sd.pdf').catch(toast.error)}>
                    Télécharger la déclaration pré-remplie
                  </Btn>
                ) : null}
                <Btn variant="outline" href={item.link.url} newTab>
                  {item.link.label} <span aria-hidden>↗</span>
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </Btn>
              </div>
              <div style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {item.doneAt ? (
                  <>
                    <Pill tone="green">Fait le {frDay(item.doneAt)}</Pill>
                    <TextLink onClick={() => mark(item.id, false)} style={{ fontSize: 14 }}>
                      Ce n’est pas encore fait
                    </TextLink>
                  </>
                ) : (
                  <Btn variant={item === first ? 'primary' : 'outline'} onClick={() => mark(item.id, true)}>
                    C’est fait
                  </Btn>
                )}
              </div>
            </Card>
          ))}
          <Callout tone="tip">
            Vos loyers de l’année se déclareront au printemps prochain : Bailio les additionne et vous guide case par case. <TextLink to="/espace/argent/declaration" style={{ fontSize: 14 }}>Déclaration des revenus</TextLink>
          </Callout>
        </>
      )}
    </AppShell>
  )
}
