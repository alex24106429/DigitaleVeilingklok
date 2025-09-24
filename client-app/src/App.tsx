import { Route, Routes, NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box } from '@mui/material';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuctionClock from './pages/AuctionClock';
import GrowerDashboard from './pages/GrowerDashboard';

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
					<Box sx={{ flexGrow: 1 }} display={"flex"} alignItems={"center"}>
						<img src="logo-petalbid.svg" height={50} alt="PetalBid logo"></img>
					</Box>

					<Button color="inherit" component={NavLink} to="/" end sx={activeButtonSx}>
						Home
					</Button>

					<Button color="inherit" component={NavLink} to="/growerdashboard" end sx={activeButtonSx}>
						Aanvoerder dashboard
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
				<Route path="/growerdashboard" element={<GrowerDashboard />} />
				<Route path="/login" element={<LoginPage isRegisterPage={false} />} />
				<Route path="/register" element={<LoginPage isRegisterPage={true} />} />
				<Route path="/auctionclock" element={<AuctionClock />} />
			</Routes>
		</div>
	);
}

export default App;