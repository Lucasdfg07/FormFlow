import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/utils';

// PATCH /api/tags/[id] — Update a tag
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
    const { name, color } = body;

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tag' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] — Delete a tag
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

    // Delete all related ResponseTags and TagRules first (cascade should handle, but be explicit)
    await prisma.responseTag.deleteMany({ where: { tagId: id } });
    await prisma.tagRule.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Erro ao deletar tag' }, { status: 500 });
  }
}
