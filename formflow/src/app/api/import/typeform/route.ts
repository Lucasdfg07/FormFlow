import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, generateSlug } from '@/lib/utils';
import Papa from 'papaparse';

// Colunas de metadados do Typeform que NÃO são perguntas
const TYPEFORM_META_COLUMNS = new Set([
  '#',
  'Response Type',
  'Start Date (UTC)',
  'Stage Date (UTC)',
  'Submit Date (UTC)',
  'Network ID',
  'Tags',
  'Ending',
]);

// Tentar detectar o tipo de campo baseado no nome e conteúdo das respostas
function detectFieldType(
  columnName: string,
  sampleValues: string[]
): string {
  const name = columnName.toLowerCase();

  // Email
  if (name.includes('email') || name.includes('e-mail')) return 'email';

  // Telefone
  if (name.includes('telefone') || name.includes('phone') || name.includes('celular') || name.includes('whatsapp'))
    return 'phone';

  // URL / Link
  if (name.includes('url') || name.includes('link') || name.includes('linkedin') || name.includes('site') || name.includes('website'))
    return 'url';

  // Idade / Número
  if (name.includes('idade') || name.includes('age')) return 'short_text';

  // Data
  if (name.includes('data') || name.includes('date') || name.includes('nascimento')) return 'date';

  // Sim/Não
  const yesNoPatterns = ['sim', 'não', 'nao', 'yes', 'no'];
  const allYesNo = sampleValues
    .filter((v) => v.trim() !== '')
    .every((v) => yesNoPatterns.includes(v.trim().toLowerCase()));
  if (allYesNo && sampleValues.filter((v) => v.trim() !== '').length > 0) return 'yes_no';

  // Verificar se parece múltipla escolha (poucas opções únicas)
  const uniqueValues = new Set(sampleValues.filter((v) => v.trim() !== ''));
  if (uniqueValues.size > 0 && uniqueValues.size <= 10 && sampleValues.length >= 3) {
    return 'multiple_choice';
  }

  // Texto longo (respostas com mais de 100 chars em média)
  const avgLen =
    sampleValues.filter((v) => v).reduce((sum, v) => sum + v.length, 0) /
    Math.max(sampleValues.filter((v) => v).length, 1);
  if (avgLen > 100) return 'long_text';

  // Default: texto curto
  return 'short_text';
}

// POST /api/import/typeform — Import Typeform CSV
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const formTitle = (formData.get('title') as string) || 'Importado do Typeform';

    if (!file) {
      return NextResponse.json({ error: 'Arquivo CSV é obrigatório' }, { status: 400 });
    }

    // Ler conteúdo do arquivo
    const text = await file.text();

    // Parse CSV com papaparse
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao analisar CSV', details: parsed.errors.slice(0, 5) },
        { status: 400 }
      );
    }

    const rows = parsed.data as Record<string, string>[];
    const allHeaders = parsed.meta.fields || [];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV vazio — nenhuma resposta encontrada' }, { status: 400 });
    }

    // Separar colunas de perguntas das colunas de metadados
    const questionHeaders = allHeaders.filter((h) => !TYPEFORM_META_COLUMNS.has(h));

    if (questionHeaders.length === 0) {
      return NextResponse.json({ error: 'Nenhuma coluna de pergunta encontrada no CSV' }, { status: 400 });
    }

    // Coletar amostras de valores para cada coluna
    const samplesByColumn: Record<string, string[]> = {};
    for (const header of questionHeaders) {
      samplesByColumn[header] = rows.map((row) => row[header] || '').slice(0, 50);
    }

    // Criar formulário
    const form = await prisma.form.create({
      data: {
        userId,
        title: formTitle.trim(),
        description: `Importado do Typeform em ${new Date().toLocaleDateString('pt-BR')}. ${rows.length} respostas importadas.`,
        slug: generateSlug(formTitle.trim()),
        status: 'CLOSED',
      },
    });

    // Criar campos (fields)
    const fieldMap: Record<string, string> = {}; // headerName -> fieldId

    for (let i = 0; i < questionHeaders.length; i++) {
      const header = questionHeaders[i];
      const detectedType = detectFieldType(header, samplesByColumn[header]);

      // Se for múltipla escolha, criar as choices
      let properties: string | null = null;
      if (detectedType === 'multiple_choice') {
        const uniqueVals = [...new Set(samplesByColumn[header].filter((v) => v.trim() !== ''))];
        properties = JSON.stringify({
          choices: uniqueVals.map((v, idx) => ({
            id: `choice_${idx}`,
            label: v,
            value: v,
          })),
        });
      }

      const field = await prisma.field.create({
        data: {
          formId: form.id,
          type: detectedType,
          title: header,
          required: false,
          order: i,
          properties,
        },
      });

      fieldMap[header] = field.id;
    }

    // Criar respostas
    const tagNamesInCSV = new Set<string>();
    const responseTagPairs: { responseId: string; tagName: string }[] = [];

    for (const row of rows) {
      // Montar answers: { fieldId: value }
      const answers: Record<string, string> = {};
      for (const header of questionHeaders) {
        const fieldId = fieldMap[header];
        if (fieldId && row[header]) {
          answers[fieldId] = row[header];
        }
      }

      // Metadados do Typeform
      const startDate = row['Start Date (UTC)'];
      const submitDate = row['Submit Date (UTC)'];
      const networkId = row['Network ID'];
      const responseType = row['Response Type'];
      const typeformId = row['#'];

      const metadata: Record<string, string> = {};
      if (typeformId) metadata.typeformId = typeformId;
      if (networkId) metadata.networkId = networkId;
      if (responseType) metadata.responseType = responseType;
      if (startDate) metadata.startedAt = startDate;

      const completedAt = submitDate ? new Date(submitDate) : null;
      const createdAt = startDate ? new Date(startDate) : new Date();

      const response = await prisma.response.create({
        data: {
          formId: form.id,
          answers: JSON.stringify(answers),
          metadata: JSON.stringify(metadata),
          completedAt: completedAt && !isNaN(completedAt.getTime()) ? completedAt : null,
          createdAt: createdAt && !isNaN(createdAt.getTime()) ? createdAt : new Date(),
        },
      });

      // Tags do Typeform
      const tags = row['Tags'];
      if (tags && tags.trim()) {
        const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
        for (const tagName of tagList) {
          tagNamesInCSV.add(tagName);
          responseTagPairs.push({ responseId: response.id, tagName });
        }
      }
    }

    // Criar tags e associar às respostas
    if (tagNamesInCSV.size > 0) {
      const tagColors = ['#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
      const tagIdMap: Record<string, string> = {};
      let colorIdx = 0;

      for (const tagName of tagNamesInCSV) {
        // Buscar tag existente ou criar nova
        let tag = await prisma.tag.findFirst({ where: { name: tagName } });
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              color: tagColors[colorIdx % tagColors.length],
            },
          });
          colorIdx++;
        }
        tagIdMap[tagName] = tag.id;
      }

      // Associar tags às respostas
      for (const pair of responseTagPairs) {
        const tagId = tagIdMap[pair.tagName];
        if (tagId) {
          await prisma.responseTag.create({
            data: {
              responseId: pair.responseId,
              tagId,
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        formId: form.id,
        formTitle: form.title,
        slug: form.slug,
        fieldsCreated: questionHeaders.length,
        responsesImported: rows.length,
        tagsCreated: tagNamesInCSV.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Import Typeform error:', error);
    return NextResponse.json({ error: 'Erro ao importar CSV do Typeform' }, { status: 500 });
  }
}
