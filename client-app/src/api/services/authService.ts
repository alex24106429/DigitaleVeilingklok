import { RegisterUserRequest, LoginRequest, User, ApiResponse, LoginResponse } from '../../types/user';

const API_BASE_URL = 'http://localhost:5048/api';

export const authService = {
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