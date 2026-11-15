import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/bricolage-grotesque/wght.css'
import './accueil/dusk.css'
import './accueil/dusk-site.css'
import { MegaMenu, MobileMenu } from '../components/SiteMenu'
import { VideoButton } from '../components/VideoDialog'
import { SiteFooter } from '../components/SiteChrome'
import { CAP_MONTHLY_CENTS, CAP_YEARLY_CENTS, LAUNCH_OFFER, MONTHLY_PRICE_CENTS, YEARLY_PRICE_CENTS } from '../config'
import { useAuth } from '../lib/auth'
import { DA2 } from '../constants/bailio-tokens'
import { MAIN, SPRITE, type DuskPrices } from './accueil/duskMain'
import { mountDusk } from './accueil/duskScript'

/**
 * Accueil « Tombée du jour » (maquette `docs/maquette/accueil-tombee-du-jour/`, générée par `scripts/accueil-dusk.py`) :
 * la façade au crépuscule dont les fenêtres s'allument, l'entrée par la vitre dans un salon, puis les chiffres, le
 * tableau de bord qui se joue au défilement, les sept moments de la location, l'hébergement en Suisse et le prix.
 * La façade (lourde) arrive à part ; le titre, les boutons et le menu sont là tout de suite. Prix repris de config.ts.
 */
const euros = (cents: number) => cents / 100
const PRICES: DuskPrices = {
  monthly: euros(MONTHLY_PRICE_CENTS),
  monthlyText: (MONTHLY_PRICE_CENTS / 100).toFixed(2).replace('.', ','),
  yearly: euros(YEARLY_PRICE_CENTS),
  capMonthly: euros(CAP_MONTHLY_CENTS),
  capYearly: euros(CAP_YEARLY_CENTS),
  trial: LAUNCH_OFFER,
}

export default function HomeDusk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const facade = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const main = useMemo(() => ({ __html: MAIN(PRICES) }), [])
  const sprite = useMemo(() => ({ __html: SPRITE }), [])

  // Fond lin derrière la page (rebond du défilement), rendu au départ.
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = DA2.linen
    return () => void (document.body.style.background = prev)
  }, [])

  // La façade et ses vitres : un fichier à part, mis en cache par le navigateur.
  useEffect(() => {
    let on = true
    fetch('/accueil/facade.html')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => {
        if (!on || !facade.current) return
        facade.current.innerHTML = t
        setReady(true)
      })
      .catch(() => undefined)
    return () => void (on = false)
  }, [])

  // Animations de la maquette, une fois la façade en place ; tout s'arrête en quittant la page.
  useEffect(() => {
    if (!ready || !root.current) return
    return mountDusk(root.current, PRICES)
  }, [ready])

  // Liens du contenu : navigation dans le site, sans recharger la page.
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    const href = a?.getAttribute('href')
    if (!a || !href || !href.startsWith('/') || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(href)
  }

  return (
    <>
    <div className="dusk" ref={root} onClick={onClick}>
      <div aria-hidden dangerouslySetInnerHTML={sprite} />
      <header className="wa" id="haut">
        <div ref={facade} className="wa-fond" />
        <div className="in" style={{ width: '100%', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
          <nav className="nav" aria-label="Menu">
            <Link to="/" className="plaque" aria-label="Bailio, accueil">
              <span>bailio</span>
            </Link>
            <div className="dusk-menu">
              <MegaMenu linkClass="dusk-link" onDark />
              <Link to={user ? '/espace' : '/connexion'} className="dusk-link hide-md">
                {user ? 'Mon espace' : 'Se connecter'}
              </Link>
              <MobileMenu
                account={
                  <Link to={user ? '/espace' : '/connexion'} className="dusk-account">
                    {user ? 'Mon espace' : 'Se connecter'}
                  </Link>
                }
                cta={null}
              />
            </div>
          </nav>
          <div className="body" id="contenu">
            <div>
              <h1>Chaque fenêtre allumée est un loyer reçu.</h1>
              <p className="sub">
                Bail, quittances, relances et impôts. Bailio prépare tout, vous validez. {PRICES.monthlyText}&#8239;€ par logement et par mois.
              </p>
              <div className="acts">
                <Link className="btn p" to="/commencer">
                  Créer mon bail
                </Link>
                <VideoButton className="btn g">
                  <svg fill="currentColor" aria-hidden>
                    <use href="#i-play" />
                  </svg>
                  Voir la vidéo, 1&#8239;min
                </VideoButton>
              </div>
            </div>
            <div className="counter" aria-hidden>
              <small>Ce soir, exemple</small>
              <strong>
                <span id="cnt">0</span> <em>/ 13 loyers</em>
              </strong>
              <ul className="feed" id="feed" />
            </div>
          </div>
        </div>
      </header>
      <main id="parcours" dangerouslySetInnerHTML={main} />
    </div>
    <SiteFooter />
    </>
  )
}
