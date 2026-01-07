import { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { api } from '../../api/client';

interface SaleHistoryItem {
	id: number;
	productName: string;
	species: string;
	quantity: number;
	purchasePrice: number;
	purchaseDate: string;
	buyerName: string;
}

const headCells: readonly HeadCell<SaleHistoryItem>[] = [
	{ id: 'purchaseDate', numeric: false, disablePadding: false, label: 'Datum', format: (val) => new Date(val).toLocaleDateString() },
	{ id: 'productName', numeric: false, disablePadding: false, label: 'Product' },
	{ id: 'buyerName', numeric: false, disablePadding: false, label: 'Koper' },
	{ id: 'quantity', numeric: true, disablePadding: false, label: 'Aantal' },
	{ id: 'purchasePrice', numeric: true, disablePadding: false, label: 'Prijs/st', format: (val) => `€ ${val.toFixed(2)}` },
	{ id: 'id', numeric: true, disablePadding: false, label: 'Totaal', format: (val, row) => `€ ${(row.purchasePrice * row.quantity).toFixed(2)}` },
];

export default function Sales() {
	const [sales, setSales] = useState<SaleHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get<SaleHistoryItem[]>('/sales')
			.then(res => {
				if (res.data) setSales(res.data);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <CircularProgress />;

	return (
		<Box p={3}>
			<Typography variant="h4" gutterBottom>Verkoopgeschiedenis</Typography>
			<TableComponent
				rows={sales}
				headCells={headCells}
				idKey="id"
				tableName="Mijn Verkopen"
			/>
		</Box>
	);
}
