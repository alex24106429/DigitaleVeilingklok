import { Route, Routes, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function App() {
	return (
		<div>
			{/* Navigatiebalk met links */}
			<AppBar position="static" sx={{
				backgroundColor: (theme) => theme.palette.background.default,
				color: (theme) => theme.palette.text.primary,
			}}>
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						PetalBid
					</Typography>
					<Button color="inherit" component={Link} to="/">Home</Button>
					<Button color="inherit" component={Link} to="/login">Inloggen</Button>
					<Button color="inherit" component={Link} to="/register">Aanmelden</Button>
				</Toolbar>
			</AppBar>

			{/* Hier worden de pagina's gerenderd */}
			<Routes>
				{/* Als de URL '/' is, toon de HomePage component */}
				<Route path="/" element={<HomePage />} />

				{/* Als de URL '/login' is, toon de LoginPage component */}
				<Route path="/login" element={<LoginPage isRegisterPage={false} />} />
				<Route path="/register" element={<LoginPage isRegisterPage={true} />} />
			</Routes>
		</div>
	);
}

export default App;