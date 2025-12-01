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

	/** Logs in a user. Handles the case-insensitivity of the returned token object. */
	async login(creds: LoginRequest): Promise<ApiResponse<LoginResponse>> {
		// Use BackendLoginResponse to avoid 'any'
		const res = await api.post<BackendLoginResponse>('/users/login', creds);

		if (res.error || !res.data) {
			return { error: res.error, message: res.message };
		}

		const { data } = res;

		// We ensure we return the strict LoginResponse shape here
		const token = data.token;
		const user = data.user;

		if (!token || !user) {
			return { error: "Ongeldig antwoord van server." };
		}

		return { data: { token, user } };
	},

	/** Fetch a user by ID. */
	getUserById: (id: number) => api.get<User>(`/users/${id}`),

	/** Updates the authenticated user's profile (name + email). */
	updateProfile: (data: UpdateProfileRequest) => api.put<User>('/users/me', data),

	/** Changes the authenticated user's password. */
	changePassword: (data: ChangePasswordRequest) => api.put<{ message: string }>('/users/me/password', data),

	/** Starts the TOTP setup flow. */
	beginTotpSetup: () => api.post<TotpSetupResponse>('/users/me/totp/setup'),

	/** Confirms a TOTP setup with the provided code. */
	verifyTotp: (data: VerifyTotpRequest) => api.post<User>('/users/me/totp/verify', data),

	/** Disables TOTP for the authenticated user. */
	disableTotp: (data: VerifyTotpRequest) => api.post<User>('/users/me/totp/disable', data),
};