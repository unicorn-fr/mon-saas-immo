import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

// ─── Maison tokens ────────────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  night: '#1a1a2e', caramel: '#c4976a',
  owner: '#1a3270', ownerLight: '#eaf0fb',
  border: '#e4e1db',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function Cookies() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: M.bg, fontFamily: M.body }}>

      {/* Hero */}
      <section style={{ backgroundColor: M.night, padding: '64px 16px 56px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontFamily: M.body, fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <p
            style={{
              fontFamily: M.body,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: M.caramel,
              marginBottom: '12px',
            }}
          >
            Légal
          </p>
          <h1
            style={{
              fontFamily: M.display,
              fontStyle: 'italic',
              fontSize: '40px',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Politique de cookies
          </h1>
          <p style={{ fontFamily: M.body, fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
            Dernière mise à jour : Février 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '56px 16px 80px' }}>
        <div className="space-y-10">

          <section>
            <h2
              style={{
                fontFamily: M.display,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: M.ink,
                marginBottom: '12px',
              }}
            >
              1. Qu'est-ce qu'un cookie ?
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Un cookie est un petit fichier texte stocké sur votre terminal (ordinateur, tablette,
              smartphone) lors de votre visite sur notre site. Il permet de mémoriser des informations
              relatives à votre navigation pour améliorer votre expérience utilisateur.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: M.display,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: M.ink,
                marginBottom: '16px',
              }}
            >
              2. Cookies utilisés
            </h2>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${M.border}` }}>
                    {['Cookie', 'Type', 'Durée', 'Finalité'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left' as const,
                          paddingBottom: '12px',
                          paddingRight: '20px',
                          fontFamily: M.body,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em',
                          color: M.inkFaint,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${M.border}` }}>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: M.ink }}>auth_token</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: M.ownerLight,
                          color: M.owner,
                          borderRadius: '100px',
                          fontFamily: M.body,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Essentiel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>Session</td>
                    <td style={{ padding: '14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>Authentification de l'utilisateur</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${M.border}` }}>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: M.ink }}>refresh_token</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: M.ownerLight,
                          color: M.owner,
                          borderRadius: '100px',
                          fontFamily: M.body,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Essentiel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>7 jours</td>
                    <td style={{ padding: '14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>Maintien de la connexion</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: M.ink }}>preferences</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: M.muted,
                          color: M.inkMid,
                          borderRadius: '100px',
                          fontFamily: M.body,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Fonctionnel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>1 an</td>
                    <td style={{ padding: '14px 0', fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>Mémorisation des préférences</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2
              style={{
                fontFamily: M.display,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: M.ink,
                marginBottom: '12px',
              }}
            >
              3. Gestion des cookies
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7, marginBottom: '14px' }}>
              Vous pouvez à tout moment modifier vos préférences en matière de cookies
              depuis les paramètres de votre navigateur. Voici les liens vers les instructions
              des principaux navigateurs :
            </p>
            <div
              style={{
                backgroundColor: M.muted,
                borderLeft: `3px solid ${M.caramel}`,
                borderRadius: '0 8px 8px 0',
                padding: '16px 20px',
              }}
            >
              <ul className="space-y-2">
                {[
                  'Google Chrome : Paramètres > Confidentialité et sécurité > Cookies',
                  'Mozilla Firefox : Options > Vie privée et sécurité',
                  'Safari : Préférences > Confidentialité',
                  'Microsoft Edge : Paramètres > Cookies et autorisations de site',
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      fontFamily: M.body,
                      fontSize: '14px',
                      color: M.inkMid,
                      lineHeight: 1.6,
                      paddingLeft: '16px',
                      position: 'relative' as const,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute' as const,
                        left: 0,
                        top: '8px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: M.caramel,
                        display: 'inline-block',
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2
              style={{
                fontFamily: M.display,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: M.ink,
                marginBottom: '12px',
              }}
            >
              4. Cookies tiers
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Notre site n'utilise actuellement aucun cookie tiers à des fins publicitaires.
              Seuls les cookies strictement nécessaires au fonctionnement du service sont déposés.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
