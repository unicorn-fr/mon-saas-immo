import { useState, useEffect } from 'react'
import { pdf, Document, Page, Text, StyleSheet } from '@react-pdf/renderer'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import {
  FileText, Download, Copy, Check, AlertTriangle, TrendingUp,
  UserX, Wrench, Key, FileCheck, ChevronDown, ChevronUp, Send,
  Loader2, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '../../services/api.service'
import { useAuth } from '../../hooks/useAuth'
import type { Contract } from '../../types/contract.types'

// ─── PDF styles ──────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    padding: 65,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  header: { fontSize: 7, textAlign: 'right', color: '#999999', marginBottom: 40 },
  title: { fontSize: 13, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  body: { lineHeight: 1.8 },
  footer: { fontSize: 7, textAlign: 'right', color: '#999999', position: 'absolute', bottom: 30, right: 65 },
})

const LetterPDF = ({ content, title }: { content: string; title: string }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>bailio.fr</Text>
      <Text style={pdfStyles.title}>{title}</Text>
      <Text style={pdfStyles.body}>{content}</Text>
      <Text style={pdfStyles.footer}>bailio.fr</Text>
    </Page>
  </Document>
)

// ─── Template data ────────────────────────────────────────────────────────────
interface LetterTemplate {
  id: string
  title: string
  category: string
  description: string
  icon: React.ElementType
  color: string
  content: string
}

const LETTERS: LetterTemplate[] = [
  {
    id: 'relance-1',
    title: '1ère relance loyer impayé',
    category: 'Impayés',
    description: 'Rappel amiable pour un loyer en retard',
    icon: AlertTriangle,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du locataire]

Objet : Rappel de loyer impayé

Madame, Monsieur,

Je me permets de vous contacter au sujet du loyer du mois de [MOIS ANNÉE] concernant votre logement situé au [ADRESSE DU BIEN].

À ce jour, je n'ai pas reçu le règlement de la somme de [MONTANT] euros correspondant à votre loyer charges comprises.

Je vous serais reconnaissant(e) de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.

Si vous rencontrez des difficultés passagères, n'hésitez pas à me contacter afin que nous trouvions ensemble une solution amiable.

Dans l'attente d'une régularisation rapide de votre situation, je reste à votre disposition.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'relance-2',
    title: '2ème relance loyer impayé',
    category: 'Impayés',
    description: 'Mise en demeure formelle de payer',
    icon: AlertTriangle,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du locataire]

Objet : MISE EN DEMEURE — Loyer(s) impayé(s)

Madame, Monsieur,

Malgré ma précédente lettre de rappel en date du [DATE RELANCE 1], je constate que le(s) loyer(s) suivant(s) demeure(nt) impayé(s) :

- Loyer de [MOIS 1] : [MONTANT] €
- Loyer de [MOIS 2] : [MONTANT] € (le cas échéant)
TOTAL DÛ : [MONTANT TOTAL] €

Par la présente, je vous mets en demeure de régulariser cette situation dans un délai de HUIT (8) JOURS à compter de la réception de ce courrier.

À défaut de règlement dans ce délai, je me verrai contraint(e) de faire appel à un huissier de justice et d'engager une procédure judiciaire pour obtenir votre expulsion et le recouvrement des sommes dues, conformément aux dispositions de la loi du 6 juillet 1989.

Recevez, Madame, Monsieur, mes salutations distinguées.

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'revision-loyer',
    title: 'Lettre de révision de loyer',
    category: 'Loyer',
    description: "Notification d'augmentation selon l'IRL",
    icon: TrendingUp,
    color: '#1a3270',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement loué]

Objet : Révision annuelle du loyer

Madame, Monsieur,

Conformément aux dispositions de l'article 17-1 de la loi n° 89-462 du 6 juillet 1989 et à la clause de révision prévue dans notre contrat de bail en date du [DATE DU BAIL], je vous informe de la révision annuelle de votre loyer.

La révision est effectuée sur la base de l'Indice de Référence des Loyers (IRL) publié par l'INSEE :

• IRL du trimestre de référence prévu au bail : [IRL DE RÉFÉRENCE (ex: 3e trimestre 2023)]
• IRL du dernier trimestre publié : [NOUVEL IRL]
• Ancien loyer hors charges : [ANCIEN LOYER] €
• Nouveau loyer calculé : [ANCIEN LOYER] × [NOUVEL IRL] / [IRL RÉFÉRENCE] = [NOUVEAU LOYER] €

