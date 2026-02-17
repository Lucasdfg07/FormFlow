import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, generateSlug } from '@/lib/utils';

// GET /api/forms — List all forms for current user
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const forms = await prisma.form.findMany({
      where: {
        userId,
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(search ? { title: { contains: search } } : {}),
      },
      include: {
        _count: {
          select: { responses: true },
        },
        responses: {
          select: { completedAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate completion rate from real data
    const formsWithStats = forms.map((form) => {
      const total = form.responses.length;
      const completed = form.responses.filter((r) => r.completedAt !== null).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Remove raw responses from payload to keep it lean
      const { responses, ...rest } = form;
      return { ...rest, completionRate };
    });

    return NextResponse.json(formsWithStats);
  } catch (error) {
    console.error('List forms error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/forms — Create new form
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Titulo é obrigatório' }, { status: 400 });
    }

    const form = await prisma.form.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        slug: generateSlug(title.trim()),
        status: 'DRAFT',
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Create form error:', error);
    return NextResponse.json({ error: 'Erro ao criar formulario' }, { status: 500 });
  }
}
