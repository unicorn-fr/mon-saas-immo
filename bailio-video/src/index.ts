import { registerRoot } from 'remotion'
import { RemotionRoot } from './Root'
import { loadFont as loadCormorant } from '@remotion/google-fonts/CormorantGaramond'
import { loadFont as loadDMSans } from '@remotion/google-fonts/DMSans'

loadCormorant()
loadDMSans()

registerRoot(RemotionRoot)
