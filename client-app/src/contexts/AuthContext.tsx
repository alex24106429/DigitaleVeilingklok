import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../api/services/authService';

export interface LoginResult {
	success: boolean;
	error?: string;
}

/**
 * Defines the shape of the authentication context provided to consumers.
 */
export interface AuthContextType {
	/** The currently authenticated user object, or `null` if no user is logged in. */
	user: User | null;
	/** The authentication token (JWT), or `null` if not authenticated. */
	token: string | null;
	/**
	 * Logs in a user with the given credentials.
	 * @param {string} email - The user's email address.
	 * @param {string} password - The user's password.
	 * @param {{ twoFactorCode?: string }} [options] - Optional two-factor code.
	 * @returns {Promise<LoginResult>} A promise describing the outcome.
	 */
	login: (email: string, password: string, options?: { twoFactorCode?: string }) => Promise<LoginResult>;
	/** Logs out the current user, clearing their session data. */
	logout: () => void;
	/** A boolean flag indicating if the initial authentication state is being loaded or checked. */
	isLoading: boolean;
	/**
	 * Updates the current user object in context and localStorage.
	 * Useful after profile updates (name/email).
	 */
	updateUser: (updatedUser: User) => void;
}

/**
 * React context for managing global authentication state.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook for accessing the authentication context.
 * Provides an easy way to get the current user, token, and auth functions.
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

/**
 * Props for the AuthProvider component.
 */
export interface AuthProviderProps {
	/** The child components that will have access to the auth context. */
	children: ReactNode;
}

/**
 * Module-scoped de-duplication for session validation to avoid double fetches in React.StrictMode.
 */
type ValidationResult = { user: User | null; token: string | null };
let sessionValidationInFlight: Promise<ValidationResult> | null = null;

/**
 * Validates the stored session once (de-duplicated). It checks:
 * - token existence
 * - user existence on the server
 * - user data matches stored data
 *
 * If invalid, it clears localStorage.
 */
async function validateStoredSessionOnce(): Promise<ValidationResult> {
	if (sessionValidationInFlight) return sessionValidationInFlight;

	sessionValidationInFlight = (async () => {
		const storedUserRaw = localStorage.getItem('user');
		const storedToken = localStorage.getItem('token');

		if (!storedUserRaw || !storedToken) {
			// Nothing to validate; ensure clean storage
			localStorage.removeItem('user');
			localStorage.removeItem('token');
			return { user: null, token: null };
		}

		const storedUser: User = JSON.parse(storedUserRaw);

		// Validate token + user by fetching from server
		const res = await authService.getUserById(storedUser.id);

		if (!res.data) {
			// Invalid token or user; clear storage
			localStorage.removeItem('user');
			localStorage.removeItem('token');
			return { user: null, token: null };
		}

		const serverUser = res.data;

		const matches =
			serverUser.id === storedUser.id &&
			serverUser.email === storedUser.email &&
			serverUser.fullName === storedUser.fullName &&
			serverUser.role === storedUser.role &&
			serverUser.isTotpEnabled === storedUser.isTotpEnabled;

		if (!matches) {
			// Mismatch; clear storage
			localStorage.removeItem('user');
			localStorage.removeItem('token');
			return { user: null, token: null };
		}

		// Valid session; return stored values
		return { user: storedUser, token: storedToken };
	})().finally(() => {
		// Keep the in-flight promise only during the request lifecycle
		sessionValidationInFlight = null;
	});

	return sessionValidationInFlight;
}

/**
 * Provider component that makes authentication state and functions available to its children.
 * It manages user data and tokens, persisting them to `localStorage`.
 *
 * On initial load it validates the stored token and user against the server.
 * If validation fails, the user is logged out.
 *
 * @param {AuthProviderProps} props - The component props.
 * @returns {JSX.Element} The provider component wrapping its children.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(() => {
		const storedUser = localStorage.getItem('user');
		return storedUser ? JSON.parse(storedUser) : null;
	});

	const [token, setToken] = useState<string | null>(() => {
		return localStorage.getItem('token');
	});

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const run = async () => {
			try {
				const result = await validateStoredSessionOnce();
				if (cancelled) return;

				setUser(result.user);
				setToken(result.token);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		void run();

		return () => {
			cancelled = true;
		};
	}, []);

	/**
	 * Handles the user login process.
	 * Calls the auth service, and on success, updates the state and localStorage.
	 */
	const login = async (
		email: string,
		password: string,
		options?: { twoFactorCode?: string }
	): Promise<LoginResult> => {
		const response = await authService.login({
			email,
			password,
			twoFactorCode: options?.twoFactorCode,
		});

		if (response.data) {
			const { user: userData, token: userToken } = response.data;
			setUser(userData);
			setToken(userToken);
			localStorage.setItem('user', JSON.stringify(userData));
			localStorage.setItem('token', userToken);
			return { success: true };
		}

		return { success: false, error: response.error };
	};

	/**
	 * Handles the user logout process.
	 * Clears the user state and removes authentication data from localStorage.
	 */
	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem('user');
		localStorage.removeItem('token');
	};

	/**
	 * Updates the user object in state and localStorage.
	 */
	const updateUser = (updatedUser: User) => {
		setUser(updatedUser);
		localStorage.setItem('user', JSON.stringify(updatedUser));
	};

	/**
	 * The value provided to the consumers of the AuthContext.
	 */
	const value = {
		user,
		token,
		login,
		logout,
		isLoading,
		updateUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};