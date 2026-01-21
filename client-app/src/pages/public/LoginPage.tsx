import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import { alpha } from '@mui/material/styles';

import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../api/services/authService";
import { UserRole } from "../../types/user";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert, AlertSlot } from '../../components/AlertProvider';

/**
 * Props for the LoginPage component.
 */
export interface LoginPageProps {
	/** Determines if the component should render the registration form (`true`) or the login form (`false`). */
	isRegisterPage: boolean;
}

/**
 * A component that renders a form for either user login or registration.
 * The mode is controlled by the `isRegisterPage` prop. It handles form state,
 * input validation, API calls for authentication, and provides user feedback.
 *
 * @param {LoginPageProps} props The props for the component.
 * @returns {JSX.Element} The rendered login or registration form.
 */
export default function LoginPage({ isRegisterPage }: LoginPageProps) {
	const { showAlert, clearAlert } = useAlert();
	const navigate = useNavigate();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [RFHnumber, setRFHnumber] = useState("");
	const [userType, setUserType] = useState("grower");
	const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
	const [twoFactorCode, setTwoFactorCode] = useState("");
	const [enableTwoFactorAfterRegister, setEnableTwoFactorAfterRegister] = useState(false);

	useEffect(() => {
		clearAlert?.();
	}, [isRegisterPage, clearAlert]);

	const sanitizeCode = (value: string) => value.replace(/\D/g, "").slice(0, 6);

	const attemptLogin = async () => {
		setIsLoading(true);
		try {
			const result = await login(email, password, {
				twoFactorCode: needsTwoFactor ? twoFactorCode : undefined,
			});

			if (result.success) {
				setNeedsTwoFactor(false);
				setTwoFactorCode("");

				let redirectPath = "/";
				if (result.user) {
					switch (result.user.role) {
						case UserRole.Buyer:
							redirectPath = "/buyer/auctionclock";
							break;
						case UserRole.Auctioneer:
							redirectPath = "/auctioneer/dashboard";
							break;
						case UserRole.Supplier:
							redirectPath = "/grower/products";
							break;
						case UserRole.Admin:
							redirectPath = "/admin/manageusers";
							break;
					}
				}

				navigate(redirectPath);
				return;
			}

			const errorMessage = result.error || "Ongeldige e-mail of wachtwoord";

			if (errorMessage.toLowerCase().includes("tweestapsverificatie vereist")) {
				setNeedsTwoFactor(true);
				return;
			}

			if (errorMessage.toLowerCase().includes("2fa")) {
				setNeedsTwoFactor(true);
				setTwoFactorCode("");
			}

			showAlert({ title: "Fout", message: errorMessage, display: "inline", severity: "error" });
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handles the form submission for both login and registration.
	 * It performs validation, calls the appropriate API service,
	 * and manages UI responses like loading states, alerts, and navigation.
	 * @param {FormEvent<HTMLFormElement>} event The form submission event.
	 */
	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault(); // Prevents the page from reloading

		if (!isRegisterPage) {
			await attemptLogin();
			return;
		}

		if (password !== confirmPassword) {
			showAlert({ title: "Ongeldige informatie", message: "Wachtwoorden komen niet overeen!", display: "inline", severity: "warning" });
			return;
		}

		setIsLoading(true);
		try {
			// Handle registration
			let role: UserRole;
			switch (userType) {
				case "buyer":
					role = UserRole.Buyer;
					break;
				case "grower":
				default:
					role = UserRole.Supplier;
					break;
			}

			const response = await authService.register({
				fullName: name,
				email,
				password,
				role
			});

			if (response.error) {
				showAlert({ title: "Serverfout", message: response.error, display: "inline", severity: "error" });
				return;
			}

			// Automatically log in after registration
			const autoLogin = await login(email, password);

			if (autoLogin.success) {
				showAlert({
					title: "Succes",
					message: "Registratie voltooid! U bent ingelogd.",
					severity: "success",
					display: "inline"
				});

				if (enableTwoFactorAfterRegister) {
					navigate("/account?setup2fa=1", { replace: true });
					return;
				}

				// Redirect based on role
				let redirectPath = "/";
				if (autoLogin.user) {
					switch (autoLogin.user.role) {
						case UserRole.Buyer:
							redirectPath = "/buyer/auctionclock";
							break;
						case UserRole.Auctioneer:
							redirectPath = "/auctioneer/dashboard";
							break;
						case UserRole.Supplier:
							redirectPath = "/grower/products";
							break;
						case UserRole.Admin:
							redirectPath = "/admin/manageusers";
							break;
					}
				}
				navigate(redirectPath);
			} else {
				// Fallback if auto-login fails
				showAlert({
					title: "Succes",
					message: "Registratie voltooid! U kunt nu inloggen.",
					severity: "success",
					display: "inline"
				});
				navigate("/login");
			}
		} catch {
			showAlert({ title: "Fout", message: "Er is een onverwachte fout opgetreden. Probeer het opnieuw.", display: "inline", severity: "error" });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<Box minHeight="100vh" margin="0" padding="100px 0" sx={(theme) => ({ backgroundImage: theme.palette.mode === "light" ? "url(/images/login-background-light.avif)" : "url(/images/login-background.avif)", backgroundSize: "cover" })}>
				<Box
					component="form"
					onSubmit={handleSubmit}
					maxWidth="sm"
					margin="auto"
					padding="25px"
					borderRadius="10px"
					sx={(theme) => ({
						backdropFilter: theme.palette.mode === "light" ? "blur(20px)" : "blur(50px)",
						backgroundColor: alpha(theme.palette.background.paper, 0.8),
						border: "1px solid rgba(255, 255, 255, 0.1)",
					})}
				>
					{!isRegisterPage ? (
						<Typography variant="h4" component="h1" align="center">Inloggen bij PetalBid</Typography>
					) : (
						<>
							<Typography variant="h4" component="h1" align="center">Registreren bij PetalBid</Typography>
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
						helperText={isRegisterPage ? "Wachtwoord moet minimaal 6 tekens, inclusief een hoofdletter, een cijfer en een speciaal teken." : undefined}
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
								</RadioGroup>
							</FormControl>

							{(userType === "grower" || userType === "buyer") &&
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
							<FormControlLabel
								control={
									<Checkbox
										checked={enableTwoFactorAfterRegister}
										onChange={(e) => setEnableTwoFactorAfterRegister(e.target.checked)}
									/>
								}
								label="Direct tweestapsverificatie instellen na registratie"
							/>
							<Typography variant="body2" color="text.secondary">
								We loggen u automatisch in en tonen een QR-code om te scannen na afloop van de registratie.
							</Typography>
						</>
					)}

					{needsTwoFactor && !isRegisterPage && (
						<TextField
							label="Authenticator-code"
							margin="normal"
							fullWidth
							required
							value={twoFactorCode}
							onChange={(e) => setTwoFactorCode(sanitizeCode(e.target.value))}
							inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
							helperText="Open uw authenticator-app en voer de 6-cijferige code in."
						/>
					)}

					{
					/* AlertSlot renders the current provider alert inline in the document flow. */}
					<AlertSlot />

					<Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
						<Button
							type="submit"
							variant="contained"
							color="primary"
							size="large"
							fullWidth
							disabled={
								isLoading ||
								(!isRegisterPage && needsTwoFactor && twoFactorCode.trim().length < 6)
							}
							startIcon={isLoading ? <CircularProgress size={20} /> : null}
						>
							{isLoading ? "Bezig..." : (isRegisterPage ? "Registreren" : "Inloggen")}
						</Button>
					</Box>
				</Box>
			</Box>
		</div>
	);
}
