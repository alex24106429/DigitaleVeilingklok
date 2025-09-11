import { createTheme } from '@mui/material/styles';

const headerFont = "Lexend";

const theme = createTheme({
	palette: {
		primary: {
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
			"main": "hsl(90 50% 40%)",
			"contrastText": "#ffffff"
		},
		secondary: {
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
			"main": "hsl(270 40% 30%)",
			"dark": "hsl(270 30% 20%)",
			"contrastText": "white"
		},
		background: {
			default: '#fafafa',
		}
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontFamily: headerFont,
		},
		h2: {
			fontFamily: headerFont
		},
		h3: {
			fontFamily: headerFont
		},
		h4: {
			fontFamily: headerFont
		},
		h5: {
			fontFamily: headerFont
		},
		h6: {
			fontFamily: headerFont
		},
	},
	shape: {
	},
	shadows: Array(25).fill('none') as any,
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
	}
});

export default theme;