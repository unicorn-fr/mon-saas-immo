import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AddressField } from '../../components/AddressField'
import { StepNav, TunnelLayout, focusFirstError } from '../../components/TunnelLayout'
import { Choices, QuestionCount, useQuestion } from '../../components/Questions'
import { TextField, display } from '../../components/ui'
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

  function validate() {
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
    return e
  }

  // Une erreur affichée disparaît dès que la réponse est corrigée ; aucune nouvelle n'apparaît pendant la saisie.
  useEffect(() => {
    const now = validate()
    setErrors((prev) => (Object.keys(prev).some((k) => !now[k]) ? Object.fromEntries(Object.entries(prev).filter(([k]) => now[k])) : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landlord, tenants, guarantor])

  // Une question par écran : vous, votre adresse, chaque locataire, le garant, puis « Quelqu'un d'autre ? ».
  const ids = ['l.name', 'l.address', ...tenants.flatMap((_, i) => [`t${i}.name`, `t${i}.email`]), ...(guarantor ? ['g.name', 'g.address'] : []), 'others']
  const { q, go } = useQuestion(ids.length)
  const id = ids[q - 1]
  const count = ids.length
  // Les erreurs de chaque question (clés de validate()).
  const keysOf = (qid: string) => (qid.endsWith('.name') ? [`${qid.slice(0, -5)}.firstName`, `${qid.slice(0, -5)}.lastName`] : [qid])

  function next() {
    const e = validate()
    const mine = Object.fromEntries(Object.entries(e).filter(([k]) => keysOf(id).includes(k)))
    setErrors(mine)
    if (Object.keys(mine).length) return focusFirstError()
    if (q < count) go(q + 1)
    else void finish()
  }

  async function finish() {
    const e = validate()
    const first = ids.find((qid) => keysOf(qid).some((k) => e[k]))
    if (first) {
      setErrors(e)
      return go(ids.indexOf(first) + 1)
    }
    update({ landlord, tenants: tenants.map((t) => ({ ...t, email: t.email?.trim() || undefined })), guarantor }, 'loyer')
    await flush()
    navigate('/commencer/loyer')
  }

  const back = q > 1 ? `?q=${q - 1}` : '/commencer/logement'
  const heading = (text: string) => <h1 style={display('clamp(34px, 5vw, 50px)')}>{text}</h1>
  const ti = id.startsWith('t') ? Number(id.slice(1, id.indexOf('.'))) : -1
  const t = ti >= 0 ? tenants[ti] : null

  return (
    <TunnelLayout step="personnes" sub={{ q, count }}>
      <div data-question className="stack" style={{ gap: 24 }}>
        <QuestionCount q={q} count={count} />
        {id === 'l.name' ? (
          <>
            {heading('Comment vous appelez-vous ?')}
            <span style={{ fontSize: 15, color: BAI.inkMid, marginTop: -8 }}>Vous, le propriétaire : votre nom figure dans le bail.</span>
            <Civility value={landlord.civility} onChange={(v) => save({ landlord: { ...landlord, civility: v } })} />
            <div className="col-md" style={{ display: 'flex', gap: 16 }}>
              <TextField maxLength={80} label="Prénom" name="l-first" autoComplete="given-name" value={landlord.firstName ?? ''} error={errors['l.firstName']} onChange={(e) => save({ landlord: { ...landlord, firstName: e.target.value } })} />
              <TextField maxLength={80} label="Nom" name="l-last" autoComplete="family-name" value={landlord.lastName ?? ''} error={errors['l.lastName']} onChange={(e) => save({ landlord: { ...landlord, lastName: e.target.value } })} />
            </div>
          </>
        ) : null}

        {id === 'l.address' ? (
          <>
            {heading('Votre adresse ?')}
            <AddressField
              label="Votre adresse"
              value={landlord.address ?? ''}
              error={errors['l.address']}
              placeholder="Là où vous recevez votre courrier"
              onChange={(v) => save({ landlord: { ...landlord, address: v } })}
              onSelect={(s) => save({ landlord: { ...landlord, address: s.label } })}
            />
          </>
        ) : null}

        {t && id.endsWith('.name') ? (
          <>
            {heading(ti === 0 ? 'Qui est votre locataire ?' : `Votre colocataire ${ti + 1} ?`)}
            <Civility value={t.civility} onChange={(v) => setTenant(ti, { civility: v })} />
            <div className="col-md" style={{ display: 'flex', gap: 16 }}>
              <TextField maxLength={80} label="Prénom" name={`t${ti}-first`} value={t.firstName ?? ''} error={errors[`t${ti}.firstName`]} onChange={(e) => setTenant(ti, { firstName: e.target.value })} />
              <TextField maxLength={80} label="Nom" name={`t${ti}-last`} value={t.lastName ?? ''} error={errors[`t${ti}.lastName`]} onChange={(e) => setTenant(ti, { lastName: e.target.value })} />
            </div>
            {ti > 0 ? (
              <button
                type="button"
                style={{ ...linkButton, color: BAI.error, fontWeight: 500 }}
                onClick={() => {
                  save({ tenants: tenants.filter((_, j) => j !== ti) })
                  go(ids.indexOf('others') - 1)
                }}
              >
                Retirer ce colocataire
              </button>
            ) : null}
          </>
        ) : null}

        {t && id.endsWith('.email') ? (
          <>
            {heading('Son email ?')}
            <TextField
              maxLength={200}
              label={ti === 0 ? 'Son email' : 'Son email (facultatif)'}
              name={`t${ti}-email`}
              type="email"
              autoComplete="off"
              value={t.email ?? ''}
              error={errors[`t${ti}.email`]}
              hint={ti === 0 ? 'Pour lui envoyer ses quittances. Il ne recevra rien sans votre accord.' : undefined}
              onChange={(e) => setTenant(ti, { email: e.target.value })}
            />
          </>
        ) : null}

        {guarantor && id === 'g.name' ? (
          <>
            {heading('Qui est le garant ?')}
            <span style={{ fontSize: 15, color: BAI.inkMid, marginTop: -8 }}>Le garant (ou « caution ») paie à la place du locataire si celui-ci ne paie pas. Il signe un acte de cautionnement, joint au bail.</span>
            <div className="col-md" style={{ display: 'flex', gap: 16 }}>
              <TextField maxLength={80} label="Prénom" name="g-first" value={guarantor.firstName ?? ''} error={errors['g.firstName']} onChange={(e) => save({ guarantor: { ...guarantor, firstName: e.target.value } })} />
              <TextField maxLength={80} label="Nom" name="g-last" value={guarantor.lastName ?? ''} error={errors['g.lastName']} onChange={(e) => save({ guarantor: { ...guarantor, lastName: e.target.value } })} />
            </div>
            <button
              type="button"
              style={{ ...linkButton, color: BAI.error, fontWeight: 500 }}
              onClick={() => {
                save({ guarantor: null })
                // La question « Quelqu'un d'autre ? » prend la place du garant.
                go(ids.indexOf('g.name') + 1)
              }}
            >
              Retirer le garant
            </button>
          </>
        ) : null}

        {guarantor && id === 'g.address' ? (
          <>
            {heading('L’adresse du garant ?')}
            <AddressField
              label="Son adresse"
              value={guarantor.address ?? ''}
              error={errors['g.address']}
              onChange={(v) => save({ guarantor: { ...guarantor, address: v } })}
              onSelect={(s) => save({ guarantor: { ...guarantor, address: s.label } })}
            />
          </>
        ) : null}

        {id === 'others' ? (
          <>
            {heading('Quelqu’un d’autre signe le bail ?')}
            <Choices
              legend="Quelqu’un d’autre signe le bail ?"
              columns
              options={[
                { value: 'NONE', label: 'Non, c’est tout' },
                ...(tenants.length < 6 ? [{ value: 'TENANT', label: 'Un colocataire' }] : []),
                ...(!guarantor ? [{ value: 'GUARANTOR', label: 'Un garant', hint: 'Il paie si le locataire ne paie pas.' }] : []),
              ]}
              onPick={(v) => {
                if (v === 'NONE') return void finish()
                if (v === 'TENANT') {
                  save({ tenants: [...tenants, {}] })
                  return go(2 + tenants.length * 2 + 1)
                }
                save({ guarantor: {} })
                go(2 + tenants.length * 2 + 1)
              }}
            />
          </>
        ) : null}
      </div>

      <StepNav back={back} next={next} nextLabel={id === 'others' ? 'Continuer sans autre signataire' : 'Continuer'} />
    </TunnelLayout>
  )
}

/** Madame / Monsieur : écrit tel quel dans le bail. */
function Civility({ value, onChange }: { value?: 'MADAME' | 'MONSIEUR'; onChange: (v: 'MADAME' | 'MONSIEUR') => void }) {
  return (
    <div role="group" aria-label="Civilité" style={{ display: 'flex', gap: 10 }}>
      {(['MADAME', 'MONSIEUR'] as const).map((c) => {
        const selected = value === c
        return (
          <button key={c} type="button" aria-pressed={selected} onClick={() => onChange(c)} style={{ minHeight: 48, padding: '0 18px', border: selected ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: selected ? BAI.ownerLight : BAI.surface, color: selected ? BAI.owner : BAI.ink, fontSize: 15, fontWeight: selected ? 700 : 600, borderRadius: 12, fontFamily: 'inherit' }}>
            {c === 'MADAME' ? 'Madame' : 'Monsieur'}
          </button>
        )
      })}
    </div>
  )
}
