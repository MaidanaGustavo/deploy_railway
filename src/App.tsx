import React from 'react'
import RamiWizardWireframe from './RamiWizardWireframe'
import AuthScreen from './components/AuthScreen'
// import Header from './components/Header'
import RamiHome from './components/RamiHome'
import { useState } from 'react'
import { addArea } from './services/areas'
import type { Area } from './types/area'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<'home' | 'wizard'>('home')
  const { user } = useAuth();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (screen === 'wizard') {
    return (
      <RamiWizardWireframe
        onExit={() => setScreen('home')}
        onComplete={(dados) => {
          if (!user) return;
          // Converter área para hectares
          let ha: number | null = null;
          const v = dados.area.valor;
          if (typeof v === 'number') {
            ha = dados.area.unidade === 'ha' ? v : +(v / 10000).toFixed(2);
          }
          const nomeBase = dados.localizacao.talhao || (dados.cultura ? `${dados.cultura}` : 'Área sem nome');
          const novaArea: Area = {
            id: Date.now().toString(),
            userId: user.id,
            nome: nomeBase,
            cultura: dados.cultura,
            ha,
            irrigacaoUsa: dados.irrigacao.usa === true,
            status: 'Cadastrada',
            progresso: 0,
            createdAt: new Date().toISOString(),
          };
          addArea(user.id, novaArea);
          // Limpar rascunho do wizard
          try { localStorage.removeItem('rami_wizard_v2'); } catch {}
          setScreen('home');
        }}
      />
    )
  }

  return <RamiHome onNewPlanting={() => setScreen('wizard')} />
}
