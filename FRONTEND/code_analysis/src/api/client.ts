import axios, { AxiosInstance } from 'axios';
import type {
  FlowchartResponse,
  ComplexityResponse,
  RefactorResponse,
  DocstringResponse,
  ApiRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
    // Check if it's a connection error (backend not running)
    const isConnectionError = 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ERR_NETWORK' ||
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch') ||
      (error.response === undefined && error.request !== undefined);
    
    if (isConnectionError) {
      throw new Error('Backend server is not running. Please start the FastAPI server on port 8000.');
    }
    
    // Check for timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. The backend may be slow or unresponsive.');
    }
    
    // Provide more detailed error messages from backend
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    // Generic error
    if (error.response?.status) {
      throw new Error(`Backend error (${error.response.status}): ${error.message}`);
    }
    
    throw error;
  }
);

// API Functions
export const analyzeCode = async (request: ApiRequest): Promise<FlowchartResponse> => {
  const response = await apiClient.post<FlowchartResponse>('/api/explain', {
    code: request.code,
    language: request.language || 'auto',
  });
  return response.data;
};

export const getComplexity = async (request: ApiRequest): Promise<ComplexityResponse> => {
  const response = await apiClient.post<ComplexityResponse>('/api/complexity', {
    code: request.code,
    language: request.language || 'auto',
  });
  return response.data;
};

export const refactorCode = async (request: ApiRequest): Promise<RefactorResponse> => {
  const response = await apiClient.post<RefactorResponse>('/api/refactor', {
    code: request.code,
    language: request.language || 'auto',
  });
  return response.data;
};

export const generateDocstring = async (request: ApiRequest): Promise<DocstringResponse> => {
  const response = await apiClient.post<DocstringResponse>('/api/docstring', {
    code: request.code,
    style: 'auto',
  });
  return response.data;
};

// Health check
export const ping = async (): Promise<{ status: string; msg: string }> => {
  try {
    const response = await apiClient.get<{ status: string; msg: string }>('/api/ping', {
      timeout: 3000, // 3 second timeout for ping
    });
    return response.data;
  } catch (error: any) {
    // Log but don't throw - let caller handle
    console.warn('Ping failed:', error.message);
    throw error;
  }
};

