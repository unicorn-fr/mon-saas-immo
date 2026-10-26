import { useEffect, useState, type ReactNode } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { Check as CheckIcon } from '../../components/Icons'
import { Btn, Callout, Card, Check, Money, Pill, Progress, TextLink, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { downloadDoc } from '../../lib/docs'

type Regime = 'MICRO' | 'REAL'
export interface TaxProgress {
  regime?: { vide?: Regime; meuble?: Regime }
  done?: string[]
  tasks?: string[]
  filedAt?: string | null
}
interface RegimeChoice {
  recommended: Regime
  chosen: Regime
  microAllowed: boolean
}
interface TaxCheck {
  id: string
  tone: 'OK' | 'TODO' | 'TIP'
  title: string
  detail?: string
  propertyId?: string
  field?: 'loanInterestCents' | 'coproRegularizationCents' | 'adminFeesCents'
  none?: string
  link?: { to: string; label: string }
}
interface CopyEntry {
  box: string
  label: string
  cents?: number
  text?: string
  hint?: string
}
interface CopyGroup {
  id: string
  form: string
  title: string
  rubric?: string
  steps: string[]
  entries: CopyEntry[]
  note?: string
}
interface Link {
  label: string
  url: string
}
interface FilingGuide {
  id: string
  title: string
  summary: string
  deadline: string | null
  documents: Array<{ label: string; detail?: string; bailio?: boolean }>
  steps: Array<{ title: string; detail?: string; link?: Link }>
  structure?: string
  alternative?: boolean
}
export interface GuideData {
  empty: { grossRentCents: number; microAllowed: boolean; microTaxableCents: number; realResultCents: number } | null
  furnished: { receiptsCents: number; microAllowed: boolean; microTaxableCents: number } | null
  lmnp?: { taxableCents: number; deficitCents: number; microTaxableCents: number } | null
  copy?: CopyGroup[]
  forms?: { f2044: boolean; cfe: Array<{ propertyId: string; name: string }> }
  filing?: FilingGuide[]
  progress?: TaxProgress
  regimes?: { vide: RegimeChoice | null; meuble: RegimeChoice | null }
  checks?: TaxCheck[]
  status?: { phase: 'EARLY' | 'OPEN' | 'LATE' | 'FILED'; title: string; text: string; deadline: string | null }
}

type StepId = 'check' | 'regime' | 'declare' | 'others' | 'after'
type ExtraPatch = { loanInterestCents?: number | null; adminFeesCents?: number | null; coproRegularizationCents?: number | null }

const euros = (cents: number) => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`
export const boxLabel = (box: string) => (/^[45][A-Z]{2}$/.test(box) ? `Case ${box}` : /^\d/.test(box) ? `Ligne ${box}` : box)
const frDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const today = () => new Date().toISOString().slice(0, 10)
const ext = { target: '_blank', rel: 'noreferrer' } as const
const linkStyle = { color: BAI.owner, fontWeight: 600, textDecoration: 'none' } as const
/** Les fiches de la déclaration elle-même : guidées à l'étape « Déclarer » ; les autres sont des démarches à part. */
const PERSONAL = ['VIDE_MICRO', 'VIDE_REEL', 'MEUBLE_MICRO']
const taskKey = (g: FilingGuide) => `${g.id}:${g.structure ?? ''}`

/**
 * Déclarer sans prise de tête : un parcours en cinq temps, une étape ouverte à la fois. Bailio vérifie d'abord ce qu'il
 * sait et ne pose que les questions utiles, laisse choisir le régime s'il y a un choix, puis accompagne la saisie sur
 * impots.gouv.fr écran par écran (un clic copie la case et la coche). La progression est gardée pour l'année.
 * L'administration n'accepte aucun fichier d'un particulier : la déclaration en ligne se remplit à la main.
 */
export function DeclarationGuide({ data, year, onExtra, reload }: { data: GuideData; year: number; onExtra: (propertyId: string, patch: ExtraPatch) => void; reload: () => void }) {
  const toast = useToast()
  const [progress, setProgress] = useState<TaxProgress>(data.progress ?? {})
  useEffect(() => setProgress(data.progress ?? {}), [data.progress])
  const groups = data.copy ?? []
  const toCopy = groups.filter((g) => g.rubric)
  const toCheck = groups.filter((g) => !g.rubric)
  const entryKeys = toCopy.flatMap((g) => g.entries.map((e, k) => `${g.id}:${e.box}:${k}`))
  const others = (data.filing ?? []).filter((g) => !g.alternative && !PERSONAL.includes(g.id))
  const checks = data.checks ?? []
  const todo = checks.filter((c) => c.tone === 'TODO')
  const regimes = data.regimes ?? { vide: null, meuble: null }
  const hasChoice = Boolean(regimes.vide?.microAllowed || regimes.meuble?.microAllowed)
  const tasks = new Set(progress.tasks ?? [])
  const done = new Set(progress.done ?? [])

  const save = (patch: TaxProgress) => {
    const next = { ...progress, ...patch, regime: patch.regime ? { ...progress.regime, ...patch.regime } : progress.regime }
    setProgress(next)
    return api('/money/tax/progress', { method: 'PUT', body: { year, ...patch } }).catch((e) => toast.error(e))
  }
  const toggleTask = (key: string, on: boolean) => save({ tasks: on ? [...tasks, key] : [...tasks].filter((t) => t !== key) })
  const markCopied = (key: string, on = true) => save({ done: on ? [...new Set([...done, key])] : [...done].filter((d) => d !== key) })

  const steps: Array<{ id: StepId; title: string; done: boolean; hint: string }> = [
    { id: 'check', title: 'Vérifier vos chiffres', done: !todo.length || tasks.has('check'), hint: todo.length ? `${todo.length} point${todo.length > 1 ? 's' : ''} à compléter` : 'Tout est prêt' },
    ...(hasChoice ? [{ id: 'regime' as const, title: 'Choisir votre régime', done: tasks.has('regime'), hint: 'Bailio a comparé pour vous' }] : []),
    ...(groups.length ? [{ id: 'declare' as const, title: 'Déclarer sur impots.gouv.fr', done: Boolean(progress.filedAt), hint: entryKeys.length ? `${entryKeys.length} case${entryKeys.length > 1 ? 's' : ''} à recopier` : 'À vérifier' }] : []),
    ...(others.length ? [{ id: 'others' as const, title: 'Vos autres démarches', done: others.every((g) => tasks.has(taskKey(g))), hint: `${others.length} démarche${others.length > 1 ? 's' : ''}` }] : []),
  ]
  const doneCount = steps.filter((s) => s.done).length
  const current = steps.find((s) => !s.done)?.id ?? 'after'
  // Étape ouverte : celle choisie, sinon la première à faire ; « none » quand le propriétaire a tout replié.
  const [open, setOpen] = useState<StepId | 'none' | null>(null)
  const shown = open ?? current
  const go = (id: StepId) => {
    setOpen(id)
    window.requestAnimationFrame(() => document.getElementById(`etape-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const next = (from: StepId) => {
    const i = steps.findIndex((s) => s.id === from)
    go(steps[i + 1]?.id ?? 'after')
  }
  const status = data.status
  const regimeNames = [regimes.vide ? (regimes.vide.chosen === 'MICRO' ? 'Micro-foncier' : 'Réel (2044)') : null, regimes.meuble ? (regimes.meuble.chosen === 'MICRO' ? 'Micro-BIC' : 'Réel (meublé)') : null].filter(Boolean).join(' et ')

  return (
    <>
      <Card style={{ background: BAI.sky, border: 'none' }}>
        {status ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Pill tone={status.phase === 'LATE' ? 'accent' : status.phase === 'FILED' ? 'green' : 'owner'}>{status.phase === 'FILED' ? 'C’est fait' : status.phase === 'LATE' ? 'En retard' : status.phase === 'OPEN' ? 'C’est le moment' : 'Bientôt'}</Pill>
            <strong style={{ fontSize: 20, marginTop: 6 }}>{status.title}</strong>
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{status.text}</span>
          </div>
        ) : null}
        <div className="grid-3" style={{ gap: 12 }}>
          <Fact label="Votre régime" value={regimeNames || 'Rien en nom propre'} />
          <Fact label="Cases à recopier" value={entryKeys.length ? `${entryKeys.length}` : 'Aucune'} detail={entryKeys.length ? 'Bailio a fait les calculs' : undefined} />
          <Fact label="Date limite en ligne" value={status?.deadline ? frDay(status.deadline) : 'Fin mai, à confirmer'} />
        </div>
        <Progress percent={steps.length ? Math.round((doneCount / steps.length) * 100) : 100} label="Votre déclaration" />
        <div className="col-md" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: BAI.inkMid }}>
            {doneCount ? `${doneCount} étape${doneCount > 1 ? 's' : ''} faite${doneCount > 1 ? 's' : ''} sur ${steps.length}.` : `${steps.length} étapes, dans l’ordre.`} Bailio garde votre place : vous pouvez revenir plus tard.
          </span>
          {current !== 'after' ? (
            <Btn onClick={() => go(current)}>{doneCount || done.size ? 'Reprendre où j’en étais' : 'Commencer'}</Btn>
          ) : null}
        </div>
      </Card>

      <ol aria-label="Les étapes de votre déclaration" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => (
          <Step key={s.id} id={s.id} n={i + 1} title={s.title} hint={s.hint} done={s.done} open={shown === s.id} onToggle={() => setOpen(shown === s.id ? 'none' : s.id)}>
            {s.id === 'check' ? <CheckStep year={year} checks={checks} onExtra={onExtra} reload={reload} onDone={() => {
                  if (todo.length) void toggleTask('check', true)
                  next('check')
                }} /> : null}
            {s.id === 'regime' ? <RegimeStep data={data} regimes={regimes} onChoose={(r) => save({ regime: r }).then(reload)} onDone={() => {
                  void toggleTask('regime', true)
                  next('regime')
                }} /> : null}
            {s.id === 'declare' ? <DeclareStep toCopy={toCopy} toCheck={toCheck} done={done} filedAt={progress.filedAt ?? null} liasse={others.some((g) => g.id === 'MEUBLE_REEL')} onCopied={markCopied} onFiled={(d) => save({ filedAt: d }).then(reload)} onNext={() => next('declare')} /> : null}
            {s.id === 'others' ? <OthersStep guides={others} tasks={tasks} onToggle={toggleTask} /> : null}
          </Step>
        ))}
        <Step id="after" n={steps.length + 1} title="Après la déclaration" hint="Ce qu’il faut garder" done={false} open={shown === 'after'} onToggle={() => setOpen(shown === 'after' ? 'none' : 'after')}>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, lineHeight: 1.6 }}>
            <li>Gardez l’accusé de réception, ce dossier et vos factures au moins trois ans : l’administration peut les demander.</li>
            <li>Votre avis d’impôt arrive dans votre espace impots.gouv.fr pendant l’été.</li>
            <li>{status?.phase === 'FILED' ? status.text.replace(/^L’avis d’impôt arrive dans votre espace pendant l’été\. /, '') : 'Une erreur après la signature ? Corrigez en ligne jusqu’à la date limite, puis avec le service de correction, ouvert l’été jusqu’à fin novembre.'}</li>
            <li>L’an prochain, Bailio reprend tout de lui-même : la date limite apparaîtra dans vos prochaines échéances.</li>
          </ul>
        </Step>
      </ol>

      <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Vos documents prêts</h2>}>
        <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Tout en un seul fichier : la fiche Bailio avec vos montants, puis les formulaires officiels remplis avec vos chiffres. À garder, ou à transmettre à votre comptable.</span>
        <FormRow title="Tout le dossier de l’année" detail="Fiche récapitulative et formulaires pré-remplis, dans l’ordre." onClick={() => downloadDoc(`/money/tax/dossier.pdf?year=${year}`, `bailio-dossier-declaration-${year}.pdf`).catch(toast.error)} label="Télécharger le dossier" />
        {data.forms?.f2044 ? <FormRow title="Déclaration des revenus fonciers 2044" detail="Pour vérifier votre saisie en ligne, ou à joindre si vous déclarez sur papier." onClick={() => downloadDoc(`/money/tax/2044.pdf?year=${year}`, `2044-revenus-${year}.pdf`).catch(toast.error)} label="Télécharger la 2044" /> : null}
        {(data.forms?.cfe ?? []).map((c) => (
          <FormRow
            key={c.propertyId}
            title={`Déclaration initiale de CFE 1447-C-SD : ${c.name}`}
            detail="Ajoutez votre numéro SIRET, datez, signez, puis envoyez-la au service des impôts des entreprises du logement, par la messagerie de votre espace professionnel ou par courrier, avant le 31 décembre."
            onClick={() => downloadDoc(`/money/tax/1447-c-sd.pdf?propertyId=${c.propertyId}`, '1447-c-sd.pdf').catch(toast.error)}
            label="Télécharger la 1447-C-SD"
          />
        ))}
        <FormRow title="Votre fiche récapitulative Bailio" detail="Tous vos montants, les étapes, les liens officiels et les contacts, sur une page à garder." onClick={() => downloadDoc(`/money/tax/fiche.pdf?year=${year}`, `bailio-declaration-${year}.pdf`).catch(toast.error)} label="Télécharger la fiche" />
      </Card>
    </>
  )
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{ background: BAI.surface, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 13, color: BAI.inkMid }}>{label}</span>
      <strong style={{ fontSize: 18 }}>{value}</strong>
      {detail ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{detail}</span> : null}
    </div>
  )
}

