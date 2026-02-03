const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface MockRegistry {
  [key: string]: (options?: RequestInit) => Promise<any>;
}

const mockRegistry: MockRegistry = {};

export function registerMock(endpoint: string, method: string, handler: (options?: RequestInit) => Promise<any>) {
  mockRegistry[`${method}:${endpoint}`] = handler;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';

  if (USE_MOCK) {
    // Simple matching for mock registry
    // In a real app, might need regex matching for dynamic params
    const mockKey = `${method}:${endpoint}`;
    // Also try matching without query params
    const endpointPath = endpoint.split('?')[0];
    const mockKeyPath = `${method}:${endpointPath}`;

    const handler = mockRegistry[mockKey] || mockRegistry[mockKeyPath];
    if (handler) {
      console.log(`[Mock API] ${method} ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency
      return handler(options);
    }
    console.warn(`[Mock API] No mock found for ${method} ${endpoint}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}
