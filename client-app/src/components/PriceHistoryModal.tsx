import React, { useEffect, useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	CircularProgress,
	Grid,
	List,
	ListItem,
	ListItemText,
	Divider,
	Paper
} from '@mui/material';
import { Product, ProductHistory } from '../types/product';
import { productService } from '../api/services/productService';
import { useAlert } from './AlertProvider';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface PriceHistoryModalProps {
	open: boolean;
	onClose: () => void;
	product: Product | null;
}
/**
 * PriceHistoryModal component to display the price history of a product.
 * @param param0 The component props.
 * @returns JSX.Element of price history modal.
 */

export default function PriceHistoryModal({ open, onClose, product }: PriceHistoryModalProps) {
	const { showAlert } = useAlert();
	const [history, setHistory] = useState<ProductHistory | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open && product) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setLoading(true);
			setHistory(null);
			productService.getProductHistory(product.id)
				.then(res => {
					if (res.data) {
						setHistory(res.data);
					} else {
						showAlert({ title: "Fout", message: "Kon prijshistorie niet ophalen.", severity: "error" });
					}
				})
				.finally(() => setLoading(false));
		}
	}, [open, product, showAlert]);

	const renderStatsColumn = (title: string, stats: ProductHistory['supplierStats']) => (
		<Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
			<Typography variant="h6" gutterBottom color="primary.main">{title}</Typography>

			<Box my={2}>
				<Typography variant="body2" color="text.secondary">Gemiddelde Prijs</Typography>
				<Typography variant="h4">{euro.format(stats.averagePrice || 0)}</Typography>
			</Box>

			<Divider />

			<Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Laatste 10 transacties:</Typography>
			{stats.last10Sales.length === 0 ? (
				<Typography variant="body2" color="text.secondary">Geen data beschikbaar.</Typography>
			) : (
				<List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
					{stats.last10Sales.map((item, idx) => (
						<ListItem key={idx} divider>
							<ListItemText
								primary={euro.format(item.price)}
								secondary={new Date(item.date).toLocaleDateString() + ' ' + new Date(item.date).toLocaleTimeString()}
							/>
						</ListItem>
					))}
				</List>
			)}
		</Paper>
	);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				Prijshistorie: {product?.name} <span style={{ fontSize: '0.8em', color: 'gray' }}>({product?.species})</span>
			</DialogTitle>
			<DialogContent dividers>
				{loading ? (
					<Box display="flex" justifyContent="center" p={4}>
						<CircularProgress />
					</Box>
				) : history ? (
					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 6 }}>
							{renderStatsColumn("Deze Aanvoerder", history.supplierStats)}
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							{renderStatsColumn("Alle Aanvoerders (Markt)", history.marketStats)}
						</Grid>
					</Grid>
				) : (
					<Typography>Geen data geladen.</Typography>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="contained">Sluiten</Button>
			</DialogActions>
		</Dialog>
	);
}
