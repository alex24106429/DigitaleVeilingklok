import { Route, Routes, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const activeButtonSx = {
	transition: 'none',
	'&[aria-current="page"]': {
		backgroundColor: 'primary.main',
		color: 'primary.contrastText',
	},
	'&[aria-current="page"]:hover': {
		backgroundColor: 'primary.dark',
	},
};

function App() {
	return (
		<div>
			<AppBar
				position="static"
				sx={{
					backgroundColor: (theme) => theme.palette.background.default,
					color: (theme) => theme.palette.text.primary,
				}}
			>
				<Toolbar>
					<Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
						PetalBid
					</Typography>

					<Button color="inherit" component={NavLink} to="/" end sx={activeButtonSx}>
						Home
					</Button>

					<Button color="inherit" component={NavLink} to="/login" sx={activeButtonSx}>
						Inloggen
					</Button>

					<Button color="inherit" component={NavLink} to="/register" sx={activeButtonSx}>
						Aanmelden
					</Button>
				</Toolbar>
			</AppBar>

			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={<LoginPage isRegisterPage={false} />} />
				<Route path="/register" element={<LoginPage isRegisterPage={true} />} />
			</Routes>
		</div>
	);
}

export default App;