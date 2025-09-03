import { Route, Routes, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

function App() {
	return (
		<div>
			{/* Navigatiebalk met links */}
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						Digitale Veilingklok
					</Typography>
					<Button color="inherit" component={Link} to="/">Home</Button>
					<Button color="inherit" component={Link} to="/login">Login</Button>
				</Toolbar>
			</AppBar>

			{/* Hier worden de pagina's gerenderd */}
			<Container sx={{ mt: 4 }}>
				<Routes>
					{/* Als de URL '/' is, toon de HomePage component */}
					<Route path="/" element={<HomePage />} />

					{/* Als de URL '/login' is, toon de LoginPage component */}
					<Route path="/login" element={<LoginPage />} />
				</Routes>
			</Container>
		</div>
	);
}

export default App;