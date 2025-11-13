import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../api/services/authService';

/**
 * Defines the shape of the authentication context provided to consumers.
 */
interface AuthContextType {
	/** The currently authenticated user object, or `null` if no user is logged in. */
	user: User | null;
	/** The authentication token (JWT), or `null` if not authenticated. */
	token: string | null;
	/**
	 * Logs in a user with the given credentials.
	 * @param {string} email - The user's email address.
	 * @param {string} password - The user's password.
	 * @returns {Promise<boolean>} A promise that resolves to `true` on successful login, `false` otherwise.
	 */
	login: (email: string, password: string) => Promise<boolean>;
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
interface AuthProviderProps {
	/** The child components that will have access to the auth context. */
	children: ReactNode;
}

/**
 * Provider component that makes authentication state and functions available to its children.
 * It manages user data and tokens, persisting them to `localStorage`.
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
		// This effect simulates the initial loading phase where an app might
		// validate a stored token with the server. For this implementation,
		// we simply trust the data in localStorage and set loading to false.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(false);
	}, []);

	/**
	 * Handles the user login process.
	 * Calls the auth service, and on success, updates the state and localStorage.
	 */
	const login = async (email: string, password: string): Promise<boolean> => {
		const response = await authService.login({ email, password });

		if (response.data) {
			const { user: userData, token: userToken } = response.data;
			setUser(userData);
			setToken(userToken);
			localStorage.setItem('user', JSON.stringify(userData));
			localStorage.setItem('token', userToken);
			return true;
		}

		return false;
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