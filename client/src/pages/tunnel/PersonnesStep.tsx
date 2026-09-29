import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AddressField } from '../../components/AddressField'
import { StepNav, TunnelLayout } from '../../components/TunnelLayout'
import { TextField, display, overline } from '../../components/ui'
import { useDraft } from '../../lib/draft'
import type { DraftData } from '../../lib/types'

type Tenant = NonNullable<DraftData['tenants']>[number]
type Guarantor = NonNullable<DraftData['guarantor']>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const linkButton = { alignSelf: 'flex-start', background: 'none', border: 'none', padding: '4px 0', fontSize: 15, fontWeight: 600, color: BAI.owner } as const

export default function PersonnesStep() {
  const { data, update, flush } = useDraft()
  const navigate = useNavigate()
  const [landlord, setLandlord] = useState(data.landlord ?? {})
  const [tenants, setTenants] = useState<Tenant[]>(data.tenants?.length ? data.tenants : [{}])
  const [guarantor, setGuarantor] = useState<Guarantor | null>(data.guarantor ?? null)
  const [adding, setAdding] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data.type) navigate('/commencer', { replace: true })
  }, [data.type, navigate])

  // Enregistrement automatique pendant la saisie.
  function save(next: { landlord?: typeof landlord; tenants?: Tenant[]; guarantor?: Guarantor | null }) {
    const l = next.landlord ?? landlord
    const t = next.tenants ?? tenants
    const g = next.guarantor === undefined ? guarantor : next.guarantor
    if (next.landlord) setLandlord(l)
    if (next.tenants) setTenants(t)
    if (next.guarantor !== undefined) setGuarantor(g)
    update({ landlord: l, tenants: t, guarantor: g })
  }

  const setTenant = (i: number, patch: Partial<Tenant>) => save({ tenants: tenants.map((t, j) => (j === i ? { ...t, ...patch } : t)) })

  async function next() {
    const e: Record<string, string> = {}
    if (!landlord.firstName?.trim()) e['l.firstName'] = 'Votre prénom est obligatoire.'
    if (!landlord.lastName?.trim()) e['l.lastName'] = 'Votre nom est obligatoire.'
    if ((landlord.address ?? '').trim().length < 5) e['l.address'] = 'Votre adresse figure obligatoirement sur le bail.'
    tenants.forEach((t, i) => {
      if (!t.firstName?.trim()) e[`t${i}.firstName`] = 'Le prénom est obligatoire.'
      if (!t.lastName?.trim()) e[`t${i}.lastName`] = 'Le nom est obligatoire.'
      if (t.email && !EMAIL.test(t.email)) e[`t${i}.email`] = 'Cet email ne semble pas valide.'
    })
    if (guarantor) {
      if (!guarantor.firstName?.trim()) e['g.firstName'] = 'Le prénom est obligatoire.'
      if (!guarantor.lastName?.trim()) e['g.lastName'] = 'Le nom est obligatoire.'
      if ((guarantor.address ?? '').trim().length < 5) e['g.address'] = "L'adresse du garant est obligatoire."
    }
    setErrors(e)
    if (Object.keys(e).length) return
    update({ landlord, tenants: tenants.map((t) => ({ ...t, email: t.email?.trim() || undefined })), guarantor }, 'loyer')
    await flush()
    navigate('/commencer/loyer')
  }

  return (
    <TunnelLayout step="personnes">
      <h1 style={display('clamp(40px, 5vw, 56px)')}>Qui signe le bail ?</h1>

      <section className="stack" style={{ gap: 14 }}>
        <h2 style={{ ...overline, margin: 0 }}>Vous, le propriétaire</h2>
        <div className="col-md" style={{ display: 'flex', gap: 16 }}>
          <TextField label="Prénom" name="l-first" autoComplete="given-name" value={landlord.firstName ?? ''} error={errors['l.firstName']} onChange={(e) => save({ landlord: { ...landlord, firstName: e.target.value } })} />
          <TextField label="Nom" name="l-last" autoComplete="family-name" value={landlord.lastName ?? ''} error={errors['l.lastName']} onChange={(e) => save({ landlord: { ...landlord, lastName: e.target.value } })} />
        </div>
        <AddressField
          label="Votre adresse"
          value={landlord.address ?? ''}
          error={errors['l.address']}
          placeholder="Là où vous recevez votre courrier"
          onChange={(v) => save({ landlord: { ...landlord, address: v } })}
          onSelect={(s) => save({ landlord: { ...landlord, address: s.label } })}
        />
      </section>

      {tenants.map((t, i) => (
        <section key={i} className="stack" style={{ gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ ...overline, margin: 0 }}>{i === 0 ? 'Votre locataire' : `Colocataire ${i + 1}`}</h2>
            {i > 0 ? (
              <button type="button" style={{ ...linkButton, color: BAI.error, fontWeight: 500 }} onClick={() => save({ tenants: tenants.filter((_, j) => j !== i) })}>
                Retirer
              </button>
            ) : null}
          </div>
          <div className="col-md" style={{ display: 'flex', gap: 16 }}>
            <TextField label="Prénom" name={`t${i}-first`} value={t.firstName ?? ''} error={errors[`t${i}.firstName`]} onChange={(e) => setTenant(i, { firstName: e.target.value })} />
            <TextField label="Nom" name={`t${i}-last`} value={t.lastName ?? ''} error={errors[`t${i}.lastName`]} onChange={(e) => setTenant(i, { lastName: e.target.value })} />
          </div>
          <TextField
            label={i === 0 ? 'Son email' : 'Son email (facultatif)'}
            name={`t${i}-email`}
            type="email"
            autoComplete="off"
            value={t.email ?? ''}
            error={errors[`t${i}.email`]}
            hint={i === 0 ? 'Pour lui envoyer ses quittances. Il ne recevra rien sans votre accord.' : undefined}
            onChange={(e) => setTenant(i, { email: e.target.value })}
          />
        </section>
      ))}

      {guarantor ? (
        <section className="stack" style={{ gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ ...overline, margin: 0 }}>Le garant</h2>
            <button type="button" style={{ ...linkButton, color: BAI.error, fontWeight: 500 }} onClick={() => save({ guarantor: null })}>
              Retirer
            </button>
          </div>
          <div className="col-md" style={{ display: 'flex', gap: 16 }}>
            <TextField label="Prénom" name="g-first" value={guarantor.firstName ?? ''} error={errors['g.firstName']} onChange={(e) => save({ guarantor: { ...guarantor, firstName: e.target.value } })} />
            <TextField label="Nom" name="g-last" value={guarantor.lastName ?? ''} error={errors['g.lastName']} onChange={(e) => save({ guarantor: { ...guarantor, lastName: e.target.value } })} />
          </div>
          <AddressField
            label="Son adresse"
            value={guarantor.address ?? ''}
            error={errors['g.address']}
            onChange={(v) => save({ guarantor: { ...guarantor, address: v } })}
            onSelect={(s) => save({ guarantor: { ...guarantor, address: s.label } })}
          />
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Le garant (ou « caution ») paie à la place du locataire si celui-ci ne paie pas. Il signe un acte de cautionnement, joint au bail.</span>
        </section>
      ) : null}

      {adding ? (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {tenants.length < 6 ? (
            <button type="button" style={linkButton} onClick={() => { save({ tenants: [...tenants, {}] }); setAdding(false) }}>
              + Un colocataire
            </button>
          ) : null}
          {!guarantor ? (
            <button type="button" style={linkButton} onClick={() => { save({ guarantor: {} }); setAdding(false) }}>
              + Un garant
            </button>
          ) : null}
        </div>
      ) : tenants.length < 6 || !guarantor ? (
        <button type="button" style={linkButton} onClick={() => setAdding(true)}>
          + Ajouter un colocataire ou un garant
        </button>
      ) : null}

      <StepNav back="/commencer/logement" next={next} />
    </TunnelLayout>
  )
}
