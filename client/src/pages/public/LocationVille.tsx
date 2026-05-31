import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useProperties } from '../../hooks/useProperties'
import { PropertyCard } from '../../components/property/PropertyCard'
import { MapPin, TrendingUp, Train, ChevronRight, Building2 } from 'lucide-react'

// ─── Données villes ───────────────────────────────────────────────────────────

interface VilleData {
  nom: string
  nomComplet: string
  prixMoyen: number
  description: string
  quartiers: string[]
  transport: string
}

const VILLES_DATA: Record<string, VilleData> = {
  'paris': {
    nom: 'Paris', nomComplet: 'Paris (75)', prixMoyen: 28,
    description: 'La capitale française concentre une offre locative unique, des studios haussmanniens aux lofts contemporains. Chaque arrondissement a son identité propre.',
    quartiers: ['Marais', 'Montmartre', 'Bastille', 'République', 'Nation', 'Oberkampf'],
    transport: 'Métro, RER, Vélib\'',
  },
  'lyon': {
    nom: 'Lyon', nomComplet: 'Lyon (69)', prixMoyen: 14,
    description: 'Deuxième ville économique de France, Lyon attire cadres et étudiants grâce à son cadre de vie exceptionnel et ses prix bien plus accessibles qu\'à Paris.',
    quartiers: ['Presqu\'île', 'Croix-Rousse', 'Confluence', 'Part-Dieu', 'Villeurbanne'],
    transport: 'Métro, TCL, Vélo\'v',
  },
  'marseille': {
    nom: 'Marseille', nomComplet: 'Marseille (13)', prixMoyen: 12,
    description: 'La cité phocéenne séduit par son ensoleillement, sa proximité avec la mer et des loyers parmi les plus accessibles des grandes villes françaises.',
    quartiers: ['Vieux-Port', 'Castellane', 'Noailles', 'Cours Julien', 'Cinq-Avenues'],
    transport: 'Métro, Bus RTM, Tram',
  },
  'bordeaux': {
    nom: 'Bordeaux', nomComplet: 'Bordeaux (33)', prixMoyen: 16,
    description: 'La Belle endormie s\'est réveillée : LGV, rénovation urbaine et attractivité économique ont fait bondir Bordeaux au rang des villes les plus convoitées de France.',
    quartiers: ['Saint-Michel', 'Chartrons', 'Capucins', 'Saint-Pierre', 'Bastide'],
    transport: 'Tram, Bus TBM',
  },
  'toulouse': {
    nom: 'Toulouse', nomComplet: 'Toulouse (31)', prixMoyen: 13,
    description: 'La Ville rose, capitale européenne de l\'aéronautique, offre un marché locatif dynamique porté par ses grandes universités et son bassin d\'emploi tech.',
    quartiers: ['Capitole', 'Saint-Cyprien', 'Carmes', 'Les Minimes', 'Compans-Caffarelli'],
    transport: 'Métro, Bus Tisséo',
  },
  'nantes': {
    nom: 'Nantes', nomComplet: 'Nantes (44)', prixMoyen: 13,
    description: 'La cité des Ducs de Bretagne, régulièrement élue ville préférée des Français, conjugue qualité de vie, culture et accessibilité des loyers.',
    quartiers: ['Bouffay', 'Île de Nantes', 'Chantenay', 'Erdre', 'Doulon'],
    transport: 'Tram, Busway, Navibus',
  },
}

// ─── Composant InfoPanel ──────────────────────────────────────────────────────