function Step({ id, n, title, hint, done, open, onToggle, children }: { id: StepId; n: number; title: string; hint: string; done: boolean; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <li id={`etape-${id}`} style={{ background: BAI.surface, border: `1px solid ${open ? BAI.owner : BAI.divider}`, borderRadius: 22, scrollMarginTop: 80 }}>
      <h2 style={{ margin: 0, fontSize: 'inherit' }}>
        <button type="button" aria-expanded={open} aria-controls={`contenu-${id}`} onClick={onToggle} style={{ width: '100%', display: 'flex', gap: 14, alignItems: 'center', background: 'none', border: 'none', padding: 'clamp(16px, 3vw, 22px)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: BAI.ink }}>
          <span aria-hidden style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, ...(done ? { background: BAI.greenLight, color: BAI.green } : open ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkMid }) }}>
            {done ? <CheckIcon size={16} /> : n}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: done ? BAI.green : BAI.inkMid }}>{done ? 'Fait' : hint}</span>
          </span>
          <span aria-hidden style={{ fontSize: 18, color: BAI.inkMid, transform: open ? 'rotate(180deg)' : 'none' }}>
            ⌄
          </span>
        </button>
      </h2>
      {open ? (
        <div id={`contenu-${id}`} style={{ padding: '0 clamp(16px, 3vw, 22px) clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
      ) : null}
    </li>
  )
}

