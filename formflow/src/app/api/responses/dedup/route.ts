import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// POST /api/responses/dedup — Remove duplicate responses across all forms
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Get all responses from forms owned by this user
    const responses = await prisma.response.findMany({
      where: { form: { userId } },
      orderBy: { createdAt: 'asc' },
      include: {
        tags: true,
      },
    });

    const seen = new Map<string, string>(); // key -> first response id
    const duplicateIds: string[] = [];

    for (const resp of responses) {
      // Chave de deduplicação: formId + answers (conteúdo idêntico)
      const key = `${resp.formId}:${resp.answers}`;

      if (seen.has(key)) {
        duplicateIds.push(resp.id);
      } else {
        seen.set(key, resp.id);
      }
    }

    // Remove tags e depois as respostas duplicadas
    if (duplicateIds.length > 0) {
      await prisma.responseTag.deleteMany({
        where: { responseId: { in: duplicateIds } },
      });
      await prisma.response.deleteMany({
        where: { id: { in: duplicateIds } },
      });
    }

    return NextResponse.json({
      success: true,
      totalAnalyzed: responses.length,
      duplicatesRemoved: duplicateIds.length,
      remaining: responses.length - duplicateIds.length,
    });
  } catch (error) {
    console.error('Dedup error:', error);
    return NextResponse.json({ error: 'Erro ao remover duplicatas' }, { status: 500 });
  }
}
