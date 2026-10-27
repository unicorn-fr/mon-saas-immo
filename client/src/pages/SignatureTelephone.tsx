import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { SignaturePad } from '../components/media'
import { Btn, Card, useToast } from '../components/kit'
import { display } from '../components/ui'
import { api } from '../lib/api'

/**
 * Signer au doigt sur son téléphone, pour l'ordinateur où l'on était en train de signer (QR code de la zone de
 * signature). La signature part au relais (`/signature-relay/:code`) et s'affiche sur l'ordinateur ; rien d'autre.
 */
export default function SignatureTelephone() {
  const { code = '' } = useParams()
  const toast = useToast()
  const [image, setImage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const send = async () => {
    if (!image) return toast.show('Signez d’abord dans le cadre.', 'error')
    try {
      await api(`/signature-relay/${encodeURIComponent(code)}`, { method: 'POST', body: { image } })
      setSent(true)
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <main id="contenu" style={{ minHeight: '100dvh', background: BAI.bg, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <Logo size={26} />
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={display('clamp(28px, 7vw, 36px)')}>
          Votre signature, <em>au doigt.</em>
        </h1>
        {sent ? (
          <Card>
            <strong style={{ fontSize: 18 }}>C’est envoyé.</strong>
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Votre signature est apparue sur votre ordinateur. Vous pouvez fermer cette page et continuer là-bas.</span>
          </Card>
        ) : (
          <Card>
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Signez dans le cadre avec le doigt, puis envoyez : la signature s’affiche sur votre ordinateur.</span>
            <SignaturePad value={image} onChange={setImage} height={200} label="Signez ici avec le doigt" />
            <Btn full onClick={send}>
              Envoyer à l’ordinateur
            </Btn>
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Votre signature transite par Bailio le temps d’arriver sur votre ordinateur, puis elle est effacée (10 minutes au plus). Elle n’est gardée que si vous la validez là-bas.</span>
          </Card>
        )}
      </div>
    </main>
  )
}
