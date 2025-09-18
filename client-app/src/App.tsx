import { Route, Routes, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import AuctionClock from './pages/AuctionClock';

const activeButtonSx = {
	transition: 'none',
	'&[aria-current="page"]': {
		backgroundColor: 'primary.600',
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
					<Box sx={{ flexGrow: 1 }} display={"flex"} alignItems={"center"}>
						<img src="logo-petalbid.svg" height={50} alt="Logo"></img>
					</Box>

					<Button color="inherit" component={NavLink} to="/" end sx={activeButtonSx}>
						Home
					</Button>

					<Button color="inherit" component={NavLink} to="/auctionclock" end sx={activeButtonSx}>
						Veilingklok
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
				<Route path="/auctionclock" element={<AuctionClock />} />
			</Routes>
		</div>
	);
}

export default App;