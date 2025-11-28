import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../components/AlertProvider';
import { authService } from '../../api/services/authService';
import { TotpSetupResponse } from '../../types/api';
import { useColorMode } from '../../contexts/ThemeContext';
import QRCode from 'qrcode';

/**
 * Account component for managing user account information (name, email, password, settings)
 * @returns JSX.Element
 */
export default function Account() {
	const { user, updateUser } = useAuth();
	const { showAlert } = useAlert();
	const { mode, toggleColorMode } = useColorMode();
	const location = useLocation();
	const navigate = useNavigate();
	const autoOpen2FaRef = useRef(false);

	// Profile form state
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [savingProfile, setSavingProfile] = useState(false);

	// Password form state
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [savingPassword, setSavingPassword] = useState(false);

	// Two-factor state
	const [isRequestingTotp, setIsRequestingTotp] = useState(false);
	const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
	const [isDisablingTotp, setIsDisablingTotp] = useState(false);
	const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
	const [disableDialogOpen, setDisableDialogOpen] = useState(false);
	const [setupPayload, setSetupPayload] = useState<TotpSetupResponse | null>(null);
	const [twoFactorCode, setTwoFactorCode] = useState('');
	const [disableCode, setDisableCode] = useState('');
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

	useEffect(() => {
		if (user) {
			setFullName(user.fullName);
			setEmail(user.email);
		}
	}, [user]);

	useEffect(() => {
		if (!user || user.isTotpEnabled || autoOpen2FaRef.current) {
			return;
		}

		const params = new URLSearchParams(location.search);
		if (params.get('setup2fa') === '1') {
			autoOpen2FaRef.current = true;
			params.delete('setup2fa');
			const nextSearch = params.toString();
			navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
			void beginTwoFactorSetup();
		}
	}, [location.search, location.pathname, navigate, user]);

	useEffect(() => {
		if (setupPayload?.otpauthUrl) {
			QRCode.toDataURL(setupPayload.otpauthUrl, {
				scale: 8,
				margin: 0,
			}, (err, url) => {
				if (err) {
					console.error('QR Code generation error:', err);
					showAlert({ title: 'Fout', message: 'Kon de QR-code niet genereren.' });
					setQrCodeDataUrl('');
				} else {
					setQrCodeDataUrl(url);
				}
			});
		} else {
			// Clear QR code when dialog is closed or payload is removed
			setQrCodeDataUrl('');
		}
	}, [setupPayload, showAlert]);

	const profileChanged = useMemo(() => {
		return user ? (fullName !== user.fullName || email !== user.email) : false;
	}, [user, fullName, email]);

	const handleSaveProfile = async () => {
		if (!profileChanged) return;
		// Basic validation
		if (fullName.trim().length === 0) {
			showAlert({ title: 'Ongeldige invoer', message: 'Naam mag niet leeg zijn.' });
			return;
		}
		if (email.length < 3 || !email.includes("@")) {
			showAlert({ title: 'Ongeldige invoer', message: 'Voer een geldig e-mailadres in.' });
			return;
		}

		setSavingProfile(true);
		const res = await authService.updateProfile({ fullName: fullName.trim(), email: email.trim() });
		setSavingProfile(false);

		if (res.error || !res.data) {
			showAlert({ title: 'Fout', message: res.error || 'Profiel bijwerken mislukt.' });
			return;
		}

		updateUser(res.data);
		showAlert({ title: 'Succes', message: 'Profiel succesvol bijgewerkt.', severity: 'success' });
	};

	const handleChangePassword = async () => {
		if (newPassword !== confirmPassword) {
			showAlert({ title: 'Ongeldige invoer', message: 'Nieuw wachtwoord en bevestiging komen niet overeen.' });
			return;
		}
		setSavingPassword(true);
		const res = await authService.changePassword({ currentPassword, newPassword });
		setSavingPassword(false);

		if (res.error) {
			showAlert({ title: 'Fout', message: res.error });
			return;
		}

		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		showAlert({ title: 'Succes', message: res.data?.message || 'Wachtwoord succesvol gewijzigd.', severity: 'success' });
	};

	const beginTwoFactorSetup = async () => {
		try {
			setIsRequestingTotp(true);
			const response = await authService.beginTotpSetup();
			if (!response.data) {
				showAlert({ title: 'Fout', message: response.error || 'Kon 2FA niet voorbereiden.' });
				return;
			}
			setSetupPayload(response.data);
			setTwoFactorCode('');
			setTwoFactorDialogOpen(true);
		} catch {
			showAlert({ title: 'Fout', message: 'Kon 2FA-setup niet starten.' });
		} finally {
			setIsRequestingTotp(false);
		}
	};

	const verifyTwoFactor = async () => {
		if (twoFactorCode.trim().length < 6) return;

		setIsVerifyingTotp(true);
		const res = await authService.verifyTotp({ code: twoFactorCode.trim() });
		setIsVerifyingTotp(false);

		if (res.error || !res.data) {
			showAlert({ title: 'Fout', message: res.error || 'Ongeldige 2FA-code.' });
			return;
		}

		updateUser(res.data);
		showAlert({ title: 'Succes', message: 'Tweestapsverificatie is ingeschakeld.', severity: 'success' });
		setTwoFactorDialogOpen(false);
		setSetupPayload(null);
		setTwoFactorCode('');
	};

	const disableTwoFactor = async () => {
		if (disableCode.trim().length < 6) return;

		setIsDisablingTotp(true);
		const res = await authService.disableTotp({ code: disableCode.trim() });
		setIsDisablingTotp(false);

		if (res.error || !res.data) {
			showAlert({ title: 'Fout', message: res.error || 'Kon 2FA niet uitschakelen.' });
			return;
		}

		updateUser(res.data);
		showAlert({ title: 'Succes', message: 'Tweestapsverificatie is uitgeschakeld.', severity: 'success' });
		setDisableDialogOpen(false);
		setDisableCode('');
	};

	return (
		<Box maxWidth="md" margin="auto" mt={4} px={2}>
			<Typography variant="h4" component="h1" gutterBottom>
				Mijn Account
			</Typography>
			<Typography variant="body1" color="text.secondary" mb={3}>
				Beheer uw profielgegevens, instellingen en wachtwoord.
			</Typography>

			<Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
				<Typography variant="h6" component="h2" gutterBottom>
					Instellingen
				</Typography>
				<FormControlLabel
					control={
						<Switch
							checked={mode === 'dark'}
							onChange={toggleColorMode}
							color="primary"
						/>
					}
					label="Donkere modus"
				/>
			</Paper>

			<Divider sx={{ mb: 4 }} />

			<Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
				<Typography variant="h6" component="h2" gutterBottom>
					Profiel
				</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							label="Volledige naam"
							fullWidth
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							label="E-mail"
							type="email"
							fullWidth
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Grid>
				</Grid>
				<Box mt={2} display="flex" gap={2}>
					<Button
						variant="contained"
						onClick={handleSaveProfile}
						disabled={!profileChanged || savingProfile}
					>
						{savingProfile ? 'Opslaan...' : 'Opslaan'}
					</Button>
				</Box>
			</Paper>

			<Divider sx={{ mb: 4 }} />

			<Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
				<Typography variant="h6" component="h2" gutterBottom>
					Wachtwoord wijzigen
				</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12 }}>
						<TextField
							label="Huidig wachtwoord"
							type="password"
							fullWidth
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							label="Nieuw wachtwoord"
							type="password"
							fullWidth
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							label="Bevestig nieuw wachtwoord"
							type="password"
							fullWidth
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</Grid>
				</Grid>
				<Box mt={2} display="flex" gap={2}>
					<Button
						variant="contained"
						color="primary"
						onClick={handleChangePassword}
						disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
					>
						{savingPassword ? 'Wijzigen...' : 'Wachtwoord wijzigen'}
					</Button>
				</Box>
			</Paper>

			<Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
					<div>
						<Typography variant="h6" component="h2" gutterBottom>
							Tweestapsverificatie
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Voeg een extra beveiligingslaag toe met een authenticator-app zoals <Link href="https://2fas.com/auth/" target="_blank" rel="noreferrer">2FAS</Link>, <Link href="https://ente.io/auth/" target="_blank" rel="noreferrer">ente</Link>, <Link href="https://bitwarden.com/products/personal/" target="_blank" rel="noreferrer">Bitwarden</Link>, of <Link href="https://support.microsoft.com/en-us/account-billing/download-microsoft-authenticator-351498fc-850a-45da-b7b6-27e523b8702a" target="_blank" rel="noreferrer">Microsoft Authenticator</Link>.
						</Typography>
					</div>
					<Chip
						label={user?.isTotpEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
						color={user?.isTotpEnabled ? 'success' : 'default'}
						variant="outlined"
						sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
					/>
				</Stack>
				<Box mt={2} display="flex" gap={2} flexWrap="wrap">
					{user?.isTotpEnabled ? (
						<Button variant="outlined" color="warning" onClick={() => setDisableDialogOpen(true)}>
							Uitschakelen
						</Button>
					) : (
						<Button
							variant="contained"
							onClick={beginTwoFactorSetup}
							disabled={isRequestingTotp}
							startIcon={isRequestingTotp ? <CircularProgress size={18} /> : null}
						>
							{isRequestingTotp ? 'Voorbereiden...' : 'Inschakelen'}
						</Button>
					)}
				</Box>
			</Paper>

			<Typography mt={3}>
				Token:
			</Typography>
			<Typography variant="subtitle2" color="text.secondary" mb={3} sx={{ overflow: 'auto', userSelect: 'all', fontFamily: 'monospace' }}>
				{localStorage.getItem("token")}
			</Typography>

			<Dialog open={twoFactorDialogOpen} onClose={() => setTwoFactorDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Scan de QR-code</DialogTitle>
				<DialogContent dividers>
					{setupPayload ? (
						<Stack spacing={2} alignItems="center">
							{qrCodeDataUrl ? (
								<img
									src={qrCodeDataUrl}
									alt="2FA QR-code"
									width={200}
									height={200}
								/>
							) : (
								<Box sx={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<CircularProgress />
								</Box>
							)}
							<Typography variant="body2" textAlign="center">
								Scan deze QR-code met uw authenticator-app en voer daarna de 6-cijferige code in.
							</Typography>
							<Box width="100%">
								<Typography variant="caption" fontFamily="monospace">
									Geheime sleutel: {setupPayload.secret}
								</Typography>
							</Box>
							<TextField
								label="Authenticator-code"
								fullWidth
								value={twoFactorCode}
								onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
								inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
								helperText="Voer de huidige code uit uw app in."
							/>
						</Stack>
					) : (
						<Typography>Laden...</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setTwoFactorDialogOpen(false)}>Annuleren</Button>
					<Button
						variant="contained"
						onClick={verifyTwoFactor}
						disabled={!setupPayload || twoFactorCode.trim().length < 6 || isVerifyingTotp}
					>
						{isVerifyingTotp ? 'Controleren...' : 'Activeren'}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>2FA uitschakelen</DialogTitle>
				<DialogContent dividers>
					<Typography variant="body2" mb={2}>
						Voer een huidige code uit uw authenticator-app in om 2FA uit te schakelen.
					</Typography>
					<TextField
						label="Authenticator-code"
						fullWidth
						value={disableCode}
						onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
						inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDisableDialogOpen(false)}>Annuleren</Button>
					<Button
						variant="contained"
						color="warning"
						onClick={disableTwoFactor}
						disabled={disableCode.trim().length < 6 || isDisablingTotp}
					>
						{isDisablingTotp ? 'Bezig...' : 'Uitschakelen'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}