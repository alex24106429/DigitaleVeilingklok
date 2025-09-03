import { Button, TextField, Typography } from "@mui/material";

export function LoginPage() {
	return (
		<div>
			<Typography variant="h2">Inloggen</Typography>
			<TextField label="Gebruikersnaam" margin="normal" fullWidth />
			<TextField label="Wachtwoord" type="password" margin="normal" fullWidth />
			<Button variant="contained" color="primary" sx={{ mt: 2 }}>
				Login
			</Button>
		</div>
	);
}