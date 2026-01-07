import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

/**
 * InfoPage component for displaying information about PetalBid
 * @returns JSX.Element
 */
export default function InfoPage() {
	return (
		<Box minHeight="100vh" margin="0" padding="70px 0" sx={(theme) => ({ backgroundImage: theme.palette.mode === "light" ? "url(/images/login-background-light.avif)" : "url(/images/login-background.avif)", backgroundSize: "cover" })}>
			<Box padding={"50px"} sx={(theme) => ({
				backdropFilter: theme.palette.mode === "light" ? "blur(20px)" : "blur(50px)",
				backgroundColor: alpha(theme.palette.background.paper, 0.8),
				borderRadius: "20px",
				border: "1px solid rgba(255, 255, 255, 0.1)",
				margin: "20px",
				maxWidth: "800px",
				marginLeft: "auto",
				marginRight: "auto"
			})}>
				<Typography
					variant="h2"
					component="h1"
					gutterBottom
					sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}
				>
					Wat is PetalBid?
				</Typography>
				<Typography paragraph>
					PetalBid is hét digitale platform voor de sierteelt. Met PetalBid bieden we één centrale plek aan waar kwekers en kopers hun commerciële en logistieke processen eenvoudig kunnen afhandelen.
				</Typography>
				<Typography paragraph>
					Daarnaast biedt PetalBid functionaliteiten voor dienstverleners (zoals handelsagenten en transporteurs) en biedt het koppelingen (API) voor softwareleveranciers.
				</Typography>
			</Box>
		</Box>
	);
}