function CheckStep({ year, checks, onExtra, reload, onDone }: { year: number; checks: TaxCheck[]; onExtra: (propertyId: string, patch: ExtraPatch) => void; reload: () => void; onDone: () => void }) {
  const toast = useToast()
  const todo = checks.filter((c) => c.tone === 'TODO').length
  const none = (c: TaxCheck) =>
    api(`/properties/${c.propertyId}/tax/${year}`, { method: 'PUT', body: { [c.field!]: 0 } })
      .then(reload)
      .catch(toast.error)
  return (
    <>
      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{todo ? 'Bailio a repris vos loyers et vos dépenses. Il lui manque seulement ceci : répondez, les montants à recopier se mettent à jour.' : 'Bailio a repris vos loyers et vos dépenses : rien ne manque.'}</span>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map((c) => (
          <li key={c.id} style={{ border: `1px solid ${c.tone === 'TODO' ? BAI.borderStrong : BAI.dividerSoft}`, background: c.tone === 'OK' ? BAI.bg : BAI.surface, borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Pill tone={c.tone === 'TODO' ? 'accent' : c.tone === 'TIP' ? 'muted' : 'green'}>{c.tone === 'TODO' ? 'À compléter' : c.tone === 'TIP' ? 'À regarder' : 'Vérifié'}</Pill>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 15 }}>{c.title}</strong>
                {c.detail ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{c.detail}</span> : null}
              </span>
            </span>
            {c.field && c.propertyId ? (
              <div className="col-md" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Money label="Montant de l’année" cents={null} onChange={(v) => onExtra(c.propertyId!, { [c.field!]: v })} />
                </div>
                {c.none ? (
                  <Btn variant="outline" onClick={() => none(c)}>
                    {c.none}
                  </Btn>
                ) : null}
              </div>
            ) : null}
            {c.link ? <TextLink to={c.link.to} style={{ fontSize: 14 }}>{c.link.label}</TextLink> : null}
          </li>
        ))}
      </ul>
      <div>
        <Btn variant="outline" onClick={onDone}>
          {todo ? 'Continuer sans compléter' : 'C’est juste, continuer'}
        </Btn>
      </div>
    </>
  )
}

