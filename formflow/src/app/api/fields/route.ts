import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// GET /api/fields?formId=xxx — Get all fields for a form
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

    const fields = await prisma.field.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error('List fields error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/fields — Create a new field
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { formId, type, title, description, required, hidden, order, properties, validations, logic } = body;

    // Check ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    const field = await prisma.field.create({
      data: {
        formId,
        type,
        title: title || 'Nova pergunta',
        description: description || null,
        required: required || false,
        hidden: hidden || false,
        order: order ?? 0,
        properties: properties ? JSON.stringify(properties) : null,
        validations: validations ? JSON.stringify(validations) : null,
        logic: logic ? JSON.stringify(logic) : null,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error('Create field error:', error);
    return NextResponse.json({ error: 'Erro ao criar campo' }, { status: 500 });
  }
}

// PUT /api/fields — Bulk update fields (reorder, etc.)
export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { formId, fields } = body as {
      formId: string;
      fields: { id: string; order: number; title?: string; description?: string | null; required?: boolean; hidden?: boolean; properties?: string | null; validations?: string | null; logic?: string | null }[];
    };

    // Check ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    // Update all fields in a transaction
    await prisma.$transaction(
      fields.map((field) =>
        prisma.field.update({
          where: { id: field.id },
          data: {
            order: field.order,
            ...(field.title !== undefined ? { title: field.title } : {}),
            ...(field.description !== undefined ? { description: field.description } : {}),
            ...(field.required !== undefined ? { required: field.required } : {}),
            ...(field.hidden !== undefined ? { hidden: field.hidden } : {}),
            ...(field.properties !== undefined ? { properties: field.properties } : {}),
            ...(field.validations !== undefined ? { validations: field.validations } : {}),
            ...(field.logic !== undefined ? { logic: field.logic } : {}),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update fields error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campos' }, { status: 500 });
  }
}

// DELETE /api/fields?id=xxx — Delete a field
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('id');

    if (!fieldId) {
      return NextResponse.json({ error: 'id é obrigatorio' }, { status: 400 });
    }

    // Get the field and check form ownership
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { form: true },
    });

    if (!field || field.form.userId !== userId) {
      return NextResponse.json({ error: 'Campo nao encontrado' }, { status: 404 });
    }

    await prisma.field.delete({ where: { id: fieldId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete field error:', error);
    return NextResponse.json({ error: 'Erro ao deletar campo' }, { status: 500 });
  }
}
