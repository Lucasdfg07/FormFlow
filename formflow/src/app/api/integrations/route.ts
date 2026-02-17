import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// POST /api/integrations — Create webhook or integration
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, formId, url, headers } = body;

    // Check ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    if (type === 'webhook') {
      // Upsert webhook (one per form for simplicity)
      const existing = await prisma.webhook.findFirst({
        where: { formId },
      });

      if (existing) {
        const webhook = await prisma.webhook.update({
          where: { id: existing.id },
          data: { url, headers: headers || null, active: true },
        });
        return NextResponse.json(webhook);
      }

      const webhook = await prisma.webhook.create({
        data: {
          formId,
          url,
          headers: headers || null,
          active: true,
        },
      });

      return NextResponse.json(webhook, { status: 201 });
    }

    return NextResponse.json({ error: 'Tipo de integracao invalido' }, { status: 400 });
  } catch (error) {
    console.error('Integration error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET /api/integrations?formId=xxx — List integrations
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json({ error: 'formId obrigatorio' }, { status: 400 });
    }

    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { formId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('List integrations error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
