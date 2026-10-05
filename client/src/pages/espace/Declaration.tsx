import { useRef, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Guide } from '../../components/Sources'
import { display } from '../../components/ui'
import { Callout, Card, Chips, Crumbs, Input, LoadError, Loader, Money, NumberField, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
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
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Vos revenus locatifs</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Les montants à reporter sur votre déclaration de revenus, calculés à partir des loyers encaissés et des dépenses enregistrés dans Bailio.</span>
      </div>
      <Chips legend="Année des revenus" value={year} onChange={setYear} options={[thisYear - 2, thisYear - 1, thisYear].map((y) => ({ value: y, label: String(y) }))} />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.properties.length ? (
        <Card>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Aucun loyer encaissé en {year}.</span>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Enregistrez les loyers reçus dans chaque bail : ils seront repris ici.</span>
        </Card>
      ) : (
        <>
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
                  <Money label="Intérêts d’emprunt payés (ligne 250)" cents={data.extras[p.id]?.loanInterestCents ?? null} onChange={(c) => saveExtra(p.id, { loanInterestCents: c })} hint="Sur le tableau d’amortissement de votre banque, pour cette année. Enregistré avec le logement." />
                  <Money label="Honoraires et frais de gestion (ligne 221)" cents={data.extras[p.id]?.adminFeesCents ?? null} onChange={(c) => saveExtra(p.id, { adminFeesCents: c })} hint="Agence, frais de procédure, comptable…" />
                  <Money label="Régularisation des provisions de copropriété de l’an dernier (ligne 230)" cents={data.extras[p.id]?.coproRegularizationCents ?? null} onChange={(c) => saveExtra(p.id, { coproRegularizationCents: c })} hint="Part non déductible des provisions déduites l’an dernier, indiquée sur le décompte annuel du syndic. 0 si vous n’êtes pas en copropriété." />
                </div>
                {p.nonDeductibleCents ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{eurosCents(p.nonDeductibleCents)} de travaux de construction ou d’agrandissement ne se déduisent pas des loyers. Gardez les factures : ils comptent pour la plus-value si vous vendez.</span> : null}
                {p.resultCents < 0 ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Un déficit foncier, hors intérêts d’emprunt, se déduit de votre revenu global dans la limite de 10 700 € par an ; le reste se reporte sur vos revenus fonciers des dix années suivantes.</span> : null}
                {p === data.properties.filter((x) => !x.furnished).at(-1) && data.empty?.deficit && data.empty.better === 'REAL' ? (
                  <Callout tone="info" title="Déficit foncier de l’année">
                    {eurosCents(data.empty.deficit.totalCents)} au total : {eurosCents(data.empty.deficit.globalCents)} à déduire de votre revenu global (case 4BC), {eurosCents(data.empty.deficit.carriedCents)} à reporter sur vos revenus fonciers des dix années suivantes (case 4BD). {data.empty.deficit.ceilingCents && data.empty.deficit.ceilingCents > 1_070_000 ? `Plafond porté à ${eurosCents(data.empty.deficit.ceilingCents)} grâce à vos travaux de rénovation énergétique (le logement doit passer de E, F ou G à A, B, C ou D ; gardez le DPE avant et après).` : 'Le plafond de 10 700 € monte jusqu’à 21 400 € si le déficit vient de travaux de rénovation énergétique : classez-les « Rénovation énergétique ».'}
                  </Callout>
                ) : null}
                {p.unclassifiedCents ? <span style={{ fontSize: 14, color: BAI.caramelInk }}>{eurosCents(p.unclassifiedCents)} de dépenses sont classées « autre » : précisez leur catégorie dans l’onglet Argent pour les déduire.</span> : null}
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
                text="Recettes de l’année, charges comprises, si elles ne dépassent pas 77 700 €."
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
        </>
      )}
    </AppShell>
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
