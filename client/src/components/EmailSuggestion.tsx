import { BAI } from '../constants/bailio-tokens'
import { suggestEmail } from '../lib/mail'

/** Sous un champ email : « Vouliez-vous dire …@gmail.com ? », la correction en un clic. */
export function EmailSuggestion({ email, onPick }: { email: string; onPick: (email: string) => void }) {
  const fix = suggestEmail(email)
  if (!fix) return null
  return (
    <p role="status" style={{ margin: 0, fontSize: 15, color: BAI.inkMid }}>
      Vouliez-vous dire{' '}
      <button type="button" className="tap" onClick={() => onPick(fix)} style={{ border: 'none', background: 'none', padding: '4px 0', font: 'inherit', fontWeight: 600, color: BAI.owner, textDecoration: 'underline', cursor: 'pointer' }}>
        {fix}
      </button>{' '}
      ?
    </p>
  )
}
