import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
/**
 * Contact component for displaying contact information
 * @returns JSX.Element
 */
export default function Contact() {
	return <div>
		<Box bgcolor={"primary.100"} width="100vw" padding={"50px"}>
			<Typography variant="h2" component="h1" gutterBottom color={"secondary.700"}>
				Contact
			</Typography>
			<Typography variant="body1">
				Neem contact met ons op via email: <Link href="mailto:info@petalbid.com">info@petalbid.com</Link>
			</Typography>
			<Typography variant="body1">
				Of bel ons op: +31 6 123 4567
			</Typography>
			<Typography variant="body1" mt={2}>
				The Hague University of Applied Sciences
			</Typography>
			<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2452.695129267896!2d4.321393712697011!3d52.0670746718289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5b6e175fe3619%3A0x9d1994a880751d7a!2sThe%20Hague%20University%20of%20Applied%20Sciences!5e0!3m2!1sen!2snl!4v1763460269632!5m2!1sen!2snl" width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="The Hague University of Applied Sciences location"></iframe>
		</Box>
	</div>
}
