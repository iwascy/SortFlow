import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileGrid } from './features/file-explorer/FileGrid';
import { useAppStore } from './store/useAppStore';

const queryClient = new QueryClient();

function App() {
  const { config } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">SortFlow</h1>
        </header>
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          <FileGrid />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
