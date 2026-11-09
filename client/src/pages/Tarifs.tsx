import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { BAI } from "../constants/bailio-tokens";
import { SimplePage } from "../components/SiteChrome";
import { SolutionLinks } from "./Solutions";
import {
  LAUNCH_OFFER,
  MONTHLY_PRICE,
  PARKING_PRICE,
  PRICE_UNIT,
  YEARLY_PRICE,
} from "../config";
import { CALLBACK_PROMISE, INCLUS } from "../content/inclus";

/** « 3,49 € » → 349 centimes. */
const cents = (price: string | null) =>
  price
    ? Math.round(Number(price.replace(/[^\d,]/g, "").replace(",", ".")) * 100)
    : 0;
const euros = (c: number) =>
  (c / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: c % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }) + " €";

/** Ce que Bailio ne fait pas : dit clairement, pour qu'on ne le découvre pas après. */
const NOT_INCLUDED = [
  "L’envoi en recommandé : Bailio prépare la lettre, vous l’envoyez à La Poste ou par un service de recommandé électronique.",
  "La liasse comptable d’une société (2031, 2033, 2065) : Bailio prépare les chiffres, l’expert-comptable la dépose.",
  "L’assurance des loyers impayés : Bailio vous indique Visale, la caution gratuite de l’État, quand votre locataire y a droit.",
];

const FAQ: Array<[string, string]> = [
  [
    "Que se passe-t-il après le mois offert ?",
    "Un email vous prévient avant tout paiement et votre accord vous est demandé. Sans votre accord, rien n’est prélevé et vous gardez votre espace et vos documents.",
  ],
  [
    "Y a-t-il un engagement ?",
    "Non. Vous arrêtez quand vous voulez, en ligne, depuis « Mon compte » : l’abonnement prend fin à la fin de la période payée. Après une souscription, vous avez 14 jours pour changer d’avis.",
  ],
  [
    "Le premier bail est-il vraiment gratuit ?",
    "Oui, le premier bail reste gratuit : vous le préparez en quelques questions et le recevez par email, sans carte bancaire.",
  ],
  [
    "Je loue un garage avec le logement.",
    "Le garage loué avec le logement est compris dans son bail. Le prix garage ne concerne qu’un garage, un box ou une place loué seul, avec son propre bail.",
  ],
  [
    "Mes logements sont dans une SCI.",
    "Même prix. Les structures (SCI, indivision, société) et leurs associés sont compris.",
  ],
  [
    "La signature électronique est-elle en plus ?",
    "Non, elle est comprise pour chaque bail, pour le locataire et le garant, sans paiement à l’acte.",
  ],
  [
    "Et si je pars ?",
    "Toutes vos données s’exportent en un clic : baux, quittances, états des lieux, dépenses (fichier pour le comptable).",
  ],
];

const card: CSSProperties = {
  background: BAI.bg,
  borderRadius: 24,
  padding: "clamp(20px, 4vw, 28px)",
};
const h2: CSSProperties = {
  margin: "44px 0 14px",
  fontSize: 24,
  fontWeight: 700,
  color: BAI.ink,
  lineHeight: 1.25,
};
const pill = (on: boolean): CSSProperties => ({
  minHeight: 44,
  padding: "0 20px",
  borderRadius: 999,
  border: `1.5px solid ${on ? BAI.owner : BAI.borderStrong}`,
  background: on ? BAI.owner : BAI.surface,
  color: on ? BAI.surface : BAI.ink,
  fontWeight: 600,
  fontSize: 15,
  fontFamily: "inherit",
  cursor: "pointer",
});
const stepBtn: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 22,
  border: `1.5px solid ${BAI.borderStrong}`,
  background: BAI.surface,
  color: BAI.ink,
  fontSize: 22,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1,
};

function Counter({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const set = (n: number) =>
    onChange(
      Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : min)),
    );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <label htmlFor={id} style={{ fontWeight: 600, color: BAI.ink }}>
        {label}
      </label>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          style={stepBtn}
          aria-label={`Un de moins : ${label.toLowerCase()}`}
          onClick={() => set(value - 1)}
          disabled={value <= min}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          style={{
            width: 72,
            height: 48,
            borderRadius: 14,
            border: `1.5px solid ${BAI.borderStrong}`,
            textAlign: "center",
            fontSize: 18,
            fontWeight: 600,
            color: BAI.ink,
            background: BAI.surface,
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          style={stepBtn}
          aria-label={`Un de plus : ${label.toLowerCase()}`}
          onClick={() => set(value + 1)}
          disabled={value >= max}
        >
          +
        </button>
      </span>
    </div>
  );
}

/**
 * Page « Tarifs » : un seul prix, calculé pour le nombre de logements et de garages, comparé à une agence ; ce qui est
 * compris, ce qui ne l'est pas, questions. Prix repris de config.ts, rien d'autre à mettre à jour.
 */
