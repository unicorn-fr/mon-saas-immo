import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Empty, LoadError, Loader, PageHead, Pill, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import { eurosCents } from '../../lib/format'

interface AllCandidates {
  properties: Array<{ id: string; name: string; open: boolean }>
  candidates: Array<{
    id: string
    propertyId: string
    propertyName: string
    name: string
    receivedAt: string
    monthlyIncomeCents: number | null
    guarantee: string
    review: { level: 'SOLID' | 'CORRECT' | 'INCOMPLETE'; label: string }
    visitConfirmed: boolean
  }>
}

const TONE = { SOLID: 'green', CORRECT: 'owner', INCOMPLETE: 'muted' } as const

/** /espace/candidats : tous les candidats, tous biens confondus, en tableau ; le détail reste sur la page du bien. */
export default function CandidatsTous() {
  const { data, error, loading, reload } = useLoad(() => api<AllCandidates>('/candidates'))
  return (
    <AppShell>
      <PageHead title="Candidats" over="Tableau de bord › Candidats" />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.candidates.length ? (
        <Empty
          title="Aucune candidature pour l’instant."
          text="Ouvrez le lien de candidature d’un bien, puis collez-le dans votre annonce."
          action={data.properties[0] ? <Btn to={`/espace/logements/${data.properties[0].id}/candidats`}>Ouvrir le lien de candidature</Btn> : <Btn to="/espace/logements/nouveau">Ajouter un bien</Btn>}
        />
      ) : (
        <div className="dash-table" role="region" aria-label="Candidats" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Candidat</th>
                <th scope="col">Bien</th>
                <th scope="col">Ressources</th>
                <th scope="col">Reçue le</th>
                <th scope="col">Dossier</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/espace/logements/${c.propertyId}/candidats`} style={{ color: BAI.ink, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <span aria-hidden className="dash-avatar">
                        {c.name
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.propertyName}</td>
                  <td>{c.monthlyIncomeCents ? `${eurosCents(c.monthlyIncomeCents)} par mois` : '—'}</td>
                  <td>{new Date(c.receivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <Pill tone={TONE[c.review.level]}>{c.review.label}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
