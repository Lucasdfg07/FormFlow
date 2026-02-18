import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// POST /api/responses/[id]/tags — Add a tag to a response
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: responseId } = await params;
    const body = await request.json();
    const { tagId, tagName, tagColor } = body;

    // Verify ownership
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { form: true },
    });

    if (!response || response.form.userId !== userId) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 });
    }

    let finalTagId = tagId;

    // If tagName is provided instead of tagId, create or find the tag
    if (!finalTagId && tagName) {
      let tag = await prisma.tag.findFirst({
        where: { name: { equals: tagName.trim() } },
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName.trim(),
            color: tagColor || '#6366f1',
          },
        });
      }

      finalTagId = tag.id;
    }

    if (!finalTagId) {
      return NextResponse.json({ error: 'tagId ou tagName é obrigatório' }, { status: 400 });
    }

    // Check if association already exists
    const existing = await prisma.responseTag.findUnique({
      where: { responseId_tagId: { responseId, tagId: finalTagId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag já associada' }, { status: 409 });
    }

    // Create association
    const responseTag = await prisma.responseTag.create({
      data: { responseId, tagId: finalTagId },
      include: { tag: true },
    });

    return NextResponse.json(responseTag, { status: 201 });
  } catch (error) {
    console.error('Add tag to response error:', error);
    return NextResponse.json({ error: 'Erro ao adicionar tag' }, { status: 500 });
  }
}

// DELETE /api/responses/[id]/tags — Remove a tag from a response
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: responseId } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: 'tagId é obrigatório' }, { status: 400 });
    }

    // Verify ownership
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { form: true },
    });

    if (!response || response.form.userId !== userId) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 });
    }

    await prisma.responseTag.delete({
      where: { responseId_tagId: { responseId, tagId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove tag from response error:', error);
    return NextResponse.json({ error: 'Erro ao remover tag' }, { status: 500 });
  }
}
