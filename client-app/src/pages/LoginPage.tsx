import { Box, Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { useState, FormEvent } from "react";

interface LoginPageProps {
	isRegisterPage: boolean;
}

export function LoginPage({ isRegisterPage }: LoginPageProps) {
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [userType, setUserType] = useState("grower");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		setError(""); // Reset de foutmelding bij elke nieuwe poging
		event.preventDefault(); // Voorkomt dat de pagina herlaadt

		if (isRegisterPage && password.length < 12) {
			setError("Wachtwoord moet minimaal 12 karakters zijn!");
			return;
		}

		if (isRegisterPage && password !== confirmPassword) {
			setError("Wachtwoorden komen niet overeen!");
			return;
		}

		console.log({
			email,
			password,
			userType: isRegisterPage ? userType : undefined,
		});
	};

	return (
		<div>
			<Box component="form" onSubmit={handleSubmit} maxWidth="sm" margin="auto" mt="30px" padding="20px">
				{!isRegisterPage ? (
					<Typography variant="h4" align="center">Inloggen bij PetalBid</Typography>
				) : (
					<>
						<Typography variant="h4" align="center">Aanmelden bij PetalBid</Typography>
						<TextField
							label="Naam"
							margin="normal"
							fullWidth
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</>
				)}

				<TextField
					label="E-mail"
					type="email"
					margin="normal"
					fullWidth
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<TextField
					label="Wachtwoord"
					type="password"
					margin="normal"
					fullWidth
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				{isRegisterPage && (
					<>
						<TextField
							label="Bevestig Wachtwoord"
							type="password"
							margin="normal"
							fullWidth
							required
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
						<FormControl required margin="normal">
							<FormLabel id="user-type-label">Ik ben:</FormLabel>
							<RadioGroup
								row
								aria-labelledby="user-type-label"
								value={userType}
								onChange={(e) => setUserType(e.target.value)}
							>
								<FormControlLabel value="grower" control={<Radio />} label="Kweker" />
								<FormControlLabel value="buyer" control={<Radio />} label="Koper" />
							</RadioGroup>
						</FormControl>
					</>
				)}

				{error && (
					<Typography color="error" align="center" style={{ marginTop: '10px' }}>
						{error}
					</Typography>
				)}

				<Box display="flex" justifyContent="center" mt={2}>
					<Button type="submit" variant="contained" color="primary" size="large" fullWidth>
						{isRegisterPage ? "Aanmelden" : "Inloggen"}
					</Button>
				</Box>
			</Box>
		</div>
	);
}