function RegimeStep({ data, regimes, onChoose, onDone }: { data: GuideData; regimes: NonNullable<GuideData['regimes']>; onChoose: (r: { vide?: Regime; meuble?: Regime }) => void; onDone: () => void }) {
  return (
    <>
      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Bailio a calculé les deux régimes avec vos chiffres. Le plus avantageux est choisi ; changez seulement si vous avez déjà opté pour l’autre.</span>
      {regimes.vide && regimes.vide.microAllowed && data.empty ? (
        <RegimePick
          legend="Location vide"
          choice={regimes.vide}
          onChoose={(r) => onChoose({ vide: r })}
          micro={{ title: 'Micro-foncier', amount: data.empty.microTaxableCents, text: 'Une seule case. L’administration retire 30 % de vos loyers pour vos frais.' }}
          real={{ title: 'Régime réel (2044)', amount: Math.max(0, data.empty.realResultCents), deficit: data.empty.realResultCents < 0 ? -data.empty.realResultCents : 0, text: 'Vos vraies dépenses se déduisent. Ce choix vous engage pour trois ans.' }}
        />
      ) : null}
      {regimes.meuble && regimes.meuble.microAllowed && data.furnished ? (
        <RegimePick
          legend="Location meublée"
          choice={regimes.meuble}
          onChoose={(r) => onChoose({ meuble: r })}
          micro={{ title: 'Micro-BIC', amount: data.furnished.microTaxableCents, text: 'Une seule case. L’administration retire 50 % de vos recettes.' }}
          real={{ title: 'Régime réel (estimation)', amount: data.lmnp?.taxableCents ?? 0, deficit: data.lmnp?.deficitCents ?? 0, text: 'Charges et amortissements déduits. Une liasse comptable (2031) à faire chaque année, en général avec un expert-comptable.' }}
        />
      ) : null}
      <div>
        <Btn variant="outline" onClick={onDone}>
          Garder ce choix et continuer
        </Btn>
      </div>
    </>
  )
}

