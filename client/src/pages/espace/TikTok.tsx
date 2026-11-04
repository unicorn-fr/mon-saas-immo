import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Callout, Card, Check, Crumbs, errorMessage, LoadError, Loader, PageHead, Select, TextArea, Toggle, useLoad } from '../../components/kit'
import { api, pdfUrl } from '../../lib/api'
import { useAuth } from '../../lib/auth'

type Privacy = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'
interface Creator { nickname: string; username: string; avatarUrl: string | null; privacyOptions: Privacy[]; commentDisabled: boolean; duetDisabled: boolean; stitchDisabled: boolean; maxDurationSec: number }
interface Status { configured: boolean; connected: boolean; creator: Creator | null; redirectUri: string }

const PRIVACY_LABEL: Record<Privacy, string> = {
  PUBLIC_TO_EVERYONE: 'Tout le monde',
  MUTUAL_FOLLOW_FRIENDS: 'Amis (abonnements mutuels)',
  FOLLOWER_OF_CREATOR: 'Abonnés',
  SELF_ONLY: 'Moi uniquement',
}
const STATUS_LABEL: Record<string, string> = {
  PROCESSING_UPLOAD: 'TikTok reçoit la vidéo…',
  PROCESSING_DOWNLOAD: 'TikTok reçoit la vidéo…',
  SEND_TO_USER_INBOX: 'Vidéo envoyée dans vos brouillons TikTok.',
  PUBLISH_COMPLETE: 'Vidéo publiée sur TikTok.',
  FAILED: 'TikTok n’a pas pu publier la vidéo.',
}
const MUSIC = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'
const BRANDED = 'https://www.tiktok.com/legal/page/global/bc-policy/en'
const note = { fontSize: 14, color: BAI.inkMid, lineHeight: 1.5, margin: 0 } as const
const link = { color: BAI.owner, fontWeight: 600 } as const

/**
 * Publier sur TikTok (réservé au pilotage) : les vidéos de Bailio sur le compte TikTok de Bailio, selon les règles
 * de TikTok pour la publication directe (compte affiché, visibilité choisie à chaque fois, réglages désactivés par
 * défaut, contenu commercial déclaré, mention de la musique avant le bouton).
 */
export default function TikTok() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const code = params.get('code')
  const state = params.get('state')
  const { data, error, loading, reload } = useLoad(async () => {
    // Retour de TikTok après la connexion : on termine, puis on enlève le code de l'adresse.
    if (code && state) {
      try {
        await api('/admin/tiktok/callback', { method: 'POST', body: { code, state } })
      } catch (err) {
        setCallbackError(errorMessage(err))
      }
      navigate('/espace/pilotage/tiktok', { replace: true })
    } else if (params.get('error')) setCallbackError('La connexion à TikTok a été annulée.')
    return api<Status>('/admin/tiktok')
  }, [], { cache: false })
  if (user && !user.admin) return <Navigate to="/espace" replace />

  const connect = async () => {
    setConnecting(true)
    try {
      const { url } = await api<{ url: string }>('/admin/tiktok/connect', { method: 'POST' })
      window.location.assign(url)
    } catch (err) {
      setCallbackError(errorMessage(err))
      setConnecting(false)
    }
  }
  const disconnect = async () => {
    await api('/admin/tiktok', { method: 'DELETE' })
    reload()
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Pilotage', to: '/espace/pilotage' }, { label: 'Publier sur TikTok' }]} />
      <PageHead title="Publier sur TikTok" sub="Les vidéos de Bailio, publiées sur le compte TikTok de Bailio." />
      {callbackError ? <Callout tone="warn">{callbackError}</Callout> : null}
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.configured ? (
        <Callout tone="info" title="Clés TikTok à renseigner sur le serveur">
          Ajoutez TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET dans le fichier .env du serveur, puis redémarrez l’API. Dans l’app TikTok for Developers, l’adresse de retour (Redirect URI) est : {data.redirectUri}
        </Callout>
      ) : !data.connected || !data.creator ? (
        <Card title="Compte TikTok">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <p style={note}>Connectez le compte TikTok de Bailio. TikTok vous demande de vous connecter et d’autoriser Bailio à lire le nom du compte et à publier des vidéos. Vous pouvez le déconnecter à tout moment.</p>
            <Btn onClick={connect} loading={connecting}>Connecter TikTok</Btn>
          </div>
        </Card>
      ) : (
        <PostForm creator={data.creator} onDisconnect={disconnect} />
      )}
    </AppShell>
  )
}

