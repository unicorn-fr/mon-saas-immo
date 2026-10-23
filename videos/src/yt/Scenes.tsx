import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import type { Word } from '../captions'
import { KineticText, Letters, clamp, easeInOut, easeOut, useBounce, useCount, useExit, useProgress } from '../fx'
import { IconeMarque, Logo, M, Rue, capitales, sans, serif } from '../marque/Marque'
import { T } from '../theme'

/**
 * Scènes YouTube (16:9, 1920 × 1080), dans l'identité de Bailio : « Bailio. », crème, encre, caramel.
 * Inspiration « explication finance » : chapitres, chiffres qui défilent, comparatifs ligne par ligne,
 * graphiques qui se dessinent, calendrier, application dans un téléphone. Contenu dans les 900 px du haut,
 * les sous-titres occupent le bas.
 */

type Base = { voix: string; sousTitre?: string; sombre?: boolean }
export type SceneYT = Base &
  (
    | { type: 'phrase'; texte: string; accent?: string }
    | { type: 'titre'; numero: string; titre: string; sous?: string }
    | { type: 'chiffre'; kicker: string; valeur: number; suffixe?: string; texte: string; note?: string; groupe?: boolean }
    | { type: 'etapes'; titre: string; etapes: string[]; reperes?: string[] }
    | { type: 'ecran'; titre: string; points: string[]; image: string; cote?: 'gauche' | 'droite'; reperes?: string[] }
    | { type: 'liste'; titre: string; items: Array<{ texte: string; icone: IconeMarque }> }
    | { type: 'match'; colonnes: [string, string]; lignes: Array<[string, string, string]>; reperes?: string[]; titre?: string }
    | { type: 'graphique'; titre: string; barres: Array<{ label: string; valeur: number; accent?: boolean }>; unite: string; reperes?: string[] }
    | { type: 'date'; quand: string; detail?: string; kicker: string; texte: string; icone: IconeMarque }
    | { type: 'calendrier'; titre: string; marques: Array<{ mois: number; label: string }>; reperes?: string[] }
    | { type: 'fin'; texte: string; url: string }
  )

// Bruitages discrets : moitié du volume demandé, la voix reste devant.
const sfx = (name: string, volume = 0.2) => <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * 0.5} />
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

/** Instants (images de la scène) où la voix prononce chaque repère ; sinon répartis sur la scène. */
function useCues(n: number, frames: number, reperes: string[] | undefined, words: Word[] | undefined, voiceAt: number, debut = 0.12, fin = 0.75) {
  return Array.from({ length: n }, (_, k) => {
    const r = reperes?.[k]
    const w = r && words?.find((x) => norm(x.w) === norm(r))
    return w ? voiceAt + Math.round(w.start * 30) : Math.round(frames * (debut + ((fin - debut) * k) / Math.max(1, n)))
  })
}

