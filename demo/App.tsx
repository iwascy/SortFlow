
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Configuration from './components/Configuration';

type Tab = 'dashboard' | 'config' | 'history';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'config' && <Configuration />}
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
  );
};

export default App;
