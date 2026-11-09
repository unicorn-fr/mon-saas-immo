import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BAI } from "../constants/bailio-tokens";
import { useDraft } from "../lib/draft";
import { Check } from "./Icons";
import { Logo } from "./Logo";
import { Spinner } from "./ui";
import { SaveLater } from "./SaveLater";

export const TUNNEL_STEPS = [
  "type",
  "logement",
  "personnes",
  "loyer",
  "relecture",
] as const;
export type TunnelStep = (typeof TUNNEL_STEPS)[number];
const STEP_LABELS: Record<TunnelStep, string> = {
  type: "Le type de location",
  logement: "Le logement",
  personnes: "Les personnes",
  loyer: "Le loyer et les dates",
  relecture: "La relecture",
};

/** Colonne de gauche sur ordinateur : les étapes, puis ce que l'on obtient à la fin. Masquée sur téléphone. */
function TunnelAside({ index }: { index: number }) {
  return (
    <aside
      className="tunnel-aside"
      aria-label="Étapes"
      style={{
        position: "sticky",
        top: 32,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 24,
          background: BAI.surface,
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {TUNNEL_STEPS.map((s, i) => {
          const state =
            i + 1 < index ? "done" : i + 1 === index ? "now" : "next";
          return (
            <li
              key={s}
              aria-current={state === "now" ? "step" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 10px",
                borderRadius: 12,
                background: state === "now" ? BAI.ownerLight : "transparent",
                color: state === "next" ? BAI.inkMid : BAI.ink,
                fontWeight: state === "now" ? 700 : 500,
                fontSize: 15,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  background:
                    state === "done"
                      ? BAI.greenLight
                      : state === "now"
                        ? BAI.owner
                        : BAI.bg,
                  color: state === "now" ? BAI.surface : BAI.ink,
                  border:
                    state === "next"
                      ? `1.5px solid ${BAI.borderStrong}`
                      : "none",
                }}
              >
                {state === "done" ? <Check size={14} /> : i + 1}
              </span>
              {STEP_LABELS[s]}
              {state === "done" ? (
                <span className="sr-only"> (fait)</span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div
        className="fold fold--ear"
        style={{
          background: BAI.sky,
          color: BAI.ink,
          borderRadius: 24,
          padding: 24,
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 16 }}>
          À la fin, gratuitement
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <li>Le bail sur le contrat type officiel</li>
          <li>Ce qu’il manque avant de le faire signer</li>
          <li>Le PDF reçu par email</li>
        </ul>
      </div>
    </aside>
  );
}

export const stepPath = (s: string) =>
  s === "type" ? "/commencer" : `/commencer/${s}`;

function SaveIndicator() {
  const { status } = useDraft();
  if (status === "idle") return <span aria-hidden style={{ width: 90 }} />;
  const saving = status === "saving";
  const error = status === "error";
  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        fontSize: 14,
        color: error ? BAI.error : BAI.green,
        display: "flex",
        gap: 6,
        alignItems: "center",
        minWidth: 90,
        justifyContent: "flex-end",
      }}
    >
      {saving ? (
        <Spinner size={14} color={BAI.green} />
      ) : error ? null : (
        <Check />
      )}
      {saving ? "Enregistrement" : error ? "Non enregistré" : "Enregistré"}
    </span>
  );
}

export function TunnelLayout({
  step,
  children,
  width = 640,
  sub,
}: {
  step: TunnelStep;
  children: ReactNode;
  width?: number;
  sub?: { q: number; count: number };
}) {
  const index = TUNNEL_STEPS.indexOf(step) + 1;
  // Une question à la fois : la barre avance aussi à l'intérieur de l'étape.
  const done = index - 1 + (sub ? (sub.q - 1) / sub.count : 1);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: BAI.bg,
      }}
    >
      <header
        style={{
          height: "clamp(60px, 8vw, 72px)",
          padding: "0 clamp(20px, 3.3vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: BAI.surface,
          gap: 12,
        }}
      >
        <Logo size={28} />
        <span style={{ fontSize: 14, fontWeight: 600, color: BAI.inkMid }}>
          <span className="hide-md">Étape </span>
          {index} sur 5
        </span>
        <SaveIndicator />
      </header>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={index}
        aria-label="Progression"
        style={{ height: 4, background: BAI.divider }}
      >
        <div
          style={{
            width: `${done * 20}%`,
            height: "100%",
            background: BAI.owner,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <main
        className="tunnel-main"
        style={{ flex: 1, padding: "clamp(40px, 6vw, 88px) 20px 64px" }}
      >
        <TunnelAside index={index} />
        <div
          className="stack"
          style={{
            width: "100%",
            maxWidth: width,
            gap: 32,
            justifySelf: "center",
          }}
        >
          {children}
          {step !== "type" ? <SaveLater /> : null}
        </div>
      </main>
    </div>
  );
}

/** Après un « Continuer » refusé : le curseur va sur le premier champ en erreur (le lecteur d'écran lit son intitulé et son message). */
export function focusFirstError() {
  requestAnimationFrame(() => {
    // Champ en erreur, sinon (question à boutons, sans champ) le premier bouton de réponse de la question affichée.
    const el =
      document.querySelector<HTMLElement>('main [aria-invalid="true"]') ??
      document.querySelector<HTMLElement>(
        "main [data-question] button[aria-pressed]",
      );
    el?.focus();
  });
}

/** Retour / Continuer, en bas de chaque étape. */
export function StepNav({
  back,
  next,
  nextLabel = "Continuer",
  loading,
  disabled,
}: {
  back?: string;
  next: () => void;
  nextLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 8,
        gap: 16,
      }}
    >
      {back ? (
        <Link
          to={back}
          style={{
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
            padding: "16px 4px",
          }}
        >
          Retour
        </Link>
      ) : (
        <span />
      )}
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          next();
        }}
        disabled={loading || disabled}
        className="btn btn-primary"
        style={{
          background: BAI.cta,
          color: BAI.ctaInk,
          height: 60,
          padding: "0 40px",
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 17,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {loading ? <Spinner color={BAI.surface} /> : null}
        {nextLabel}
      </button>
    </div>
  );
}
