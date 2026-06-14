import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useSEO } from '../../hooks/useSEO'
import { Clock, ArrowRight, Search, BookOpen } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  slug: string
  title: string
  description: string
  tag: string
  readTime: number
  role: 'tenant' | 'owner'
}

// ─── Données articles ─────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  // Locataire
  {
    slug: 'dossier-locatif-solide',
    title: 'Comment rédiger un dossier locatif solide',
    description: 'Les pièces indispensables, les erreurs à éviter et les conseils pour maximiser vos chances face à des dizaines de candidats.',
    tag: 'DOSSIER', readTime: 5, role: 'tenant',
  },
  {
    slug: 'comprendre-bail-loi',
    title: 'Comprendre le bail : tout ce que dit la loi',
    description: 'Durée, dépôt de garantie, préavis, charges — décryptage complet des clauses du contrat de location selon la loi ALUR.',
    tag: 'JURIDIQUE', readTime: 8, role: 'tenant',
  },
  {
    slug: 'visite-appartement-questions',
    title: 'Visite appartement : 20 questions à poser',
    description: "Ne repartez jamais sans avoir posé ces questions clés sur les charges, le voisinage, les travaux et l'état général.",
    tag: 'VISITE', readTime: 4, role: 'tenant',
  },
  {
    slug: 'droits-locataire',
    title: 'Droits du locataire : ce que vous devez savoir',
    description: "De la décence du logement à l'obligation d'entretien du propriétaire, connaissez vos droits pour vous protéger.",
    tag: 'DROITS', readTime: 6, role: 'tenant',
  },
  {
    slug: 'demenagement-checklist',
    title: 'Déménagement : checklist complète 2025',
    description: "Changement d'adresse, résiliation d'abonnements, état des lieux de sortie… Tout ce qu'il faut faire, dans l'ordre.",
    tag: 'PRATIQUE', readTime: 7, role: 'tenant',
  },
  {
    slug: 'loyer-charges-comprises',
    title: 'Loyer charges comprises : bien comprendre',
    description: 'Charges forfaitaires ou réelles ? Quelles charges sont récupérables ? Comment contester une régularisation ?',
    tag: 'FINANCES', readTime: 5, role: 'tenant',
  },
  // Propriétaire
  {
    slug: 'fixer-bon-loyer',
    title: 'Fixer le bon loyer pour son bien en 2025',
    description: "Méthodes de calcul, zones tendues, encadrement des loyers : comment trouver le juste prix pour louer vite et bien.",
    tag: 'LOYER', readTime: 6, role: 'owner',
  },
  {
    slug: 'choisir-locataire-criteres',
    title: 'Choisir son locataire : critères légaux',
    description: "Les règles anti-discrimination à respecter, les revenus exigibles, et comment évaluer la solvabilité sans prendre de risques.",
    tag: 'SÉLECTION', readTime: 5, role: 'owner',
  },
  {
    slug: 'rediger-annonce-attire',
    title: 'Rédiger une annonce de location qui attire',
    description: "Photos, description, informations clés — les techniques des professionnels pour générer un maximum de visites qualifiées.",
    tag: 'ANNONCE', readTime: 4, role: 'owner',
  },
  {
    slug: 'fiscalite-locative',
    title: 'Fiscalité locative 2025 : micro-foncier, réel, LMNP',
    description: 'Régime micro-foncier vs réel, déficit foncier, LMNP : optimisez votre déclaration et réduisez votre imposition légalement.',
    tag: 'FISCALITÉ', readTime: 10, role: 'owner',
  },
  {
    slug: 'etat-des-lieux',
    title: 'État des lieux : guide complet entrée et sortie',
    description: "Entrée et sortie, photos, désaccords, délais de restitution du dépôt — le guide complet pour éviter les litiges.",
    tag: 'EDL', readTime: 7, role: 'owner',
  },
  {
    slug: 'charges-recuperables',
    title: 'Charges récupérables : liste complète et légale 2025',
    description: "Eau, gardiennage, ascenseur, espaces verts — ce que vous pouvez légalement récupérer auprès de votre locataire.",
    tag: 'CHARGES', readTime: 6, role: 'owner',
  },
]

