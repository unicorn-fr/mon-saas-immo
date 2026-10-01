import { describe, expect, it } from 'vitest'
import { GUIDES, citeParts, law } from './sources'

const linked = (ref: string) => citeParts(ref).filter((p) => p.url).map((p) => [p.text, p.url])

describe('citeParts : chaque article cité renvoie au texte officiel', () => {
  it('loi de 1989 : un lien par article', () => {
    const l = linked('loi n° 89-462 du 6 juillet 1989, art. 3 et 10')
    expect(l.map(([t]) => t)).toEqual(['loi n° 89-462 du 6 juillet 1989, ', '3', '10'])
    expect(l[1][1]).toBe(law('3'))
    expect(l[2][1]).toContain('LEGIARTI000028806675')
  })

  it('le texte reconstitué est identique à la référence', () => {
    const ref = 'loi n° 89-462 du 6 juillet 1989, art. 24 ; Code civil, art. 1344'
    expect(citeParts(ref).map((p) => p.text).join('')).toBe(ref)
  })

  it('Code civil : seuls les articles vérifiés ont un lien', () => {
    expect(linked('Code civil, art. 2297').map(([t]) => t)).toEqual(['2297'])
    expect(linked('Code civil, art. 1344')).toEqual([])
  })

  it('contrat type et décrets : lien vers le décret', () => {
    expect(linked('Contrat type, rubrique II.A')[0][1]).toContain('JORFTEXT000030649868')
    expect(linked('décret n° 2015-1437')[0][1]).toContain('JORFTEXT000031444493')
  })

  it('les fiches pratiques pointent vers service-public.gouv.fr ou Légifrance', () => {
    for (const g of Object.values(GUIDES)) expect(g.url).toMatch(/^https:\/\/www\.(service-public\.gouv\.fr|legifrance\.gouv\.fr)\//)
  })
})
