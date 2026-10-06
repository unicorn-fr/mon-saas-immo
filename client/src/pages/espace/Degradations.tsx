import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { AuthImage } from '../../components/media'
import { Btn, Callout, Card, Chips, Crumbs, Input, Line, LoadError, Loader, Money, NumberField, TextArea, TextLink, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api, openPdfFrom, pdfUrl } from '../../lib/api'
import { dateNum, eurosCents } from '../../lib/format'

interface DamageLine {
  key: string
  room: string
  label: string
  entryState: string | null
  exitState: string | null
  exitNote: string | null
  exitPhotoIds: string[]
  decision: 'WEAR' | 'DAMAGE' | null
  costCents: number | null
  wearPct: number | null
  justification: string | null
  comment: string | null
  retainedCents: number
  missing: string | null
}

interface DamageView {
  exitInventoryId: string
  exitDate: string | null
  hasEntry: boolean
  lines: DamageLine[]
  entryPhotos: Record<string, string[]>
  totalCents: number
  complete: boolean
  depositCents: number
  tenantName: string
  propertyName: string
}

const retained = (cost: number | null, wear: number | null) => Math.round((cost ?? 0) * (1 - Math.min(100, Math.max(0, wear ?? 0)) / 100))

/**
 * Récapitulatif des dégradations, après l'état des lieux de sortie : un élément abîmé à la fois, usure normale ou
 * dégradation (coût, justificatif, part d'usure, commentaire). Les retenues passent dans le solde de tout compte.
 */
