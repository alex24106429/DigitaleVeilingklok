import { api } from '../client';
import { User } from '../../types/user';
import {
	RegisterUserRequest,
	LoginRequest,
	LoginResponse,
	BackendLoginResponse,
	UpdateProfileRequest,
	ChangePasswordRequest,
	TotpSetupResponse,
	VerifyTotpRequest,
	ApiResponse
} from '../../types/api';

/**
 * Service object for handling authentication-related API calls.
 */
export const authService = {
	/** Registers a new user with the provided user data. */
	register: (data: RegisterUserRequest) => api.post<User>('/users/register', data),

	/** Logs in a user. Handles the case-insensitivity of the returned user object. */
	async login(creds: LoginRequest): Promise<ApiResponse<LoginResponse>> {
		// Use BackendLoginResponse to avoid 'any'
		const res = await api.post<BackendLoginResponse>('/users/login', creds);

		if (res.error || !res.data) {
			return { error: res.error, message: res.message };
		}

		const { data } = res;
		const user = data.user;

		if (!user) {
			return { error: "Ongeldig antwoord van server." };
		}

		return { data: { user } };
	},

	/** Logs out the user by telling the server to clear the cookie. */
	logout: () => api.post<{ message: string }>('/users/logout'),

	/** Fetch a user by ID. */
	getUserById: (id: number) => api.get<User>(`/users/${id}`),

	/** Updates the authenticated user's profile (name + email). */
	updateProfile: (data: UpdateProfileRequest) => api.put<User>('/users/me', data),

	/** Changes the authenticated user's password. */
	changePassword: (data: ChangePasswordRequest) => api.put<{ message: string }>('/users/me/password', data),

	/** Deletes the authenticated user's account. */
	deleteAccount: () => api.delete('/users/me'),

	/** Starts the TOTP setup flow. */
	beginTotpSetup: () => api.post<TotpSetupResponse>('/users/me/totp/setup'),

	/** Confirms a TOTP setup with the provided code. */
	verifyTotp: (data: VerifyTotpRequest) => api.post<User>('/users/me/totp/verify', data),

	/** Disables TOTP for the authenticated user. */
	disableTotp: (data: VerifyTotpRequest) => api.post<User>('/users/me/totp/disable', data),
};
