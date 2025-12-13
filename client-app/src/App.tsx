import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PurchaseProvider } from './contexts/PurchaseContext';
import AppRoutes from './AppRoutes';
import { UserRole } from './types/user';
import { AlertProvider } from './components/AlertProvider';

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
import ManageAccounts from '@mui/icons-material/ManageAccounts';
import Settings from '@mui/icons-material/Settings';

const footerButtonSx = {
	transition: 'none',
	'&[aria-current="page"]': {
		backgroundColor: 'primary.main',
		color: 'primary.contrastText',
	},
	'&[aria-current="page"]:hover': {
		backgroundColor: 'primary.dark',
	},
};

const appBarButtonSx = {
	...footerButtonSx,
	display: 'flex',
	flexDirection: { xs: 'column', md: 'row' },
	alignItems: 'center',
	textAlign: 'center',
	gap: { xs: 0.2, md: 1 },
	fontSize: { xs: '10px', md: '14px' },
	lineHeight: { xs: 1.2, md: 'inherit' },
	minWidth: 75,
	padding: { xs: '6px 8px', md: '8px 20px' },
	letterSpacing: -0.5,
	borderRadius: { xs: '15px', md: '50px' },
};

function AppBarContent() {
	const { user, logout } = useAuth();
	const theme = useTheme();
	const location = useLocation();
	const userRole = user?.role;
	const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

	const newUIPages = [
		'/login',
		'/register',
		'/'
	]

	const isNewUIPage = newUIPages.includes(location.pathname);

	const logoSrc = theme.palette.mode === 'dark' ? "/images/logo-petalbid-dark.svg" : "/images/logo-petalbid.svg";
	const logoSmallSrc = "/images/logo-petalbid-small.svg";

	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const handleLogout = () => {
		handleCloseUserMenu();
		logout();
	};

	const renderRoleSpecificLinks = () => {
		switch (userRole) {
			case UserRole.Buyer:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/buyer/auctionclock" end sx={appBarButtonSx}>
							<AvTimerIcon />
							Veilingklok
						</Button>
						<Button color="inherit" component={NavLink} to="/buyer/purchases" end sx={appBarButtonSx}>
							<ShoppingCart />
							Mijn Aankopen
						</Button>
					</>
				);

			case UserRole.Auctioneer:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/auctioneer/dashboard" end sx={appBarButtonSx}>
							<DashboardIcon />
							Dashboard
						</Button>
						<Button color="inherit" component={NavLink} to="/auctioneer/manageauction" end sx={appBarButtonSx}>
							<Gavel />
							Veilingbeheer
						</Button>
					</>
				);

			case UserRole.Supplier:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/grower/products" end sx={appBarButtonSx}>
							<Inventory />
							Productbeheer
						</Button>
						<Button color="inherit" component={NavLink} to="/grower/sales" end sx={appBarButtonSx}>
							<Sell />
							Verkoopgeschiedenis
						</Button>
					</>
				);

			case UserRole.Admin:
				return (
					<>
						<Button color="inherit" component={NavLink} to="/admin/manageusers" end sx={appBarButtonSx}>
							<ManageAccounts />
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
			position={isNewUIPage ? "absolute" : "static"}
			elevation={0}
			sx={{
				backgroundColor: (theme) => isNewUIPage
					? alpha(theme.palette.background.paper, 0.8)
					: theme.palette.background.default,
				color: (theme) => theme.palette.text.primary,
				backdropFilter: isNewUIPage ? "blur(50px)" : "none",
				width: '100%',
				zIndex: (theme) => theme.zIndex.drawer + 1,
				borderRadius: isNewUIPage ? "0 0 15px 15px" : "0px",
				border: isNewUIPage ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
			}}
		>
			<Toolbar>

				<Box sx={{ flexGrow: 1 }} display={"flex"} alignItems={"center"}>
					<NavLink to="/">
						<Box
							component="img"
							src={logoSrc}
							alt="PetalBid logo"
							sx={{
								height: 50,
								display: { xs: 'none', md: 'block' },
								filter: theme.palette.mode === 'light' ? "drop-shadow(0 0 15px #ffffff)" : "none"
							}}
						/>

						<Box
							component="img"
							src={logoSmallSrc}
							alt="PetalBid logo"
							sx={{
								height: 50,
								display: { xs: 'block', md: 'none' },
								filter: theme.palette.mode === 'light' ? "drop-shadow(0 0 15px #ffffff)" : "none"
							}}
						/>
					</NavLink>
				</Box>

				{!user && (<Button color="inherit" component={NavLink} to="/" end sx={appBarButtonSx}>
					<HomeIcon></HomeIcon>
					Home
				</Button>)}

				{renderRoleSpecificLinks()}

				{!user ? (
					<>
						<Button color="inherit" component={NavLink} to="/login" sx={appBarButtonSx}>
							<LoginIcon></LoginIcon>
							Inloggen
						</Button>

						<Button color="inherit" component={NavLink} to="/register" sx={appBarButtonSx}>
							<PersonAddIcon></PersonAddIcon>
							Registreren
						</Button>
					</>
				) : (
					<Box sx={{ flexGrow: 0, ml: 1 }}>
						<Tooltip title={user.fullName}>
							<IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
								<Avatar
									src={user.profileImageBase64}
									alt={user.fullName}
									sx={{ bgcolor: 'primary.main' }}
								>
									{user.fullName.charAt(0).toUpperCase()}
								</Avatar>
							</IconButton>
						</Tooltip>
						<Menu
							sx={{ mt: '45px' }}
							id="menu-appbar"
							anchorEl={anchorElUser}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							keepMounted
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							open={Boolean(anchorElUser)}
							onClose={handleCloseUserMenu}
							slotProps={{
								paper: {
									variant: "outlined",
									elevation: 0,
									sx: {
										borderRadius: "15px"
									}
								},
								list: {
									sx: {
										padding: 0
									}
								}
							}}
						>
							<Box sx={{ px: 3, pb: 1, pt: 1 }}>
								<Typography variant="subtitle1" noWrap fontWeight="bold">
									{user.fullName}
								</Typography>
								<Typography variant="body2" color="text.secondary" noWrap>
									{user.email}
								</Typography>
							</Box>
							<Divider />
							<MenuItem
								component={NavLink}
								to="/account"
								onClick={handleCloseUserMenu}
								sx={{ m: 1, borderRadius: '10px' }}
							>
								<ListItemIcon sx={{ color: 'text.primary' }}>
									<Settings fontSize="small" />
								</ListItemIcon>
								Instellingen
							</MenuItem>
							<MenuItem
								onClick={handleLogout}
								sx={{ m: 1, borderRadius: '10px' }}
							>
								<ListItemIcon sx={{ color: 'text.primary' }}>
									<LogoutIcon fontSize="small" />
								</ListItemIcon>
								Uitloggen
							</MenuItem>
						</Menu>
					</Box>
				)}
			</Toolbar>
		</AppBar>
	);
}

export default function App() {
	const theme = useTheme();
	return (
		<AuthProvider>
			<PurchaseProvider>
				<AlertProvider>
					<Box minHeight="100vh" display="flex" flexDirection="column">
						<AppBarContent />
						<AppRoutes></AppRoutes>

						<div style={{ marginTop: 'auto' }}>
							<Box textAlign="center" padding="20px" bgcolor={theme.palette.mode === 'dark' ? "grey.900" : "grey.200"} color="text.primary">
								&copy; {new Date().getFullYear()} PetalBid. Alle rechten voorbehouden.
								<Button color="inherit" component={NavLink} to="/privacy" sx={footerButtonSx}>
									Privacybeleid
								</Button>
								<Button color="inherit" component={NavLink} to="/terms" sx={footerButtonSx}>
									Algemene voorwaarden
								</Button>
								<Button color="inherit" component={NavLink} to="/contact" sx={footerButtonSx}>
									Contact
								</Button>
								<Button color="inherit" component={NavLink} to="/info" sx={footerButtonSx}>
									Informatie
								</Button>
							</Box>
						</div>
					</Box>
				</AlertProvider>
			</PurchaseProvider>
		</AuthProvider>
	);
}
