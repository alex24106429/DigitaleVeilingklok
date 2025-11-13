import { useCallback, useEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
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

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		const response = await userService.getAllUsers();
		if (response.data) {
			setUsers(response.data);
		} else {
			showAlert({ title: "Fout", message: response.error || 'Kon gebruikers niet ophalen.' });
		}
		setLoading(false);
	}, [showAlert]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleDelete = async (selectedIds: readonly (string | number)[]) => {
		if (!currentUser) return;

		// Filter out the current user's ID to prevent self-deletion
		const idsToDelete = selectedIds.filter(id => id !== currentUser.id);

		if (idsToDelete.length < selectedIds.length) {
			showAlert({ title: "Actie niet toegestaan", message: "U kunt uw eigen account niet verwijderen." });
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
			});
		} else {
			showAlert({ title: 'Succes', message: `${idsToDelete.length} gebruiker(s) succesvol verwijderd.` });
		}

		// Refresh the user list
		fetchUsers();
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
			/>
		</Box>
	);
}
