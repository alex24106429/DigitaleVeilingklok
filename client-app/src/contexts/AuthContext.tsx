import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types/user';
import { authService } from '../api/services/authService';

export interface LoginResult {
	success: boolean;
	error?: string;
	user?: User;
}

/**
 * Defines the shape of the authentication context provided to consumers.
 */
export interface AuthContextType {
	/** The currently authenticated user object, or `null` if no user is logged in. */
	user: User | null;
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
 * Provides an easy way to get the current user and auth functions.
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
type ValidationResult = { user: User | null };
let sessionValidationInFlight: Promise<ValidationResult> | null = null;

/**
 * Validates the stored session once (de-duplicated).
 * It checks localStorage for the user object, but verifies authorization via an API call
 * which relies on the HttpOnly cookie.
 */
async function validateStoredSessionOnce(): Promise<ValidationResult> {
	if (sessionValidationInFlight) return sessionValidationInFlight;

	sessionValidationInFlight = (async () => {
		const storedUserRaw = localStorage.getItem('user');

		if (!storedUserRaw) {
			return { user: null };
		}

		const storedUser: User = JSON.parse(storedUserRaw);

		// Validate token (cookie) + user by fetching from server
		// If the cookie is missing or invalid, this will return 401
		const res = await authService.getUserById(storedUser.id);

		if (!res.data) {
			// Invalid session; clear storage
			localStorage.removeItem('user');
			return { user: null };
		}

		const serverUser = res.data;

		// Optional: Ensure the server user matches what we have locally
		const matches =
			serverUser.id === storedUser.id &&
			serverUser.email === storedUser.email &&
			serverUser.fullName === storedUser.fullName &&
			serverUser.role === storedUser.role;

		if (!matches) {
			localStorage.removeItem('user');
			return { user: null };
		}

		// Valid session; return stored values
		return { user: storedUser };
	})().finally(() => {
		// Keep the in-flight promise only during the request lifecycle
		sessionValidationInFlight = null;
	});

	return sessionValidationInFlight;
}

/**
 * Provider component that makes authentication state and functions available to its children.
 * It manages user data, persisting the user profile to `localStorage` (but not the token).
 *
 * @param {AuthProviderProps} props - The component props.
 * @returns {JSX.Element} The provider component wrapping its children.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(() => {
		const storedUser = localStorage.getItem('user');
		return storedUser ? JSON.parse(storedUser) : null;
	});

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const run = async () => {
			try {
				const result = await validateStoredSessionOnce();
				if (cancelled) return;

				setUser(result.user);
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
	 * Wrapped in useCallback for stability.
	 */
	const login = useCallback(async (
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
			const { user: userData } = response.data;
			setUser(userData);
			// We only store profile info, token is in cookie
			localStorage.setItem('user', JSON.stringify(userData));
			return { success: true, user: userData };
		}

		return { success: false, error: response.error };
	}, []);

	/**
	 * Handles the user logout process.
	 * Calls the logout endpoint to clear the cookie and removes local user data.
	 * Wrapped in useCallback for stability.
	 */
	const logout = useCallback(async () => {
		await authService.logout();
		setUser(null);
		localStorage.removeItem('user');
	}, []);

	/**
	 * Updates the user object in state and localStorage.
	 * Wrapped in useCallback for stability.
	 */
	const updateUser = useCallback((updatedUser: User) => {
		setUser(updatedUser);
		localStorage.setItem('user', JSON.stringify(updatedUser));
	}, []);

	/**
	 * The value provided to the consumers of the AuthContext.
	 * Memoized to prevent consumers from re-rendering or triggering effects unnecessarily.
	 */
	const value = useMemo(() => ({
		user,
		token: null, // Token is no longer accessible via JS
		login,
		logout,
		isLoading,
		updateUser,
	}), [user, login, logout, isLoading, updateUser]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