function RegimePick({ legend, choice, onChoose, micro, real }: { legend: string; choice: RegimeChoice; onChoose: (r: Regime) => void; micro: { title: string; amount: number; text: string }; real: { title: string; amount: number; deficit: number; text: string } }) {
  const gap = micro.amount - real.amount
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <legend style={{ fontSize: 16, fontWeight: 700, padding: 0, marginBottom: 8 }}>{legend}</legend>
      <div className="grid-2" style={{ gap: 12 }}>
        {(['MICRO', 'REAL'] as const).map((r) => {
          const o = r === 'MICRO' ? micro : real
          const on = choice.chosen === r
          return (
            <button key={r} type="button" aria-pressed={on} onClick={() => onChoose(r)} style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', background: on ? BAI.ownerTint : BAI.surface, color: BAI.ink, border: on ? `2px solid ${BAI.owner}` : `1px solid ${BAI.borderStrong}`, borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 16 }}>{o.title}</strong>
                {choice.recommended === r ? <Pill tone="owner">Le plus avantageux</Pill> : null}
              </span>
              <span style={{ fontSize: 14, color: BAI.inkMid }}>Revenu imposé</span>
              <strong style={{ fontSize: 22 }}>{euros(o.amount)}</strong>
              {r === 'REAL' && real.deficit ? <span style={{ fontSize: 14, color: BAI.green, fontWeight: 600 }}>Et un déficit de {euros(real.deficit)}</span> : null}
              <span style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.5 }}>{o.text}</span>
            </button>
          )
        })}
      </div>
      {Math.abs(gap) >= 100 ? <span style={{ fontSize: 14, color: BAI.inkMid }}>Écart : {euros(Math.abs(gap))} de revenu imposé en {gap > 0 ? 'moins au réel' : 'moins au micro'}.</span> : null}
    </fieldset>
  )
}

