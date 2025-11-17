import { UserRole, User } from "./user";

/**
 * A generic wrapper for API responses.
 * It provides a standardized structure for both successful and failed requests.
 * @template T The type of the data expected in a successful response.
 */
export interface ApiResponse<T> {
	/** The data payload of a successful response. Undefined on error. */
	data?: T;
	/** An optional informational message from the server. */
	message?: string;
	/** An error message if the request failed. Undefined on success. */
	error?: string;
}

/**
 * Defines the shape of the data required to register a new user.
 */
export interface RegisterUserRequest {
	/** The full name of the new user. */
	fullName: string;
	/** The email address for the new user. */
	email: string;
	/** The password for the new user's account. */
	password: string;
	/** The role to be assigned to the new user. */
	role: UserRole;
}

/**
 * Defines the shape of the credentials required for a user to log in.
 */
export interface LoginRequest {
	/** The user's email address. */
	email: string;
	/** The user's password. */
	password: string;
	/** Optional TOTP code when 2FA is enabled. */
	twoFactorCode?: string;
}

/**
 * Defines the shape of the data returned upon a successful login.
 */
export interface LoginResponse {
	/** The authentication token (JWT) for the user's session. */
	token: string;
	/** The authenticated user's data. */
	user: User;
}

/**
 * Payload returned when initiating a TOTP setup.
 */
export interface TotpSetupResponse {
	/** The shared secret in Base32. */
	secret: string;
	/** The otpauth:// URI used to generate the QR code. */
	otpauthUrl: string;
}

/**
 * Request body for verifying or disabling TOTP.
 */
export interface VerifyTotpRequest {
	/** The 6-digit code from the authenticator app. */
	code: string;
}