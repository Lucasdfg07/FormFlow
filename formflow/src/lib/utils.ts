import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Get current user ID from session (server-side)
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string })?.id || null;
}

// Generate slug from title
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

// Parse JSON safely from string (database stored as string)
export function parseJsonField<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Stringify JSON for database storage
export function stringifyJsonField(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}
