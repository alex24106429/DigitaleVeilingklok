import { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { api } from '../../api/client';

interface PurchaseItem {
	id: number;
	productName: string;
	species: string;
	quantity: number;
	purchasePrice: number;
	purchaseDate: string;
	buyerName: string; // Will be self
}

const headCells: readonly HeadCell<PurchaseItem>[] = [
	{ id: 'purchaseDate', numeric: false, disablePadding: false, label: 'Datum', format: (val) => new Date(val).toLocaleDateString() },
	{ id: 'productName', numeric: false, disablePadding: false, label: 'Product' },
	{ id: 'quantity', numeric: true, disablePadding: false, label: 'Aantal' },
	{ id: 'purchasePrice', numeric: true, disablePadding: false, label: 'Prijs/st', format: (val) => `€ ${val.toFixed(2)}` },
	{ id: 'id', numeric: true, disablePadding: false, label: 'Totaal', format: (val, row) => `€ ${(row.purchasePrice * row.quantity).toFixed(2)}` },
];

export default function Purchases() {
	const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get<PurchaseItem[]>('/sales') // Uses same endpoint, filtered by backend based on role
			.then(res => {
				if (res.data) setPurchases(res.data);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <CircularProgress />;

	return (
		<Box p={3}>
			<Typography variant="h4" gutterBottom>Mijn Aankopen</Typography>
			<TableComponent
				rows={purchases}
				headCells={headCells}
				idKey="id"
				tableName="Transacties"
			/>
		</Box>
	);
}
