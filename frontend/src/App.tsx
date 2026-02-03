import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'history'>('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'config' && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4 block">settings</span>
              <p className="text-lg font-medium">Configuration Panel</p>
              <p className="text-sm opacity-60">Coming soon.</p>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4 block">history</span>
              <p className="text-lg font-medium">History Log is empty.</p>
              <p className="text-sm opacity-60">Operations you perform will appear here.</p>
            </div>
          </div>
        )}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
