import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../api/services/authService';

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

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
		// This effect is to simulate initial loading, e.g., validating a token.
		// For now, we just check localStorage synchronously.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(false);
	}, []);

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

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem('user');
		localStorage.removeItem('token');
	};

	const value = {
		user,
		token,
		login,
		logout,
		isLoading
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};