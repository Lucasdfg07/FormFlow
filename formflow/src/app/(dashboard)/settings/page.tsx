'use client';

import { useSession } from 'next-auth/react';
import { User, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Configuracoes</h1>
          <p className="text-sm text-muted mt-0.5">Gerencie sua conta e preferencias</p>
        </div>

        {/* Account */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Conta</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted font-medium mb-1">Nome</p>
              <p className="text-sm text-foreground">{session?.user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium mb-1">Email</p>
              <p className="text-sm text-foreground">{session?.user?.email || '—'}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Sistema</h3>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p>FormFlow v1.0.0</p>
            <p>Next.js + Prisma + SQLite</p>
            <p>Self-hosted</p>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Seguranca</h3>
          </div>
          <p className="text-sm text-muted">
            Senhas criptografadas com bcrypt. Sessoes JWT com validade de 30 dias.
          </p>
        </div>
      </div>
    </div>
  );
}
