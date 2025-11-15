import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../components/AlertProvider';
import { authService } from '../../api/services/authService';

/**
 * Account component for managing user account information (name, email, password)
 * @returns JSX.Element
 */
export default function Account() {
	const { user, updateUser } = useAuth();
	const { showAlert } = useAlert();

	// Profile form state
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [savingProfile, setSavingProfile] = useState(false);

	// Password form state
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [savingPassword, setSavingPassword] = useState(false);

	useEffect(() => {
		if (user) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setFullName(user.fullName);
			setEmail(user.email);
		}
	}, [user]);

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
		showAlert({ title: 'Succes', message: 'Profiel succesvol bijgewerkt.' });
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
		showAlert({ title: 'Succes', message: res.data?.message || 'Wachtwoord succesvol gewijzigd.' });
	};

	return (
		<Box maxWidth="md" margin="auto" mt={4} px={2}>
			<Typography variant="h4" component="h1" gutterBottom>
				Mijn Account
			</Typography>
			<Typography variant="body1" color="text.secondary" mb={3}>
				Beheer uw profielgegevens en wijzig uw wachtwoord.
			</Typography>

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

			<Paper variant="outlined" sx={{ p: 3 }}>
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
			<Typography mt={3}>
				Token:
			</Typography>
			<Typography variant="subtitle2" color="text.secondary" mb={3} sx={{ overflow: 'auto', userSelect: 'all', fontFamily: 'monospace' }}>
				{localStorage.getItem("token")}
			</Typography>
		</Box>
	);
}