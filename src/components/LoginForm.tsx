import React, { useState } from 'react';
import { LoginData } from '../types/auth';

interface LoginFormProps {
  onLogin: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  onSwitchToRegister: () => void;
  loading?: boolean;
}

export default function LoginForm({ onLogin, onSwitchToRegister, loading = false }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!formData.email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!formData.password) {
      setError('Digite sua senha');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Digite um email válido');
      return;
    }

    const result = await onLogin(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Limpar erro quando usuário começar a digitar
    if (error) setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            Entrar no Rami
          </h1>
          <p className="text-sm text-neutral-600">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="seu@email.com"
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Sua senha"
                className="h-12 w-full rounded-xl border border-neutral-300 bg-white pr-10 pl-3 text-base outline-none transition-colors focus:border-emerald-600"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={loading}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.62-1.44 1.6-2.86 2.82-4.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1 2.3-2.7 4.31-4.74 5.66"/>
                    <path d="M1 1l22 22"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
                <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-emerald-600 px-4 text-base font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Ainda não tem conta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-emerald-600 font-medium hover:underline"
              disabled={loading}
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