// ─── Tag colors ───────────────────────────────────────────────────────────────

const TAG_COLORS_TENANT: Record<string, { bg: string; color: string; border: string }> = {
  'DOSSIER':   { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
  'JURIDIQUE': { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
  'VISITE':    { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
  'DROITS':    { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
  'PRATIQUE':  { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
  'FINANCES':  { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
}

const TAG_COLORS_OWNER: Record<string, { bg: string; color: string; border: string }> = {
  'LOYER':     { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
  'SÉLECTION': { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
  'ANNONCE':   { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
  'FISCALITÉ': { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
  'EDL':       { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
  'CHARGES':   { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
}

// ─── ArticleCard ──────────────────────────────────────────────────────────────

function ArticleCard({ article, isOwner }: { article: Article; isOwner: boolean }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const tagMap = isOwner ? TAG_COLORS_OWNER : TAG_COLORS_TENANT
  const tagStyle = tagMap[article.tag] ?? { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border }

  return (
    <div
      role="article"
      onClick={() => navigate(`/guide/${article.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${hovered ? BAI.caramel : BAI.border}`,
        borderRadius: 14,
        boxShadow: hovered ? BAI.shadowLg : BAI.shadowSm,
        padding: '22px 20px',
        cursor: 'pointer',
        transition: BAI.transition,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Tag */}
      <div>
        <span style={{
          background: tagStyle.bg,
          color: tagStyle.color,
          border: `1px solid ${tagStyle.border}`,
          borderRadius: BAI.radiusSm,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.10em',
          padding: '3px 9px',
          fontFamily: BAI.fontBody,
          textTransform: 'uppercase' as const,
        }}>
          {article.tag}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 19,
        fontWeight: 700,
        fontStyle: 'italic',
        color: hovered ? BAI.caramel : BAI.ink,
        margin: 0,
        lineHeight: 1.3,
        transition: BAI.transition,
      }}>
        {article.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 13,
        color: BAI.inkMid,
        margin: 0,
        lineHeight: 1.65,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        flexGrow: 1,
      }}>
        {article.description}
      </p>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: `1px solid ${BAI.border}`,
        marginTop: 'auto',
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: BAI.fontBody,
          fontSize: 12,
          color: BAI.inkFaint,
        }}>
          <Clock size={12} />
          {article.readTime} min de lecture
        </span>
        <ArrowRight
          size={14}
          style={{
            color: hovered ? BAI.caramel : BAI.inkFaint,
            transition: BAI.transition,
          }}
        />
      </div>
    </div>
  )
}

// ─── GuideHero ────────────────────────────────────────────────────────────────

function GuideHero({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  return (
    <div style={{
      position: 'relative',
      background: '#0a0d1a',
      padding: 'clamp(64px, 10vw, 96px) clamp(16px, 5vw, 48px)',
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.22,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: BAI.caramel,
          marginBottom: 14,
        }}>
          Guide Bailio
        </p>
        <h1 style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(30px, 5.5vw, 52px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#ffffff',
          marginBottom: 18,
          lineHeight: 1.15,
        }}>
          Tout savoir sur la location.
        </h1>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 'clamp(14px, 1.6vw, 18px)',
          color: 'rgba(255,255,255,0.65)',
          marginBottom: 36,
          maxWidth: 560,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.65,
        }}>
          Dossiers, baux, fiscalité, droits — nos guides experts pour louer sereinement.
        </p>

        {/* Stats glass */}
        <div className="flex flex-wrap justify-center gap-3" style={{ marginBottom: 36 }}>
          {[
            { label: 'ARTICLES', value: '12' },
            { label: 'THÈMES', value: '8' },
            { label: 'LECTURE MOY.', value: '~6 min' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 14,
                padding: '11px 20px',
              }}
            >
              <p style={{
                fontFamily: BAI.fontBody,
                fontSize: 9,
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                margin: '0 0 3px',
              }}>
                {stat.label}
              </p>
              <p style={{
                fontFamily: BAI.fontDisplay,
                fontSize: 24,
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1,
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 15,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Rechercher un article…"
            aria-label="Rechercher un article"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: BAI.radius,
              padding: '14px 14px 14px 44px',
              fontFamily: BAI.fontBody,
              fontSize: 14,
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box' as const,
              minHeight: 48,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── GuideCTA ─────────────────────────────────────────────────────────────────

function GuideCTA() {
  const navigate = useNavigate()
  return (
    <div style={{
      background: BAI.bgMuted,
      borderTop: `1px solid ${BAI.border}`,
      padding: 'clamp(48px, 7vw, 72px) clamp(16px, 5vw, 48px)',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 14,
      }}>
        <BookOpen size={20} style={{ color: BAI.caramel }} />
      </div>
      <h2 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 'clamp(24px, 3.5vw, 34px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: BAI.ink,
        marginBottom: 10,
      }}>
        Prêt à trouver votre logement ?
      </h2>
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 15,
        color: BAI.inkMid,
        marginBottom: 32,
        maxWidth: 440,
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.6,
      }}>
        Consultez les annonces disponibles ou publiez votre bien en quelques minutes, sans agence.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/search')}
          style={{
            background: BAI.night,
            color: '#fff',
            border: 'none',
            borderRadius: BAI.radius,
            padding: '13px 28px',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 48,
            transition: BAI.transition,
          }}
        >
          Voir les annonces
        </button>
        <button
          onClick={() => navigate('/register?role=OWNER')}
          style={{
            background: BAI.bgSurface,
            color: BAI.ink,
            border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radius,
            padding: '13px 28px',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 48,
            transition: BAI.transition,
          }}
        >
          Publier une annonce
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Guide() {
  const [activeTab, setActiveTab] = useState<'tenant' | 'owner'>('tenant')
  const [search, setSearch] = useState('')

  useSEO({
    title: 'Guide de la location | Bailio — Conseils propriétaires et locataires',
    description: 'Nos guides complets pour louer sereinement : dossier locatif, bail ALUR, fiscalité, état des lieux, droits et obligations. Conseils experts gratuits.',
    canonical: 'https://bailio.fr/guide',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'Guide de la location — Bailio',
      'description': 'Guides complets pour locataires et propriétaires',
      'url': 'https://bailio.fr/guide',
      'publisher': {
        '@type': 'Organization',
        'name': 'Bailio',
        'url': 'https://bailio.fr',
      },
    },
  })

  const filtered = ARTICLES.filter(a =>
    a.role === activeTab &&
    (search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()))
  )

  const tabs: { key: 'tenant' | 'owner'; label: string }[] = [
    { key: 'tenant', label: 'Je suis locataire' },
    { key: 'owner', label: 'Je suis propriétaire' },
  ]

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <GuideHero search={search} onSearch={setSearch} />

        {/* Tabs navigation */}
        <div style={{
          background: BAI.bgSurface,
          borderBottom: `1px solid ${BAI.border}`,
          display: 'flex',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          gap: 0,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key
                  ? `2px solid ${BAI.caramel}`
                  : '2px solid transparent',
                padding: '16px 32px',
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? BAI.ink : BAI.inkMid,
                cursor: 'pointer',
                transition: BAI.transition,
                minHeight: 52,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grille d'articles */}
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(28px, 4vw, 52px) clamp(16px, 4vw, 32px)',
        }}>
          {search !== '' && (
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 13,
              color: BAI.inkFaint,
              marginBottom: 20,
            }}>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
              {' '}pour &ldquo;{search}&rdquo;
            </p>
          )}

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '72px 0',
              color: BAI.inkFaint,
              fontFamily: BAI.fontBody,
              fontSize: 14,
            }}>
              Aucun article ne correspond à votre recherche.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
              gap: 22,
            }}>
              {filtered.map(article => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  isOwner={activeTab === 'owner'}
                />
              ))}
            </div>
          )}
        </div>

        <GuideCTA />
      </div>
    </Layout>
  )
}
