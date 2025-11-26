// API Service for Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.detail || data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network error',
      0,
      null
    );
  }
}

// Health check
export async function ping() {
  return apiRequest('/api/ping');
}

// Explain code and get flowchart
export async function explainCode(code, language = 'auto') {
  return apiRequest('/api/explain', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

// Refactor code
export async function refactorCode(code, language = 'auto') {
  return apiRequest('/api/refactor', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

// Analyze complexity
export async function analyzeComplexity(code, language = 'auto') {
  return apiRequest('/api/complexity', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

// Generate docstring
export async function generateDocstring(code, style = 'auto') {
  return apiRequest('/api/docstring', {
    method: 'POST',
    body: JSON.stringify({ code, style }),
  });
}

// Comprehensive analysis - combines multiple endpoints
export async function analyzeCode(code, language = 'auto', options = {}) {
  const { includeRefactor = true, includeComplexity = true, includeExplain = true } = options;
  
  const results = {
    explain: null,
    refactor: null,
    complexity: null,
    docstring: null,
  };

  try {
    // Run all analyses in parallel
    const promises = [];
    
    if (includeExplain) {
      promises.push(explainCode(code, language).catch(err => ({ error: err.message })));
    }
    
    if (includeRefactor) {
      promises.push(refactorCode(code, language).catch(err => ({ error: err.message })));
    }
    
    if (includeComplexity) {
      promises.push(analyzeComplexity(code, language).catch(err => ({ error: err.message })));
    }

    const [explainResult, refactorResult, complexityResult] = await Promise.all(promises);

    if (includeExplain && !explainResult.error) {
      results.explain = explainResult;
    }
    
    if (includeRefactor && !refactorResult.error) {
      results.refactor = refactorResult;
    }
    
    if (includeComplexity && !complexityResult.error) {
      results.complexity = complexityResult;
    }

    return results;
  } catch (error) {
    throw new ApiError(
      `Analysis failed: ${error.message}`,
      error.status || 500,
      error.data
    );
  }
}

export { ApiError };