/** Fond : crème avec façades très pâles, ou encre avec un halo caramel. Léger travelling continu. */
function Fond({ sombre, frames, children, rue = true }: { sombre?: boolean; frames: number; children: ReactNode; rue?: boolean }) {
  const frame = useCurrentFrame()
  const z = interpolate(frame, [0, frames], [1, 1.035], { ...clamp, easing: easeInOut })
  return (
    <AbsoluteFill style={{ background: sombre ? M.encre : M.creme, overflow: 'hidden' }}>
      {sombre ? (
        <div style={{ position: 'absolute', width: 1400, height: 1400, left: 900, top: -500, borderRadius: '50%', background: `radial-gradient(circle, ${M.caramel} 0%, transparent 62%)`, opacity: 0.18 }} />
      ) : rue ? (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.8, transform: `translateX(${-frame * 0.25}px)` }}>
          <Rue width={2400} height={300} seed="yt" />
        </div>
      ) : null}
      <AbsoluteFill style={{ transform: `scale(${z})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  )
}

const encre = (sombre?: boolean) => (sombre ? M.blanc : M.encre)
const doux = (sombre?: boolean) => (sombre ? '#c9c4d4' : M.gris)

/** Sortie : tout le contenu monte et s'efface avant la transition. */
const Sortie = ({ frames, children, style }: { frames: number; children: ReactNode; style?: CSSProperties }) => {
  const exit = useExit(frames, T)
  return <AbsoluteFill style={{ transform: `translateY(${-exit * 60}px)`, opacity: 1 - exit, filter: `blur(${exit * 8}px)`, ...style }}>{children}</AbsoluteFill>
}

/** Mot souligné d'un trait caramel qui se trace. */
const Souligne = ({ children, delay }: { children: ReactNode; delay: number }) => {
  const p = useProgress(delay, 16)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: '0.02em', height: '0.08em', background: M.caramel, transform: `scaleX(${p})`, transformOrigin: 'left', borderRadius: 8 }} />
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------

function Phrase({ s, frames }: { s: Extract<SceneYT, { type: 'phrase' }>; frames: number }) {
  const words = s.texte.split(' ').length
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ alignItems: 'center', justifyContent: 'center', padding: '0 220px', marginTop: -60 }}>
        <KineticText text={s.texte} stagger={3} style={{ ...serif(118, encre(s.sombre), 700), textAlign: 'center', lineHeight: 1.08 }} />
        {s.accent ? (
          <div style={{ marginTop: 40, ...serif(118, s.sombre ? M.caramel : M.bleu, 700) }}>
            <Souligne delay={words * 3 + 12}>
              <KineticText text={s.accent} delay={words * 3 + 4} style={{ ...serif(118, s.sombre ? M.caramel : M.bleu, 700) }} />
            </Souligne>
          </div>
        ) : null}
      </Sortie>
    </Fond>
  )
}

function Titre({ s, frames }: { s: Extract<SceneYT, { type: 'titre' }>; frames: number }) {
  const frame = useCurrentFrame()
  const line = useProgress(8, 20)
  return (
    <Fond sombre frames={frames}>
      {/* Grand numéro en filigrane, qui glisse lentement. */}
      <div style={{ position: 'absolute', right: 120, top: 40, ...serif(900, 'rgba(196,151,106,0.07)', 700), lineHeight: 1, transform: `translateX(${interpolate(frame, [0, frames], [80, -40], clamp)}px)` }}>{s.numero}</div>
      <Sortie frames={frames} style={{ justifyContent: 'center', padding: '0 220px', marginTop: -40 }}>
        <Letters text={s.numero} stagger={3} style={{ ...serif(210, M.caramel, 700) }} />
        <div style={{ width: 360 * line, height: 4, background: M.caramel, borderRadius: 4, margin: '10px 0 36px' }} />
        <KineticText text={s.titre} delay={10} style={{ ...serif(120, M.blanc, 700), justifyContent: 'flex-start' }} />
        {s.sous ? <div style={{ ...capitales(26, '#d9c3a9'), marginTop: 34, opacity: useProgress(22, 14) }}>{s.sous}</div> : null}
      </Sortie>
      <Sequence from={2} durationInFrames={20}>{sfx('impact', 0.25)}</Sequence>
    </Fond>
  )
}

function Chiffre({ s, frames }: { s: Extract<SceneYT, { type: 'chiffre' }>; frames: number }) {
  const value = useCount(s.valeur, 6, 34, 0, s.groupe ?? true)
  const kick = useBounce(2, 200, 16)
  const bar = useProgress(14, 24)
  const note = useBounce(Math.floor(frames * 0.45), 200, 16)
  return (
    <Fond sombre={s.sombre} frames={frames} rue={false}>
      <Sortie frames={frames} style={{ flexDirection: 'row', alignItems: 'center', padding: '0 170px', gap: 110, marginTop: -60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, flexShrink: 0 }}>
          <div style={{ transform: `scale(${kick})`, transformOrigin: 'left', background: M.caramel, borderRadius: 999, padding: '12px 32px', ...capitales(26, M.encre) }}>{s.kicker}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ ...sans(300, encre(s.sombre), 700), letterSpacing: -14, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            {s.suffixe ? <span style={{ ...serif(120, M.caramel, 700) }}>{s.suffixe}</span> : null}
          </div>
          <div style={{ width: 520 * bar, height: 8, borderRadius: 4, background: M.caramel }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <KineticText text={s.texte} delay={14} stagger={2} style={{ ...serif(70, encre(s.sombre), 700), justifyContent: 'flex-start', lineHeight: 1.12 }} />
          {s.note ? (
            <div style={{ alignSelf: 'flex-start', transform: `scale(${note})`, transformOrigin: 'left', opacity: Math.min(1, note * 1.5), border: `2px solid ${s.sombre ? 'rgba(255,255,255,0.18)' : M.ligne}`, background: s.sombre ? 'rgba(255,255,255,0.06)' : M.blanc, borderRadius: 18, padding: '16px 28px', ...sans(32, doux(s.sombre), 500) }}>{s.note}</div>
          ) : null}
        </div>
      </Sortie>
      <Sequence from={6} durationInFrames={12}>{sfx('pop', 0.16)}</Sequence>
    </Fond>
  )
}

const Carte = ({ children, style, actif }: { children: ReactNode; style?: CSSProperties; actif?: boolean }) => (
  <div style={{ background: M.blanc, border: `3px solid ${actif ? M.caramel : M.ligne}`, borderRadius: 28, boxShadow: actif ? '0 24px 60px rgba(26,26,46,0.12)' : '0 10px 30px rgba(26,26,46,0.05)', ...style }}>{children}</div>
)

function Etapes({ s, frames, words, voiceAt }: { s: Extract<SceneYT, { type: 'etapes' }>; frames: number; words?: Word[]; voiceAt: number }) {
  const frame = useCurrentFrame()
  const cues = useCues(s.etapes.length, frames, s.reperes, words, voiceAt)
  const bounces = cues.map((c) => useBounce(c, 190, 17))
  const current = cues.reduce((a, c, k) => (frame >= c ? k : a), -1)
  const n = s.etapes.length
  const line = interpolate(frame, [cues[0], cues[n - 1] + 10], [0, 1], { ...clamp, easing: easeInOut })
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ padding: '160px 140px', gap: 90 }}>
        <KineticText text={s.titre} style={{ ...serif(92, encre(s.sombre), 700), justifyContent: 'flex-start' }} />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 40 }}>
          <div style={{ position: 'absolute', left: '6%', right: '6%', top: 58, height: 4, background: M.ligne, borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: '6%', width: `${88 * line}%`, top: 58, height: 4, background: M.caramel, borderRadius: 4 }} />
          {s.etapes.map((e, k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, transform: `translateY(${(1 - bounces[k]) * 80}px)`, opacity: Math.min(1, bounces[k] * 1.5) }}>
              <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 60, background: k < current ? M.bleu : k === current ? M.caramel : M.blanc, border: `3px solid ${k <= current ? 'transparent' : M.ligne}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...serif(64, k <= current ? M.blanc : M.encre, 700) }}>{k < current ? '✓' : k + 1}</div>
              <Carte actif={k === current} style={{ padding: '30px 28px', width: '100%', textAlign: 'center' }}>
                <div style={{ ...sans(40, M.encre, 700), lineHeight: 1.2 }}>{e}</div>
              </Carte>
            </div>
          ))}
        </div>
      </Sortie>
      {cues.map((c, k) => <Sequence key={k} from={c} durationInFrames={10}>{sfx('pop', 0.16)}</Sequence>)}
    </Fond>
  )
}

