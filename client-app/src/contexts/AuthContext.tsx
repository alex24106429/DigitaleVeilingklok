import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../api/services/authService';

interface AuthContextType {
	user: User | null;
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
		if (storedUser) {
			return JSON.parse(storedUser);
		}
		return null;
	});

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(false);
	}, []);

	const login = async (email: string, password: string): Promise<boolean> => {
		const response = await authService.login({ email, password });

		if (response.data) {
			setUser(response.data);
			localStorage.setItem('user', JSON.stringify(response.data));
			return true;
		}

		return false;
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
	};

	const value = {
		user,
		login,
		logout,
		isLoading
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};