function InfoPanel({ ville }: { ville: VilleData }) {
  return (
    <div style={{
      background: BAI.bgSurface,
      border: `1px solid ${BAI.border}`,
      borderRadius: BAI.radiusLg,
      overflow: 'hidden',
      position: 'sticky',
      top: 80,
    }}>
      {/* Prix moyen */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${BAI.border}` }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 6 }}>
          Prix moyen
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: BAI.fontDisplay, fontSize: 32, fontWeight: 700, color: BAI.ink }}>{ville.prixMoyen}€</span>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>/m²/mois</span>
        </div>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 4 }}>
          Estimation marché 2026
        </p>
      </div>

      {/* Transport */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Train size={16} style={{ color: BAI.caramel, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink, marginBottom: 2 }}>Transports</p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>{ville.transport}</p>
          </div>
        </div>
      </div>

      {/* À propos */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink, marginBottom: 6 }}>À propos</p>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6 }}>{ville.description}</p>
      </div>

      {/* Quartiers */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink, marginBottom: 10 }}>Quartiers populaires</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ville.quartiers.map(q => (
            <span key={q} style={{
              background: BAI.bgMuted,
              color: BAI.inkMid,
              border: `1px solid ${BAI.border}`,
              borderRadius: 20,
              padding: '4px 10px',
              fontFamily: BAI.fontBody,
              fontSize: 12,
            }}>
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LocationVille() {
  const { ville: villeParam } = useParams<{ ville: string }>()
  const navigate = useNavigate()
  const { properties, isLoading, fetchProperties } = useProperties()

  const villeKey = villeParam?.toLowerCase() ?? ''
  const villeData = VILLES_DATA[villeKey]

  useEffect(() => {
    if (villeData) {
      fetchProperties({ city: villeData.nom, status: 'AVAILABLE' as const }, { page: 1, limit: 12 })
    }
  }, [villeData?.nom])

  // Ville non trouvée
  if (!villeData) {
    return (
      <Layout>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: BAI.fontBody }}>
          <MapPin size={40} style={{ color: BAI.inkFaint }} />
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: BAI.ink }}>
            Ville non trouvée
          </h1>
          <p style={{ color: BAI.inkMid, fontSize: 14 }}>
            La ville <strong>"{villeParam}"</strong> n'est pas encore référencée.
          </p>
          <Link to="/search" style={{
            background: BAI.night,
            color: '#fff',
            borderRadius: BAI.radius,
            padding: '12px 24px',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Voir toutes les annonces
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>

        {/* Hero compact */}
        <div style={{ background: BAI.night, padding: 'clamp(28px, 4vw, 48px) clamp(16px, 5vw, 48px)' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {[['Accueil', '/'], ['Location', '/search'], [villeData.nom, '']].map(([label, href], i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                {href ? (
                  <Link to={href} style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                ) : (
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
                )}
              </span>
            ))}
          </nav>

          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 6 }}>
            Location à {villeData.nom}
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {villeData.nomComplet} — Loyer moyen : {villeData.prixMoyen}€/m²/mois
          </p>
        </div>

        {/* Stats band */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, padding: '12px clamp(16px, 5vw, 48px)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { icon: <Building2 size={14} />, label: `${properties.length} annonce${properties.length !== 1 ? 's' : ''} disponible${properties.length !== 1 ? 's' : ''}` },
              { icon: <TrendingUp size={14} />, label: `Loyer moyen : ${villeData.prixMoyen}€/m²` },
              { icon: <MapPin size={14} />, label: `${villeData.quartiers.length} quartiers référencés` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: BAI.inkMid }}>
                <span style={{ color: BAI.caramel }}>{item.icon}</span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)' }}>
          <div className="flex gap-8" style={{ alignItems: 'flex-start' }}>

            {/* Colonne gauche — annonces */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>
                    Chargement des annonces…
                  </div>
                </div>
              ) : properties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: BAI.inkFaint }}>
                  <Building2 size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14 }}>
                    Aucune annonce disponible à {villeData.nom} pour le moment.
                  </p>
                  <button
                    onClick={() => navigate('/search')}
                    style={{
                      marginTop: 16,
                      background: BAI.night,
                      color: '#fff',
                      border: 'none',
                      borderRadius: BAI.radius,
                      padding: '10px 20px',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Toutes les annonces
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
                  {properties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite — info panel (cachée sur mobile) */}
            <div className="hidden md:block" style={{ width: 280, flexShrink: 0 }}>
              <InfoPanel ville={villeData} />
            </div>
          </div>

          {/* Section quartiers */}
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BAI.border}` }}>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 16 }}>
              Explorer par quartier
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {villeData.quartiers.map(q => (
                <button
                  key={q}
                  onClick={() => navigate(`/search?city=${villeData.nom}&neighborhood=${q}`)}
                  style={{
                    background: BAI.bgSurface,
                    color: BAI.ink,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 20,
                    padding: '8px 18px',
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: BAI.transition,
                    minHeight: 44,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = BAI.caramel
                    ;(e.currentTarget as HTMLButtonElement).style.color = BAI.caramel
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = BAI.border
                    ;(e.currentTarget as HTMLButtonElement).style.color = BAI.ink
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
