import { User } from '../../types/user';
import { RegisterUserRequest, LoginRequest, ApiResponse, LoginResponse } from '../../types/api';

const API_BASE_URL = 'http://localhost:5048/api';

/**
 * Retrieves the authorization headers from local storage.
 * @returns {HeadersInit} The headers object with the Authorization token.
 * @throws {Error} If the authentication token is not found.
 */
const getAuthHeaders = (): HeadersInit => {
	const token = localStorage.getItem('token');
	if (!token) {
		throw new Error('No authentication token found.');
	}
	return {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	};
};

/**
 * DTO for updating profile (name + email)
 */
interface UpdateProfileRequest {
	fullName: string;
	email: string;
}

/**
 * DTO for changing password
 */
interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

/**
 * Service object for handling authentication-related API calls.
 */
export const authService = {
	/**
	 * Registers a new user with the provided user data.
	 * @param {RegisterUserRequest} userData - The user registration information.
	 * @returns {Promise<ApiResponse<User>>} A promise that resolves to an ApiResponse containing the new user data or an error.
	 */
	async register(userData: RegisterUserRequest): Promise<ApiResponse<User>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData),
			});

			const data = await response.json();

			if (!response.ok) {
				return { error: data.message || 'Registration failed' };
			}

			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Logs in a user with the provided credentials.
	 * @param {LoginRequest} credentials - The user's login credentials (email and password).
	 * @returns {Promise<ApiResponse<LoginResponse>>} A promise that resolves to an ApiResponse containing the login response (token + User object) or an error.
	 */
	async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(credentials),
			});

			const raw = await response.json();

			if (!response.ok) {
				return { error: raw.message || 'Login failed' };
			}

			// Backend returns { Token, User }, map to { token, user }
			const data: LoginResponse = {
				token: raw.token ?? raw.Token,
				user: raw.user ?? raw.User,
			};

			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Fetch a user by ID using the current auth token.
	 * Useful for validating the stored session.
	 * @param {number} id
	 * @returns {Promise<ApiResponse<User>>}
	 */
	async getUserById(id: number): Promise<ApiResponse<User>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/${id}`, {
				method: 'GET',
				headers: getAuthHeaders(),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data?.message || 'Failed to fetch user.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Updates the authenticated user's profile (name + email).
	 * @param {UpdateProfileRequest} payload
	 * @returns {Promise<ApiResponse<User>>}
	 */
	async updateProfile(payload: UpdateProfileRequest): Promise<ApiResponse<User>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/me`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Failed to update profile.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Changes the authenticated user's password.
	 * @param {ChangePasswordRequest} payload
	 * @returns {Promise<ApiResponse<{ message: string }>>}
	 */
	async changePassword(payload: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/me/password`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(payload),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				return { error: data.message || 'Failed to change password.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},
};