function AccountCard({ creator, onDisconnect }: { creator: Creator; onDisconnect: () => void }) {
  const [avatar, setAvatar] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    if (creator.avatarUrl) pdfUrl('/admin/tiktok/avatar').then((u) => { url = u; setAvatar(u) }).catch(() => undefined)
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [creator.avatarUrl])
  return (
    <Card title="Publié sur le compte">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {avatar ? <img src={avatar} alt="" width={56} height={56} style={{ borderRadius: 28 }} /> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{creator.nickname || 'Compte TikTok'}</span>
          {creator.username ? <span style={{ fontSize: 14, color: BAI.inkMid }}>@{creator.username}</span> : null}
        </div>
        <Btn variant="ghost" size="sm" onClick={onDisconnect}>Déconnecter</Btn>
      </div>
    </Card>
  )
}

function PostForm({ creator, onDisconnect }: { creator: Creator; onDisconnect: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [privacy, setPrivacy] = useState<Privacy | null>(null)
  const [allowComment, setAllowComment] = useState(false)
  const [allowDuet, setAllowDuet] = useState(false)
  const [allowStitch, setAllowStitch] = useState(false)
  const [commercial, setCommercial] = useState(false)
  const [yourBrand, setYourBrand] = useState(false)
  const [brandedContent, setBrandedContent] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [publishId, setPublishId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])
  // Un contenu de marque ne peut pas être privé : « Moi uniquement » disparaît et la visibilité se rechoisit.
  useEffect(() => { if (commercial && brandedContent && privacy === 'SELF_ONLY') setPrivacy(null) }, [commercial, brandedContent, privacy])

  const pick = (f: File | null) => {
    setFile(f)
    setDuration(null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }
  const tooLong = duration !== null && duration > creator.maxDurationSec
  const missing = !file ? 'Choisissez une vidéo.' : tooLong ? `La vidéo dure trop longtemps pour ce compte (${creator.maxDurationSec} secondes au plus).` : !privacy ? 'Choisissez qui peut voir la vidéo.' : commercial && !yourBrand && !brandedContent ? 'Indiquez s’il s’agit de votre marque, d’un contenu de marque, ou des deux.' : null
  const options = creator.privacyOptions.filter((p) => !(commercial && brandedContent && p === 'SELF_ONLY')).map((p) => ({ value: p, label: PRIVACY_LABEL[p] }))

  const post = async () => {
    if (missing || !file) return setMessage(missing)
    setSending(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('video', file)
      Object.entries({ title, privacy: privacy ?? '', allowComment, allowDuet, allowStitch, commercial, yourBrand, brandedContent, durationSec: duration === null ? '' : Math.ceil(duration) }).forEach(([k, v]) => form.append(k, String(v)))
      const { publishId: id } = await api<{ publishId: string }>('/admin/tiktok/post', { method: 'POST', form, timeout: 300_000 })
      setPublishId(id)
      setStatus('PROCESSING_UPLOAD')
      let tries = 0
      timer.current = window.setInterval(async () => {
        tries += 1
        try {
          const s = await api<{ status?: string; fail_reason?: string }>(`/admin/tiktok/post/${encodeURIComponent(id)}`)
          if (s.status) setStatus(s.status)
          if (s.status === 'FAILED' && s.fail_reason) setMessage(`Motif donné par TikTok : ${s.fail_reason}`)
          if (s.status === 'PUBLISH_COMPLETE' || s.status === 'FAILED' || tries >= 36) window.clearInterval(timer.current!)
        } catch {
          if (tries >= 36) window.clearInterval(timer.current!)
        }
      }, 5000)
    } catch (err) {
      setMessage(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <AccountCard creator={creator} onDisconnect={onDisconnect} />
      <Card title="La vidéo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 600 }}>
            Fichier vidéo (MP4, MOV ou WebM, 64 Mo au plus)
            <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => pick(e.target.files?.[0] ?? null)} disabled={sending || Boolean(publishId)} />
          </label>
          {preview ? (
            <video src={preview} controls playsInline aria-label="Aperçu de la vidéo" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} style={{ width: '100%', maxWidth: 320, maxHeight: 560, borderRadius: 14, background: BAI.night }} />
          ) : null}
          {tooLong ? <Callout tone="warn">La vidéo dure {Math.ceil(duration!)} secondes : ce compte accepte {creator.maxDurationSec} secondes au plus.</Callout> : null}
          <TextArea label="Description" hint={`${title.length} / 2 200 caractères`} value={title} onChange={setTitle} rows={4} maxLength={2200} />
        </div>
      </Card>
      <Card title="Réglages de la publication">
        <Select<Privacy> label="Qui peut voir cette vidéo ?" hint={commercial && brandedContent ? 'Un contenu de marque ne peut pas être privé.' : 'À choisir à chaque publication.'} value={privacy} onChange={(v) => setPrivacy(v || null)} options={options} placeholder="Choisir" />
        <div style={{ marginTop: 12 }}>
          <Toggle label="Autoriser les commentaires" sub={creator.commentDisabled ? 'Désactivé dans les réglages de ce compte TikTok.' : undefined} checked={allowComment && !creator.commentDisabled} onChange={setAllowComment} disabled={creator.commentDisabled} />
          <Toggle label="Autoriser les duos (Duet)" sub={creator.duetDisabled ? 'Désactivé dans les réglages de ce compte TikTok.' : undefined} checked={allowDuet && !creator.duetDisabled} onChange={setAllowDuet} disabled={creator.duetDisabled} />
          <Toggle label="Autoriser les collages (Stitch)" sub={creator.stitchDisabled ? 'Désactivé dans les réglages de ce compte TikTok.' : undefined} checked={allowStitch && !creator.stitchDisabled} onChange={setAllowStitch} disabled={creator.stitchDisabled} />
          <Toggle label="Déclarer un contenu commercial" sub="La vidéo fait la promotion de vous-même, d’une marque, d’un produit ou d’un service." checked={commercial} onChange={(v) => { setCommercial(v); if (!v) { setYourBrand(false); setBrandedContent(false) } }} />
          {commercial ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 16px' }}>
              <Check label="Votre marque (Your brand)" sub="Vous faites la promotion de vous-même ou de votre entreprise. La vidéo sera marquée « Contenu promotionnel »." checked={yourBrand} onChange={setYourBrand} />
              <Check label="Contenu de marque (Branded content)" sub="Vous faites la promotion d’une autre marque ou d’un tiers. La vidéo sera marquée « Partenariat rémunéré »." checked={brandedContent} onChange={setBrandedContent} />
            </div>
          ) : null}
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
        <p style={note}>
          En publiant, vous acceptez la <a href={MUSIC} target="_blank" rel="noreferrer" style={link}>confirmation d’utilisation de la musique de TikTok</a>
          {commercial && brandedContent ? <> et la <a href={BRANDED} target="_blank" rel="noreferrer" style={link}>politique de TikTok sur le contenu de marque</a></> : null}.
        </p>
        {message ? <Callout tone="warn">{message}</Callout> : null}
        {publishId ? (
          <Callout tone={status === 'FAILED' ? 'warn' : 'ok'} title={STATUS_LABEL[status ?? ''] ?? 'Vidéo envoyée à TikTok.'}>
            La vidéo peut mettre quelques minutes à apparaître sur le profil TikTok.
          </Callout>
        ) : (
          <Btn onClick={post} loading={sending} disabled={Boolean(missing)}>Publier sur TikTok</Btn>
        )}
        {!publishId && missing ? <p style={note}>{missing}</p> : null}
      </div>
    </div>
  )
}
