import { createTheme } from '@mui/material/styles';
import { green, lightGreen } from '@mui/material/colors';

const headerFont = "Lexend";

const theme = createTheme({
	palette: {
		primary: {
			main: lightGreen[900],
		},
		secondary: {
			main: green[900],
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
					borderRadius: '50px'
				},
			},
		},
	}
});

export default theme;