'use client';

import { useSession, signOut } from 'next-auth/react';
import { Menu, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-surface-hover text-muted-foreground"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-hover transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
              <span className="text-xs font-semibold text-accent">{initials}</span>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg py-1 animate-scale-in z-50">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-sm font-medium text-foreground">{session?.user?.name || 'Usuario'}</p>
                <p className="text-xs text-muted">{session?.user?.email || ''}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
