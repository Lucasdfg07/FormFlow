import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import FormRenderer from '@/components/renderer/FormRenderer';

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;

  const form = await prisma.form.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      fields: { orderBy: { order: 'asc' } },
    },
  });

  if (!form) {
    notFound();
  }

  const welcomeScreen = form.welcomeScreen ? JSON.parse(form.welcomeScreen) : null;
  const thankYouScreen = form.thankYouScreen ? JSON.parse(form.thankYouScreen) : null;
  const theme = form.theme ? JSON.parse(form.theme) : null;

  return (
    <FormRenderer
      formId={form.id}
      title={form.title}
      fields={form.fields}
      welcomeScreen={welcomeScreen}
      thankYouScreen={thankYouScreen}
      theme={theme}
    />
  );
}
