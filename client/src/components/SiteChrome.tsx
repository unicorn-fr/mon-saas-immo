import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CALLBACK_PROMISE } from "../content/inclus";
import { SIMULATEURS } from "../content/modeles";
import { BAI } from "../constants/bailio-tokens";
import { useAuth } from "../lib/auth";
import { Logo } from "./Logo";
import { MegaMenu, MobileMenu } from "./SiteMenu";
import { display } from "./ui";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header
      className="container"
      style={{
        position: "relative",
        zIndex: 30,
        height: "clamp(72px, 9vw, 88px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <Logo size={26} />
      <nav
        aria-label="Menu"
        className="site-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(10px, 2vw, 24px)",
          fontSize: 15,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <MegaMenu
          linkStyle={{
            textDecoration: "none",
            color: BAI.ink,
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            padding: "0 12px",
          }}
        />
        {user ? (
          <Link
            to="/espace"
            className="hide-md"
            style={{
              textDecoration: "none",
              color: BAI.inkMid,
              display: "inline-block",
              padding: "13px 2px",
            }}
          >
            Mon espace
          </Link>
        ) : (
          <Link
            to="/connexion"
            className="hide-md"
            style={{
              textDecoration: "none",
              color: BAI.inkMid,
              display: "inline-block",
              padding: "13px 2px",
            }}
          >
            Se connecter
          </Link>
        )}
        <MobileMenu
          account={
            <Link
              to={user ? "/espace" : "/connexion"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
                borderRadius: 999,
                border: `1.5px solid ${BAI.borderStrong}`,
                color: BAI.ink,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {user ? "Mon espace" : "Se connecter"}
            </Link>
          }
          cta={null}
        />
        <Link
          to="/commencer"
          className="btn btn-primary"
          style={{
            textDecoration: "none",
            background: BAI.cta,
            color: BAI.ctaInk,
            border: `1.5px solid ${BAI.cta}`,
            padding: "12px clamp(14px, 2vw, 24px)",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          Créer mon bail
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  // Trois colonnes nommées au lieu d'une liste de 19 liens : on trouve ce qu'on cherche d'un coup d'œil.
  const columns: Array<{ title: string; links: Array<{ to: string; label: string }> }> = [
    {
      title: "Produit",
      links: [
        { to: "/fonctionnalites", label: "Fonctionnalités" },
        { to: "/tarifs", label: "Tarifs" },
        { to: "/demo", label: "Essayer la démo" },
        { to: "/changer-pour-bailio", label: "Changer pour Bailio" },
        { to: "/espace-locataire", label: "Espace locataire" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { to: "/guides", label: "Guides" },
        { to: "/modeles", label: "Modèles gratuits" },
        { to: "/avis", label: "Avis" },
        { to: "/a-propos", label: "À propos" },
        { to: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Cadre légal",
      links: [
        { to: "/mentions-legales", label: "Mentions légales" },
        { to: "/conditions", label: "Conditions" },
        { to: "/cgv", label: "CGV" },
        { to: "/confidentialite", label: "Confidentialité" },
        { to: "/cookies", label: "Cookies" },
        { to: "/prix-et-remboursement", label: "Prix et remboursement" },
        { to: "/accessibilite", label: "Accessibilité" },
        { to: "/securite", label: "Sécurité" },
      ],
    },
  ];
  const link = { color: BAI.onDark, textDecoration: "none", display: "inline-block", padding: "7px 0", fontSize: 14.5 } as const;
  return (
    <footer style={{ background: BAI.night, color: BAI.onDark }}>
      <div className="container site-foot" style={{ padding: "56px clamp(20px, 6.6vw, 96px) 28px" }}>
        <div className="site-foot-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <Logo size={28} onDark />
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: BAI.onDarkMuted, maxWidth: "26ch" }}>
              La gestion locative des propriétaires, sans agence.
            </p>
            <Link
              to="/commencer"
              style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 18px", borderRadius: BAI.radiusBtn, background: BAI.accent, color: BAI.night, fontWeight: 600, fontSize: 15, textDecoration: "none" }}
            >
              Créer mon bail
            </Link>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: BAI.accent }}>{c.title}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="foot-link" style={link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BAI.nightLine}`, marginTop: 36, paddingTop: 18, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 13, color: BAI.onDarkMuted }}>
          <span>© {new Date().getFullYear()} Bailio</span>
          <span>Hébergé en Suisse, chez Infomaniak.</span>
        </div>
      </div>
    </footer>
  );
}

/** Sommaire de la page (titres h2 du contenu), outils gratuits quand il n'y a pas de sommaire, et rappel. */
function PageAside({
  body,
  extra,
}: {
  body: React.RefObject<HTMLDivElement | null>;
  extra?: ReactNode;
}) {
  const { pathname } = useLocation();
  const [toc, setToc] = useState<Array<{ id: string; text: string }>>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const read = () => {
      const hs = [...el.querySelectorAll("h2")].filter(
        (h) => !h.closest("aside, details"),
      );
      const used = new Set<string>();
      setToc(
        hs.map((h, i) => {
          if (!h.id) {
            let id =
              (h.textContent || `partie-${i}`)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 60) || `partie-${i}`;
            while (used.has(id) || document.getElementById(id)) id += "-" + i;
            h.id = id;
          }
          used.add(h.id);
          return { id: h.id, text: h.textContent || "" };
        }),
      );
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [body, pathname]);

  useEffect(() => {
    if (toc.length < 2 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    toc.forEach((t) => {
      const h = document.getElementById(t.id);
      if (h) io.observe(h);
    });
    return () => io.disconnect();
  }, [toc]);

  const card = { background: BAI.bg, borderRadius: 24, padding: 24 } as const;
  const head = {
    margin: "0 0 12px",
    fontSize: 13,
    fontWeight: 700,
    color: BAI.owner,
  } as const;
  return (
    <aside
      className="page-aside"
      aria-label="Sur cette page"
      style={{
        position: "sticky",
        top: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontSize: 15,
        lineHeight: 1.45,
      }}
    >
      {toc.length >= 2 ? (
        <nav aria-label="Sommaire" style={card}>
          <p style={head}>Sur cette page</p>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  aria-current={active === t.id ? "true" : undefined}
                  style={{
                    display: "block",
                    padding: "6px 10px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: active === t.id ? BAI.owner : BAI.inkMid,
                    background:
                      active === t.id ? BAI.ownerLight : "transparent",
                    fontWeight: active === t.id ? 600 : 400,
                  }}
                >
                  {t.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <nav aria-label="Outils gratuits" style={card}>
          <p style={head}>Outils gratuits</p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {SIMULATEURS.filter((x) => x.path !== pathname)
              .slice(0, 6)
              .map((x) => (
                <li key={x.path}>
                  <Link
                    to={x.path}
                    style={{
                      display: "block",
                      padding: "6px 10px",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: BAI.inkMid,
                    }}
                  >
                    {x.name}
                  </Link>
                </li>
              ))}
          </ul>
          <Link
            to="/modeles"
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "6px 10px",
              fontWeight: 600,
            }}
          >
            Modèles de lettres gratuits
          </Link>
        </nav>
      )}
      {extra}
      <div
        className="fold fold--ear"
        style={{ ...card, background: BAI.sky, color: BAI.ink }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 17 }}>
          Une question ?
        </p>
        <p style={{ margin: "0 0 14px", color: BAI.ink }}>{CALLBACK_PROMISE}</p>
        <Link
          to="/contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            padding: "0 20px",
            borderRadius: 999,
            background: BAI.cta,
            color: BAI.surface,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Être rappelé
        </Link>
      </div>
    </aside>
  );
}

/**
 * Page de contenu (pages légales, guides, modèles, outils, pages d'information). Sur ordinateur : le contenu et une colonne
 * qui reste visible (sommaire de la page, outils gratuits, rappel) ; `wide` : toute la largeur, sans colonne. Sur téléphone
 * et tablette : une seule colonne, sans la colonne latérale.
 */
export function SimplePage({
  title,
  children,
  wide = false,
  aside,
}: {
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
  aside?: ReactNode;
}) {
  const body = useRef<HTMLDivElement | null>(null);
  return (
    <div
      className="pub"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: BAI.surface,
      }}
    >
      <SiteHeader />
      <main
        className="container"
        style={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          paddingTop: "clamp(28px, 4vw, 56px)",
          paddingBottom: 96,
        }}
      >
        <h1
          style={display("clamp(40px, 5.6vw, 64px)", {
            margin: "0 0 32px",
            maxWidth: 900,
          })}
        >
          {title}
        </h1>
        <div className={wide ? undefined : "page-grid"}>
          <div
            ref={body}
            className="page-body"
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: BAI.inkMid,
              minWidth: 0,
            }}
          >
            {children}
          </div>
          {wide ? null : <PageAside body={body} extra={aside} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