export default function Degradations() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, reload } = useLoad(() => api<DamageView | null>(`/leases/${id}/damages`), [id])
  const [index, setIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<DamageLine | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (data === undefined) return <AppShell><Loader /></AppShell>

  const header = (
    <>
      <Crumbs items={[{ label: 'Bail', to: `/espace/baux/${id}` }, { label: 'Dégradations' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Dégradations</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Ce qui est plus abîmé qu’à l’entrée : usure normale ou dégradation, vous décidez élément par élément.</span>
      </div>
    </>
  )
  if (!data)
    return (
      <AppShell>
        {header}
        <Callout tone="info">Faites d’abord l’état des lieux de sortie et signez-le : Bailio le compare à l’entrée et liste ici ce qui a changé.</Callout>
        <div>
          <Btn onClick={() => navigate(`/espace/baux/${id}/etat-des-lieux?type=EXIT`)}>Préparer l’état des lieux de sortie</Btn>
        </div>
      </AppShell>
    )

  const lines = data.lines
  const open = (i: number) => {
    setMessage(null)
    setIndex(i)
    setDraft({ ...lines[i] })
    window.scrollTo(0, 0)
  }
  const firstTodo = lines.findIndex((l) => l.missing)

  const save = async () => {
    if (!draft || index === null) return
    const problem = !draft.decision
      ? 'Indiquez s’il s’agit d’usure normale ou d’une dégradation.'
      : draft.decision === 'DAMAGE' && !draft.costCents
        ? 'Indiquez le coût de la réparation.'
        : draft.decision === 'DAMAGE' && !draft.justification?.trim()
          ? 'Indiquez le justificatif (devis, facture) : une retenue doit être justifiée.'
          : null
    setMessage(problem)
    if (problem) return
    setBusy(true)
    try {
      const body = { key: draft.key, decision: draft.decision, costCents: draft.decision === 'DAMAGE' ? draft.costCents : null, wearPct: draft.decision === 'DAMAGE' ? draft.wearPct : null, justification: draft.decision === 'DAMAGE' ? draft.justification : null, comment: draft.comment || null }
      await api(`/leases/${id}/damages`, { method: 'PUT', body: { decisions: [body] } })
      const next = lines.findIndex((l, j) => j > index && l.missing)
      reload()
      if (next >= 0) open(next)
      else {
        setIndex(null)
        setDraft(null)
        window.scrollTo(0, 0)
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  // Un élément à la fois.
  if (index !== null && draft) {
    const entryPhotos = data.entryPhotos[draft.key] ?? []
    return (
      <AppShell>
        {header}
        <Card pad={28}>
          <span style={{ fontSize: 14, color: BAI.inkMid }}>
            Élément {index + 1} sur {lines.length}
          </span>
          <h2 style={display('clamp(26px, 4vw, 32px)')}>
            {draft.room}, {draft.label.toLowerCase()}
          </h2>
          <span style={{ fontSize: 16, lineHeight: 1.5 }}>
            {draft.entryState ?? 'Non relevé'} à l’entrée, <strong>{draft.exitState ?? 'non vérifié'}</strong> à la sortie{draft.exitNote ? ` : ${draft.exitNote}` : '.'}
          </span>
          {entryPhotos.length || draft.exitPhotoIds.length ? (
            <div className="grid-2" style={{ gap: 12 }}>
              <PhotoRow title="À l’entrée" ids={entryPhotos} />
              <PhotoRow title="À la sortie" ids={draft.exitPhotoIds} />
            </div>
          ) : null}
          <Chips
            legend="C’est"
            big
            value={draft.decision}
            onChange={(v) => setDraft({ ...draft, decision: v })}
            options={[
              { value: 'WEAR' as const, label: 'De l’usure normale' },
              { value: 'DAMAGE' as const, label: 'Une dégradation' },
            ]}
            hint="L’usure normale (peinture qui ternit, moquette qui s’use avec le temps) reste à votre charge. Une dégradation (trou, brûlure, casse) peut être retenue sur le dépôt."
          />
          {draft.decision === 'DAMAGE' ? (
            <>
              <Money label="Coût de la réparation" cents={draft.costCents} onChange={(c) => setDraft({ ...draft, costCents: c })} />
              <Input label="Justificatif" value={draft.justification ?? ''} onChange={(v) => setDraft({ ...draft, justification: v })} placeholder="Devis n° 124 de Peinture Martin, 2 octobre" hint="Une retenue doit être justifiée : devis, facture ou constat." maxLength={160} />
              <NumberField label="Part due à l’usure (facultatif)" value={draft.wearPct} onChange={(n) => setDraft({ ...draft, wearPct: n === null ? null : Math.round(Math.min(100, Math.max(0, n))) })} suffix="%" step="int" hint="Si l’élément était déjà ancien : selon la grille de vétusté du bail, ou votre estimation." />
              {draft.costCents ? <Line label="Retenue sur le dépôt" value={eurosCents(retained(draft.costCents, draft.wearPct))} strong /> : null}
            </>
          ) : null}
          {draft.decision ? <TextArea label="Votre commentaire (facultatif)" value={draft.comment ?? ''} onChange={(v) => setDraft({ ...draft, comment: v })} rows={2} hint="Il figure dans le récapitulatif envoyé à votre locataire." maxLength={1000} /> : null}
          {message ? <Callout tone="warn">{message}</Callout> : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <TextLink onClick={() => { setIndex(null); setDraft(null) }}>Retour à la liste</TextLink>
            <Btn onClick={() => void save()} loading={busy}>
              {lines.some((l, j) => j > index && l.missing) ? 'Élément suivant' : 'Enregistrer'}
            </Btn>
          </div>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {header}
      {!data.hasEntry ? <Callout tone="info">Aucun état des lieux d’entrée n’est enregistré dans Bailio : rien ne peut être comparé automatiquement.</Callout> : null}
      {!lines.length ? (
        <Card pad={28}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Rien n’est plus abîmé qu’à l’entrée.</h2>
          <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Le dépôt de garantie se rend en entier, sauf loyers ou charges restant dus, dans le mois qui suit la remise des clés.</span>
          <div>
            <Btn onClick={() => navigate(`/espace/baux/${id}/courriers?type=DEPOSIT_RETURN`)}>Préparer le solde de tout compte</Btn>
          </div>
        </Card>
      ) : (
        <>
          {firstTodo >= 0 ? (
            <Card pad={28}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                {lines.filter((l) => l.missing).length} élément{lines.filter((l) => l.missing).length > 1 ? 's' : ''} à regarder
              </h2>
              <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>D’après l’état des lieux de sortie{data.exitDate ? ` du ${dateNum(data.exitDate)}` : ''}. Un élément à la fois, avec les photos de l’entrée et de la sortie.</span>
              <div>
                <Btn onClick={() => open(firstTodo)}>Commencer</Btn>
              </div>
            </Card>
          ) : (
            <Card dark title="Retenues pour dégradations" style={{ gap: 12 }}>
              {lines
                .filter((l) => l.decision === 'DAMAGE')
                .map((l) => (
                  <Line key={l.key} dark label={`${l.room}, ${l.label.toLowerCase()}`} value={eurosCents(l.retainedCents)} />
                ))}
              <Line dark strong border label="Total retenu" value={eurosCents(data.totalCents)} />
              <span style={{ fontSize: 13, color: BAI.surface, lineHeight: 1.5 }}>Sur un dépôt de {eurosCents(data.depositCents)}. Les retenues sont reprises dans le solde de tout compte.</span>
            </Card>
          )}
          <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Les éléments</h2>}>
            {lines.map((l, i) => (
              <button key={l.key} type="button" onClick={() => open(i)} style={{ textAlign: 'left', fontFamily: 'inherit', background: 'none', border: 'none', borderTop: `1px solid ${BAI.dividerSoft}`, padding: '10px 0 0', cursor: 'pointer', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {l.room}, {l.label.toLowerCase()}
                  </span>
                  <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                    {l.entryState ?? '?'} → {l.exitState ?? '?'}
                  </span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: l.missing ? BAI.caramelInk : BAI.inkMid }}>{l.missing ? 'À décider' : l.decision === 'WEAR' ? 'Usure normale' : eurosCents(l.retainedCents)}</span>
              </button>
            ))}
          </Card>
          {firstTodo < 0 ? (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Btn onClick={() => navigate(`/espace/baux/${id}/courriers?type=DEPOSIT_RETURN`)}>Préparer le solde de tout compte</Btn>
              <TextLink onClick={() => openPdfFrom(() => pdfUrl(`/leases/${id}/damages.pdf`)).catch(toast.error)}>Voir le récapitulatif (PDF)</TextLink>
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  )
}

function PhotoRow({ title, ids }: { title: string; ids: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: BAI.inkMid }}>{title}</span>
      {ids.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ids.slice(0, 4).map((p, n) => (
            <AuthImage key={p} id={p} alt={`${title}, photo ${n + 1}`} size={96} />
          ))}
        </div>
      ) : (
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pas de photo.</span>
      )}
    </div>
  )
}
