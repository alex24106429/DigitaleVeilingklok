import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { Purchase } from '../../types/purchase';
import { Box, CircularProgress, Chip } from '@mui/material';
import { usePurchase } from '../../contexts/PurchaseContext';
import { useAuth } from '../../contexts/AuthContext';

const headCells: readonly HeadCell<Purchase>[] = [
	{ id: 'id', numeric: true, disablePadding: false, label: 'ID' },
	{ id: 'productName', numeric: false, disablePadding: false, label: 'Productnaam' },
	{ id: 'species', numeric: false, disablePadding: false, label: 'Soort' },
	{ id: 'origin', numeric: false, disablePadding: false, label: 'Herkomst' },
	{ id: 'quantity', numeric: true, disablePadding: false, label: 'Hoeveelheid' },
	{
		id: 'purchasePrice',
		numeric: true,
		disablePadding: false,
		label: 'Prijs (€)',
		format: (value: number) => new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: 'EUR'
		}).format(value)
	},
	{
		id: 'purchaseDate',
		numeric: false,
		disablePadding: false,
		label: 'Datum',
		format: (value: string) => {
			try {
				return new Date(value).toLocaleDateString('nl-NL', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
			} catch {
				return value;
			}
		}
	},
	{
		id: 'sideBuy',
		numeric: false,
		disablePadding: false,
		label: 'Type',
		format: (value: boolean) => value ? (
			<Chip label="Meekopen" color="success" size="small" />
		) : (
			<Chip label="Direct" color="primary" size="small" />
		)
	},
];

/**
 * Displays a list of purchases made by the user.
 * @returns JSX.Element
 */
export default function Purchases() {
	const { purchases, getPurchasesByUser } = usePurchase();
	const { user } = useAuth();
	const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);

		// Filter purchases by current user
		if (user) {
			const userPurchases = getPurchasesByUser(String(user.id) || user.fullName || 'unknown');
			setFilteredPurchases(userPurchases);
		} else {
			setFilteredPurchases([]);
		}

		setIsLoading(false);
	}, [purchases, user, getPurchasesByUser]);

	return (
		<div>
			<Typography variant="h4" component="h1" gutterBottom>
				Mijn Aankopen
			</Typography>
			<Typography paragraph>
				Hier vindt u een overzicht van al uw gekochte kavels.
				{filteredPurchases.length > 0 && (
					<> Totaal: {filteredPurchases.length} aankoop{filteredPurchases.length !== 1 ? 'en' : ''}.</>
				)}
			</Typography>

			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
					<CircularProgress />
				</Box>
			) : filteredPurchases.length === 0 ? (
				<Box sx={{ textAlign: 'center', mt: 4 }}>
					<Typography variant="h6" color="text.secondary">
						Nog geen aankopen gedaan
					</Typography>
					<Typography color="text.secondary">
						Ga naar de veilingklok om uw eerste aankoop te doen.
					</Typography>
				</Box>
			) : (
				<TableComponent
					rows={filteredPurchases}
					headCells={headCells}
					idKey="id"
					tableName="Mijn Aankopen"
				// onDelete and onEdit are not applicable for a purchases list
				// If needed, implement view details functionality
				/>
			)}
		</div>
	);
}