const Telephone = ({ src, h, style }: { src: string; h: number; style?: CSSProperties }) => {
  const frame = useCurrentFrame()
  const scroll = interpolate(frame, [20, 400], [0, -120], { ...clamp, easing: easeInOut })
  return (
    <div style={{ height: h, width: h * 0.49, borderRadius: h * 0.075, background: M.encre, padding: h * 0.014, boxShadow: `0 ${h * 0.05}px ${h * 0.1}px rgba(26,26,46,0.22)`, ...style }}>
      <div style={{ width: '100%', height: '100%', borderRadius: h * 0.062, overflow: 'hidden', background: M.creme }}>
        <Img src={staticFile(src)} style={{ width: '100%', transform: `translateY(${scroll}px)` }} />
      </div>
    </div>
  )
}

function Ecran({ s, frames, words, voiceAt }: { s: Extract<SceneYT, { type: 'ecran' }>; frames: number; words?: Word[]; voiceAt: number }) {
  const frame = useCurrentFrame()
  const enter = useBounce(0, 110, 18)
  const cues = useCues(s.points.length, frames, s.reperes, words, voiceAt, 0.2, 0.8)
  const bounces = cues.map((c) => useBounce(c, 190, 17))
  const droite = (s.cote ?? 'droite') === 'droite'
  const tel = (
    <div style={{ transform: `translateY(${(1 - enter) * 300 + Math.sin(frame / 25) * 8}px) rotate(${(droite ? 1 : -1) * (4 - enter * 2)}deg)`, opacity: Math.min(1, enter * 1.4) }}>
      <Telephone src={s.image} h={740} />
    </div>
  )
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '120px 220px 140px' }}>
        {!droite ? tel : null}
        <div style={{ width: 860, display: 'flex', flexDirection: 'column', gap: 50 }}>
          <KineticText text={s.titre} style={{ ...serif(100, encre(s.sombre), 700), justifyContent: 'flex-start' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {s.points.map((p, k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 26, transform: `translateX(${(1 - bounces[k]) * -60}px)`, opacity: Math.min(1, bounces[k] * 1.5) }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: M.caramel, flexShrink: 0 }} />
                <span style={{ ...sans(44, encre(s.sombre), 500) }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        {droite ? tel : null}
      </Sortie>
      {cues.map((c, k) => <Sequence key={k} from={c} durationInFrames={10}>{sfx('pop', 0.14)}</Sequence>)}
    </Fond>
  )
}

function Liste({ s, frames }: { s: Extract<SceneYT, { type: 'liste' }>; frames: number }) {
  const per = Math.max(6, Math.floor((frames * 0.55) / s.items.length))
  const bounces = s.items.map((_, k) => useBounce(10 + k * per, 190, 16))
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ padding: '160px 160px', gap: 60 }}>
        <KineticText text={s.titre} style={{ ...serif(92, encre(s.sombre), 700), justifyContent: 'flex-start' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 34 }}>
          {s.items.map((it, k) => (
            <Carte key={k} style={{ padding: '36px 36px', display: 'flex', alignItems: 'center', gap: 28, transform: `translateY(${(1 - bounces[k]) * 70}px) scale(${0.92 + bounces[k] * 0.08})`, opacity: Math.min(1, bounces[k] * 1.5) }}>
              <div style={{ width: 110, height: 110, borderRadius: 55, background: M.creme, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconeMarque nom={it.icone} size={72} />
              </div>
              <span style={{ ...sans(38, M.encre, 700), lineHeight: 1.2 }}>{it.texte}</span>
            </Carte>
          ))}
        </div>
      </Sortie>
      {s.items.map((_, k) => <Sequence key={k} from={10 + k * per} durationInFrames={10}>{sfx('pop', 0.12)}</Sequence>)}
    </Fond>
  )
}