function DeclareStep({ toCopy, toCheck, done, filedAt, liasse, onCopied, onFiled, onNext }: { toCopy: CopyGroup[]; toCheck: CopyGroup[]; done: Set<string>; filedAt: string | null; liasse: boolean; onCopied: (key: string, on?: boolean) => void; onFiled: (d: string | null) => void; onNext: () => void }) {
  const toast = useToast()
  const rubrics = toCopy.map((g) => g.rubric!).filter((r, i, a) => a.indexOf(r) === i)
  const total = toCopy.reduce((a, g) => a + g.entries.length, 0)
  const copied = toCopy.reduce((a, g) => a + g.entries.filter((e, k) => done.has(`${g.id}:${e.box}:${k}`)).length, 0)
  const copy = async (e: CopyEntry, key: string) => {
    const value = e.cents !== undefined ? String(Math.round(e.cents / 100)) : e.text ?? ''
    try {
      await navigator.clipboard.writeText(value)
      toast.show(`${boxLabel(e.box)} copiée : ${value}`)
      onCopied(key)
    } catch {
      toast.show('Sélectionnez le montant puis copiez-le.', 'error')
    }
  }
  let n = 0
  const sub = (title: string, children: ReactNode) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: n++ ? `1px solid ${BAI.dividerSoft}` : 'none', paddingTop: n > 1 ? 14 : 0 }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
        {n}. {title}
      </h3>
      {children}
    </section>
  )
  return (
    <>
      {liasse ? <Callout tone="tip">Location meublée au réel : la liasse 2031 se dépose d’abord (voir vos autres démarches). Son résultat fait foi pour la case à recopier.</Callout> : null}
      {sub(
        'Ouvrez votre espace sur impots.gouv.fr',
        <>
          <span style={{ fontSize: 15, lineHeight: 1.6 }}>Connectez-vous avec votre numéro fiscal (sur votre dernier avis d’impôt) et votre mot de passe, ou avec FranceConnect. Puis ouvrez votre déclaration de revenus.</span>
          <div>
            <Btn variant="outline" href="https://www.impots.gouv.fr/accueil" newTab>
              Ouvrir impots.gouv.fr <span aria-hidden>↗</span>
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </Btn>
          </div>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Sur ordinateur, gardez cette page à côté. Sur téléphone, revenez ici entre deux cases : celles déjà copiées restent cochées.</span>
        </>,
      )}
      {sub('Passez les premiers écrans', <span style={{ fontSize: 15, lineHeight: 1.6 }}>Ils concernent votre situation personnelle (adresse, famille, salaires) : rien ne change pour vos locations. Vérifiez-les et continuez.</span>)}
      {sub(
        `À l’étape « Revenus et charges », cochez ${rubrics.length > 1 ? 'ces rubriques' : 'cette rubrique'}`,
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.5 }}>
          {rubrics.map((r) => (
            <li key={r}>
              <strong>{r}</strong>
            </li>
          ))}
        </ul>,
      )}
      {sub(
        `Recopiez ${total > 1 ? `les ${total} cases` : 'la case'}`,
        <>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
            En euros entiers, sans centimes. « Copier » met le montant dans le presse-papiers et coche la case : collez-le sur impots.gouv.fr. {copied ? `${copied} sur ${total} déjà copiée${copied > 1 ? 's' : ''}.` : ''}
          </span>
          {toCopy.map((g) => (
            <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 16 }}>{g.title}</strong>
                <Pill tone="owner">Formulaire {g.form}</Pill>
              </span>
              {g.steps.map((st) => (
                <span key={st} style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
                  {st}
                </span>
              ))}
              {g.entries.map((e, k) => {
                const key = `${g.id}:${e.box}:${k}`
                const isDone = done.has(key)
                return (
                  <div key={key} className={e.text !== undefined ? 'copy-row copy-row--text' : 'copy-row'} style={{ background: isDone ? BAI.greenLight : e.text !== undefined ? BAI.bg : BAI.surface, border: `1px solid ${isDone ? BAI.green : BAI.divider}`, borderRadius: 16, padding: '12px 14px' }}>
                    <span className="copy-box" style={{ fontWeight: 700, fontSize: 17, color: BAI.owner, fontVariantNumeric: 'tabular-nums' }}>
                      {boxLabel(e.box)}
                    </span>
                    <span className="copy-label" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, lineHeight: 1.4 }}>{e.label}</span>
                      {e.hint ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.4 }}>{e.hint}</span> : null}
                    </span>
                    <strong className="copy-value" style={{ fontSize: 18, textAlign: e.text !== undefined ? 'left' : 'right', whiteSpace: e.text !== undefined ? 'normal' : 'nowrap', overflowWrap: 'anywhere' }}>
                      {e.cents !== undefined ? euros(e.cents) : e.text}
                    </strong>
                    <span className="copy-btn">
                      <Btn variant="outline" size="sm" onClick={() => copy(e, key)} title={`Copier : ${boxLabel(e.box)}`}>
                        {isDone ? 'Copiée' : 'Copier'}
                      </Btn>
                    </span>
                  </div>
                )
              })}
              {g.note ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{g.note}</span> : null}
            </div>
          ))}
        </>,
      )}
      {sub(
        'Vérifiez le récapitulatif',
        <>
          {toCheck.length ? (
            toCheck.map((g) => (
              <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g.steps.map((st) => (
                  <span key={st} style={{ fontSize: 15, lineHeight: 1.5 }}>
                    {st}
                  </span>
                ))}
                {g.entries.map((e) => (
                  <span key={e.box} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, background: BAI.bg, borderRadius: 12, padding: '10px 12px' }}>
                    <span>
                      <strong style={{ color: BAI.owner }}>{boxLabel(e.box)}</strong> · {e.label}
                    </span>
                    <strong style={{ whiteSpace: 'nowrap' }}>{e.cents !== undefined ? euros(e.cents) : e.text}</strong>
                  </span>
                ))}
                {g.note ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{g.note}</span> : null}
              </div>
            ))
          ) : (
            <span style={{ fontSize: 15, lineHeight: 1.6 }}>Le récapitulatif reprend les montants saisis : ils doivent être ceux de Bailio. L’impôt estimé s’affiche aussi.</span>
          )}
        </>,
      )}
      {sub(
        'Signez votre déclaration',
        filedAt ? (
          <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 15 }}>
            <Pill tone="green">Signée le {frDay(filedAt)}</Pill>
            <TextLink onClick={() => onFiled(null)} style={{ fontSize: 14 }}>
              Ce n’est pas encore fait
            </TextLink>
          </span>
        ) : (
          <>
            <span style={{ fontSize: 15, lineHeight: 1.6 }}>Cliquez sur « Signer » en bas du récapitulatif. Un accusé de réception arrive par email : gardez-le avec votre dossier.</span>
            <div>
              <Btn
                variant="dark"
                onClick={() => {
                  onFiled(today())
                  onNext()
                }}
              >
                J’ai signé ma déclaration
              </Btn>
            </div>
          </>
        ),
      )}
    </>
  )
}

