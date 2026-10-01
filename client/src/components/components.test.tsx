// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MissingList } from './Missing'
import { Cite, Sources } from './Sources'

afterEach(cleanup)

describe('MissingList (« Il manque… »)', () => {
  it('liste chaque mention avec un lien vers la bonne fiche', () => {
    render(
      <MemoryRouter>
        <MissingList
          items={[
            { key: 'terms.rent', label: 'Le montant du loyer', where: 'TERMS', to: '/espace/baux/1/contrat#rent' },
            { key: 'property.dpe', label: 'La classe énergie du DPE', where: 'PROPERTY', to: '/espace/logements/2/fiche#diagnostics' },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Le montant du loyer')).toBeTruthy()
    const links = screen.getAllByRole('link', { name: 'Compléter' })
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/espace/baux/1/contrat#rent', '/espace/logements/2/fiche#diagnostics'])
  })
  it('n’affiche rien quand le dossier est complet', () => {
    const { container } = render(
      <MemoryRouter>
        <MissingList items={[]} />
      </MemoryRouter>,
    )
    expect(container.innerHTML).toBe('')
  })
})

describe('Sources officielles', () => {
  it('Cite ouvre Légifrance dans un nouvel onglet', () => {
    render(<Cite reference="loi n° 89-462 du 6 juillet 1989, art. 22" />)
    const a = screen.getByRole('link', { name: '22' })
    expect(a.getAttribute('href')).toContain('legifrance.gouv.fr')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noreferrer')
  })
  it('Sources affiche la fiche service-public', () => {
    render(<Sources guides={['depot']} />)
    expect(screen.getByRole('link', { name: /Le dépôt de garantie/ }).getAttribute('href')).toContain('service-public.gouv.fr')
  })
})
