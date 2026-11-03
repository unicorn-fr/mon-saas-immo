import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authorizeUrl, initBody, postProblem, readCreatorInfo, type CreatorInfo, type PostChoice } from './tiktok.js'

const creator: CreatorInfo = { nickname: 'Bailio', username: 'bailio', avatarUrl: null, privacyOptions: ['PUBLIC_TO_EVERYONE', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'], commentDisabled: false, duetDisabled: true, stitchDisabled: false, maxDurationSec: 600 }
const base: PostChoice = { title: 'Révision du loyer', privacy: 'PUBLIC_TO_EVERYONE', allowComment: true, allowDuet: true, allowStitch: false, commercial: false, yourBrand: false, brandedContent: false, durationSec: 30 }

test('la visibilité se choisit à chaque fois, parmi celles du compte', () => {
  assert.equal(postProblem(base, creator), null)
  assert.match(postProblem({ ...base, privacy: null }, creator)!, /Choisissez/)
  assert.match(postProblem({ ...base, privacy: 'MUTUAL_FOLLOW_FRIENDS' }, creator)!, /pas proposée/)
})

test('contenu commercial : un choix au moins, jamais privé pour un contenu de marque', () => {
  assert.match(postProblem({ ...base, commercial: true }, creator)!, /votre marque/)
  assert.equal(postProblem({ ...base, commercial: true, yourBrand: true, privacy: 'SELF_ONLY' }, creator), null)
  assert.match(postProblem({ ...base, commercial: true, brandedContent: true, privacy: 'SELF_ONLY' }, creator)!, /privé/)
})

test('durée et longueur de la description', () => {
  assert.match(postProblem({ ...base, durationSec: 601 }, creator)!, /trop longtemps/)
  assert.match(postProblem({ ...base, title: 'x'.repeat(2201) }, creator)!, /trop longue/)
})

test('réglages refusés par le compte toujours désactivés, envoi en un morceau', () => {
  const b = initBody(base, creator, 4_700_000)
  assert.equal(b.post_info.disable_duet, true)
  assert.equal(b.post_info.disable_comment, false)
  assert.equal(b.post_info.disable_stitch, true)
  assert.equal(b.post_info.brand_content_toggle, false)
  assert.deepEqual(b.source_info, { source: 'FILE_UPLOAD', video_size: 4_700_000, chunk_size: 4_700_000, total_chunk_count: 1 })
})

test('connexion et lecture du compte', () => {
  const u = new URL(authorizeUrl('cle', 'https://bailio.fr/espace/pilotage/tiktok', 'etat'))
  assert.equal(u.searchParams.get('scope'), 'user.info.basic,video.publish')
  assert.equal(u.searchParams.get('redirect_uri'), 'https://bailio.fr/espace/pilotage/tiktok')
  const c = readCreatorInfo({ creator_nickname: 'Bailio', privacy_level_options: ['SELF_ONLY', 'AUTRE'], duet_disabled: true, max_video_post_duration_sec: 300 })
  assert.deepEqual(c.privacyOptions, ['SELF_ONLY'])
  assert.equal(c.duetDisabled, true)
  assert.equal(c.maxDurationSec, 300)
})
