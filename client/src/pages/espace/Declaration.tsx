import { useRef, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Guide } from '../../components/Sources'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Check, Chips, Crumbs, Input, Line, LoadError, Loader, Money, NumberField, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { downloadDoc } from '../../lib/docs'
import { eurosCents } from '../../lib/format'

interface TaxLine {
  line: string
  label: string
  cents: number
}
interface PropertyTax {
  id: string
  name: string
  furnished: boolean
  rentCents: number
  chargesCents: number
  unclassifiedCents: number
  nonDeductibleCents?: number
  lines: TaxLine[]
  resultCents: number
}
interface TaxView {
  year: number
  properties: PropertyTax[]
  empty: { grossRentCents: number; microAllowed: boolean; microTaxableCents: number; realResultCents: number; better: 'MICRO' | 'REAL' | null; deficit?: { totalCents: number; globalCents: number; carriedCents: number; ceilingCents?: number } | null } | null
  furnished: { receiptsCents: number; microAllowed: boolean; microTaxableCents: number } | null
  lmnp?: { receiptsCents: number; chargesCents: number; resultBeforeAmortCents: number; amortYearCents: number; amortAvailableCents: number; amortUsedCents: number; amortCarriedCents: number; deficitCents: number; taxableCents: number; microTaxableCents: number; better: 'MICRO' | 'REAL'; missingPurchase: boolean } | null
  lmnpSettings?: Record<string, { name: string; purchase: { priceCents?: number | null; date?: string | null } | null; landSharePercent: number | null; furnitureCents: number | null }>
  unassignedExpensesCents: number
  extras: Record<string, { loanInterestCents?: number | null; adminFeesCents?: number | null; coproRegularizationCents?: number | null; lmnpCarriedCents?: number | null }>
  /** Ligne 250 calculée depuis les emprunts du logement (reprise quand rien n'est saisi). */
  loanComputed?: Record<string, number>
  /** SCI et sociétés : leur propre fiche (formulaires, dates, montants, parts des associés). */
  structures?: StructureSheet[]
  /** Préparer le dépôt : documents, étapes, liens et contacts, situation par situation. */
  filing?: FilingGuide[]
  contacts?: Contact[]
  /** Case par case, ce qu'il faut saisir sur impots.gouv.fr (domain/taxForms.ts). */
  copy?: CopyGroup[]
  /** Formulaires officiels pré-remplis proposés. */
  forms?: { f2044: boolean; cfe: Array<{ propertyId: string; name: string }> }
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
  steps: string[]
  entries: CopyEntry[]
  note?: string
}
interface FilingLink {
  label: string
  url: string
}
interface FilingGuide {
  id: string
  title: string
  summary: string
  deadline: string | null
  documents: Array<{ label: string; detail?: string; bailio?: boolean }>
  steps: Array<{ title: string; detail?: string; link?: FilingLink }>
  links: FilingLink[]
  watch: string[]
  structure?: string
  alternative?: boolean
}
interface Contact {
  label: string
  value: string
  detail: string
  url?: string
}
interface StructureSheet {
  id: string
  name: string
  properties: string[]
  sheet: null | {
    kind: string
    title: string
    steps: Array<{ title: string; form?: string; deadline?: string; lines: Array<{ label: string; cents?: number; text?: string }>; note?: string }>
    shares: Array<{ name: string; pct: number; resultCents: number }>
    sources: Array<{ label: string; url: string }>
  }
}

const thisYear = new Date().getFullYear()

/**
 * Aide à la déclaration des revenus locatifs : Bailio additionne les loyers encaissés et les dépenses de l'année,
 * et indique les montants à reporter (micro-foncier, régime réel 2044, micro-BIC). Le propriétaire vérifie.
 */
