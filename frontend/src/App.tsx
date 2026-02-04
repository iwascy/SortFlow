import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { ConfigurationPage } from './features/config/ConfigurationPage';
import { HistoryPage } from './features/history/HistoryPage';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'history'>('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'config' && <ConfigurationPage />}
        {activeTab === 'history' && <HistoryPage />}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
