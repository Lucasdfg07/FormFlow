import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// GET /api/forms/[id] — Get single form with fields
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const form = await prisma.form.findFirst({
      where: { id, userId },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/forms/[id] — Update form
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existing = await prisma.form.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    // Only allow updating known fields
    const allowedFields = ['title', 'description', 'status', 'theme', 'welcomeScreen', 'thankYouScreen', 'settings', 'slug'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const form = await prisma.form.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE /api/forms/[id] — Delete form
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.form.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    await prisma.form.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