export default function Declaration() {
  const [year, setYear] = useState(thisYear - 1)
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<TaxView>(`/money/tax?year=${year}`), [year])
  // Enregistré quelques instants après la saisie, puis le calcul est relancé.
  const timers = useRef<Record<string, number>>({})
  // Réglages du meublé au réel (terrain, mobilier, prix d'achat), gardés dans la fiche du logement.
  const saveTo = (path: string, body: Record<string, unknown>) => {
    window.clearTimeout(timers.current[path])
    timers.current[path] = window.setTimeout(() => {
      api(path, { method: 'PUT', body })
        .then(() => reload())
        .catch((e) => toast.error(e))
    }, 700)
  }
  const saveExtra = (propertyId: string, patch: { loanInterestCents?: number | null; adminFeesCents?: number | null; coproRegularizationCents?: number | null; lmnpCarriedCents?: number | null }) => {
    const key = `${propertyId}:${Object.keys(patch)[0]}`
    window.clearTimeout(timers.current[key])
    timers.current[key] = window.setTimeout(() => {
      api(`/properties/${propertyId}/tax/${year}`, { method: 'PUT', body: patch })
        .then(() => reload())
        .catch((e) => toast.error(e))
    }, 700)
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Argent', to: '/espace/argent' }, { label: 'Déclaration de revenus' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Déclarer vos revenus locatifs</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>
          Bailio reprend les loyers encaissés et les dépenses de l’année, et vous donne, case par case, ce qu’il faut saisir sur impots.gouv.fr. Les formulaires à envoyer sont remplis pour vous.
        </span>
        <a href="#depot" style={{ fontSize: 15, fontWeight: 600, color: BAI.owner, textDecoration: 'none' }}>
          Dates limites, documents à réunir et contacts <span aria-hidden>↓</span>
        </a>
      </div>
      <Chips legend="Année des revenus" value={year} onChange={setYear} options={[thisYear - 2, thisYear - 1, thisYear].map((y) => ({ value: y, label: String(y) }))} />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.properties.length && data.structures?.length ? (
        <>
          <StructureSheets list={data.structures} year={year} />
          <Filing guides={data.filing ?? []} contacts={data.contacts ?? []} year={year} />
        </>
      ) : !data.properties.length ? (
        <Card>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Aucun loyer encaissé en {year}.</span>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Enregistrez les loyers reçus dans chaque bail : ils seront repris ici.</span>
        </Card>
      ) : (
        <>
          <DeclarePlan data={data} year={year} />
          <h2 style={{ margin: '12px 0 0', fontSize: 22, fontWeight: 700 }}>Le détail des calculs</h2>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5, marginTop: -8 }}>Comparez les régimes, et complétez ce que Bailio ne peut pas savoir (intérêts d’emprunt, honoraires, régularisation de copropriété) : les montants à recopier se mettent à jour.</span>
          {data.empty ? (
            <Card title="Location vide : revenus fonciers" action={<Guide to="impotsVide" label="Fiche officielle" />}>
              <div className="grid-2" style={{ gap: 14 }}>
                <Regime
                  title="Micro-foncier"
                  better={data.empty.better === 'MICRO'}
                  disabled={!data.empty.microAllowed}
                  lines={data.empty.microAllowed ? [['Case 4BE de la déclaration 2042', eurosCents(data.empty.grossRentCents)], ['Imposé après l’abattement de 30 %', eurosCents(data.empty.microTaxableCents)]] : [['Non disponible', 'loyers de plus de 15 000 €']]}
                  text="Automatique si vos loyers de l’année ne dépassent pas 15 000 € : l’administration retire 30 % pour vos frais."
                />
                <Regime
                  title="Régime réel"
                  better={data.empty.better === 'REAL'}
                  lines={[[data.empty.realResultCents >= 0 ? 'Revenu foncier net (2044)' : 'Déficit foncier (2044)', eurosCents(Math.abs(data.empty.realResultCents))]]}
                  text="Vos dépenses réelles sont déduites ligne par ligne (déclaration 2044). Ce choix vous engage pour trois ans."
                />
              </div>
              {data.empty.better ? (
                <Callout tone="tip">
                  D’après vos chiffres, le {data.empty.better === 'MICRO' ? 'micro-foncier' : 'régime réel'} est le plus avantageux{data.empty.microAllowed ? '' : ', et il est obligatoire au-delà de 15 000 € de loyers'}.
                </Callout>
              ) : null}
            </Card>
          ) : null}
          {data.properties
            .filter((p) => !p.furnished)
            .map((p) => (
              <Card key={p.id} title={`${p.name} : déclaration 2044`}>
                {p.lines.map((l) => (
                  <div key={l.line} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, borderTop: l.line === '211' ? 'none' : `1px solid ${BAI.dividerSoft}`, paddingTop: l.line === '211' ? 0 : 8 }}>
                    <span>
                      <span style={{ color: BAI.inkSoft, fontVariantNumeric: 'tabular-nums' }}>Ligne {l.line}</span> · {l.label}
                    </span>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{l.line === '211' ? eurosCents(l.cents) : l.cents < 0 ? `+ ${eurosCents(-l.cents)}` : `- ${eurosCents(l.cents)}`}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: `1px solid ${BAI.divider}`, paddingTop: 10 }}>
                  <span>{p.resultCents >= 0 ? 'Revenu net' : 'Déficit'}</span>
                  <span>{eurosCents(Math.abs(p.resultCents))}</span>
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <Money
                    label="Intérêts, assurance et frais d’emprunt (ligne 250)"
                    cents={data.extras[p.id]?.loanInterestCents ?? null}
                    onChange={(c) => saveExtra(p.id, { loanInterestCents: c })}
                    hint={data.loanComputed?.[p.id] ? `Calculé depuis l’emprunt du logement : ${eurosCents(data.loanComputed[p.id])}, repris si vous laissez vide. Le tableau de votre banque fait foi.` : 'Sur le tableau d’amortissement de votre banque, pour cette année. Ou renseignez l’emprunt du logement : Bailio le calcule.'}
                  />
                  <Money label="Honoraires et frais de gestion (ligne 221)" cents={data.extras[p.id]?.adminFeesCents ?? null} onChange={(c) => saveExtra(p.id, { adminFeesCents: c })} hint="Honoraires de l’agence qui gère le logement (sur son relevé annuel), frais de procédure, comptable…" />
                  <Money label="Régularisation des provisions de copropriété de l’an dernier (ligne 230)" cents={data.extras[p.id]?.coproRegularizationCents ?? null} onChange={(c) => saveExtra(p.id, { coproRegularizationCents: c })} hint="Part non déductible des provisions déduites l’an dernier, indiquée sur le décompte annuel du syndic. 0 si vous n’êtes pas en copropriété." />
                </div>
                {p.nonDeductibleCents ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{eurosCents(p.nonDeductibleCents)} de travaux de construction ou d’agrandissement ne se déduisent pas des loyers. Gardez les factures : ils comptent pour la plus-value si vous vendez.</span> : null}
                {p.resultCents < 0 ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Un déficit foncier, hors intérêts d’emprunt, se déduit de votre revenu global dans la limite de 10 700 € par an ; le reste se reporte sur vos revenus fonciers des dix années suivantes.</span> : null}
                {p === data.properties.filter((x) => !x.furnished).at(-1) && data.empty?.deficit && data.empty.better === 'REAL' ? (
                  <Callout tone="info" title="Déficit foncier de l’année">
                    {eurosCents(data.empty.deficit.totalCents)} au total : {eurosCents(data.empty.deficit.globalCents)} à déduire de votre revenu global (case 4BC), {eurosCents(data.empty.deficit.carriedCents)} à reporter sur vos revenus fonciers des dix années suivantes (case 4BB). {data.empty.deficit.ceilingCents && data.empty.deficit.ceilingCents > 1_070_000 ? `Plafond porté à ${eurosCents(data.empty.deficit.ceilingCents)} grâce à vos travaux de rénovation énergétique (le logement doit passer de E, F ou G à A, B, C ou D ; gardez le DPE avant et après).` : 'Le plafond de 10 700 € monte jusqu’à 21 400 € si le déficit vient de travaux de rénovation énergétique : classez-les « Rénovation énergétique ».'}
                  </Callout>
                ) : null}
                {p.unclassifiedCents ? <span style={{ fontSize: 14, color: BAI.accentInk }}>{eurosCents(p.unclassifiedCents)} de dépenses sont classées « autre » : précisez leur catégorie dans l’onglet Argent pour les déduire.</span> : null}
              </Card>
            ))}
          {data.furnished ? (
            <Card title="Location meublée : loueur en meublé non professionnel" action={<Guide to="impotsMeuble" label="Fiche officielle" />}>
              <Regime
                title="Micro-BIC"
                disabled={!data.furnished.microAllowed}
                lines={[
                  ['Case 5NI de la déclaration 2042-C-PRO (5OI pour le second déclarant)', eurosCents(data.furnished.receiptsCents)],
                  ['Imposé après l’abattement de 50 %', eurosCents(data.furnished.microTaxableCents)],
                ]}
                better={data.lmnp ? data.lmnp.better === 'MICRO' : true}
                text={`Recettes de l’année, charges comprises, si elles ne dépassent pas ${year >= 2026 ? '83 600' : '77 700'} €.`}
              />
              {data.lmnp ? (
                <Regime
                  title="Régime réel (estimation)"
                  better={data.lmnp.better === 'REAL'}
                  lines={[
                    ['Recettes', eurosCents(data.lmnp.receiptsCents)],
                    ['Charges, intérêts et frais', `- ${eurosCents(data.lmnp.chargesCents)}`],
                    ['Amortissements déduits', `- ${eurosCents(data.lmnp.amortUsedCents)}`],
                    ['Résultat imposable estimé', eurosCents(data.lmnp.taxableCents)],
                    ...(data.lmnp.amortCarriedCents ? ([['Amortissements reportés aux années suivantes', eurosCents(data.lmnp.amortCarriedCents)]] as Array<[string, string]>) : []),
                    ...(data.lmnp.deficitCents ? ([['Déficit reportable 10 ans (location meublée)', eurosCents(data.lmnp.deficitCents)]] as Array<[string, string]>) : []),
                  ]}
                  text="Amortissement simplifié : logement hors terrain sur 30 ans, mobilier sur 7 ans, travaux d’amélioration sur 15 ans. Il ne peut pas créer de déficit : le reste est reporté. Pour opter pour le réel, la liasse 2031 se fait avec un expert-comptable ou un logiciel agréé, et son résultat se reporte case 5NA (bénéfice) ou 5NY (déficit) de la 2042-C-PRO ; depuis 2025, les amortissements déduits sont repris dans la plus-value à la vente."
                />
              ) : null}
              {data.lmnp?.missingPurchase ? <Callout tone="tip">Indiquez le prix d’achat de chaque logement meublé : sans lui, l’amortissement du logement n’est pas compté.</Callout> : null}
              {Object.entries(data.lmnpSettings ?? {}).map(([id, st]) => (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{st.name} : pour le régime réel</span>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <Money label="Prix d’achat (frais de notaire compris)" cents={st.purchase?.priceCents ?? null} onChange={(c) => saveTo(`/properties/${id}/purchase`, { priceCents: c, date: st.purchase?.date ?? null })} />
                    <Input label="Date d’achat ou de première location" type="date" value={st.purchase?.date ?? ''} onChange={(v) => saveTo(`/properties/${id}/purchase`, { priceCents: st.purchase?.priceCents ?? null, date: v || null })} />
                    <NumberField label="Part du terrain dans le prix (%)" value={st.landSharePercent ?? 15} onChange={(v) => saveTo(`/properties/${id}/lmnp`, { landSharePercent: v })} hint="Le terrain ne s’amortit pas : 15 % est courant en appartement, davantage en maison." />
                    <Money label="Valeur du mobilier" cents={st.furnitureCents ?? null} onChange={(c) => saveTo(`/properties/${id}/lmnp`, { furnitureCents: c })} />
                    <Money label="Amortissements reportés des années précédentes" cents={data.extras[id]?.lmnpCarriedCents ?? null} onChange={(c) => saveExtra(id, { lmnpCarriedCents: c })} hint="Sur la liasse de l’an dernier, s’il y en a." />
                  </div>
                </div>
              ))}
            </Card>
          ) : null}
          {data.unassignedExpensesCents ? <Callout tone="warn">{eurosCents(data.unassignedExpensesCents)} de dépenses ne sont rattachées à aucun logement : elles ne sont pas comptées. <TextLink to="/espace/argent" style={{ fontSize: 13 }}>Les rattacher</TextLink></Callout> : null}
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
            Sommes encaissées ou payées entre le 1er janvier et le 31 décembre {year}. Bailio vous aide à préparer votre déclaration ; vous restez responsable des montants déclarés sur impots.gouv.fr. Votre situation est particulière (indivision, société, plusieurs régimes) ? Demandez conseil au centre des impôts.
          </span>
          {data.structures?.length ? <StructureSheets list={data.structures} year={year} /> : null}
          <Filing guides={data.filing ?? []} contacts={data.contacts ?? []} year={year} />
        </>
      )}
    </AppShell>
  )
}

