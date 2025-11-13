import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { Purchase } from '../../types/purchase';
import { Box, CircularProgress } from '@mui/material';


const headCells: readonly HeadCell<Purchase>[] = [
	{ id: 'id', numeric: true, disablePadding: false, label: 'ID' },
	{ id: 'productName', numeric: false, disablePadding: false, label: 'Productnaam' },
	{ id: 'species', numeric: false, disablePadding: false, label: 'Soort' },
	{ id: 'quantity', numeric: true, disablePadding: false, label: 'Hoeveelheid' },
	{ id: 'purchasePrice', numeric: true, disablePadding: false, label: 'Prijs (€)' },
	{ id: 'purchaseDate', numeric: false, disablePadding: false, label: 'Datum' },
];
/**
 * Displays a list of purchases made by the user.
 * @returns JSX.Element 
 */
export default function Purchases() {
	const [purchases, setPurchases] = useState<Purchase[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		// Simulate fetching data
		const fetchPurchases = async () => {
			setIsLoading(true);
			// Dummy data for now
			const dummyPurchases: Purchase[] = [
				{ id: 1, productName: 'Rozen', species: 'Rosa', quantity: 10, purchasePrice: 15.50, purchaseDate: '2024-10-26' },
				{ id: 2, productName: 'Tulpen', species: 'Tulipa', quantity: 20, purchasePrice: 12.00, purchaseDate: '2024-10-25' },
			];
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
			setPurchases(dummyPurchases);
			setIsLoading(false);
		};

		fetchPurchases();
	}, []);

	return (
		<div>
			<Typography variant="h4" component="h1" gutterBottom>
				Mijn Aankopen
			</Typography>
			<Typography paragraph>
				Hier vindt u een overzicht van al uw gekochte kavels.
			</Typography>

			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableComponent
					rows={purchases}
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

