import { Box, Button, TextField, Typography } from "@mui/material";

export function LoginPage() {
	return (
		<div>
			<Box maxWidth="sm" margin="auto" mt="30px"padding="20px">
			<Typography variant="h4">Inloggen</Typography>
			<TextField label="Gebruikersnaam" margin="normal" fullWidth />
			<TextField label="Wachtwoord" type="password" margin="normal" fullWidth />
			<Button variant="contained" color="primary" sx={{ mt: 2 }}>
				Login
			</Button>
			</Box>
		</div>
	);
}