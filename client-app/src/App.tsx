import { NavLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppRoutes from './AppRoutes';
import { UserRole } from './types/user';
import { AlertProvider } from './components/AlertProvider';

import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import Gavel from '@mui/icons-material/Gavel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Inventory from '@mui/icons-material/Inventory';
import Sell from '@mui/icons-material/Sell';
import { ManageAccounts } from '@mui/icons-material';

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

	const userRole = user?.role;

	const renderRoleSpecificLinks = () => {
		switch (userRole) {
			case UserRole.Buyer:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/buyer/auctionclock" end sx={activeButtonSx}>
							<AvTimerIcon sx={{ mr: 1 }} />
							Veilingklok
						</Button>
						<Button color="inherit" component={NavLink} to="/buyer/purchases" end sx={activeButtonSx}>
							<ShoppingCart sx={{ mr: 1 }} />
							Mijn Aankopen
						</Button>
					</>
				);

			case UserRole.Auctioneer:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/auctioneer/dashboard" end sx={activeButtonSx}>
							<DashboardIcon sx={{ mr: 1 }} />
							Dashboard
						</Button>
						<Button color="inherit" component={NavLink} to="/auctioneer/manageauction" end sx={activeButtonSx}>
							<Gavel sx={{ mr: 1 }} />
							Veilingbeheer
						</Button>
					</>
				);

			case UserRole.Supplier:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/grower/products" end sx={activeButtonSx}>
							<Inventory sx={{ mr: 1 }} />
							Productbeheer
						</Button>
						<Button color="inherit" component={NavLink} to="/grower/sales" end sx={activeButtonSx}>
							<Sell sx={{ mr: 1 }} />
							Verkoopgeschiedenis
						</Button>
					</>
				);

			case UserRole.Admin:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/admin/manageusers" end sx={activeButtonSx}>
							<ManageAccounts sx={{ mr: 1 }} />
							Gebruikerbeheer
						</Button>

					</>
				);
			default:
				return null;
		}
	};

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
						<Box
							component="img"
							src="/images/logo-petalbid.svg"
							alt="PetalBid logo"
							sx={{
								height: 50,
								display: { xs: 'none', md: 'block' },
							}}
						/>

						<Box
							component="img"
							src="/images/logo-petalbid-small.svg"
							alt="PetalBid logo"
							sx={{
								height: 50,
								display: { xs: 'block', md: 'none' },
							}}
						/>
					</NavLink>
				</Box>

				{!user && (<Button color="inherit" component={NavLink} to="/" end sx={activeButtonSx}>
					<HomeIcon sx={{ mr: 1 }}></HomeIcon>
					Home
				</Button>)}

				{renderRoleSpecificLinks()}

				{!user ? (
					<>
						<Button color="inherit" component={NavLink} to="/login" sx={activeButtonSx}>
							<LoginIcon sx={{ mr: 1 }}></LoginIcon>
							Inloggen
						</Button>

						<Button color="inherit" component={NavLink} to="/register" sx={activeButtonSx}>
							<PersonAddIcon sx={{ mr: 1 }}></PersonAddIcon>
							Registreren
						</Button>
					</>
				) : (
					<>
						<Button color="inherit" component={NavLink} to="/account" sx={activeButtonSx}>
							<PersonIcon sx={{ mr: 1 }}></PersonIcon>
							{user.fullName}
						</Button>
						<Button color="inherit" onClick={logout} sx={activeButtonSx}>
							<LogoutIcon sx={{ mr: 1 }}></LogoutIcon>
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
			<AlertProvider>
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
			</AlertProvider>
		</AuthProvider>
	);
}

