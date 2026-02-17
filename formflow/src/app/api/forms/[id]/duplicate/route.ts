import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, generateSlug } from '@/lib/utils';

// POST /api/forms/[id]/duplicate — Duplicate a form with all fields
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Get original form with fields
    const original = await prisma.form.findFirst({
      where: { id, userId },
      include: { fields: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Formulario nao encontrado' }, { status: 404 });
    }

    const newTitle = `${original.title} (Copia)`;

    // Create duplicate
    const duplicate = await prisma.form.create({
      data: {
        userId,
        title: newTitle,
        description: original.description,
        slug: generateSlug(newTitle),
        status: 'DRAFT',
        theme: original.theme,
        welcomeScreen: original.welcomeScreen,
        thankYouScreen: original.thankYouScreen,
        settings: original.settings,
        fields: {
          create: original.fields.map((field) => ({
            type: field.type,
            title: field.title,
            description: field.description,
            required: field.required,
            order: field.order,
            properties: field.properties,
            validations: field.validations,
            logic: field.logic,
          })),
        },
      },
      include: { fields: true },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error('Duplicate form error:', error);
    return NextResponse.json({ error: 'Erro ao duplicar' }, { status: 500 });
  }
}
