import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'
import { SignupCta } from '../components/SignupCta'
import { Btn, Callout, Pill, Tabs, Toggle } from '../components/kit'
import { TextField, display } from '../components/ui'
import { DUNNING, HOMES, LEASE_RULES, OWNER, eurosFromCents, euros, frDay, leaseSummary, rentTable, revision, taxFigures, TAX, type LeaseKind } from '../content/demo'

type Tab = 'aujourdhui' | 'loyers' | 'bail' | 'impots'

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'aujourdhui', label: 'Aujourd’hui' },
  { value: 'loyers', label: 'Loyers' },
  { value: 'bail', label: 'Créer un bail' },
  { value: 'impots', label: 'Impôts' },
]

const card = { background: BAI.bg, borderRadius: 24, padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 10 } as const
const h2 = { margin: 0, fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 700, color: BAI.ink } as const
const linkButton = { alignSelf: 'flex-start', background: 'none', border: 'none', padding: '12px 0', fontSize: 16, fontWeight: 600, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' } as const

/** Un résultat apparu après un clic : annoncé aux lecteurs d'écran. */
function Result({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="panel-in" style={{ margin: 0, padding: '12px 14px', borderRadius: 12, background: BAI.greenLight, color: BAI.ink, fontSize: 15, lineHeight: 1.5 }}>
      {children}
    </p>
  )
}

type Done = { rent: boolean; insurance: boolean; revision: boolean }

function Today({ now, done, setDone }: { now: Date; done: Done; setDone: (d: Done) => void }) {
  const lyon = HOMES[0]
  const month = now.toLocaleDateString('fr-FR', { month: 'long' })
  const rev = revision(lyon.rentCents / 100)
  const tasks = [
    {
      key: 'rent' as const,
      title: `Loyer de ${month} de ${lyon.city} pas encore arrivé`,
      detail: `${lyon.tenant}, ${eurosFromCents(lyon.rentCents)} attendus.`,
      action: 'Noter le loyer reçu',
      result: `Quittance envoyée par email à ${lyon.tenant} (${lyon.email}) le ${frDay(now)}.`,
    },
    {
      key: 'insurance' as const,
      title: `Attestation d’assurance à demander à ${HOMES[1].tenant}`,
      detail: `Studio de ${HOMES[1].city} : l’attestation du locataire manque.`,
      action: 'Demander l’attestation',
      result: `Lien envoyé à ${HOMES[1].tenant} (${HOMES[1].email}). Il dépose son attestation sans créer de compte.`,
    },
    {
      key: 'revision' as const,
      title: `Révision du loyer possible à ${lyon.city}`,
      detail: 'La date anniversaire du bail approche.',
      action: 'Réviser le loyer',
      result: `${euros(lyon.rentCents / 100)} devient ${euros(rev.next)} (${rev.percent > 0 ? '+' : ''}${rev.percent.toLocaleString('fr-FR')} %). Calcul : ${euros(lyon.rentCents / 100)} × ${String(148.07).replace('.', ',')} ÷ ${String(145.78).replace('.', ',')}, d’après l’indice des loyers (IRL).`,
    },
  ]
  return (
    <section aria-labelledby="demo-today" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 id="demo-today" style={h2}>
        Bonjour {OWNER.name}, 3 choses à faire
      </h2>
      {tasks.map((t) => (
        <article key={t.key} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 17, lineHeight: 1.35, color: BAI.ink }}>{t.title}</strong>
            <Pill tone={done[t.key] ? 'green' : 'muted'}>{done[t.key] ? 'Fait' : 'À faire'}</Pill>
          </div>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>{t.detail}</span>
          {done[t.key] ? <Result>{t.result}</Result> : <Btn variant="outline" onClick={() => setDone({ ...done, [t.key]: true })}>{t.action}</Btn>}
        </article>
      ))}
    </section>
  )
}

