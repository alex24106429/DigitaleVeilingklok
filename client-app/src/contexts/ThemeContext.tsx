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
	// Initialize state from localStorage or default to 'light'
	const [mode, setMode] = useState<'light' | 'dark'>(() => {
		const savedMode = localStorage.getItem('themeMode');
		return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
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