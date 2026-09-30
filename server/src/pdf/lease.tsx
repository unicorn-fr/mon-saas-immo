import type { LeaseInput } from '../domain/lease.js'
import { legacyToContract } from '../services/contract.js'
import { renderContractPdf } from './contract.js'

/**
 * Bail issu du tunnel public (réponses « LeaseInput ») : converti au format des fiches, puis produit
 * avec le contrat complet (pdf/contract.tsx), pour qu'un même bail ait toujours la même présentation.
 */
export function renderLeasePdf(lease: LeaseInput): Promise<Buffer> {
  return renderContractPdf({ ...legacyToContract(lease), version: undefined })
}