À compter du [DATE D'APPLICATION], votre nouveau loyer mensuel hors charges sera de [NOUVEAU LOYER] euros.

Le montant des charges reste inchangé à [MONTANT CHARGES] euros.

Votre nouveau loyer charges comprises sera donc de [NOUVEAU LOYER + CHARGES] euros.

Je reste à votre disposition pour tout renseignement complémentaire.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'conge-bailleur',
    title: 'Congé donné par le bailleur',
    category: 'Fin de bail',
    description: 'Reprise du logement pour habiter ou vendre',
    icon: UserX,
    color: '#6b21a8',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Congé pour [REPRISE POUR HABITER / VENTE / MOTIF LÉGITIME ET SÉRIEUX]

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie votre congé pour le logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN], conformément aux dispositions de l'article 15 de la loi du 6 juillet 1989.

[CHOISIR LE MOTIF APPROPRIÉ :]

MOTIF 1 — REPRISE POUR HABITER :
Ce congé est motivé par la reprise du logement pour y habiter personnellement / pour y loger [mon/ma conjoint(e), mon/ma partenaire pacsé(e), mes ascendants/descendants], [PRÉNOM NOM], qui se trouve dans la nécessité de se loger.

MOTIF 2 — VENTE :
Ce congé est motivé par la vente du logement. En vertu de l'article 15-II de la loi du 6 juillet 1989, vous bénéficiez d'un droit de préemption. Le prix de vente est fixé à [PRIX] euros. Vous disposez d'un délai de deux mois à compter de la réception de ce congé pour exercer ce droit.

Le bail prenant fin le [DATE DE FIN DU BAIL], vous devrez libérer les lieux au plus tard à cette date.