const euros = (cents: number) => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`
const boxLabel = (box: string) => (/^[45][A-Z]{2}$/.test(box) ? `Case ${box}` : /^\d/.test(box) ? `Ligne ${box}` : box)

/**
 * Déclarer en trois étapes : ce qu'il faut remplir, les cases à recopier (bouton « Copier » sur chaque montant, en euros
 * entiers comme le demande l'administration), puis les formulaires officiels pré-remplis à télécharger.
 */
function DeclarePlan({ data, year }: { data: TaxView; year: number }) {
  const toast = useToast()
  const groups = data.copy ?? []
  const forms = data.forms ?? { f2044: false, cfe: [] }
  const has = (id: string) => groups.some((g) => g.id === id)
  const deadline = data.filing?.find((g) => ['VIDE_MICRO', 'VIDE_REEL', 'MEUBLE_MICRO', 'MEUBLE_REEL'].includes(g.id))?.deadline
  const todo: Array<{ title: string; detail: string }> = []
  if (groups.length) todo.push({ title: 'Votre déclaration de revenus (2042), en ligne', detail: deadline ? `Sur impots.gouv.fr. Date limite : ${deadline}.` : 'Sur impots.gouv.fr, au printemps.' })
  if (has('VIDE_2044')) todo.push({ title: 'L’annexe 2044 : revenus fonciers au régime réel', detail: 'Elle se remplit dans la même déclaration en ligne, une colonne par logement loué vide.' })
  if (has('MEUBLE_MICRO') || has('MEUBLE_REEL')) todo.push({ title: 'L’annexe 2042-C-PRO : location meublée', detail: has('MEUBLE_REEL') ? 'Dans la même déclaration en ligne, avec le résultat de votre liasse 2031 (expert-comptable).' : 'Dans la même déclaration en ligne : une seule case.' })
  for (const c of forms.cfe) todo.push({ title: `La déclaration initiale de CFE (1447-C-SD) : ${c.name}`, detail: 'Première année en meublé : à envoyer avant le 31 décembre au service des impôts des entreprises. Elle est remplie pour vous plus bas.' })
  for (const st of data.structures ?? []) if (st.sheet) todo.push({ title: `${st.name} : ${st.sheet.title}`, detail: 'La société déclare elle-même ses résultats : voir sa fiche plus bas.' })
  if (data.filing?.some((g) => g.id === 'OCCUPATION')) todo.push({ title: 'La déclaration d’occupation de vos logements', detail: 'Un occupant a changé : à mettre à jour dans « Gérer mes biens immobiliers » sur impots.gouv.fr.' })

  const copy = async (e: CopyEntry) => {
    const value = e.cents !== undefined ? String(Math.round(e.cents / 100)) : e.text ?? ''
    try {
      await navigator.clipboard.writeText(value)
      toast.show(`${boxLabel(e.box)} copiée : ${value}`)
    } catch {
      toast.show('Sélectionnez le montant puis copiez-le.', 'error')
    }
  }
  const download = (path: string, name: string) => downloadDoc(path, name).catch(toast.error)

  return (
    <>
      <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>1. Ce que vous devez remplir</h2>}>
        {todo.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todo.map((t) => (
              <li key={t.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span aria-hidden style={{ width: 24, height: 24, borderRadius: 12, background: BAI.ownerTint, color: BAI.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5 10 17 19 7" />
                  </svg>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <strong style={{ fontSize: 16 }}>{t.title}</strong>
                  <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{t.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Rien à déclarer pour vos logements en nom propre cette année.</span>
        )}
      </Card>

      {groups.length ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>2. À recopier sur impots.gouv.fr</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Dans l’ordre de la déclaration en ligne. Les montants sont en euros entiers, sans centimes, comme le demande l’administration. Un clic sur « Copier », puis collez dans la case.</span>
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`copy-${g.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <h3 id={`copy-${g.id}`} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {g.title}
                </h3>
                <Pill tone="owner">Formulaire {g.form}</Pill>
              </div>
              <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.5 }}>
                {g.steps.map((st) => (
                  <li key={st}>{st}</li>
                ))}
              </ol>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g.entries.map((e, k) => (
                  <div key={`${e.box}-${k}`} className={e.text !== undefined ? 'copy-row copy-row--text' : 'copy-row'} style={{ background: e.text !== undefined ? BAI.bg : BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: '12px 14px' }}>
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
                      <Btn variant="outline" size="sm" onClick={() => copy(e)} title={`Copier : ${boxLabel(e.box)}`}>
                        Copier
                      </Btn>
                    </span>
                  </div>
                ))}
              </div>
              {g.note ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{g.note}</span> : null}
            </section>
          ))}
        </Card>
      ) : null}

      <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{groups.length ? '3' : '2'}. Vos formulaires pré-remplis</h2>}>
        <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Les formulaires officiels d’impots.gouv.fr, remplis avec vos chiffres. Relisez-les : vous restez responsable de ce que vous déclarez.</span>
        {forms.f2044 ? (
          <FormRow title="Déclaration des revenus fonciers 2044" detail="Pour vérifier votre saisie en ligne, ou à joindre si vous déclarez sur papier." onClick={() => download(`/money/tax/2044.pdf?year=${year}`, `2044-revenus-${year}.pdf`)} label="Télécharger la 2044" />
        ) : null}
        {forms.cfe.map((c) => (
          <FormRow
            key={c.propertyId}
            title={`Déclaration initiale de CFE 1447-C-SD : ${c.name}`}
            detail="Ajoutez votre numéro SIRET, datez, signez, puis envoyez-la au service des impôts des entreprises du logement, par la messagerie de votre espace professionnel ou par courrier, avant le 31 décembre."
            onClick={() => download(`/money/tax/1447-c-sd.pdf?propertyId=${c.propertyId}`, '1447-c-sd.pdf')}
            label="Télécharger la 1447-C-SD"
          />
        ))}
        <FormRow title="Votre fiche récapitulative Bailio" detail="Tous vos montants, les étapes, les liens officiels et les contacts, sur une page à garder." onClick={() => download(`/money/tax/fiche.pdf?year=${year}`, `bailio-declaration-${year}.pdf`)} label="Télécharger la fiche" />
      </Card>

      <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Votre cas est particulier ?</h2>}>
        <Special title="Une agence gère le logement" text="Vous déclarez vous-même, comme si vous gériez seul. L’agence vous envoie chaque année un relevé de gestion : déclarez les loyers bruts, avant ses honoraires, et ses honoraires en frais de gestion (ligne 221 de la 2044, à saisir plus bas). Au micro-foncier, seuls les loyers bruts comptent." />
        <Special title="Vous louez à deux (couple, indivision)" text="Mariés ou pacsés : une seule déclaration pour le foyer, avec tous les loyers. En indivision hors couple : chacun déclare sa part des loyers et des charges, selon ses droits dans le bien." />
        <Special title="Le logement appartient à une SCI ou à une société" text="La société a sa propre déclaration : 2072 pour une SCI à l’impôt sur le revenu, 2065 à l’impôt sur les sociétés. Chaque associé reporte ensuite sa part. Rattachez le logement à sa structure pour obtenir sa fiche." link={{ to: '/espace/structures', label: 'Vos structures' }} />
        <Special title="Location meublée de plus de 23 000 € par an" text="Si vos recettes meublées dépassent 23 000 € et vos autres revenus d’activité, vous êtes loueur professionnel (LMP) : cotisations sociales et règles différentes. Faites-vous accompagner par un expert-comptable." />
      </Card>
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

