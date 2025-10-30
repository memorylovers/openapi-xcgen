/**
 * HTTP client utilities
 * Generated from: Custom Validation Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

/**
 * API error with detailed response information
 */
export class XcgenApiError extends Error {
  readonly response: Response;
  readonly body?: unknown;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;

  constructor(response: Response, body?: unknown) {
    super(`API Error: ${response.status} ${response.statusText}`);
    this.name = "XcgenApiError";
    this.response = response;
    this.body = body;
    this.status = response.status;
    this.statusText = response.statusText;
    this.url = response.url;
  }
}

/**
 * API client configuration
 */
export interface ApiConfig {
  /** Base URL for all API requests */
  baseUrl?: string;
  /** Default headers for all requests */
  headers?: Record<string, string>;
  /** Custom fetch function (for interceptors) */
  fetch?: typeof fetch;
}

let config: ApiConfig = {};

/**
 * Configure the API client
 * @param newConfig - Configuration options
 */
export function setConfig(newConfig: ApiConfig): void {
  config = { ...config, ...newConfig };
}

/**
 * Internal request helper
 * @internal
 */
export async function request<T>(params: {
  method: string;
  path: string;
  options: any;
  init?: RequestInit;
}): Promise<T> {
  const { method, path, options, init } = params;

  // Build URL with path parameters
  let url = config.baseUrl ? `${config.baseUrl}${path}` : path;

  // Replace path parameters
  if (options.path) {
    for (const [key, value] of Object.entries(options.path)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
  }

  // Add query parameters
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    ...config.headers,
    ...options.header,
    ...(init?.headers as Record<string, string>),
  };

  // Add Content-Type for body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Make request
  const fetchFn = config.fetch || fetch;
  const response = await fetchFn(url, {
    ...init,
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw new XcgenApiError(response, errorBody);
  }

  // Parse response
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type') || '';

  // Handle binary responses (images, PDFs, etc.)
  if (
    contentType.includes('application/octet-stream') ||
    contentType.includes('image/') ||
    contentType.includes('application/pdf') ||
    contentType.includes('video/') ||
    contentType.includes('audio/')
  ) {
    return response.blob() as T;
  }

  // Handle JSON responses
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  // Default to text
  return response.text() as T;
}
