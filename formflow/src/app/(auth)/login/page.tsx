'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Layers } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha incorretos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Erro ao fazer login');
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
        <p className="text-muted mt-1 text-sm">Entre na sua conta</p>
      </div>

      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Ainda nao tem conta?{' '}
          <Link href="/register" className="text-foreground hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