function Rents({ now, done }: { now: Date; done: Done }) {
  const [auto, setAuto] = useState(false)
  const rows = rentTable(now, done.rent)
  return (
    <section aria-labelledby="demo-rents" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 id="demo-rents" style={h2}>
        Les 6 derniers mois
      </h2>
      <div role="region" aria-label="Tableau des loyers" tabIndex={0} style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520, fontSize: 15 }}>
          <caption className="sr-only">Loyers des 6 derniers mois par logement</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left', padding: '10px 8px', color: BAI.ink }}>
                Logement
              </th>
              {rows[0].cells.map((c) => (
                <th key={c.key} scope="col" style={{ textAlign: 'left', padding: '10px 8px', color: BAI.ink, whiteSpace: 'nowrap' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.home.id} style={{ borderTop: `1px solid ${BAI.divider}` }}>
                <th scope="row" style={{ textAlign: 'left', padding: '12px 8px', color: BAI.ink, fontWeight: 600 }}>
                  {r.home.city}
                  <br />
                  <span style={{ fontWeight: 400, color: BAI.inkSoft }}>{r.home.tenant}</span>
                </th>
                {r.cells.map((c) => (
                  <td key={c.key} style={{ padding: '12px 8px' }}>
                    <Pill tone={c.state === 'PAID' ? 'green' : 'error'}>{c.state === 'PAID' ? 'Payé' : 'Impayé'}</Pill>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={card}>
        <Toggle border={false} checked={auto} onChange={setAuto} label="Relancer automatiquement un loyer impayé" sub="Désactivé tant que vous ne l’activez pas." />
        {auto ? (
          <ol className="panel-in" aria-label="Calendrier des relances" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DUNNING.map((d) => (
              <li key={d.day} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <strong style={{ minWidth: 44, color: BAI.owner }}>J+{d.day}</strong>
                <span>
                  <strong>{d.name}</strong>
                  <br />
                  <span style={{ color: BAI.inkMid, fontSize: 15 }}>{d.text}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}

function LeaseTab({ now }: { now: Date }) {
  const { q, go } = useQuestion(4)
  const [kind, setKind] = useState<LeaseKind | null>(null)
  const [rent, setRent] = useState('')
  const [start, setStart] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
  const [error, setError] = useState<string | null>(null)
  const rentNumber = Number(rent.replace(',', '.').replace(/\s/g, ''))
  const rentOk = Number.isFinite(rentNumber) && rentNumber >= 10 && rentNumber <= 20000
  const step = !kind ? 1 : q >= 3 && !rentOk ? 2 : q >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(start) ? 3 : q
  const nextRent = () => {
    if (!rentOk) return setError('Indiquez un loyer entre 10 € et 20 000 €.')
    go(3)
  }
  if (step === 1)
    return (
      <QuestionScreen q={1} count={3} title="Votre logement est…" hideNext>
        <Choices legend="Type de location" columns value={kind} options={[{ value: 'VIDE', label: 'Vide', hint: 'sans meubles' }, { value: 'MEUBLE', label: 'Meublé' }]} onPick={(v) => (setKind(v), go(2))} />
      </QuestionScreen>
    )
  if (step === 2)
    return (
      <QuestionScreen
        q={2}
        count={3}
        title="Quel est le loyer ?"
        onBack={() => go(1)}
        onNext={nextRent}
        hideNext
      >
        <TextField label="Loyer hors charges, en euros par mois" name="demo-rent" inputMode="decimal" suffix="€" value={rent} error={error ?? undefined} onChange={(e) => (setRent(e.target.value), setError(null))} />
        <Btn variant="outline" onClick={nextRent}>
          Continuer
        </Btn>
      </QuestionScreen>
    )
  if (step === 3)
    return (
      <QuestionScreen q={3} count={3} title="Quand le locataire entre-t-il ?" onBack={() => go(2)} onNext={() => start && go(4)} hideNext>
        <TextField label="Date d’entrée du locataire" name="demo-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Btn variant="outline" onClick={() => start && go(4)}>
          Voir le bail
        </Btn>
      </QuestionScreen>
    )
  const s = leaseSummary(kind!, rentNumber, start)
  const rows: Array<[string, string, string]> = [
    ['Durée du bail', `${s.years} ${s.years > 1 ? 'ans' : 'an'}, jusqu’au ${s.end}`, kind === 'VIDE' ? 'Trois ans en location vide.' : 'Un an en location meublée.'],
    ['Dépôt de garantie', `${euros(s.depositMax)} au plus`, `${s.depositMonths} mois de loyer hors charges. C’est une somme versée à l’entrée et rendue à la sortie.`],
    ['Votre préavis', `${s.noticeMonths} mois avant la fin`, 'Le délai pour prévenir votre locataire si vous voulez qu’il parte.'],
  ]
  return (
    <section aria-labelledby="demo-lease" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 id="demo-lease" style={h2}>
        Règles appliquées automatiquement
      </h2>
      <p style={{ margin: 0, color: BAI.inkMid }}>
        Logement {LEASE_RULES[kind!].label}, loyer de {euros(rentNumber)}.
      </p>
      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(([k, v, why]) => (
          <div key={k} style={card}>
            <dt style={{ fontSize: 15, color: BAI.inkMid }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 20, fontWeight: 700, color: BAI.ink }}>{v}</dd>
            <dd style={{ margin: 0, fontSize: 14, color: BAI.inkSoft }}>{why}</dd>
          </div>
        ))}
      </dl>
      <Callout tone="ok" title="Votre bail serait prêt à signer en ligne">
        Le locataire le signe depuis son téléphone, sans créer de compte.
      </Callout>
      <button type="button" onClick={() => (setKind(null), setRent(''), go(1))} style={linkButton}>
        Refaire avec d’autres réponses
      </button>
    </section>
  )
}

function Taxes() {
  const [regime, setRegime] = useState<'MICRO' | 'REEL'>('MICRO')
  const t = taxFigures()
  return (
    <section aria-labelledby="demo-tax" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 id="demo-tax" style={h2}>
        Loyers {TAX.year}, exemple chiffré
      </h2>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TAX.rents.map((r) => (
          <li key={r.home.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${BAI.divider}` }}>
            <span>
              {r.home.name}, {r.home.city}
            </span>
            <strong>{eurosFromCents(r.yearCents)}</strong>
          </li>
        ))}
        <li style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
          <span>Total des loyers bruts</span>
          <strong>{eurosFromCents(t.gross)}</strong>
        </li>
      </ul>
      <Choices
        legend="Régime d’imposition"
        value={regime}
        options={[
          { value: 'MICRO', label: 'Micro-foncier', hint: 'abattement forfaitaire de 30 %' },
          { value: 'REEL', label: 'Réel', hint: 'vos charges réelles' },
        ]}
        onPick={setRegime}
      />
      <div style={card} aria-live="polite">
        {regime === 'MICRO' ? (
          <>
            <span style={{ fontSize: 15, color: BAI.inkMid }}>Case 4BE de la déclaration 2042-C</span>
            <strong style={{ fontSize: 28, color: BAI.ink }}>{eurosFromCents(t.gross)}</strong>
            <span style={{ fontSize: 15, color: BAI.inkMid }}>
              Vous recopiez les loyers bruts. L’abattement de 30 % ({eurosFromCents(t.allowance)}) est retiré par l’administration : il reste {eurosFromCents(t.micro)} à imposer.
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 15, color: BAI.inkMid }}>Résultat à reporter case 4BA</span>
            <strong style={{ fontSize: 28, color: BAI.ink }}>{eurosFromCents(t.real)}</strong>
            <span style={{ fontSize: 15, color: BAI.inkMid }}>
              Loyers {eurosFromCents(t.gross)} moins charges {eurosFromCents(t.charges)} ({TAX.charges.map((c) => c.label.toLowerCase()).join(', ')}).
            </span>
          </>
        )}
      </div>
      <Callout tone="tip" title={t.best === 'REEL' ? 'Dans cet exemple, le réel coûte moins d’impôt' : 'Dans cet exemple, le micro-foncier coûte moins d’impôt'}>
        Avec Bailio, ces chiffres viennent de vos loyers et dépenses enregistrés. Exemple, pas un conseil fiscal.
      </Callout>
    </section>
  )
}

/** « Essayez Bailio sans compte » : un espace d'exemple manipulable, entièrement dans le navigateur (content/demo.ts). */
export default function Demo() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('onglet')
  const tab: Tab = TABS.some((t) => t.value === raw) ? (raw as Tab) : 'aujourdhui'
  const [now] = useState(() => new Date())
  const [done, setDone] = useState<Done>({ rent: false, insurance: false, revision: false })
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.surface }}>
      <SiteHeader />
      <main className="container" style={{ flex: 1, maxWidth: 800, paddingTop: 32, paddingBottom: 72 }}>
        <h1 style={display('clamp(36px, 6.5vw, 56px)', { margin: '0 0 12px' })}>
          Essayez Bailio, <em>sans compte.</em>
        </h1>
        <p style={{ margin: '0 0 24px', color: BAI.inkMid, fontSize: 17 }}>Données d’exemple : rien n’est enregistré.</p>
        <Tabs label="Parties de la démo" tabs={TABS} value={tab} onChange={(v) => setParams(v === 'aujourdhui' ? {} : { onglet: v }, { replace: true })} />
        <div className="panel-in" key={tab} style={{ paddingTop: 24 }}>
          {tab === 'aujourdhui' ? <Today now={now} done={done} setDone={setDone} /> : null}
          {tab === 'loyers' ? <Rents now={now} done={done} /> : null}
          {tab === 'bail' ? <LeaseTab now={now} /> : null}
          {tab === 'impots' ? <Taxes /> : null}
        </div>
        <SignupCta text="Dans votre espace, tout cela se fait avec vos vrais logements et vos vrais locataires : les courriers partent, les montants et les dates sont justes." />
      </main>
      <SiteFooter />
    </div>
  )
}
