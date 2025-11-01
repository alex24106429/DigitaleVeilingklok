import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { NavLink } from "react-router-dom";

export default function PageNotFound() {
	return <>
		<Typography variant="h2" component="h1" align="center" sx={{ mt: 5 }}>Pagina niet gevonden.</Typography>
		<Link component={NavLink} to="/"><Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>Terug naar home.</Typography></Link>
		<div style={{ textAlign: 'center' }}>
			<img src="https://http.cat/404" width="500px" height="auto" alt="404: Not Found"></img>
		</div>
	</>;
}