function OthersStep({ guides, tasks, onToggle }: { guides: FilingGuide[]; tasks: Set<string>; onToggle: (key: string, on: boolean) => void }) {
  return (
    <>
      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>En plus de votre déclaration de revenus, d’après vos logements. Cochez-les une fois faites.</span>
      {guides.map((g) => {
        const key = taskKey(g)
        return (
          <div key={key} style={{ border: `1px solid ${BAI.divider}`, borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <strong style={{ fontSize: 16 }}>{g.title}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>{g.summary}</span>
            {g.deadline ? <span style={{ fontSize: 14, color: BAI.accentInk, fontWeight: 600, lineHeight: 1.5 }}>Date limite : {g.deadline}.</span> : null}
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, color: BAI.owner, minHeight: 32 }}>Comment faire</summary>
              <ol style={{ margin: '8px 0 0', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, lineHeight: 1.5 }}>
                {g.steps.map((st) => (
                  <li key={st.title}>
                    <strong>{st.title}</strong>
                    {st.detail ? ` : ${st.detail}` : ''}
                    {st.link ? (
                      <>
                        {' '}
                        <a href={st.link.url} {...ext} style={linkStyle}>
                          {st.link.label} <span aria-hidden>↗</span>
                          <span className="sr-only"> (nouvelle fenêtre)</span>
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ol>
              {g.documents.length ? (
                <p style={{ margin: '10px 0 0', fontSize: 14, color: BAI.inkMid, lineHeight: 1.6 }}>
                  À réunir : {g.documents.map((d) => d.label.charAt(0).toLowerCase() + d.label.slice(1)).join(' ; ')}.
                </p>
              ) : null}
            </details>
            <Check checked={tasks.has(key)} onChange={(v) => onToggle(key, v)} label="C’est fait" />
          </div>
        )
      })}
    </>
  )
}

function FormRow({ title, detail, onClick, label }: { title: string; detail: string; onClick: () => void; label: string }) {
  return (
    <div className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <strong style={{ fontSize: 16 }}>{title}</strong>
        <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{detail}</span>
      </span>
      <Btn variant="outline" onClick={onClick}>
        {label}
      </Btn>
    </div>
  )
}