function Special({ title, text, link }: { title: string; text: string; link?: { to: string; label: string } }) {
  return (
    <details style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
      <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 700, color: BAI.ink, minHeight: 32 }}>{title}</summary>
      <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.6, color: BAI.inkMid }}>
        {text} {link ? <TextLink to={link.to}>{link.label}</TextLink> : null}
      </p>
    </details>
  )
}

function Regime({ title, text, lines, better, disabled }: { title: string; text: string; lines: Array<[string, string]>; better?: boolean; disabled?: boolean }) {
  return (
    <div style={{ border: better && !disabled ? `2px solid ${BAI.owner}` : `1px solid ${BAI.divider}`, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, opacity: disabled ? 0.6 : 1 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{title}</span>
        {better && !disabled ? <Pill tone="owner">Le plus avantageux</Pill> : null}
      </span>
      {lines.map(([k, v]) => (
        <span key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 15 }}>
          <span style={{ color: BAI.inkMid }}>{k}</span>
          <strong style={{ whiteSpace: 'nowrap' }}>{v}</strong>
        </span>
      ))}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

/** SCI et sociétés : une fiche par structure, étape par étape, à vérifier avant de déclarer. */
function StructureSheets({ list, year }: { list: StructureSheet[]; year: number }) {
  return (
    <>
      <h2 style={{ margin: '12px 0 0', fontSize: 22, fontWeight: 700 }}>Vos sociétés</h2>
      <Callout tone="warn" title="Aide à vérifier">
        Bailio prépare les chiffres et vous indique les formulaires ; il ne dépose rien. Vérifiez chaque montant, et faites-vous accompagner par un expert-comptable pour une société à l’impôt sur les sociétés.
      </Callout>
      {list.map((st) =>
        st.sheet ? (
          <Card key={st.id} title={<h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{st.name}</h3>}>
            <span style={{ fontSize: 14, color: BAI.inkMid }}>
              {st.sheet.title} · revenus {year} · {st.properties.join(', ')}
            </span>
            <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {st.sheet.steps.map((step) => (
                <li key={step.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{step.title}</strong>
                  {step.form ? <span style={{ fontSize: 15 }}>Formulaire : {step.form}.</span> : null}
                  {step.deadline ? <span style={{ fontSize: 15, color: BAI.accentInk, fontWeight: 600 }}>À déposer avant le {step.deadline}.</span> : null}
                  {step.lines.map((l) => (
                    <Line key={l.label} label={l.label} value={l.cents !== undefined ? eurosCents(l.cents) : l.text ?? ''} />
                  ))}
                  {step.note ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{step.note}</span> : null}
                </li>
              ))}
            </ol>
            {st.sheet.shares.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                <strong style={{ fontSize: 15 }}>Part de chaque associé</strong>
                {st.sheet.shares.map((a) => (
                  <Line key={a.name} label={`${a.name} (${a.pct.toLocaleString('fr-FR')} %)`} value={a.resultCents ? eurosCents(a.resultCents) : '—'} />
                ))}
              </div>
            ) : null}
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.6 }}>
              Sources :{' '}
              {st.sheet.sources.map((src, i) => (
                <span key={src.url}>
                  {i ? ' · ' : ''}
                  <a href={src.url} target="_blank" rel="noreferrer" style={{ color: BAI.owner }}>
                    {src.label}
                  </a>
                </span>
              ))}
            </span>
          </Card>
        ) : null,
      )}
    </>
  )
}

