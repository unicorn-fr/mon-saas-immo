import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { FileText, Download, Copy, Check, AlertTriangle, TrendingUp, UserX, Wrench, Key, FileCheck } from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function Documents() {
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = activeCategory === 'Tous' ? LETTERS : LETTERS.filter(l => l.category === activeCategory)

  const handleCopy = (letter: LetterTemplate) => {
    navigator.clipboard.writeText(letter.content)
    setCopied(letter.id)
    toast.success('Texte copié dans le presse-papiers')
    setTimeout(() => setCopied(null), 2500)
  }

  const handleDownload = (letter: LetterTemplate) => {
    const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${letter.id}-bailio.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Lettre téléchargée')
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
              Administration
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px', lineHeight: 1.15 }}>
              Documents & Courriers
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Lettres type prêtes à l'emploi — copiez et personnalisez les champs entre crochets
            </p>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: activeCategory === cat ? `1.5px solid ${BAI.night}` : `1.5px solid ${BAI.border}`,
                  background: activeCategory === cat ? BAI.night : BAI.bgSurface,
                  color: activeCategory === cat ? '#fff' : BAI.inkMid,
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
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
              return (
                <div key={letter.id} style={{
                  background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                }}>
                  {/* Card header */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : letter.id)}
                    style={{
                      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${letter.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon className="w-5 h-5" style={{ color: letter.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink }}>
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
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '2px 0 0' }}>
                        {letter.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(letter) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500, color: BAI.inkMid,
                          cursor: 'pointer',
                        }}
                      >
                        {copied === letter.id
                          ? <Check className="w-3.5 h-3.5" style={{ color: '#1b5e3b' }} />
                          : <Copy className="w-3.5 h-3.5" />}
                        Copier
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDownload(letter) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`, background: BAI.night, color: '#fff',
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        .txt
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${BAI.border}`, padding: '0 20px 20px' }}>
                      <pre style={{
                        fontFamily: BAI.fontBody, fontSize: 13,
                        color: BAI.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                        background: BAI.bgMuted, borderRadius: 8,
                        padding: '16px 20px', marginTop: 16,
                        border: `1px solid ${BAI.border}`,
                        maxHeight: 400, overflowY: 'auto',
                      }}>
                        {letter.content}
                      </pre>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, marginTop: 8 }}>
                        Remplacez tous les champs entre [crochets] par les informations réelles avant d'envoyer.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
