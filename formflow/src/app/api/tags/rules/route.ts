import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// GET /api/tags/rules?formId=xxx — List tag rules for a form
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

    const rules = await prisma.tagRule.findMany({
      where: { formId },
      include: {
        tag: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { tag: { name: 'asc' } },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('List tag rules error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/tags/rules — Create a new tag rule
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { formId, tagId, fieldId, operator, value } = body;

    if (!formId || !tagId || !fieldId || !operator || value === undefined) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Check form ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    const rule = await prisma.tagRule.create({
      data: {
        formId,
        tagId,
        fieldId,
        operator,
        value: String(value),
        active: true,
      },
      include: {
        tag: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Create tag rule error:', error);
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 });
  }
}

// DELETE /api/tags/rules?id=xxx — Delete a tag rule
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return NextResponse.json({ error: 'id é obrigatorio' }, { status: 400 });
    }

    // Get the rule and check form ownership
    const rule = await prisma.tagRule.findUnique({
      where: { id: ruleId },
      include: { form: true },
    });

    if (!rule || rule.form.userId !== userId) {
      return NextResponse.json({ error: 'Regra nao encontrada' }, { status: 404 });
    }

    await prisma.tagRule.delete({ where: { id: ruleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag rule error:', error);
    return NextResponse.json({ error: 'Erro ao deletar regra' }, { status: 500 });
  }
}