function Match({ s, frames, words, voiceAt }: { s: Extract<SceneYT, { type: 'match' }>; frames: number; words?: Word[]; voiceAt: number }) {
  const cues = useCues(s.lignes.length, frames, s.reperes, words, voiceAt, 0.15, 0.6)
  const bounces = cues.map((c) => useBounce(c, 190, 16))
  const head = useBounce(2, 200, 16)
  const Col = ({ children, couleur }: { children: ReactNode; couleur: string }) => (
    <div style={{ background: couleur, color: M.blanc, borderRadius: 999, padding: '16px 0', textAlign: 'center', ...serif(56, M.blanc, 700), transform: `scale(${head})` }}>{children}</div>
  )
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ padding: '160px 160px', gap: 34 }}>
        {s.titre ? <KineticText text={s.titre} style={{ ...serif(80, encre(s.sombre), 700), justifyContent: 'flex-start', marginBottom: 20 }} /> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 30, alignItems: 'center' }}>
          <div />
          <Col couleur={M.bleu}>{s.colonnes[0]}</Col>
          <Col couleur={M.caramel}>{s.colonnes[1]}</Col>
        </div>
        {s.lignes.map(([label, a, b], k) => (
          <Carte key={k} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 30, alignItems: 'center', padding: '34px 44px', transform: `translateY(${(1 - bounces[k]) * 60}px)`, opacity: Math.min(1, bounces[k] * 1.5) }}>
            <span style={{ ...sans(40, M.encre, 700) }}>{label}</span>
            <span style={{ textAlign: 'center', ...sans(64, M.bleu, 700) }}>{a}</span>
            <span style={{ textAlign: 'center', ...sans(64, M.caramelFonce, 700) }}>{b}</span>
          </Carte>
        ))}
      </Sortie>
      {cues.map((c, k) => <Sequence key={k} from={c} durationInFrames={10}>{sfx('pop', 0.16)}</Sequence>)}
    </Fond>
  )
}

