import { useEffect, useState, type ReactNode } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api, setMissingHandler, type MissingItem } from '../lib/api'
import { Btn, Callout, Input, Modal, errorMessage } from './kit'
import { SignaturePad } from './media'

/** Ce que la fenêtre sait compléter sur place, et où elle l'enregistre (profil du bailleur ou fiche du locataire). */
const FIXABLE = new Set(['landlord.signature', 'landlord.name', 'landlord.address', 'tenant.email'])
const fixable = (m: MissingItem) => FIXABLE.has(m.key) && (m.key !== 'tenant.email' || Boolean(m.tenantId)) && (m.section !== 'company')

interface Ask {
  items: MissingItem[]
  message: string
  resolve: (ok: boolean) => void
}

/**
 * « Il manque une information » : quand une action s'arrête parce qu'une information manque (signature avant d'envoyer
 * une quittance, email du locataire avant un envoi…), elle se demande ici, s'enregistre au bon endroit, puis l'action
 * reprend toute seule. Ce qui ne se complète pas ici est nommé, avec la fiche où le faire.
 */
export function FixMissingProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<Ask | null>(null)
  useEffect(() => {
    setMissingHandler((items, message) => new Promise<boolean>((resolve) => setAsk({ items, message, resolve })))
    return () => setMissingHandler(null)
  }, [])
  const close = (ok: boolean) => {
    ask?.resolve(ok)
    setAsk(null)
  }
  return (
    <>
      {children}
      {ask ? <FixMissing key={ask.items.map((i) => i.key).join()} ask={ask} onDone={close} /> : null}
    </>
  )
}

function FixMissing({ ask, onDone }: { ask: Ask; onDone: (ok: boolean) => void }) {
  const items = ask.items
  const toFix = items.filter(fixable)
  const elsewhere = items.filter((m) => !fixable(m))
  const need = (key: string) => toFix.some((m) => m.key === key)
  const [signature, setSignature] = useState<string | null>(null)
  const [firstNames, setFirstNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const check = (): string | null => {
    if (need('landlord.signature') && !signature) return 'Signez dans le cadre.'
    if (need('landlord.name') && (!firstNames.trim() || !lastName.trim())) return 'Indiquez vos prénom et nom.'
    if (need('landlord.address') && (!address.trim() || !postalCode.trim() || !city.trim())) return 'Indiquez votre adresse complète.'
    if (need('tenant.email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Indiquez une adresse email valide.'
    return null
  }

  const save = async () => {
    const problem = check()
    if (problem) return setError(problem)
    setBusy(true)
    setError(null)
    try {
      const profile: Record<string, string> = {}
      if (need('landlord.signature') && signature) profile.signature = signature
      if (need('landlord.name')) Object.assign(profile, { firstNames: firstNames.trim(), lastName: lastName.trim() })
      if (need('landlord.address')) Object.assign(profile, { address: address.trim(), postalCode: postalCode.trim(), city: city.trim() })
      if (Object.keys(profile).length) await api('/profile', { method: 'PUT', body: profile, noFix: true })
      const tenant = toFix.find((m) => m.key === 'tenant.email')
      if (tenant?.tenantId) await api(`/tenants/${tenant.tenantId}`, { method: 'PUT', body: { email: email.trim() }, noFix: true })
      onDone(true)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  const title = items.length > 1 ? `Il manque ${items.length} informations` : 'Il manque une information'
  return (
    <Modal
      open
      onClose={() => onDone(false)}
      title={title}
      width={520}
      actions={
        toFix.length && !elsewhere.length ? (
          <>
            <Btn variant="outline" onClick={() => onDone(false)}>
              Annuler
            </Btn>
            <Btn onClick={() => void save()} loading={busy}>
              Enregistrer et continuer
            </Btn>
          </>
        ) : (
          <Btn variant="outline" onClick={() => onDone(false)}>
            Fermer
          </Btn>
        )
      }
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      {toFix.length && !elsewhere.length ? (
        <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
          {need('tenant.email') && toFix.length === 1 ? 'Elle est enregistrée dans la fiche du locataire, puis l’envoi reprend.' : 'Elle est enregistrée dans votre profil, puis l’action reprend.'}
        </span>
      ) : null}
      {elsewhere.length ? (
        <>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{ask.message}</span>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6 }}>
            {items.map((m) => (
              <li key={m.key + (m.tenantId ?? '')}>
                {m.label} : {WHERE[m.where] ?? 'à compléter dans la fiche concernée'}.
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {need('landlord.signature') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Votre signature</span>
              <SignaturePad value={signature} onChange={setSignature} label="Signez ici avec la souris ou le doigt" />
            </div>
          ) : null}
          {need('landlord.name') ? (
            <>
              <Input label="Vos prénoms" value={firstNames} onChange={setFirstNames} autoComplete="given-name" />
              <Input label="Votre nom" value={lastName} onChange={setLastName} autoComplete="family-name" />
            </>
          ) : null}
          {need('landlord.address') ? (
            <>
              <Input label="Votre adresse" value={address} onChange={setAddress} autoComplete="street-address" />
              <Input label="Code postal" value={postalCode} onChange={setPostalCode} inputMode="numeric" autoComplete="postal-code" />
              <Input label="Ville" value={city} onChange={setCity} autoComplete="address-level2" />
            </>
          ) : null}
          {need('tenant.email') ? <Input label="Email du locataire" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="off" /> : null}
        </>
      )}
    </Modal>
  )
}

const WHERE: Record<string, string> = {
  LANDLORD: 'dans Mon compte, « Votre profil », ou la fiche de la structure',
  PROPERTY: 'dans la fiche du logement',
  TENANT: 'dans la fiche du locataire',
  GUARANTOR: 'dans la fiche du locataire, partie garant',
  TERMS: 'dans les conditions du bail',
}