export function Tarifs() {
  const [yearly, setYearly] = useState(false);
  const [homes, setHomes] = useState(2);
  const [garages, setGarages] = useState(0);
  const [rent, setRent] = useState(750);
  const month = cents(MONTHLY_PRICE);
  const year = cents(YEARLY_PRICE);
  const parking = cents(PARKING_PRICE);
  const perYear = homes * year + garages * parking * 12;
  const perMonth = homes * month + garages * parking;
  const agencyLow = Math.round(rent * 100 * 12 * homes * 0.04);
  const agencyHigh = Math.round(rent * 100 * 12 * homes * 0.1);
  const bailioYear = homes * year;

  return (
    <SimplePage title="Un prix, tout compris" wide>
      <p style={{ margin: "-16px 0 28px", fontSize: 18 }}>
        {LAUNCH_OFFER}, sans carte bancaire. Ensuite {MONTHLY_PRICE}{" "}
        {PRICE_UNIT}, sans option payante.
      </p>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section
          aria-labelledby="calcul"
          className="fold fold--ear"
          style={{
            ...card,
            background: BAI.sky,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <h2
            id="calcul"
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: BAI.ink }}
          >
            Votre prix
          </h2>
          <div
            role="radiogroup"
            aria-label="Paiement"
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={!yearly}
              style={pill(!yearly)}
              onClick={() => setYearly(false)}
            >
              Chaque mois
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={yearly}
              style={pill(yearly)}
              onClick={() => setYearly(true)}
            >
              Chaque année, 2 mois offerts
            </button>
          </div>
          <Counter
            id="tarif-logements"
            label="Logements"
            value={homes}
            min={0}
            max={100}
            onChange={setHomes}
          />
          <Counter
            id="tarif-garages"
            label="Garages, box ou places loués seuls"
            value={garages}
            min={0}
            max={100}
            onChange={setGarages}
          />
          <p aria-live="polite" style={{ margin: 0, color: BAI.ink }}>
            <strong
              style={{
                fontSize: "clamp(30px, 6vw, 40px)",
                fontWeight: 700,
                display: "block",
                lineHeight: 1.1,
              }}
            >
              {yearly
                ? `${euros(perYear)} par an`
                : `${euros(perMonth)} par mois`}
            </strong>
            <span>
              {yearly
                ? `soit ${euros(Math.round(perYear / 12))} par mois`
                : `soit ${euros(perMonth * 12)} par an`}
              , après le mois offert.
              {garages ? ` Garages : ${PARKING_PRICE} par mois chacun.` : ""}
            </span>
          </p>
          <Link
            to="/commencer"
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 52,
              padding: "0 26px",
              borderRadius: 999,
              background: BAI.owner,
              color: BAI.surface,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Commencer gratuitement
          </Link>
        </section>

        <div>
          <h2 style={{ ...h2, marginTop: 0 }}>Comparé à une agence</h2>
          <div
            style={{
              ...card,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <label
              htmlFor="tarif-loyer"
              style={{ fontWeight: 600, color: BAI.ink }}
            >
              Loyer mensuel moyen d’un logement, charges comprises
            </label>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              <input
                id="tarif-loyer"
                type="number"
                inputMode="numeric"
                min={0}
                max={20000}
                value={rent}
                onChange={(e) =>
                  setRent(
                    Math.max(0, Math.min(20000, Number(e.target.value) || 0)),
                  )
                }
                style={{
                  width: 140,
                  height: 60,
                  borderRadius: 14,
                  border: `1.5px solid ${BAI.borderStrong}`,
                  padding: "0 16px",
                  fontSize: 18,
                  color: BAI.ink,
                  background: BAI.surface,
                  fontFamily: "inherit",
                }}
              />
              <span aria-hidden>€</span>
            </span>
            <p style={{ margin: 0 }}>
              Pour {homes || 0} logement{homes > 1 ? "s" : ""}, une gestion par
              agence coûte en général 4 à 10 % des loyers encaissés, soit{" "}
              <strong style={{ color: BAI.ink }}>
                {euros(agencyLow)} à {euros(agencyHigh)} par an
              </strong>
              . Avec Bailio :{" "}
              <strong style={{ color: BAI.ink }}>
                {euros(bailioYear)} par an
              </strong>
              , et vous gardez la main.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <h2 style={h2}>Tout est compris</h2>
          <ul
            style={{
              ...card,
              margin: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {INCLUS.map((x) => (
              <li key={x}>
                <span aria-hidden style={{ color: BAI.green, fontWeight: 700 }}>
                  ✓{" "}
                </span>
                {x}
              </li>
            ))}
            <li>
              <span aria-hidden style={{ color: BAI.green, fontWeight: 700 }}>
                ✓{" "}
              </span>
              Import de vos logements et locataires depuis un fichier, ou d’un
              bail en photo
            </li>
          </ul>
        </div>
        <div>
          <h2 style={h2}>Ce que Bailio ne fait pas</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: 22,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {NOT_INCLUDED.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 style={h2}>Questions</h2>
      <div className="grid-2" style={{ gap: 8, alignItems: "start" }}>
        {FAQ.map(([q, a]) => (
          <details key={q} style={{ ...card, padding: "16px 20px" }}>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: BAI.ink,
                minHeight: 28,
              }}
            >
              {q}
            </summary>
            <p style={{ margin: "10px 0 0" }}>{a}</p>
          </details>
        ))}
      </div>

      <p style={{ marginTop: 32 }}>
        Plusieurs logements à reprendre ? {CALLBACK_PROMISE}{" "}
        <Link to="/contact">Être rappelé</Link>. Détail des conditions :{" "}
        <Link to="/prix-et-remboursement">
          prix, rétractation et remboursement
        </Link>
        .
      </p>
      <SolutionLinks />
    </SimplePage>
  );
}
