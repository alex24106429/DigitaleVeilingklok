import { useCallback, useEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { User, UserRole } from '../../types/user';
import { userService } from '../../api/services/userService';
import { useAlert } from '../../components/AlertProvider';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { useAuth } from '../../contexts/AuthContext';

// Helper to map enum to readable string
const roleNames: { [key in UserRole]: string } = {
	[UserRole.Buyer]: 'Koper',
	[UserRole.Auctioneer]: 'Veilingmeester',
	[UserRole.Supplier]: 'Leverancier',
	[UserRole.Admin]: 'Administrator',
};

// Define a new type for display purposes where role is a string
type DisplayUser = Omit<User, 'role'> & { role: string };

// Define table headers for the DisplayUser type
const headCells: readonly HeadCell<DisplayUser>[] = [
	{ id: 'id', numeric: true, disablePadding: false, label: 'ID' },
	{ id: 'fullName', numeric: false, disablePadding: false, label: 'Volledige Naam' },
	{ id: 'email', numeric: false, disablePadding: false, label: 'E-mail' },
	{ id: 'role', numeric: false, disablePadding: false, label: 'Rol' },
];

/**
 * ManageUsers component for admin user management
 * @returns JSX.Element
 */
export default function ManageUsers() {
	const { showAlert } = useAlert();
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);

	// Edit Dialog State
	const [editOpen, setEditOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [editForm, setEditForm] = useState({
		fullName: '',
		email: '',
	});

	const fetchUsers = useCallback(async (force = false) => {
		setLoading(true);
		const response = await userService.getAllUsers({ force });
		if (response.data) {
			setUsers(response.data);
		} else {
			showAlert({ title: "Fout", message: response.error || 'Kon gebruikers niet ophalen.', severity: 'error' });
		}
		setLoading(false);
	}, [showAlert]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchUsers(false);
	}, [fetchUsers]);

	const handleDelete = async (selectedIds: readonly (string | number)[]) => {
		if (!currentUser) return;

		// Filter out the current user's ID to prevent self-deletion
		const idsToDelete = selectedIds.filter(id => id !== currentUser.id);

		if (idsToDelete.length < selectedIds.length) {
			showAlert({ title: "Actie niet toegestaan", message: "U kunt uw eigen account niet verwijderen.", severity: 'error' });
		}

		if (idsToDelete.length === 0) return;

		// Confirmation dialog
		if (!window.confirm(`Weet u zeker dat u ${idsToDelete.length} gebruiker(s) wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
			return;
		}

		const deletionPromises = idsToDelete.map(id => userService.deleteUser(id as number));
		const results = await Promise.all(deletionPromises);

		const failedDeletions = results.filter(res => res.error);

		if (failedDeletions.length > 0) {
			showAlert({
				title: 'Fout bij verwijderen',
				message: `Kon ${failedDeletions.length} van de ${idsToDelete.length} gebruiker(s) niet verwijderen. Eerste fout: ${failedDeletions[0].error}`,
				severity: 'error'
			});
		} else {
			showAlert({ title: 'Succes', message: `${idsToDelete.length} gebruiker(s) succesvol verwijderd.`, severity: 'success' });
		}

		// Force refresh to bypass cache after mutation
		fetchUsers(true);
	};

	const handleEdit = (id: string | number) => {
		const userToEdit = users.find(u => u.id === Number(id));
		if (userToEdit) {
			setEditingUser(userToEdit);
			setEditForm({
				fullName: userToEdit.fullName,
				email: userToEdit.email
			});
			setEditOpen(true);
		}
	};

	const handleEditSave = async () => {
		if (!editingUser) return;

		const response = await userService.updateUser(editingUser.id, editForm);
		if (response.data) {
			showAlert({ title: 'Succes', message: 'Gebruiker bijgewerkt.', severity: 'success' });
			setEditOpen(false);
			setEditingUser(null);
			// Force refresh to update list
			fetchUsers(true);
		} else {
			showAlert({ title: 'Fout', message: response.error || 'Kon gebruiker niet bijwerken.', severity: 'error' });
		}
	};

	// Memoize the data prepared for the table to avoid re-calculating on every render
	const displayUsers = useMemo(() => {
		return users.map(user => ({
			...user,
			role: roleNames[user.role] || 'Onbekend',
		}));
	}, [users]);

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mt={4}>
				<CircularProgress />
				<Typography sx={{ ml: 2 }}>Gebruikers laden...</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Gebruikersbeheer
			</Typography>
			<Typography variant="body1" color="text.secondary" mb={2}>
				Beheer alle geregistreerde gebruikers. Selecteer rijen om acties uit te voeren, zoals verwijderen.
			</Typography>
			<TableComponent
				rows={displayUsers}
				headCells={headCells}
				idKey="id"
				tableName="Geregistreerde Gebruikers"
				onDelete={handleDelete}
				onEdit={handleEdit}
			/>

			<Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Gebruiker Bewerken</DialogTitle>
				<DialogContent>
					<TextField
						margin="normal"
						label="Volledige Naam"
						fullWidth
						value={editForm.fullName}
						onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
					/>
					<TextField
						margin="normal"
						label="E-mail"
						fullWidth
						value={editForm.email}
						onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditOpen(false)}>Annuleren</Button>
					<Button onClick={handleEditSave} variant="contained">Opslaan</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
