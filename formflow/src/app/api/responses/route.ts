import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';
import { validateField, type ValidationRule } from '@/lib/validators';

// GET /api/responses?formId=xxx — Get all responses for a form
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json({ error: 'formId é obrigatorio' }, { status: 400 });
    }

    // Check ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('List responses error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/responses — Submit a response (PUBLIC - no auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, answers, metadata } = body;

    if (!formId || !answers) {
      return NextResponse.json({ error: 'formId e answers sao obrigatorios' }, { status: 400 });
    }

    // Check if form exists and is published
    const form = await prisma.form.findFirst({
      where: { id: formId, status: 'PUBLISHED' },
      include: {
        fields: { orderBy: { order: 'asc' } },
        tagRules: { include: { tag: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado ou nao publicado' }, { status: 404 });
    }

    // Server-side field validation
    const validationErrors: { fieldId: string; field: string; error: string }[] = [];

    for (const field of form.fields) {
      const value = answers[field.id];
      const fieldValidations: ValidationRule | null = field.validations
        ? JSON.parse(field.validations)
        : null;

      const result = validateField(value, field.type, field.required, fieldValidations);

      if (!result.valid) {
        validationErrors.push({
          fieldId: field.id,
          field: field.title,
          error: result.error || 'Campo inválido',
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validação falhou',
          validationErrors,
        },
        { status: 422 }
      );
    }

    // Deduplicação server-side: mesmas respostas + mesmo formId nos últimos 60s
    const answersJson = JSON.stringify(answers);
    const deduplicaWindow = new Date(Date.now() - 60 * 1000); // 60 segundos

    const existingDuplicate = await prisma.response.findFirst({
      where: {
        formId,
        answers: answersJson,
        createdAt: { gte: deduplicaWindow },
      },
    });

    if (existingDuplicate) {
      // Retorna sucesso sem criar duplicata (idempotente)
      return NextResponse.json(
        { success: true, responseId: existingDuplicate.id, deduplicated: true },
        { status: 200 }
      );
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        formId,
        answers: answersJson,
        metadata: metadata ? JSON.stringify(metadata) : null,
        completedAt: new Date(),
      },
    });

    // Apply tag rules automatically
    for (const rule of form.tagRules) {
      if (!rule.active) continue;

      const fieldValue = String(answers[rule.fieldId] || '');
      let match = false;

      switch (rule.operator) {
        case 'equals':
          match = fieldValue === rule.value;
          break;
        case 'contains':
          match = fieldValue.toLowerCase().includes(rule.value.toLowerCase());
          break;
        case 'gt':
          match = Number(fieldValue) > Number(rule.value);
          break;
        case 'lt':
          match = Number(fieldValue) < Number(rule.value);
          break;
        case 'empty':
          match = !fieldValue || fieldValue.trim() === '';
          break;
        case 'not_empty':
          match = !!fieldValue && fieldValue.trim() !== '';
          break;
      }

      if (match) {
        await prisma.responseTag.create({
          data: {
            responseId: response.id,
            tagId: rule.tagId,
          },
        });
      }
    }

    // Fire webhooks
    const webhooks = await prisma.webhook.findMany({
      where: { formId, active: true },
    });

    for (const webhook of webhooks) {
      fireWebhook(webhook, response, answers).catch((err) =>
        console.error('Webhook error:', err)
      );
    }

    return NextResponse.json({ success: true, responseId: response.id }, { status: 201 });
  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json({ error: 'Erro ao submeter resposta' }, { status: 500 });
  }
}

// DELETE /api/responses?id=xxx or ?formId=xxx&batch=true — Delete response(s)
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('id');
    const formId = searchParams.get('formId');
    const batch = searchParams.get('batch');

    // Batch delete: delete all responses for a form
    if (batch === 'true' && formId) {
      const form = await prisma.form.findFirst({
        where: { id: formId, userId },
      });

      if (!form) {
        return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
      }

      // Delete response tags first
      await prisma.responseTag.deleteMany({
        where: { response: { formId } },
      });

      const result = await prisma.response.deleteMany({
        where: { formId },
      });

      return NextResponse.json({ success: true, deleted: result.count });
    }

    // Single delete
    if (!responseId) {
      return NextResponse.json({ error: 'id é obrigatorio' }, { status: 400 });
    }

    // Check ownership via form
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { form: true },
    });

    if (!response || response.form.userId !== userId) {
      return NextResponse.json({ error: 'Resposta nao encontrada' }, { status: 404 });
    }

    // Delete related tags
    await prisma.responseTag.deleteMany({ where: { responseId } });
    await prisma.response.delete({ where: { id: responseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete response error:', error);
    return NextResponse.json({ error: 'Erro ao deletar resposta' }, { status: 500 });
  }
}

// Fire webhook with retry
async function fireWebhook(
  webhook: { id: string; url: string; headers: string | null },
  response: { id: string },
  answers: Record<string, unknown>,
  attempt = 1
) {
  const maxAttempts = 3;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (webhook.headers) {
    try {
      Object.assign(headers, JSON.parse(webhook.headers));
    } catch { /* ignore */ }
  }

  const payload = {
    event: 'response.submitted',
    responseId: response.id,
    answers,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        status: res.status,
        success: res.ok,
        payload: JSON.stringify(payload),
        response: await res.text().catch(() => ''),
        attempt,
      },
    });

    if (!res.ok && attempt < maxAttempts) {
      setTimeout(() => fireWebhook(webhook, response, answers, attempt + 1), attempt * 5000);
    }
  } catch (error) {
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        status: 0,
        success: false,
        payload: JSON.stringify(payload),
        response: String(error),
        attempt,
      },
    });

    if (attempt < maxAttempts) {
      setTimeout(() => fireWebhook(webhook, response, answers, attempt + 1), attempt * 5000);
    }
  }
}
