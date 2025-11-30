import { User } from '../../types/user';
import {
	RegisterUserRequest,
	LoginRequest,
	ApiResponse,
	LoginResponse,
	TotpSetupResponse,
	VerifyTotpRequest,
} from '../../types/api';

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
export interface UpdateProfileRequest {
	fullName: string;
	email: string;
}

/**
 * DTO for changing password
 */
export interface ChangePasswordRequest {
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
				return { error: data.message || 'Registratie mislukt!' };
			}

			return { data };
		} catch {
			return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' };
		}
	},

	/**
	 * Logs in a user with the provided credentials.
	 * @param {LoginRequest} credentials - The user's login credentials (email and password, optionally a TOTP code).
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

			const raw = await response.json().catch(() => ({}));

			if (!response.ok) {
				return { error: raw.message || 'Ongeldige e-mail of wachtwoord' };
			}

			// Backend returns { Token, User }, map to { token, user }
			const data: LoginResponse = {
				token: raw.token ?? raw.Token,
				user: raw.user ?? raw.User,
			};

			return { data };
		} catch {
			return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' };
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
				return { error: data?.message || 'Kan gebruiker niet ophalen.' };
			}
			return { data };
		} catch {
			return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' };
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
				return { error: data.message || 'Profiel wijzingingen niet gelukt.' };
			}
			return { data };
		} catch {
			return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' };
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
			return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' };
		}
	},

	/**
	 * Starts the TOTP setup flow and returns the shared secret + otpauth URL.
	 */
	async beginTotpSetup(): Promise<ApiResponse<TotpSetupResponse>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/me/totp/setup`, {
				method: 'POST',
				headers: getAuthHeaders(),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Kan TOTP-configuratie niet starten.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Confirms a TOTP setup with the provided code.
	 */
	async verifyTotp(payload: VerifyTotpRequest): Promise<ApiResponse<User>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/me/totp/verify`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Verificatie van 2FA-code mislukt.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Disables TOTP for the authenticated user (requires a valid code).
	 */
	async disableTotp(payload: VerifyTotpRequest): Promise<ApiResponse<User>> {
		try {
			const response = await fetch(`${API_BASE_URL}/users/me/totp/disable`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Uitschakelen van 2FA mislukt.' };
			}
			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},
};