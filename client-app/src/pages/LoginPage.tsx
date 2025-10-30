import { Box, Button, FormControl, FormControlLabel, FormLabel, Link, Radio, RadioGroup, TextField, Typography, CircularProgress } from "@mui/material";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services/authService";
import { UserRole } from "../types/user";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from '../components/AlertProvider';

interface LoginPageProps {
	isRegisterPage: boolean;
}

export default function LoginPage({ isRegisterPage }: LoginPageProps) {
	const { showAlert } = useAlert();
	const navigate = useNavigate();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [RFHnumber, setRFHnumber] = useState("");
	const [userType, setUserType] = useState("grower");

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault(); // Voorkomt dat de pagina herlaadt

		if (isRegisterPage && password.length < 6) {
			showAlert({ title: "Ongeldige informatie", message: "Wachtwoord moet minimaal 6 karakters zijn!" });
			return;
		}

		if (isRegisterPage && password !== confirmPassword) {
			showAlert({ title: "Ongeldige informatie", message: "Wachtwoorden komen niet overeen!" });
			return;
		}

		setIsLoading(true);

		try {
			if (isRegisterPage) {
				// Map user type string to UserRole enum
				let role = UserRole.Supplier; // Default to grower/supplier
				if (userType === "buyer") role = UserRole.Buyer;
				if (userType === "auctioneer") role = UserRole.Auctioneer;

				const response = await authService.register({
					fullName: name,
					email,
					password,
					role
				});

				if (response.error) {
					showAlert({ title: "Serverfout", message: response.error });
				} else {
					// Registration successful, navigate to login
					navigate("/login");
				}
			} else {
				// Login
				const success = await login(email, password);

				if (success) {
					// Login successful - navigate to home
					navigate("/");
				} else {
					showAlert({ title: "Fout", message: "Ongeldige e-mail of wachtwoord" });
				}
			}
		} catch (err) {
			showAlert({ title: "Fout", message: "Er is een onverwachte fout opgetreden. Probeer het opnieuw." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<Box component="form" onSubmit={handleSubmit} maxWidth="sm" margin="auto" mt="30px" padding="20px">
				{!isRegisterPage ? (
					<Typography variant="h4" component="h1" align="center">Inloggen bij PetalBid</Typography>
				) : (
					<>
						<Typography variant="h4" component="h1" align="center">Aanmelden bij PetalBid</Typography>
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
							<FormLabel component="legend" id="user-type-label">Ik ben:</FormLabel>
							<RadioGroup
								row
								aria-labelledby="user-type-label"
								value={userType}
								onChange={(e) => setUserType(e.target.value)}
							>
								<FormControlLabel value="grower" control={<Radio />} label="Leverancier" />
								<FormControlLabel value="buyer" control={<Radio />} label="Koper" />
								<FormControlLabel value="auctioneer" control={<Radio />} label="Veilingmeester" />
							</RadioGroup>
						</FormControl>

						{userType !== "auctioneer" &&
							<TextField
								label="RFH Nummer"
								margin="normal"
								fullWidth
								required
								value={RFHnumber}
								onChange={(e) => setRFHnumber(e.target.value)}
							/>
						}

						{userType === "grower" &&
							<Link
								href="https://portal.royalfloraholland.com/nl-nl/klant-worden/aanvoerder/"
								target="_blank"
								rel="noreferrer"
							>
								Nog geen RFH nummer? Registreer je hier als leverancier
							</Link>
						}

						{userType === "buyer" &&
							<Link
								href="https://portal.royalfloraholland.com/nl-NL/klant-worden/koper/"
								target="_blank"
								rel="noreferrer"
							>
								Nog geen RFH nummer? Registreer je hier als koper
							</Link>
						}
						<br />

					</>
				)}

				<Box display="flex" justifyContent="center" mt={2}>
					<Button
						type="submit"
						variant="contained"
						color="primary"
						size="large"
						fullWidth
						disabled={isLoading}
						startIcon={isLoading ? <CircularProgress size={20} /> : null}
					>
						{isLoading ? "Bezig..." : (isRegisterPage ? "Aanmelden" : "Inloggen")}
					</Button>
				</Box>
			</Box>
		</div>
	);
}