const ext = { target: '_blank', rel: 'noreferrer' } as const
const linkStyle = { color: BAI.owner, fontWeight: 600, textDecoration: 'none' } as const
const ExternalLink = ({ link }: { link: FilingLink }) => (
  <a href={link.url} {...ext} style={linkStyle}>
    {link.label} <span aria-hidden>↗</span>
    <span className="sr-only"> (nouvelle fenêtre)</span>
  </a>
)

/**
 * Préparer le dépôt : une situation ouverte à la fois (vide, meublé, début en meublé, SCI, occupation), avec les
 * documents à réunir (à cocher), les étapes sur impots.gouv.fr, les pièges, les liens officiels, puis les contacts.
 * La même fiche se télécharge en PDF, montants compris.
 */
function Filing({ guides, contacts, year }: { guides: FilingGuide[]; contacts: Contact[]; year: number }) {
  const toast = useToast()
  const [open, setOpen] = useState(0)
  const [done, setDone] = useState<Record<string, boolean>>({})
  if (!guides.length) return null
  const g = guides[Math.min(open, guides.length - 1)]
  const key = (label: string) => `${g.id}:${g.structure ?? ''}:${label}`
  const short = (x: FilingGuide) => (x.structure ? x.structure : x.title) + (x.alternative ? ' (autre régime)' : '')
  return (
    <>
      <Card id="depot" title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Préparer votre dépôt</h2>} action={<TextLink onClick={() => downloadDoc(`/money/tax/fiche.pdf?year=${year}`, `bailio-declaration-${year}.pdf`).catch(toast.error)}>Télécharger la fiche (PDF)</TextLink>}>
        <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Ce qu’il vous faut pour déclarer vos revenus {year}, situation par situation : les documents à réunir, les étapes sur impots.gouv.fr et les liens directs.</span>
        {guides.length > 1 ? <Chips legend="Votre situation" value={open} onChange={setOpen} options={guides.map((x, k) => ({ value: k, label: short(x) }))} /> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong style={{ fontSize: 18 }}>{g.title}</strong>
          {g.alternative ? <span style={{ fontSize: 14, color: BAI.inkMid }}>Moins avantageux d’après vos chiffres : à suivre si vous avez déjà choisi ce régime.</span> : null}
          <span style={{ fontSize: 15, lineHeight: 1.5 }}>{g.summary}</span>
          {g.deadline ? <span style={{ fontSize: 15, color: BAI.accentInk, fontWeight: 600, lineHeight: 1.5 }}>Date limite : {g.deadline}.</span> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Documents à réunir</h3>
          {g.documents.map((d) => (
            <Check key={d.label} checked={Boolean(done[key(d.label)])} onChange={(v) => setDone((x) => ({ ...x, [key(d.label)]: v }))} label={d.bailio ? <>{d.label} <Pill tone="owner">Dans Bailio</Pill></> : d.label} sub={d.detail} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Étapes</h3>
          <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {g.steps.map((st) => (
              <li key={st.title} style={{ fontSize: 15, lineHeight: 1.5 }}>
                <strong>{st.title}</strong>
                {st.detail ? ` : ${st.detail}` : ''}
                {st.link ? (
                  <>
                    {st.detail ? ' ' : ' : '}
                    <ExternalLink link={st.link} />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        {g.watch.length ? (
          <Callout tone="tip" title="À savoir">
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.watch.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Callout>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Liens officiels</h3>
          {g.links.map((l) => (
            <span key={l.url} style={{ fontSize: 15 }}>
              <ExternalLink link={l} />
            </span>
          ))}
        </div>
      </Card>
      {contacts.length ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Qui contacter</h2>}>
          {contacts.map((c) => (
            <div key={c.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
              <span style={{ fontSize: 14, color: BAI.inkMid }}>{c.label}</span>
              <strong style={{ fontSize: 16 }}>{c.url ? <a href={c.url} {...ext} style={linkStyle}>{c.value}</a> : c.value}</strong>
              <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>{c.detail}</span>
            </div>
          ))}
        </Card>
      ) : null}
    </>
  )
}
