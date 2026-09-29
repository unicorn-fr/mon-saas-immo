import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Upload } from '../components/Icons'
import { Logo } from '../components/Logo'
import { Button, Notice, Spinner, display } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useDraft } from '../lib/draft'
import type { Draft } from '../lib/types'

const ACCEPT = 'image/jpeg,image/png,application/pdf'

/** « J'ai déjà un bail signé » : photos ou PDF, lus par l'IA, puis vérifiés par le propriétaire. */
export default function Importer() {
  const navigate = useNavigate()
  const { reset, ensure, replace } = useDraft()
  const [files, setFiles] = useState<File[]>([])
  const [available, setAvailable] = useState<boolean | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api<{ available: boolean }>('/drafts/import/available')
      .then((r) => setAvailable(r.available))
      .catch(() => setAvailable(false))
  }, [])

  function add(list: FileList | null) {
    if (!list) return
    setError(null)
    const next = [...files, ...Array.from(list)].slice(0, 10)
    setFiles(next)
  }

  async function read() {
    setError(null)
    setReading(true)
    try {
      reset()
      await ensure()
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      const draft = await api<Draft>('/drafts/current/import', { method: 'POST', form, draft: true })
      replace(draft)
      navigate('/commencer/relecture')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lecture impossible.')
      setReading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.bg }}>
      <header style={{ height: 72, padding: '0 clamp(20px, 3.3vw, 48px)', display: 'flex', alignItems: 'center', background: BAI.surface }}>
        <Logo size={28} />
      </header>
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 'clamp(40px, 6vw, 88px) 20px 64px' }}>
        <div className="stack" style={{ width: '100%', maxWidth: 640, gap: 28 }}>
          <h1 style={display('clamp(40px, 5vw, 56px)')}>Importez votre bail signé</h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: BAI.inkMid }}>
            Prenez chaque page en photo, ou déposez le PDF. Bailio lit le bail et remplit tout : le logement, le locataire, le loyer, les dates. Vous vérifiez ensuite.
          </p>

          {available === false ? (
            <Notice tone="info">
              La lecture automatique arrive très bientôt. En attendant, vous pouvez saisir votre bail en 4 questions : cela prend 5 minutes.
              <div style={{ marginTop: 12 }}>
                <Link to="/commencer" style={{ fontWeight: 600 }}>
                  Saisir mon bail
                </Link>
              </div>
            </Notice>
          ) : reading ? (
            <div className="stack" style={{ alignItems: 'center', gap: 16, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, padding: 48, textAlign: 'center' }} role="status">
              <Spinner size={32} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Bailio lit votre bail…</span>
              <span style={{ fontSize: 15, color: BAI.inkSoft }}>Cela peut prendre jusqu'à une minute. Ne fermez pas cette page.</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  add(e.dataTransfer.files)
                }}
                style={{ background: BAI.surface, border: `2px dashed ${BAI.borderStrong}`, borderRadius: 24, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: BAI.ink }}
              >
                <Upload />
                <span style={{ fontSize: 18, fontWeight: 600 }}>Prendre une photo ou choisir un fichier</span>
                <span style={{ fontSize: 14, color: BAI.inkSoft }}>Photos (JPEG, PNG) ou un PDF · 15 Mo maximum par fichier</span>
              </button>
              <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => add(e.target.files)} />
              {files.length ? (
                <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 15 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.type === 'application/pdf' ? f.name : `Page ${i + 1} · ${f.name}`}</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: BAI.error, fontSize: 14 }} aria-label={`Retirer ${f.name}`}>
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {error ? <Notice tone="warning">{error}</Notice> : null}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <Link to="/commencer" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 16, padding: '16px 4px' }}>
                  Retour
                </Link>
                <Button disabled={!files.length || available === null} onClick={() => void read()}>
                  Lire mon bail
                </Button>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: BAI.inkSoft, lineHeight: 1.6 }}>
                Votre document est lu par une intelligence artificielle (Claude, d'Anthropic) uniquement pour remplir ces informations. Il est ensuite conservé dans votre espace, et nulle part ailleurs.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
