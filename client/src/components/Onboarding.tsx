import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User } from '../lib/types'
import { AddressInput, Chips, ChoiceCard, Input, useToast } from './kit'
import { Fields } from './FlowLayout'
import { display } from './ui'
import { Wizard } from './Wizard'

type Goal = 'PROPERTY' | 'LEASE' | 'IMPORT' | 'EXPLORE'

const GOALS: Array<{ value: Goal; title: string; sub: string; to: string }> = [
  { value: 'PROPERTY', title: 'Ajouter mon logement', sub: 'Adresse, surface, équipements : une question à la fois.', to: '/espace/logements/nouveau' },
  { value: 'LEASE', title: 'Créer un bail', sub: 'Bailio vous guide du logement au locataire, jusqu’à la signature.', to: '/espace/baux/nouveau' },
  { value: 'IMPORT', title: 'Importer un bail déjà signé', sub: 'Une photo ou le PDF suffit : Bailio remplit tout.', to: '/importer' },
  { value: 'EXPLORE', title: 'Découvrir mon espace', sub: 'Faire le tour, et revenir plus tard.', to: '/espace' },
]

/**
 * Accueil d'un nouveau compte (seulement un email) : qui est la personne, puis ce qu'elle veut faire.
 * Le nom et l'adresse remplissent le profil du bailleur, repris dans le bail et les quittances.
 */
export function Onboarding({ onLater }: { onLater: () => void }) {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [civility, setCivility] = useState<'MADAME' | 'MONSIEUR' | null>(null)
  const [firstNames, setFirstNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [goal, setGoal] = useState<Goal | null>(null)
  const [busy, setBusy] = useState(false)

  const finish = async () => {
    setBusy(true)
    try {
      const r = await api<{ user: User }>('/profile', {
        method: 'PUT',
        body: { civility: civility ?? undefined, firstNames: firstNames.trim(), lastName: lastName.trim(), ...(address.trim() ? { address: address.trim(), postalCode: postalCode.trim(), city: city.trim() } : {}) },
      })
      setUser(r.user)
      const g = GOALS.find((x) => x.value === goal) ?? GOALS[3]
      if (g.value === 'EXPLORE') onLater()
      else navigate(g.to)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={{ maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 'clamp(8px, 3vw, 32px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(38px, 6vw, 54px)')}>Bienvenue sur Bailio.</h1>
        <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, lineHeight: 1.5 }}>Trois questions pour faire connaissance. Ce que vous indiquez est repris dans vos baux et vos quittances : vous ne le saisirez qu’une fois.</p>
      </div>
      <div style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 22, padding: 'clamp(20px, 3vw, 28px)' }}>
        <Wizard
          busy={busy}
          onCancel={onLater}
          cancelLabel="Plus tard"
          focusOnOpen={false}
          finishLabel="C’est parti"
          onFinish={() => void finish()}
          steps={[
            {
              key: 'name',
              title: 'Comment vous appelez-vous ?',
              content: (
                <>
                  <Fields>
                    <Input big label="Prénom" value={firstNames} onChange={setFirstNames} autoComplete="given-name" maxLength={120} />
                    <Input big label="Nom" value={lastName} onChange={setLastName} autoComplete="family-name" maxLength={80} />
                  </Fields>
                  <Chips legend="Civilité (facultatif)" value={civility} onChange={setCivility} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
                </>
              ),
              validate: () => (!firstNames.trim() ? 'Indiquez votre prénom.' : !lastName.trim() ? 'Indiquez votre nom.' : null),
            },
            {
              key: 'address',
              title: 'Où peut-on vous écrire ?',
              note: 'Votre adresse figure dans le bail : votre locataire peut vous y envoyer un courrier. Vous pouvez la donner plus tard.',
              optional: true,
              content: (
                <>
                  <AddressInput
                    big
                    label="Adresse"
                    value={address}
                    placeholder="8 rue de l’Aiguillerie"
                    onChange={setAddress}
                    onSelect={(s) => {
                      setAddress(s.label.replace(` ${s.postalCode} ${s.city}`, '').trim())
                      setPostalCode(s.postalCode)
                      setCity(s.city)
                    }}
                  />
                  <Fields>
                    <Input big label="Code postal" value={postalCode} onChange={setPostalCode} inputMode="numeric" maxLength={5} autoComplete="postal-code" />
                    <Input big label="Ville" value={city} onChange={setCity} autoComplete="address-level2" maxLength={120} />
                  </Fields>
                </>
              ),
              validate: () => (address.trim() && (!/^\d{5}$/.test(postalCode.trim()) || !city.trim()) ? 'Indiquez le code postal (5 chiffres) et la ville, ou passez cette étape.' : null),
            },
            {
              key: 'goal',
              title: 'Que voulez-vous faire en premier ?',
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {GOALS.map((g) => (
                    <ChoiceCard key={g.value} selected={goal === g.value} onClick={() => setGoal(g.value)} title={g.title} sub={g.sub} />
                  ))}
                </div>
              ),
              validate: () => (goal ? null : 'Choisissez ce que vous voulez faire.'),
            },
          ]}
        />
      </div>
    </section>
  )
}
