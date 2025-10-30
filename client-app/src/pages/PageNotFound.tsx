import { Link, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

export default function PageNotFound() {
	return <>
		<Typography variant="h2" component="h1" align="center" sx={{ mt: 5 }}>Pagina niet gevonden.</Typography>
		<NavLink to="/"><Link><Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>Terug naar home.</Typography></Link></NavLink>
		<div style={{ textAlign: 'center' }}>
			<img src="https://http.cat/404" width="500px" height="auto"></img>
		</div>
	</>;
}
