import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme';

interface ThemeContextType {
	toggleColorMode: () => void;
	mode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
	toggleColorMode: () => { },
	mode: 'light',
});

export const useColorMode = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
	// Initialize state from localStorage, then System Preference, then default to 'light'
	const [mode, setMode] = useState<'light' | 'dark'>(() => {
		const savedMode = localStorage.getItem('themeMode');

		// 1. Check if user has previously explicitly saved a preference
		if (savedMode === 'dark' || savedMode === 'light') {
			return savedMode;
		}

		// 2. If no saved preference, check the OS/System preference
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	});

	useEffect(() => {
		localStorage.setItem('themeMode', mode);
	}, [mode]);

	const colorMode = useMemo(
		() => ({
			toggleColorMode: () => {
				setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
			},
			mode,
		}),
		[mode],
	);

	const theme = useMemo(() => getTheme(mode), [mode]);

	return (
		<ThemeContext.Provider value={colorMode}>
			<MuiThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</MuiThemeProvider>
		</ThemeContext.Provider>
	);
};