import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { NavLink } from "react-router-dom";

interface ErrorPageProps {
	statusCode: number;
}
// Tekst gebaseerd op Error
const errorMessages = {
	403: "Toegang geweigerd",
	404: "Pagina niet gevonden"
}
//Link terug naar home en img
export default function ErrorPage(props: ErrorPageProps) {
	return <>
		<Typography variant="h2" component="h1" align="center" sx={{ mt: 5 }}>{errorMessages[props.statusCode as keyof typeof errorMessages] || "Er is een fout opgetreden"}</Typography>
		<Link component={NavLink} to="/"><Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>Terug naar home.</Typography></Link>
		<div style={{ textAlign: 'center' }}>
			<img src={`https://http.garden/${props.statusCode}.avif`} width="500px" height="auto" alt="404: Not Found"></img>
		</div>
	</>;
}
