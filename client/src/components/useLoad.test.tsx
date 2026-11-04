// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useLoad } from './kit'
import { clearLoadCache } from '../lib/loadCache'

afterEach(() => {
  cleanup()
  clearLoadCache()
})

let answer = 'v1'
let calls = 0
const fetchValue = () => {
  calls++
  return new Promise<string>((r) => setTimeout(() => r(answer), 20))
}

function View({ cache = true }: { cache?: boolean }) {
  const { data } = useLoad(fetchValue, [], { cache })
  return <p>{data ?? 'Chargement'}</p>
}

describe('useLoad : retour sur une page déjà vue', () => {
  it('affiche tout de suite les dernières données, puis les données à jour', async () => {
    answer = 'v1'
    const first = render(<View />)
    expect(screen.getByText('Chargement')).toBeTruthy()
    await act(() => new Promise((r) => setTimeout(r, 40)))
    expect(screen.getByText('v1')).toBeTruthy()
    first.unmount()

    answer = 'v2'
    render(<View />)
    expect(screen.getByText('v1')).toBeTruthy() // sans écran de chargement
    await act(() => new Promise((r) => setTimeout(r, 40)))
    expect(screen.getByText('v2')).toBeTruthy() // rechargé en arrière-plan
  })

  it('un formulaire (cache: false) attend toujours les données à jour', async () => {
    answer = 'v1'
    const first = render(<View cache={false} />)
    await act(() => new Promise((r) => setTimeout(r, 40)))
    first.unmount()
    render(<View cache={false} />)
    expect(screen.getByText('Chargement')).toBeTruthy()
  })

  it('la déconnexion vide la mémoire', async () => {
    answer = 'v1'
    const first = render(<View />)
    await act(() => new Promise((r) => setTimeout(r, 40)))
    first.unmount()
    clearLoadCache()
    calls = 0
    render(<View />)
    expect(screen.getByText('Chargement')).toBeTruthy()
    expect(calls).toBe(1)
  })
})
