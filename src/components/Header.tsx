import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Olá, {user.name.split(' ')[0]}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