function Graphique({ s, frames, words, voiceAt }: { s: Extract<SceneYT, { type: 'graphique' }>; frames: number; words?: Word[]; voiceAt: number }) {
  const cues = useCues(s.barres.length, frames, s.reperes, words, voiceAt, 0.12, 0.7)
  const max = Math.max(...s.barres.map((b) => b.valeur))
  const H = 420
  return (
    <Fond sombre={s.sombre} frames={frames} rue={false}>
      <Sortie frames={frames} style={{ padding: '160px 160px', gap: 40 }}>
        <KineticText text={s.titre} style={{ ...serif(80, encre(s.sombre), 700), justifyContent: 'flex-start' }} />
        <div style={{ position: 'relative', height: H + 120, display: 'flex', alignItems: 'flex-end', gap: 90, padding: '0 60px', borderBottom: `3px solid ${M.ligne}` }}>
          {s.barres.map((b, k) => <Barre key={k} b={b} max={max} H={H} cue={cues[k]} unite={s.unite} sombre={s.sombre} />)}
        </div>
      </Sortie>
      {cues.map((c, k) => <Sequence key={k} from={c} durationInFrames={10}>{sfx('pop', 0.16)}</Sequence>)}
    </Fond>
  )
}

function Barre({ b, max, H, cue, unite, sombre }: { b: { label: string; valeur: number; accent?: boolean }; max: number; H: number; cue: number; unite: string; sombre?: boolean }) {
  const p = useProgress(cue, 26)
  const v = useCount(b.valeur, cue, 26, 0)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ ...sans(52, b.accent ? M.caramelFonce : encre(sombre), 700), opacity: p > 0.02 ? 1 : 0, fontVariantNumeric: 'tabular-nums' }}>{v} {unite}</div>
      <div style={{ width: '100%', height: (H * b.valeur * p) / max, borderRadius: '22px 22px 0 0', background: b.accent ? M.caramel : M.bleu }} />
      <div style={{ ...sans(32, doux(sombre), 500), textAlign: 'center', position: 'absolute', bottom: -64 }}>{b.label}</div>
    </div>
  )
}

function DateScene({ s, frames }: { s: Extract<SceneYT, { type: 'date' }>; frames: number }) {
  const page = useBounce(2, 150, 15)
  const kick = useBounce(12, 200, 16)
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ flexDirection: 'row', alignItems: 'center', padding: '0 200px', gap: 120, marginTop: -60 }}>
        {/* Feuille de calendrier : bandeau caramel, la date en grand. */}
        <div style={{ width: 560, flexShrink: 0, borderRadius: 40, overflow: 'hidden', background: M.blanc, boxShadow: '0 40px 90px rgba(26,26,46,0.16)', transform: `rotate(${(1 - page) * -10 - 2}deg) scale(${0.7 + page * 0.3})`, opacity: Math.min(1, page * 1.5) }}>
          <div style={{ background: M.caramel, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 110 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: M.creme }} />
            <span style={{ width: 22, height: 22, borderRadius: 11, background: M.creme }} />
          </div>
          <div style={{ padding: '50px 30px 60px', textAlign: 'center' }}>
            <div style={{ ...serif(s.quand.length > 9 ? 96 : 130, M.encre, 700), lineHeight: 1 }}>{s.quand}</div>
            {s.detail ? <div style={{ ...capitales(24), marginTop: 26 }}>{s.detail}</div> : null}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${kick})`, transformOrigin: 'left' }}>
            <IconeMarque nom={s.icone} size={90} />
            <span style={{ ...capitales(30, s.sombre ? M.caramel : M.caramelFonce) }}>{s.kicker}</span>
          </div>
          <KineticText text={s.texte} delay={12} stagger={2} style={{ ...serif(74, encre(s.sombre), 700), justifyContent: 'flex-start', lineHeight: 1.12 }} />
        </div>
      </Sortie>
      <Sequence from={2} durationInFrames={20}>{sfx('whoosh', 0.12)}</Sequence>
    </Fond>
  )
}

const MOIS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
function Calendrier({ s, frames, words, voiceAt }: { s: Extract<SceneYT, { type: 'calendrier' }>; frames: number; words?: Word[]; voiceAt: number }) {
  const frame = useCurrentFrame()
  const cues = useCues(s.marques.length, frames, s.reperes, words, voiceAt, 0.15, 0.8)
  const strip = useProgress(0, 26)
  return (
    <Fond sombre={s.sombre} frames={frames}>
      <Sortie frames={frames} style={{ padding: '170px 120px', gap: 80 }}>
        <KineticText text={s.titre} style={{ ...serif(88, encre(s.sombre), 700), justifyContent: 'flex-start' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>
            {MOIS.map((m, i) => {
              const on = s.marques.some((mk, k) => mk.mois === i && frame >= cues[k])
              return (
                <div key={m} style={{ height: 120, borderRadius: 20, background: on ? M.bleu : M.blanc, border: `2px solid ${on ? M.bleu : M.ligne}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sans(32, on ? M.blanc : M.gris, 700), transform: `translateY(${(1 - strip) * 40}px)`, opacity: interpolate(frame, [i * 1.2, i * 1.2 + 10], [0, 1], clamp) }}>{m}</div>
              )
            })}
          </div>
          {s.marques.map((mk, k) => <Marque key={k} mk={mk} cue={cues[k]} rang={k} />)}
        </div>
      </Sortie>
      {cues.map((c, k) => <Sequence key={k} from={c} durationInFrames={10}>{sfx('pop', 0.16)}</Sequence>)}
    </Fond>
  )
}

