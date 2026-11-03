import { describe, expect, it } from 'vitest'
import { MAIL_PROVIDERS, isApple, providerFor, providersFor, suggestEmail } from './mail'

describe('messageries : la boîte de l’adresse saisie en premier', () => {
  it('reconnaît les domaines courants', () => {
    expect(providerFor('marie@gmail.com')?.label).toBe('Gmail')
    expect(providerFor(' Jean@Wanadoo.fr ')?.key).toBe('orange')
    expect(providerFor('a@hotmail.fr')?.key).toBe('outlook')
    expect(providerFor('a@me.com')?.key).toBe('icloud')
    expect(providerFor('a@monentreprise.fr')).toBeNull()
  })
  it('met la bonne en tête sans rien perdre', () => {
    const list = providersFor('a@free.fr')
    expect(list[0].key).toBe('free')
    expect(list).toHaveLength(MAIL_PROVIDERS.length)
    expect(providersFor('a@inconnu.fr')[0].key).toBe('gmail')
  })
  it('liens en https uniquement', () => {
    expect(MAIL_PROVIDERS.every((p) => p.url.startsWith('https://'))).toBe(true)
    expect(isApple('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(true)
    expect(isApple('Mozilla/5.0 (Windows NT 10.0)')).toBe(false)
  })
})

describe('faute de frappe dans l’adresse', () => {
  it('propose la messagerie voisine', () => {
    expect(suggestEmail('paul.durand@gmial.com')).toBe('paul.durand@gmail.com')
    expect(suggestEmail('Marie@Hotmial.fr')).toBe('marie@hotmail.fr')
    expect(suggestEmail('a@gmail.con')).toBe('a@gmail.com')
    expect(suggestEmail('a@wanadoo.ff')).toBe('a@wanadoo.fr')
    expect(suggestEmail('a@yaho.fr')).toBe('a@yahoo.fr')
  })
  it('se tait pour une adresse juste ou inconnue', () => {
    expect(suggestEmail('a@gmail.com')).toBeNull()
    expect(suggestEmail('a@monentreprise.fr')).toBeNull()
    expect(suggestEmail('a@gmx.de')).toBeNull()
    expect(suggestEmail('a@')).toBeNull()
    expect(suggestEmail('pas-une-adresse')).toBeNull()
  })
})

import { deviceOf, mailTarget } from './mail'

describe('ouvrir la messagerie sur téléphone', () => {
  const gmail = MAIL_PROVIDERS.find((p) => p.key === 'gmail')!
  const orange = MAIL_PROVIDERS.find((p) => p.key === 'orange')!
  it('reconnaît l’appareil', () => {
    expect(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android')
    expect(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios')
    expect(deviceOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios')
    expect(deviceOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe('desktop')
  })
  it('ouvre l’application, sinon le site', () => {
    expect(mailTarget(gmail, 'ios')).toEqual({ href: 'googlegmail://', fallback: gmail.url })
    expect(mailTarget(gmail, 'android').href).toContain('package=com.google.android.gm')
    expect(mailTarget(gmail, 'android').href).toContain('S.browser_fallback_url=')
    expect(mailTarget(gmail, 'desktop')).toEqual({ href: gmail.url, fallback: null })
    expect(mailTarget(orange, 'ios')).toEqual({ href: orange.url, fallback: null })
  })
})
