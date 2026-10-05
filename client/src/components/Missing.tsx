import { BAI } from '../constants/bailio-tokens'
import type { MissingItem } from '../lib/space'
import { TextLink } from './kit'

const WHERE: Record<MissingItem['where'], string> = {
  LANDLORD: 'Votre profil',
  PROPERTY: 'Fiche du logement',
  TENANT: 'Fiche du locataire',
  GUARANTOR: 'Acte de caution',
  TERMS: 'Conditions du bail',
}

/** « Il manque… » : chaque mention obligatoire absente, avec un lien direct vers l'endroit où la saisir. */
export function MissingList({ items, title = 'Avant de signer, il manque :' }: { items: MissingItem[]; title?: string }) {
  if (!items.length) return null
  const essential = items.filter((m) => (m.level ?? 'ESSENTIAL') === 'ESSENTIAL')
  const later = items.filter((m) => m.level === 'RECOMMENDED')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {essential.length ? <Group items={essential} title={title} text="Ces informations sont primordiales : sans elles, le bail ne peut pas être signé. Cliquez pour les ajouter : vous revenez ensuite ici." tone={BAI.caramelLight} /> : null}
      {later.length ? (
        <Group
          items={later}
          title={essential.length ? 'À compléter si possible :' : 'Le bail peut être signé. À compléter si possible :'}
          text="Ces mentions sont prévues par la loi, mais le bail peut se faire sans : il laissera une ligne à compléter à la main. Mieux vaut les ajouter avant la signature."
          tone={BAI.surface}
        />
      ) : null}
    </div>
  )
}

function Group({ items, title, text, tone }: { items: MissingItem[]; title: string; text: string; tone: string }) {
  return (
    <div style={{ background: tone, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.45 }}>{text}</span>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((m) => (
          <li key={m.key} style={{ fontSize: 14, lineHeight: 1.45 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span>
                {m.label} <span style={{ color: BAI.inkSoft }}>· {m.where === 'LANDLORD' && m.to.includes('/espace/structures/') ? 'Fiche de la structure' : WHERE[m.where]}</span>
              </span>
              <TextLink to={m.to} style={{ fontSize: 13 }}>
                Compléter
              </TextLink>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
