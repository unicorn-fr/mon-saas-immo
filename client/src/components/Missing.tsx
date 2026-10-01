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
  return (
    <div style={{ background: BAI.caramelLight, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.45 }}>Ces mentions sont exigées par la loi. Sans elles, le document serait incomplet. Cliquez pour les ajouter : vous revenez ensuite ici.</span>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((m) => (
          <li key={m.key} style={{ fontSize: 14, lineHeight: 1.45 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span>
                {m.label} <span style={{ color: BAI.inkSoft }}>· {WHERE[m.where]}</span>
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
