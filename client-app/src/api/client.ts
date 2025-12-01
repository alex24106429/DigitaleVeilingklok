import { ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';

/**
 * Creates the standard authorization headers.
 */
const getHeaders = (): HeadersInit => {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		...(token ? { 'Authorization': `Bearer ${token}` } : {}),
	};
};

/**
 * Generic request handler that manages standard fetch boilerplate, auth injection, and error parsing.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			headers: getHeaders(),
			...options,
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			// Handle various error formats (string message, validation object, or status text)
			const errorMsg = data.message
				|| (data.errors ? Object.values(data.errors).join('\n') : null)
				|| response.statusText;
			return { error: errorMsg };
		}

		return { data: data as T, message: data.message };
	} catch (err) {
		console.error(`API Error (${endpoint}):`, err);
		return { error: 'Network error. Please try again.' };
	}
}

/**
 * Helper to create a cached resource for GET requests.
 * Manages in-memory caching and in-flight promise deduplication.
 */
export function createCachedResource<T>(endpoint: string) {
	let cache: T | null = null;
	let promise: Promise<ApiResponse<T>> | null = null;

	return {
		/** Fetch data, optionally forcing a refresh. */
		get: async (force = false): Promise<ApiResponse<T>> => {
			if (!force && cache) return { data: cache };
			if (!force && promise) return promise;

			promise = request<T>(endpoint).then((res) => {
				if (res.data) cache = res.data;
				return res;
			}).finally(() => { promise = null; });

			return promise;
		},
		/** Invalidate the current cache. */
		invalidate: () => { cache = null; }
	};
}

/**
 * Public API client methods.
 */
export const api = {
	get: <T>(url: string) => request<T>(url, { method: 'GET' }),
	post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
	put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
	delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};