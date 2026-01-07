import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

/**
 * Contact component for displaying contact information
 * @returns JSX.Element
 */
export default function Contact() {
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
					Contact
				</Typography>
				<Typography variant="body1">
					Neem contact met ons op via email: <Link href="mailto:info@petalbid.bid">info@petalbid.bid</Link>
				</Typography>
				<Typography variant="body1">
					Of bel ons op: +31 6 123 4567
				</Typography>

				<Box mt={4}>
					<Typography
						variant="h5"
						gutterBottom
						sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'primary.800' : 'secondary.700' }}
					>
						The Hague University of Applied Sciences
					</Typography>
					<Typography variant="body1">
						Johanna Westerdijkplein 75, 2521 EN Den Haag, Nederland
					</Typography>
					<Box sx={{
						position: 'relative',
						overflow: 'hidden',
						paddingTop: '56.25%', // 16:9 Aspect Ratio
						borderRadius: '10px'
					}}>
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2452.695129267896!2d4.321393712697011!3d52.0670746718289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5b6e175fe3619%3A0x9d1994a880751d7a!2sThe%20Hague%20University%20of%20Applied%20Sciences!5e0!3m2!1sen!2snl!4v1763460269632!5m2!1sen!2snl"
							style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
							allowFullScreen
							loading="lazy"
							sandbox="allow-scripts"
							referrerPolicy="no-referrer-when-downgrade"
							title="The Hague University of Applied Sciences location"
						></iframe>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
