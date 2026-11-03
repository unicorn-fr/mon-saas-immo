/**
 * Publication sur le compte TikTok de Bailio (page « Publier sur TikTok » du pilotage), selon les règles de TikTok
 * pour la Content Posting API (« Content Sharing Guidelines ») : compte affiché, visibilité choisie à chaque fois
 * (aucune valeur par défaut), commentaires, duos et collages désactivés par défaut et grisés si le compte les refuse,
 * contenu commercial déclaré (« Votre marque » ou « Contenu de marque », jamais privé), durée maximale respectée.
 */

export const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'] as const

export type PrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

/** Ce que TikTok renvoie sur le compte avant une publication (creator_info). */
export interface CreatorInfo {
  nickname: string
  username: string
  avatarUrl: string | null
  privacyOptions: PrivacyLevel[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxDurationSec: number
}

export interface PostChoice {
  title: string
  privacy: PrivacyLevel | null
  allowComment: boolean
  allowDuet: boolean
  allowStitch: boolean
  /** « Déclarer un contenu commercial » activé. */
  commercial: boolean
  /** Promotion de sa propre marque (« Contenu promotionnel »). */
  yourBrand: boolean
  /** Partenariat rémunéré (« Partenariat rémunéré »). */
  brandedContent: boolean
  durationSec: number | null
}

export const TITLE_MAX = 2200
/** Envoi en un seul morceau : TikTok l'accepte jusqu'à 64 Mo. */
export const VIDEO_MAX_BYTES = 64 * 1024 * 1024

/** Raison pour laquelle la publication ne peut pas partir, ou null. Mêmes règles sur la page et sur le serveur. */
export function postProblem(c: PostChoice, creator: CreatorInfo): string | null {
  if (c.title.length > TITLE_MAX) return `La description est trop longue (${TITLE_MAX} caractères au plus).`
  if (!c.privacy) return 'Choisissez qui peut voir la vidéo.'
  if (!creator.privacyOptions.includes(c.privacy)) return 'Cette visibilité n’est pas proposée pour ce compte.'
  if (c.commercial && !c.yourBrand && !c.brandedContent) return 'Indiquez s’il s’agit de votre marque, d’un contenu de marque, ou des deux.'
  if (c.commercial && c.brandedContent && c.privacy === 'SELF_ONLY') return 'Un contenu de marque ne peut pas être privé.'
  if (c.durationSec !== null && c.durationSec > creator.maxDurationSec) return `La vidéo dure trop longtemps pour ce compte (${creator.maxDurationSec} secondes au plus).`
  return null
}

/** Corps de l'appel « video/init » (envoi du fichier en un morceau). */
export function initBody(c: PostChoice, creator: CreatorInfo, videoSize: number) {
  return {
    post_info: {
      title: c.title,
      privacy_level: c.privacy,
      disable_comment: creator.commentDisabled || !c.allowComment,
      disable_duet: creator.duetDisabled || !c.allowDuet,
      disable_stitch: creator.stitchDisabled || !c.allowStitch,
      brand_organic_toggle: c.commercial && c.yourBrand,
      brand_content_toggle: c.commercial && c.brandedContent,
    },
    source_info: { source: 'FILE_UPLOAD', video_size: videoSize, chunk_size: videoSize, total_chunk_count: 1 },
  }
}

/** Adresse de connexion TikTok (Login Kit). */
export function authorizeUrl(clientKey: string, redirectUri: string, state: string) {
  const q = new URLSearchParams({ client_key: clientKey, scope: TIKTOK_SCOPES.join(','), response_type: 'code', redirect_uri: redirectUri, state })
  return `https://www.tiktok.com/v2/auth/authorize/?${q}`
}

/** Lecture de creator_info, sans se fier à la forme exacte de la réponse. */
export function readCreatorInfo(d: Record<string, unknown>): CreatorInfo {
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    nickname: str(d.creator_nickname),
    username: str(d.creator_username),
    avatarUrl: str(d.creator_avatar_url) || null,
    privacyOptions: (Array.isArray(d.privacy_level_options) ? d.privacy_level_options : []).filter((p): p is PrivacyLevel => ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'].includes(p as string)),
    commentDisabled: d.comment_disabled === true,
    duetDisabled: d.duet_disabled === true,
    stitchDisabled: d.stitch_disabled === true,
    maxDurationSec: typeof d.max_video_post_duration_sec === 'number' ? d.max_video_post_duration_sec : 60,
  }
}
