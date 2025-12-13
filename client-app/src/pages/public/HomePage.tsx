import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha } from '@mui/material/styles';

/**
 * HomePage component for displaying the home page
 * @returns JSX.Element
 */
export default function HomePage() {
	// Features of the platform
	const features = [
		'Toegang tot grote markt',
		'Gemakkelijk zaken doen',
		'Handige extra diensten',
	];
	const { user } = useAuth();
	// Render the home page content
	return (
		<div>
			<Box minHeight="100vh" margin="0" padding="70px 0" sx={(theme) => ({ backgroundImage: theme.palette.mode === "light" ? "url(/images/login-background-light.avif)" : "url(/images/login-background.avif)", backgroundSize: "cover" })}>
				<Box padding={"50px"} sx={(theme) => ({
					backdropFilter: theme.palette.mode === "light" ? "blur(20px)" : "blur(50px)",
					backgroundColor: alpha(theme.palette.background.paper, 0.8),
					borderRadius: "20px",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					margin: "20px"
				})}>
					<Typography
						variant="h3"
						component="h1"
						gutterBottom
						sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}
					>
						Planten kopen en verkopen vanuit één plek
					</Typography>
					<Typography mb="20px">
						Handel al je commerciële processen eenvoudig af op één plek. PetalBid, het wereldwijde platform voor de sierteeltsector!
					</Typography>
					{!user && (
						<Button component={NavLink} to="/login" variant="contained" color="primary" sx={{ mr: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}>
							Inloggen
						</Button>
					)}
					<Button component={NavLink} to="/info" variant="outlined" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}>
						Meer info
					</Button>
				</Box>
				<Grid container spacing={4} alignItems="center">
					<Grid size={{ xs: 12, md: 6 }}>
						<Box padding={4} sx={(theme) => ({
							backdropFilter: theme.palette.mode === "light" ? "blur(20px)" : "blur(50px)",
							backgroundColor: alpha(theme.palette.background.paper, 0.8),
							borderRadius: "20px",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							margin: "20px"
						})}>
							<Typography
								variant="h4"
								component="h2"
								gutterBottom
								sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}
							>
								Wat is PetalBid?
							</Typography>
							<Typography mb="10px">
								PetalBid is hét digitale platform voor de sierteelt. Met PetalBid bieden we één centrale plek aan waar kwekers en kopers hun commerciële en logistieke processen eenvoudig kunnen afhandelen. Daarnaast biedt PetalBid functionaliteiten voor dienstverleners (zoals handelsagenten en transporteurs) en biedt het koppelingen (API) voor softwareleveranciers.
							</Typography>
							{features.map((feature) => (
								<FormControlLabel
									key={feature}
									control={<Checkbox disabled checked sx={(theme) => ({ '&.Mui-disabled': { color: theme.palette.mode === 'dark' ? 'primary.700' : 'secondary.700' } })} />}
									label={feature}
									sx={(theme) => ({
										width: '100%',
										'& .MuiFormControlLabel-label.Mui-disabled': {
											fontWeight: "bold",
											color: theme.palette.mode === 'dark' ? 'common.white' : 'secondary.700',
										}
									})}
								/>
							))}
						</Box>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Box
							component="img"
							src="/images/stock-1.avif"
							alt="Mensen die de hand schudden en glimlachen. Op de achtergrond zijn kleurrijke bloemen en planten te zien, de foto is genomen tijdens een evenement."
							sx={{
								borderRadius: "20px",
								margin: '20px',
								width: 'calc(100% - 40px)',
								float: 'right',
								height: 'auto',
								display: 'block'
							}}
						/>
					</Grid>
				</Grid>
			</Box>
		</div>
	);
}