Je vous rappelle que votre préavis est de SIX (6) MOIS pour un logement loué vide, ou TROIS (3) MOIS pour un logement loué meublé.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },
  {
    id: 'etat-lieux-sortie',
    title: 'Convocation état des lieux de sortie',
    category: 'État des lieux',
    description: "Planification de l'état des lieux de sortie",
    icon: Key,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Convocation à l'état des lieux de sortie

Madame, Monsieur,

Suite à votre préavis de départ, je vous contacte afin d'organiser l'état des lieux de sortie de votre logement situé au [ADRESSE DU BIEN].

Je vous propose de nous retrouver le [DATE] à [HEURE] pour procéder ensemble à cet état des lieux contradictoire.

Lors de cette visite, vous devrez me remettre :
• L'ensemble des clés et badges d'accès
• Les documents liés au logement (notices, garanties, etc.)

Le dépôt de garantie d'un montant de [MONTANT] euros vous sera restitué dans un délai d'UN (1) MOIS si l'état des lieux de sortie est conforme à l'état des lieux d'entrée, ou de DEUX (2) MOIS dans le cas contraire, après déduction des sommes dues.

Merci de me confirmer ce rendez-vous dans les plus brefs délais ou de me proposer une autre date si celle-ci ne vous convient pas.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'travaux-bailleur',
    title: 'Notification de travaux',
    category: 'Travaux',
    description: 'Information du locataire sur des travaux à venir',
    icon: Wrench,
    color: BAI.caramel,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Information — Travaux dans votre logement / dans l'immeuble

Madame, Monsieur,

Je vous informe que des travaux [DE RÉNOVATION / D'ENTRETIEN / D'AMÉLIORATION / NÉCESSAIRES À LA CONSERVATION DU LOGEMENT] vont être réalisés dans votre logement / dans les parties communes de l'immeuble.

Nature des travaux : [DESCRIPTION DES TRAVAUX]

Ces travaux débuteront le [DATE DE DÉBUT] et se termineront le [DATE DE FIN ESTIMÉE], soit une durée de [DURÉE] jours ouvrés.

Les intervenants seront présents aux horaires suivants : [HORAIRES, ex: du lundi au vendredi, de 8h à 17h].

Conformément à l'article 7 de la loi du 6 juillet 1989, vous êtes tenu(e) de laisser accès à votre logement pour la réalisation de ces travaux.

[SI DURÉE > 21 JOURS :] Ces travaux étant d'une durée supérieure à 21 jours, vous pourrez, conformément à l'article 1724 du Code civil, demander une réduction de loyer proportionnelle à la durée et à la nature des travaux.

Je reste à votre disposition pour toute question.

Cordialement,

[Votre Prénom Nom]
[Téléphone]`,
  },
  {
    id: 'quittance-manuelle',
    title: 'Reçu de paiement de loyer',
    category: 'Loyer',
    description: 'Quittance simple à compléter manuellement',
    icon: FileCheck,
    color: '#1b5e3b',
    content: `QUITTANCE DE LOYER

Je soussigné(e), [Prénom Nom du propriétaire], demeurant au [Adresse du propriétaire],

déclare avoir reçu de [Prénom Nom du locataire],

la somme de [MONTANT EN LETTRES] euros ([MONTANT EN CHIFFRES] €)

pour le paiement du loyer et des charges du logement situé au :
[ADRESSE COMPLÈTE DU BIEN LOUÉ]

Pour la période du 1er au [DERNIER JOUR] [MOIS] [ANNÉE]

Détail :
• Loyer hors charges : [MONTANT LOYER] €
• Charges : [MONTANT CHARGES] €
• TOTAL : [MONTANT TOTAL] €

Fait à [Ville], le [DATE]

Signature du bailleur :

_______________________
[Prénom Nom du propriétaire]

---
Cette quittance ne vaut pas reçu définitif en cas de paiement par chèque.`,
  },
  {
    id: 'demande-document',
    title: 'Demande de documents au locataire',
    category: 'Dossier',
    description: 'Réclamation de pièces justificatives manquantes',
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du candidat/locataire]
[Adresse]

Objet : Demande de documents complémentaires

Madame, Monsieur,

Suite à votre candidature / dans le cadre de la constitution de votre dossier locataire pour le logement situé au [ADRESSE DU BIEN], je souhaite vous demander les documents suivants qui n'ont pas encore été transmis :

☐ Pièce d'identité en cours de validité (recto/verso)
☐ 3 derniers bulletins de salaire
☐ Dernier avis d'imposition
☐ Justificatif de domicile actuel (moins de 3 mois)
☐ Contrat de travail (CDI / CDD / autre)
☐ Attestation employeur
☐ [AUTRE DOCUMENT]

Merci de bien vouloir me transmettre ces pièces dans un délai de [DÉLAI] jours par email à [VOTRE EMAIL] ou en les déposant directement sur la plateforme Bailio.

Sans retour de votre part dans ce délai, je me verrai dans l'obligation d'étudier d'autres candidatures.

Restant disponible pour tout renseignement complémentaire,

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
]

const CATEGORIES = ['Tous', ...Array.from(new Set(LETTERS.map(l => l.category)))]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateFr(d: Date = new Date()): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fillTemplate(
  content: string,
  contract: Contract | null,
  ownerName: string,
): string {
  if (!contract) return content

  const tenant = contract.tenant
  const property = contract.property
  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : null
  const tenantAddress = property
    ? `${property.address}, ${property.postalCode} ${property.city}`
    : null
  const propertyAddress = property
    ? `${property.address}, ${property.postalCode} ${property.city}`
    : null
  const city = property?.city ?? null
  const today = formatDateFr()
  const totalRent =
    (contract.monthlyRent ?? 0) + (contract.charges ?? 0)
  const rentStr = totalRent > 0 ? `${totalRent} €` : null

  const replacements: Array<[RegExp, string | null]> = [
    [/\[Prénom Nom du locataire\]/g, tenantName],
    [/\[Prénom Nom du candidat\/locataire\]/g, tenantName],
    [/\[Adresse du locataire\]/g, tenantAddress],
    [/\[Adresse du logement loué\]/g, propertyAddress],
    [/\[Adresse du logement\]/g, propertyAddress],
    [/\[Adresse du bien\]/g, propertyAddress],
    [/\[ADRESSE DU BIEN\]/g, propertyAddress],
    [/\[ADRESSE COMPLÈTE DU BIEN\]/g, propertyAddress],
    [/\[ADRESSE COMPLÈTE DU BIEN LOUÉ\]/g, propertyAddress],
    [/\[MONTANT\]/g, rentStr],
    [/\[DATE\]/g, today],
    [/\[Ville\]/g, city],
    [/\[Votre Prénom Nom\]/g, ownerName || null],
    [/\[Prénom Nom du propriétaire\]/g, ownerName || null],
  ]

  let result = content
  for (const [pattern, value] of replacements) {
    if (value) result = result.replace(pattern, value)
  }
  return result
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth()

  // Contracts fetch
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [selectedContractId, setSelectedContractId] = useState<string>('')

  // UI state
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      setLoadingContracts(true)
      try {
        const res = await apiClient.get('/contracts?status=ACTIVE')
        const data = res.data.data as Contract[]
        setContracts(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Impossible de charger les contrats actifs')
        setContracts([])
      } finally {
        setLoadingContracts(false)
      }
    }
    fetchContracts()
  }, [])

  const selectedContract = contracts.find(c => c.id === selectedContractId) ?? null
  const ownerName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : ''

  const filtered =
    activeCategory === 'Tous' ? LETTERS : LETTERS.filter(l => l.category === activeCategory)

  // ── Actions ────────────────────────────────────────────────────────────────
  const getFilledContent = (letter: LetterTemplate) =>
    fillTemplate(letter.content, selectedContract, ownerName)

  const handleCopy = (letter: LetterTemplate) => {
    navigator.clipboard.writeText(getFilledContent(letter))
    setCopied(letter.id)
    toast.success('Texte copié dans le presse-papiers')
    setTimeout(() => setCopied(null), 2500)
  }

  const handleDownloadPDF = async (letter: LetterTemplate) => {
    setDownloadingId(letter.id)
    try {
      const filledContent = getFilledContent(letter)
      const blob = await pdf(
        <LetterPDF content={filledContent} title={letter.title} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${letter.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch {
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleSendEmail = async (letter: LetterTemplate) => {
    if (!selectedContract || !selectedContract.tenant) {
      toast.error('Sélectionnez d\'abord un locataire')
      return
    }
    const tenant = selectedContract.tenant
    const tenantDisplayName = `${tenant.firstName} ${tenant.lastName}`
    setSendingId(letter.id)
    try {
      const filledContent = getFilledContent(letter)
      await apiClient.post('/documents/send-letter', {
        to: tenant.email,
        subject: letter.title,
        content: filledContent,
        tenantName: tenantDisplayName,
      })
      toast.success(`Email envoyé à ${tenantDisplayName}`)
    } catch {
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setSendingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 4px',
            }}>
              Administration
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 700, fontStyle: 'italic', color: BAI.ink,
              margin: '0 0 4px', lineHeight: 1.15,
            }}>
              Documents & Courriers
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Lettres type prêtes à l'emploi — sélectionnez un locataire pour pré-remplir automatiquement
            </p>
          </div>

          {/* Tenant selector */}
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: 12, padding: '20px 24px', marginBottom: 28,
            boxShadow: BAI.shadowMd,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: BAI.ownerLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ color: BAI.owner, width: 16, height: 16 }} />
              </div>
              <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>
                Locataire cible
              </span>
              {selectedContract && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 20,
                  background: BAI.tenantLight, color: BAI.tenant,
                  border: `1px solid ${BAI.tenantBorder}`,
                }}>
                  Pré-remplissage actif
                </span>
              )}
            </div>

            {loadingContracts ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                <Loader2
                  style={{ color: BAI.inkFaint, width: 16, height: 16, animation: 'spin 1s linear infinite' }}
                />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>
                  Chargement des contrats…
                </span>
              </div>
            ) : contracts.length === 0 ? (
              <div style={{
                padding: '14px 16px', borderRadius: 8,
                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0 }}>
                  Aucun locataire actif. Créez d'abord un contrat et activez-le pour utiliser le pré-remplissage.
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedContractId}
                  onChange={e => setSelectedContractId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px',
                    borderRadius: 8, border: `1px solid ${BAI.border}`,
                    background: BAI.bgInput, color: selectedContractId ? BAI.ink : BAI.inkFaint,
                    fontFamily: BAI.fontBody, fontSize: 14,
                    appearance: 'none', cursor: 'pointer',
                    minHeight: 44, outline: 'none',
                  }}
                >
                  <option value="" style={{ color: BAI.inkFaint }}>
                    Choisir un locataire...
                  </option>
                  {contracts.map(c => {
                    const t = c.tenant
                    const p = c.property
                    const label = t
                      ? `${t.firstName} ${t.lastName}${p ? ` — ${p.address}` : ''}`
                      : c.id
                    return (
                      <option key={c.id} value={c.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: BAI.inkFaint, width: 16, height: 16, pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {selectedContract && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                display: 'flex', gap: 16, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Locataire', value: selectedContract.tenant ? `${selectedContract.tenant.firstName} ${selectedContract.tenant.lastName}` : '—' },
                  { label: 'Bien', value: selectedContract.property ? `${selectedContract.property.address}, ${selectedContract.property.city}` : '—' },
                  { label: 'Loyer CC', value: `${(selectedContract.monthlyRent ?? 0) + (selectedContract.charges ?? 0)} €` },
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.tenant, fontWeight: 600, display: 'block' }}>
                      {item.label}
                    </span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 20, minHeight: 36,
                  border: activeCategory === cat
                    ? `1.5px solid ${BAI.night}`
                    : `1.5px solid ${BAI.border}`,
                  background: activeCategory === cat ? BAI.night : BAI.bgSurface,
                  color: activeCategory === cat ? '#ffffff' : BAI.inkMid,
                  fontFamily: BAI.fontBody, fontSize: 13,
                  fontWeight: activeCategory === cat ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Letters list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(letter => {
              const Icon = letter.icon
              const isExpanded = expanded === letter.id
              const isDownloading = downloadingId === letter.id
              const isSending = sendingId === letter.id
              const filledContent = getFilledContent(letter)

              return (
                <div
                  key={letter.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : letter.id)}
                    style={{
                      padding: 'clamp(14px, 2vw, 18px) 20px',
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${letter.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ color: letter.color, width: 18, height: 18 }} />
                    </div>

                    {/* Title + description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink,
                        }}>
                          {letter.title}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: `${letter.color}12`, color: letter.color,
                          whiteSpace: 'nowrap',
                        }}>
                          {letter.category}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '2px 0 0',
                      }}>
                        {letter.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(letter)}
                        title="Copier le texte"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500,
                          color: copied === letter.id ? BAI.tenant : BAI.inkMid,
                          cursor: 'pointer',
                        }}
                      >
                        {copied === letter.id
                          ? <Check style={{ color: BAI.tenant, width: 14, height: 14 }} />
                          : <Copy style={{ width: 14, height: 14 }} />
                        }
                        Copier
                      </button>

                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownloadPDF(letter)}
                        disabled={isDownloading}
                        title="Télécharger en PDF"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`,
                          background: BAI.night, color: '#ffffff',
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                          opacity: isDownloading ? 0.7 : 1,
                        }}
                      >
                        {isDownloading
                          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          : <Download style={{ width: 14, height: 14 }} />
                        }
                        PDF
                      </button>

                      {/* Send email */}
                      <button
                        onClick={() => handleSendEmail(letter)}
                        disabled={isSending}
                        title={selectedContract ? 'Envoyer par email au locataire' : 'Sélectionnez un locataire'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${selectedContract ? BAI.ownerBorder : BAI.border}`,
                          background: selectedContract ? BAI.ownerLight : BAI.bgMuted,
                          color: selectedContract ? BAI.owner : BAI.inkFaint,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                          cursor: isSending ? 'not-allowed' : 'pointer',
                          opacity: isSending ? 0.7 : 1,
                        }}
                      >
                        {isSending
                          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          : <Send style={{ width: 14, height: 14 }} />
                        }
                        Email
                      </button>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : letter.id)}
                        title={isExpanded ? 'Réduire' : 'Voir le contenu'}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 36, height: 36, borderRadius: 8,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          color: BAI.inkMid, cursor: 'pointer',
                        }}
                      >
                        {isExpanded
                          ? <ChevronUp style={{ width: 16, height: 16 }} />
                          : <ChevronDown style={{ width: 16, height: 16 }} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${BAI.border}`, padding: '0 20px 20px' }}>
                      <pre style={{
                        fontFamily: BAI.fontBody, fontSize: 13,
                        color: BAI.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                        background: BAI.bgMuted, borderRadius: 8,
                        padding: '16px 20px', marginTop: 16,
                        border: `1px solid ${BAI.border}`,
                        maxHeight: 420, overflowY: 'auto',
                      }}>
                        {filledContent}
                      </pre>
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 11,
                        color: selectedContract ? BAI.tenant : BAI.inkFaint,
                        marginTop: 8,
                      }}>
                        {selectedContract
                          ? 'Les champs reconnus ont été pré-remplis automatiquement. Complétez les champs entre [crochets] restants avant d\'envoyer.'
                          : 'Sélectionnez un locataire en haut pour pré-remplir automatiquement les champs entre [crochets].'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
