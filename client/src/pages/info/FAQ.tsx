import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Minus } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

interface FaqItem {
  q: string
  a: string
}

interface FaqSection {
  category: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    category: 'Sécurité & juridique',
    items: [
      {
        q: 'Le bail signé sur Bailio a-t-il la même valeur qu\'un bail papier ?',
        a: 'Oui. Le bail électronique Bailio est conforme à la loi ALUR et signé via un prestataire certifié eIDAS niveau avancé. Il a la même valeur probante qu\'un bail papier — mieux : il est horodaté, archivé et accessible à vie dans ton espace.',
      },
      {
        q: 'Comment fonctionnent les dossiers vérifiés ?',
        a: 'Le candidat dépose sa pièce d\'identité, ses trois derniers bulletins de salaire, son avis d\'imposition et son justificatif de domicile. On vérifie la cohérence des documents et on produit une analyse basée sur des critères objectifs : taux d\'effort, stabilité professionnelle, présence d\'un garant.',
      },
      {
        q: 'Vos données sont hébergées où ?',
        a: 'En France, sur des serveurs sécurisés. Nous ne partageons aucune donnée avec un tiers non essentiel au service. Le RGPD, on l\'applique — y compris le droit à l\'export et à la suppression de compte, accessibles en deux clics.',
      },
      {
        q: 'Est-ce que Bailio est conforme à la loi ALUR ?',
        a: 'Oui. Les baux générés respectent les modèles types définis par décret, incluent toutes les mentions obligatoires et sont signés via une solution certifiée. L\'état des lieux est également conforme au décret du 30 mars 2016.',
      },
    ],
  },
  {
    category: 'Tarifs & paiement',
    items: [
      {
        q: 'Bailio est gratuit pour les locataires ?',
        a: 'Oui, totalement. La loi ALUR interdit les frais à la charge du locataire lors de la mise en location. Nous allons plus loin : aucun frais de dossier, aucun frais d\'état des lieux, aucune commission. Gratuit, pour toujours.',
      },
      {
        q: 'Et si le locataire ne paie plus ?',
        a: 'La garantie loyers impayés (option à 2,5 % du loyer mensuel) couvre jusqu\'à 96 000 € par sinistre, procédure juridique incluse. Elle est proposée en partenariat avec un assureur agréé et activable en un clic depuis ton tableau de bord.',
      },
      {
        q: 'Quand suis-je facturé en tant que propriétaire ?',
        a: 'Jamais avant la signature du bail. Une fois ton locataire installé, 1 % du loyer mensuel est prélevé sur chaque quittance. Si le bien est vacant, la facturation est suspendue automatiquement.',
      },
      {
        q: 'Y a-t-il des frais cachés ?',
        a: 'Non. Le seul prélèvement est 1 % du loyer mensuel, visible sur chaque quittance. Aucun frais d\'entrée, aucun frais de mise en location, aucun frais de sortie, aucun renouvellement payant.',
      },
    ],
  },
  {
    category: 'Utilisation',
    items: [
      {
        q: 'Combien de temps pour publier une annonce ?',
        a: 'Quelques minutes. Tu remplis les informations essentielles (surface, loyer, équipements, ville), tu téléverses tes photos et tu publies. L\'annonce est en ligne immédiatement.',
      },
      {
        q: 'Puis-je gérer plusieurs biens ?',
        a: 'Oui. Le tableau de bord regroupe tous tes biens, tes loyers encaissés, tes candidatures et ta rentabilité globale. Chaque bien a sa propre fiche avec son historique complet.',
      },
      {
        q: 'Comment fonctionne l\'état des lieux ?',
        a: 'Pièce par pièce, photo par photo, depuis ton téléphone ou ton ordinateur. L\'application te guide, le locataire valide, le tout est horodaté et archivé dans les deux espaces. À la sortie, on compare automatiquement avec l\'état des lieux d\'entrée.',
      },
      {
        q: 'Puis-je utiliser Bailio si je suis déjà en location ?',
        a: 'Oui. Tu peux importer un contrat existant pour gérer les quittances, la messagerie et l\'état des lieux de sortie, même si le bail n\'a pas été signé sur Bailio.',
      },
    ],
  },
]

function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: `1px solid ${BAI.border}`,
        padding: '22px 0',
        cursor: 'pointer',
        borderLeft: open ? `3px solid ${BAI.caramel}` : '3px solid transparent',
        paddingLeft: open ? 16 : 0,
        transition: 'border-color 0.15s, padding-left 0.15s',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 19, color: BAI.ink, margin: 0, lineHeight: 1.3, flex: 1 }}>{item.q}</p>
        <div style={{ color: BAI.caramel, flexShrink: 0, transition: 'transform .2s' }}>
          {open ? <Minus size={22} /> : <Plus size={22} />}
        </div>
      </div>
      {open && (
        <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.7, margin: '14px 0 0', textWrap: 'pretty' } as React.CSSProperties}>{item.a}</p>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <section
        style={{
          background: '#0a0d1a',
          padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,48px) clamp(40px,6vw,60px)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: BAI.caramel,
              margin: '0 0 10px',
            }}
          >
            Questions fréquentes
          </p>
          <h1
            style={{
              fontFamily: BAI.fontDisplay,
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 'clamp(32px,6vw,52px)',
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '8px 0 12px',
            }}
          >
            Tout ce que vous{' '}
            <em style={{ color: BAI.caramel }}>voulez savoir.</em>
          </h1>
          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: '15px',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6,
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            Tu ne trouves pas ? Écris-nous, on répond en moins de 4 heures ouvrées.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(40px,6vh,60px) 0 clamp(64px,10vh,100px)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          {FAQ_SECTIONS.map(section => (
            <div key={section.category}>
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, margin: '48px 0 0', color: BAI.ink }}>{section.category}</p>
              {section.items.map(item => (
                <FaqItem key={item.q} item={item} />
              ))}
            </div>
          ))}

          {/* Contact block */}
          <div style={{ marginTop: 64, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, margin: '0 0 8px', color: BAI.ink }}>Encore une question ?</p>
            <p style={{ fontSize: 14, color: BAI.inkMid, margin: '0 0 20px' }}>L'équipe répond en moins de 4 heures ouvrées.</p>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, background: BAI.night, color: '#fff', textDecoration: 'none' }}>
              Nous contacter <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
