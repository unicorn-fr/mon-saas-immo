import { describe, expect, it } from 'vitest'
import { smallSurfaceWarning } from './lease'

describe('surface : alerte de décence sous 9 m²', () => {
  it('prévient entre 0 et 9 m²', () => {
    expect(smallSurfaceWarning(4.5)).toMatch(/20 m³/)
    expect(smallSurfaceWarning(8.99)).not.toBeNull()
  })
  it('se tait à partir de 9 m² ou sans surface', () => {
    expect(smallSurfaceWarning(9)).toBeNull()
    expect(smallSurfaceWarning(42)).toBeNull()
    expect(smallSurfaceWarning(undefined)).toBeNull()
    expect(smallSurfaceWarning(0)).toBeNull()
  })
})
