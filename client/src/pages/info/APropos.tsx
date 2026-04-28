import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const BAI = {
  bgBase:      '#fafaf8',
  bgSurface:   '#ffffff',
  bgMuted:     '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  caramel:     '#c4976a',
  border:      '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
  shadow:      '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
} as const

const PRINCIPLES = [
  {
    title: 'Tutoiement.',
    desc:  "On parle comme à un ami. Pas de jargon notarial, pas de formules marketing creuses. La loi ALUR expliquée en clair.",
  },
  {
    title: 'Aucune commission.',
    desc:  "Pas de frais d'agence, pas de pourcentage caché côté locataire. Un seul prix transparent côté propriétaire.",
  },
  {
    title: 'Données en France.',
    desc:  "Hébergement OVHcloud certifié HDS. Aucune revente. RGPD strict. Tu peux exporter ou supprimer ton compte en deux clics.",
  },
]

const TEAM: {
  letter: string
  name: string
  role: string
  bio: string
  gradientFrom: string
  gradientTo: string
  letterColor: string
}[] = [
  {
    letter:       'A',
    name:         'Aline Berger',
    role:         'CEO · ex-Doctolib',
    bio:          'A loué onze appartements en quinze ans. A juré que le douzième serait différent.',
    gradientFrom: '#fdf5ec',
    gradientTo:   '#e8ccaa',
    letterColor:  '#b07f54',
  },
  {
    letter:       'M',
    name:         'Mehdi Lacroix',
    role:         'CTO · ex-Alan',
    bio:          'Construit du logiciel qui simplifie la vie. Allergique au PDF en pièce jointe.',
    gradientFrom: '#eaf0fb',
    gradientTo:   '#b8ccf0',
    letterColor:  '#1a3270',
  },
  {
    letter:       'J',
    name:         'Jeanne Mariotti',
    role:         'Head of Product · ex-Qonto',
    bio:          "Croit qu'un bon produit se mesure en clics évités, pas en fonctionnalités ajoutées.",
    gradientFrom: '#edf7f2',
    gradientTo:   '#9fd4ba',
    letterColor:  '#1b5e3b',
  },
]

export default function APropos() {
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <Header />

      {/* SECTION 1 — Header clair */}
      <section style={{ padding: '80px 0 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ maxWidth: 720 }}>
            <p style={{
              fontFamily:    BAI.fontBody,
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         BAI.caramel,
              margin:        '0 0 14px',
            }}>
              À propos
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay,
              fontStyle:  'italic',
              fontWeight: 700,
              fontSize:   'clamp(36px,5vw,64px)',
              lineHeight: 1.05,
              color:      BAI.ink,
              margin:     '0 0 24px',
            }}>
              Louer ne devrait pas{' '}
              <em style={{ color: BAI.caramel }}>faire mal.</em>
            </h1>
            <p style={{
              fontSize:   18,
              lineHeight: 1.65,
              color:      BAI.inkMid,
              margin:     0,
            }}>
              Bailio est né d'un constat simple : entre les agences à 1&nbsp;100&nbsp;€, les dossiers refusés sans explication, les bails imprimés en triple exemplaire et les quittances oubliées, louer en France reste une corvée. On a décidé de la réécrire.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Principles */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(72px,12vh,130px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle:  'italic',
            fontWeight: 700,
            fontSize:   'clamp(28px,4vw,48px)',
            lineHeight: 1.1,
            color:      BAI.ink,
            margin:     '0 0 40px',
          }}>
            Nos principes.
          </h2>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 24,
          }}>
            {PRINCIPLES.map(p => (
              <div
                key={p.title}
                style={{
                  background:   BAI.bgSurface,
                  border:       `1px solid ${BAI.border}`,
                  borderRadius: 12,
                  padding:      28,
                  boxShadow:    BAI.shadow,
                }}
              >
                <h4 style={{
                  fontFamily: BAI.fontDisplay,
                  fontStyle:  'italic',
                  fontWeight: 700,
                  fontSize:   22,
                  color:      BAI.ink,
                  margin:     '0 0 10px',
                }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.65, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Team */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(72px,12vh,130px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle:  'italic',
            fontWeight: 700,
            fontSize:   'clamp(28px,4vw,48px)',
            lineHeight: 1.1,
            color:      BAI.ink,
            margin:     '0 0 40px',
          }}>
            L'équipe fondatrice.
          </h2>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 24,
          }}>
            {TEAM.map(m => (
              <div key={m.name}>
                {/* Avatar */}
                <div style={{
                  aspectRatio:    '1',
                  background:     `linear-gradient(135deg, ${m.gradientFrom}, ${m.gradientTo})`,
                  borderRadius:   12,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  marginBottom:   16,
                }}>
                  <span style={{
                    fontFamily: BAI.fontDisplay,
                    fontStyle:  'italic',
                    fontWeight: 700,
                    fontSize:   64,
                    color:      m.letterColor,
                    lineHeight: 1,
                  }}>
                    {m.letter}
                  </span>
                </div>
                {/* Name */}
                <p style={{
                  fontFamily: BAI.fontDisplay,
                  fontStyle:  'italic',
                  fontWeight: 700,
                  fontSize:   22,
                  color:      BAI.ink,
                  margin:     0,
                }}>
                  {m.name}
                </p>
                {/* Role */}
                <p style={{
                  fontSize: 13,
                  color:    BAI.inkFaint,
                  margin:   '4px 0 8px',
                }}>
                  {m.role}
                </p>
                {/* Bio */}
                <p style={{
                  fontSize:   13.5,
                  color:      BAI.inkMid,
                  lineHeight: 1.6,
                  margin:     0,
                }}>
                  {m.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
