import { User } from '../../types/user';
import { RegisterUserRequest, LoginRequest, ApiResponse, LoginResponse } from '../../types/api';

const API_BASE_URL = 'http://localhost:5048/api';

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

			const data = await response.json();

			if (!response.ok) {
				return { error: data.message || 'Login failed' };
			}

			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},
};