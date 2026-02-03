import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileGrid } from './features/file-explorer/FileGrid';
import { PatternMixer } from './features/pattern-mixer/PatternMixer';
import { ExecutionView } from './features/execution/ExecutionView';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow px-6 py-4 z-10">
          <h1 className="text-xl font-bold text-gray-800">SortFlow</h1>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 p-4">
             <div className="bg-white rounded shadow flex-1 overflow-hidden flex flex-col">
                <FileGrid />
             </div>
          </div>
          <div className="w-96 bg-white shadow-l border-l flex flex-col overflow-y-auto z-20">
             <div className="p-4 flex-1">
               <PatternMixer />
             </div>
             <div className="sticky bottom-0 bg-white z-30">
               <ExecutionView />
             </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