function Marque({ mk, cue, rang }: { mk: { mois: number; label: string }; cue: number; rang: number }) {
  const b = useBounce(cue, 200, 15)
  const x = ((mk.mois + 0.5) / 12) * 100
  const bas = rang % 2 === 0
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: bas ? 150 : 150, transform: `translateX(-50%) translateY(${bas ? (1 - b) * 30 : (1 - b) * 30 + 170}px) scale(${b})`, opacity: Math.min(1, b * 1.5), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 4, height: 30, background: M.caramel }} />
      <div style={{ background: M.blanc, border: `3px solid ${M.caramel}`, borderRadius: 18, padding: '14px 22px', ...sans(28, M.encre, 700), whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(26,26,46,0.1)' }}>{mk.label}</div>
    </div>
  )
}

function Fin({ s, frames }: { s: Extract<SceneYT, { type: 'fin' }>; frames: number }) {
  const frame = useCurrentFrame()
  const logo = useBounce(0, 150, 16)
  const btn = useBounce(18, 200, 13)
  const sub = useBounce(30, 200, 13)
  return (
    <Fond frames={frames}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 46, marginTop: -60 }}>
        <div style={{ width: 160 * useProgress(4, 20), height: 4, background: M.caramel, borderRadius: 4 }} />
        <div style={{ transform: `scale(${0.8 + logo * 0.2})`, opacity: Math.min(1, logo * 1.5) }}>
          <Logo height={210} />
        </div>
        <KineticText text={s.texte} delay={10} style={{ ...serif(64, M.gris, 500), textAlign: 'center' }} />
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          <span style={{ transform: `scale(${btn * (1 + Math.sin(frame / 6) * 0.015)})`, background: M.bleu, borderRadius: 999, padding: '26px 64px', ...sans(54, M.blanc, 700) }}>{s.url}</span>
          <span style={{ transform: `scale(${sub})`, display: 'flex', alignItems: 'center', gap: 16, background: M.blanc, border: `3px solid ${M.ligne}`, borderRadius: 999, padding: '20px 40px', ...sans(40, M.encre, 700) }}>
            <IconeMarque nom="actu" size={46} /> S'abonner
          </span>
        </div>
      </AbsoluteFill>
      <Sequence from={18} durationInFrames={12}>{sfx('pop', 0.2)}</Sequence>
    </Fond>
  )
}

export function SceneYTView({ scene, frames, words, voiceAt }: { scene: SceneYT; frames: number; words?: Word[]; voiceAt: number }) {
  switch (scene.type) {
    case 'phrase':
      return <Phrase s={scene} frames={frames} />
    case 'titre':
      return <Titre s={scene} frames={frames} />
    case 'chiffre':
      return <Chiffre s={scene} frames={frames} />
    case 'etapes':
      return <Etapes s={scene} frames={frames} words={words} voiceAt={voiceAt} />
    case 'ecran':
      return <Ecran s={scene} frames={frames} words={words} voiceAt={voiceAt} />
    case 'liste':
      return <Liste s={scene} frames={frames} />
    case 'match':
      return <Match s={scene} frames={frames} words={words} voiceAt={voiceAt} />
    case 'graphique':
      return <Graphique s={scene} frames={frames} words={words} voiceAt={voiceAt} />
    case 'date':
      return <DateScene s={scene} frames={frames} />
    case 'calendrier':
      return <Calendrier s={scene} frames={frames} words={words} voiceAt={voiceAt} />
    case 'fin':
      return <Fin s={scene} frames={frames} />
  }
}
