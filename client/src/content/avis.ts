/**
 * Avis de propriétaires montrés sur l'accueil (bloc « Ils louent avec Bailio »). Uniquement de vrais avis, recopiés
 * mot pour mot, avec l'accord écrit de leur auteur pour être publiés avec ce nom (questionnaire des testeurs, message,
 * email : garder la preuve). Jamais d'avis inventé, retouché ou acheté (code de la consommation, art. L121-4, 21° et
 * L111-7-2). Tant que la liste est vide, le bloc n'apparaît pas.
 */
export interface Avis {
  /** Prénom et initiale, ou nom public (compte Instagram…) si l'auteur l'a choisi. */
  name: string
  /** Ce qu'il loue, en quelques mots : « 2 appartements à Montpellier ». */
  role: string
  text: string
  /** Mois de l'avis, AAAA-MM. */
  date: string
  /** Lien public de l'auteur, s'il le souhaite (compte Instagram…). */
  url?: string
}

export const AVIS: Avis[] = []
