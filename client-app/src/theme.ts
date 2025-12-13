import { createTheme, Shadows, PaletteMode } from '@mui/material/styles';

const headerFont = "Lexend";

const lightPrimary = {
	"50": "hsl(90 100% 95%)",
	"100": "hsl(90 100% 90%)",
	"200": "hsl(90 90% 80%)",
	"300": "hsl(90 80% 70%)",
	"400": "hsl(90 70% 60%)",
	"500": "hsl(90 60% 50%)",
	"600": "hsl(90 50% 40%)",
	"700": "hsl(90 40% 30%)",
	"800": "hsl(90 30% 20%)",
	"900": "hsl(90 20% 10%)",
	main: "hsl(90 40% 30%)",
	dark: "hsl(90 30% 20%)",
	contrastText: "#ffffff"
};

const lightSecondary = {
	"50": "hsl(270 100% 95%)",
	"100": "hsl(270 100% 90%)",
	"200": "hsl(270 90% 80%)",
	"300": "hsl(270 80% 70%)",
	"400": "hsl(270 70% 60%)",
	"500": "hsl(270 60% 50%)",
	"600": "hsl(270 50% 40%)",
	"700": "hsl(270 40% 30%)",
	"800": "hsl(270 30% 20%)",
	"900": "hsl(270 20% 10%)",
	main: "hsl(270 40% 30%)",
	dark: "hsl(270 30% 20%)",
	contrastText: "#ffffff"
};

const darkPrimary = {
	"50": "hsl(90 20% 10%)",
	"100": "hsl(90 20% 15%)",
	"200": "hsl(90 30% 20%)",
	"300": "hsl(90 40% 30%)",
	"400": "hsl(90 50% 40%)",
	"500": "hsl(90 60% 50%)",
	"600": "hsl(90 70% 60%)",
	"700": "hsl(90 80% 70%)",
	"800": "hsl(90 90% 80%)",
	"900": "hsl(90 100% 90%)",
	main: "hsl(90 50% 50%)",
	dark: "hsl(90 60% 40%)",
	contrastText: "#000000"
};

const darkSecondary = {
	"50": "hsl(270 20% 10%)",
	"100": "hsl(270 20% 15%)",
	"200": "hsl(270 30% 20%)",
	"300": "hsl(270 40% 30%)",
	"400": "hsl(270 50% 40%)",
	"500": "hsl(270 60% 50%)",
	"600": "hsl(270 70% 60%)",
	"700": "hsl(270 80% 80%)",
	"800": "hsl(270 90% 85%)",
	"900": "hsl(270 100% 95%)",
	main: "hsl(270 60% 60%)",
	dark: "hsl(270 50% 50%)",
	contrastText: "#000000"
};

export const getTheme = (mode: PaletteMode) => createTheme({
	palette: {
		mode,
		primary: mode === 'light' ? lightPrimary : darkPrimary,
		secondary: mode === 'light' ? lightSecondary : darkSecondary,
		background: {
			default: mode === 'light' ? '#ffffff' : '#121212',
			paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
		}
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: { fontFamily: headerFont },
		h2: { fontFamily: headerFont },
		h3: { fontFamily: headerFont },
		h4: { fontFamily: headerFont },
		h5: { fontFamily: headerFont },
		h6: { fontFamily: headerFont },
	},
	shadows: Array(25).fill('none') as Shadows,
	components: {
		MuiButton: {
			defaultProps: {
				disableRipple: true
			},
			styleOverrides: {
				root: {
					textTransform: 'none',
				},
				sizeSmall: {
					padding: '6px 18px',
					borderRadius: '50px'
				},
				sizeMedium: {
					padding: '8px 20px',
					borderRadius: '50px'
				},
				sizeLarge: {
					padding: '14px 30px',
					borderRadius: '5px'
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: '15px'
				}
			}
		}
	}
});

export default getTheme('light');
