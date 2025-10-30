import { NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppRoutes from './AppRoutes';

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

function AppBarContent() {
	const { user, logout } = useAuth();

	return (
		<AppBar
			position="static"
			sx={{
				backgroundColor: (theme) => theme.palette.background.default,
				color: (theme) => theme.palette.text.primary,
			}}
		>
			<Toolbar>

				<Box sx={{ flexGrow: 1 }} display={"flex"} alignItems={"center"}>
					<NavLink to="/">
						<img src="logo-petalbid.svg" height={50} alt="PetalBid logo"></img>
					</NavLink>
				</Box>

				<Button color="inherit" component={NavLink} to="/" end sx={activeButtonSx}>
					Home
				</Button>

				{user && (
					<>
						<Button color="inherit" component={NavLink} to="/growerdashboard" end sx={activeButtonSx}>
							Leverancier dashboard
						</Button>

						<Button color="inherit" component={NavLink} to="/auctionclock" end sx={activeButtonSx}>
							Veilingklok
						</Button>
					</>
				)}

				{!user ? (
					<>
						<Button color="inherit" component={NavLink} to="/login" sx={activeButtonSx}>
							Inloggen
						</Button>

						<Button color="inherit" component={NavLink} to="/register" sx={activeButtonSx}>
							Aanmelden
						</Button>
					</>
				) : (
					<>
						<Button color="inherit" sx={{ ml: 2 }}>
							{user.fullName}
						</Button>
						<Button color="inherit" onClick={logout} sx={activeButtonSx}>
							Uitloggen
						</Button>
					</>
				)}
			</Toolbar>
		</AppBar>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<div>

				<Box minHeight="100vh" display="flex" flexDirection="column">
					<AppBarContent />
					<AppRoutes></AppRoutes>

					<div style={{ marginTop: 'auto' }}>
						<Box textAlign="center" padding="20px" bgcolor="primary.100" color="Black">
							&copy; {new Date().getFullYear()} PetalBid. Alle rechten voorbehouden.
							<Button color="inherit" component={NavLink} to="/privacy" sx={activeButtonSx}>
								Privacybeleid
							</Button>
							<Button color="inherit" component={NavLink} to="/terms" sx={activeButtonSx}>
								Algemene voorwaarden
							</Button>
							<Button color="inherit" component={NavLink} to="/contact" sx={activeButtonSx}>
								Contact
							</Button>
							<Button color="inherit" component={NavLink} to="/info" sx={activeButtonSx}>
								Informatie
							</Button>
						</Box>
					</div>
				</Box>

			</div>
		</AuthProvider>
	);
}

