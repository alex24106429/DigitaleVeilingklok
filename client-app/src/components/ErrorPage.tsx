import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { NavLink } from "react-router-dom";

/**
 * Props for the ErrorPage component.
 */
interface ErrorPageProps {
	/** The HTTP status code of the error. */
	statusCode: number;
}

/**
 * A mapping of HTTP status codes to user-friendly error messages in Dutch.
 */
const errorMessages = {
	403: "Toegang geweigerd",
	404: "Pagina niet gevonden"
}

/**
 * A component to display a user-friendly error page.
 * It shows a title, a message, a relevant image from http.garden, and a link to the homepage.
 *
 * @param {ErrorPageProps} props The props for the component.
 * @returns {JSX.Element} The rendered error page.
 */
export default function ErrorPage(props: ErrorPageProps) {
	const errorMessage = errorMessages[props.statusCode as keyof typeof errorMessages] || "Er is een fout opgetreden";
	return <>
		<Typography variant="h2" component="h1" align="center" sx={{ mt: 5 }}>{errorMessage}</Typography>
		<Link component={NavLink} to="/"><Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>Terug naar home.</Typography></Link>
		<div style={{ textAlign: 'center' }}>
			<img src={`https://http.garden/${props.statusCode}.avif`} width="500px" height="auto" alt={`${props.statusCode}: ${errorMessage}`}></img>
		</div>
	</>;
}
