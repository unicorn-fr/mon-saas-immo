import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiCommentaryResult {
  commentary: string
  strengths: string[]
  concerns: string[]
  verdict: 'FORT' | 'MOYEN' | 'FRAGILE'
}

const DEFAULT_RESULT: AiCommentaryResult = {
  commentary: 'Analyse IA non disponible.',
  strengths: [],
  concerns: [],
  verdict: 'MOYEN',
}

// ─── Service ─────────────────────────────────────────────────────────────────

export async function generateAiCommentary(applicationId: string): Promise<AiCommentaryResult> {
  // Load application with all necessary relations
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          profileMeta: true,
        },
      },
      property: {
        select: {
          title: true,
          price: true,
          charges: true,
          selectionCriteria: true,
        },
      },
    },
  })

  if (!application) throw new Error('Candidature introuvable')

  // Extract tenant financial data from profileMeta
  const meta = (application.tenant.profileMeta ?? {}) as Record<string, unknown>
  const composed = (meta._composed ?? {}) as Record<string, unknown>
  const netSalary = typeof composed.netSalary === 'number' ? composed.netSalary : null
  const contractType = typeof composed.contractType === 'string' ? composed.contractType : null

  const rent = application.property.price
  const charges = application.property.charges ?? 0
  const totalRent = rent + charges
  const ratio = netSalary ? Math.round((totalRent / netSalary) * 100) : null

  // Build context for Claude
  const context = {
    candidat: `${application.tenant.firstName} ${application.tenant.lastName}`,
    loyer: rent,
    charges,
    totalRent,
    revenuNet: netSalary,
    ratioLoyer: ratio ? `${ratio}%` : 'inconnu',
    typeContrat: contractType ?? 'non renseigné',
    garant: application.hasGuarantor
      ? `Oui (${application.guarantorType ?? 'type non précisé'})`
      : 'Non',
    score: application.score,
  }

  // Fallback if no API key
  if (!env.ANTHROPIC_API_KEY) {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiCommentary: JSON.stringify(DEFAULT_RESULT),
        aiScoredAt: new Date(),
      },
    })
    return DEFAULT_RESULT
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Tu es un expert en immobilier locatif français. Tu analyses des dossiers de candidature pour des propriétaires bailleurs. Réponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.

Format attendu :
{
  "commentary": "string (2-3 phrases, ton professionnel, en français)",
  "strengths": ["point positif 1", "point positif 2"],
  "concerns": ["vigilance 1"],
  "verdict": "FORT" | "MOYEN" | "FRAGILE"
}

Règles verdict :
- FORT : ratio loyer/revenus < 33% et stabilité professionnelle (CDI, fonctionnaire)
- MOYEN : ratio 33-40% ou contrat non CDI mais dossier complet
- FRAGILE : ratio > 40%, revenus inconnus, ou manques importants dans le dossier

Règles commentary :
- 2-3 phrases maximum
- Analyser ratio loyer/revenus, stabilité emploi, garanties
- Ton professionnel et neutre`,
      messages: [
        {
          role: 'user',
          content: `Analyse cette candidature :\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const parsed = JSON.parse(raw) as AiCommentaryResult

    // Validate verdict
    const validVerdicts = ['FORT', 'MOYEN', 'FRAGILE']
    if (!validVerdicts.includes(parsed.verdict)) {
      parsed.verdict = 'MOYEN'
    }

    // Persist to database
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiCommentary: JSON.stringify(parsed),
        aiScoredAt: new Date(),
      },
    })

    return parsed
  } catch {
    // On error, persist default and return it
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiCommentary: JSON.stringify(DEFAULT_RESULT),
        aiScoredAt: new Date(),
      },
    })
    return DEFAULT_RESULT
  }
}
