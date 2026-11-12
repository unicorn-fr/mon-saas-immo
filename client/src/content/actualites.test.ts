import { describe, expect, it } from 'vitest'
import { NEWS, newsFor } from './actualites'

describe('fil d’actualité', () => {
  it('chaque information a une source officielle', () => {
    for (const n of NEWS) expect(n.source.url).toMatch(/^https:\/\/(www\.)?(service-public|legifrance)\.gouv\.fr/)
  })
  it('échéances à venir d’abord, de la plus proche à la plus lointaine, puis le plus récent', () => {
    const list = newsFor(null, '2026-11-12')
    expect(list[0].title).toBe('CFE de votre meublé')
    expect(list[1].title).toBe('Logements F interdits à la location')
    expect(list[2].date >= list[3].date).toBe(true)
  })
  it('location vide : pas les échéances propres au meublé', () => {
    expect(newsFor(false, '2026-11-12').some((n) => n.for === 'MEUBLE')).toBe(false)
    expect(newsFor(true, '2026-11-12').some((n) => n.for === 'VIDE')).toBe(false)
  })
})
