import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

export default function Cookies() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody }}>

      {/* Hero */}
      <section style={{ backgroundColor: BAI.night, padding: '64px 16px 56px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: BAI.caramel,
              marginBottom: '12px',
            }}
          >
            Légal
          </p>
          <h1
            style={{
              fontFamily: BAI.fontDisplay,
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
          <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
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
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              1. Qu'est-ce qu'un cookie ?
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Un cookie est un petit fichier texte stocké sur votre terminal (ordinateur, tablette,
              smartphone) lors de votre visite sur notre site. Il permet de mémoriser des informations
              relatives à votre navigation pour améliorer votre expérience utilisateur.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '16px',
              }}
            >
              2. Cookies utilisés
            </h2>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${BAI.border}` }}>
                    {['Cookie', 'Type', 'Durée', 'Finalité'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left' as const,
                          paddingBottom: '12px',
                          paddingRight: '20px',
                          fontFamily: BAI.fontBody,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em',
                          color: BAI.inkFaint,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${BAI.border}` }}>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: BAI.ink }}>auth_token</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: BAI.ownerLight,
                          color: BAI.owner,
                          borderRadius: '100px',
                          fontFamily: BAI.fontBody,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Essentiel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>Session</td>
                    <td style={{ padding: '14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>Authentification de l'utilisateur</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${BAI.border}` }}>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: BAI.ink }}>refresh_token</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: BAI.ownerLight,
                          color: BAI.owner,
                          borderRadius: '100px',
                          fontFamily: BAI.fontBody,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Essentiel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>7 jours</td>
                    <td style={{ padding: '14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>Maintien de la connexion</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: 'monospace', fontSize: '13px', color: BAI.ink }}>preferences</td>
                    <td style={{ padding: '14px 20px 14px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          backgroundColor: BAI.bgMuted,
                          color: BAI.inkMid,
                          borderRadius: '100px',
                          fontFamily: BAI.fontBody,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Fonctionnel
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px 14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>1 an</td>
                    <td style={{ padding: '14px 0', fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>Mémorisation des préférences</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              3. Gestion des cookies
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '14px' }}>
              Vous pouvez à tout moment modifier vos préférences en matière de cookies
              depuis les paramètres de votre navigateur. Voici les liens vers les instructions
              des principaux navigateurs :
            </p>
            <div
              style={{
                backgroundColor: BAI.bgMuted,
                borderLeft: `3px solid ${BAI.caramel}`,
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
                      fontFamily: BAI.fontBody,
                      fontSize: '14px',
                      color: BAI.inkMid,
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
                        backgroundColor: BAI.caramel,
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
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              4. Cookies tiers
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
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
