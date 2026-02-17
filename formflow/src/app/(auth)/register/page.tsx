'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Layers } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      router.push('/');
      router.refresh();
    } catch {
      setError('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground mb-4">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">FormFlow</h1>
        <p className="text-muted mt-1 text-sm">Crie sua conta</p>
      </div>

      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Minimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Ja tem uma conta?{' '}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
