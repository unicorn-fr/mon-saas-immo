export const B = {
  night:      '#1a1a2e',
  nightMid:   '#22223c',
  caramel:    '#c4976a',
  cream:      '#fafaf8',
  ink:        '#0d0c0a',
  inkMid:     '#5a5754',
  inkFaint:   '#9e9b96',
  border:     '#e4e1db',
  bgMuted:    '#f4f2ee',
  display:    'Cormorant Garamond, Georgia, serif',
  body:       'DM Sans, system-ui, sans-serif',
} as const

import { staticFile } from 'remotion'

// Local images in bailio-video/public/
export const IMGS = {
  apartment:   staticFile('apartment.jpg'),
  contract:    staticFile('contract.jpg'),
  keys:        staticFile('keys.jpg'),
  paris:       staticFile('paris.jpg'),
  interior:    staticFile('interior.jpg'),
  handshake:   staticFile('handshake.jpg'),
} as const
