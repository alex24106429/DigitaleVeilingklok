import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import {
	Typography, Box, CircularProgress, Button, Dialog, DialogActions,
	DialogContent, DialogTitle, TextField, Grid
} from '@mui/material';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { Purchase } from '../../types/purchase';
import { usePurchase } from '../../contexts/PurchaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../components/AlertProvider';

interface Sale {
	id: string;
	productName: string;
	buyer: string;
	salePrice: number;
	saleDate: string;
	status: 'sold' | 'unsold';
}

/** Table column definitions */
const headCells: readonly HeadCell<Sale>[] = [
	{ id: 'id', numeric: true, disablePadding: false, label: 'ID' },
	{ id: 'productName', numeric: false, disablePadding: false, label: 'Productnaam' },
	{ id: 'buyer', numeric: false, disablePadding: false, label: 'Koper' },
	{
		id: 'salePrice',
		numeric: true,
		disablePadding: false,
		label: 'Prijs (€)',
		format: (value: number) =>
			new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value),
	},
	{
		id: 'saleDate',
		numeric: false,
		disablePadding: false,
		label: 'Datum',
		format: (value: string) =>
			new Date(value).toLocaleDateString('nl-NL', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			}),
	},
	{
		id: 'status',
		numeric: false,
		disablePadding: false,
		label: 'Status',
		format: (value: 'sold' | 'unsold') =>
			value === 'sold' ? (
				<Box sx={{ display: 'inline-block', bgcolor: 'success.main', color: 'white', px: 1, borderRadius: 1, fontSize: 12 }}>Verkocht</Box>
			) : (
				<Box sx={{ display: 'inline-block', bgcolor: 'grey.400', color: 'white', px: 1, borderRadius: 1, fontSize: 12 }}>Niet-verkocht</Box>
			),
	},
];

const initialSaleForm = { buyer: '', status: 'unsold' as 'sold' | 'unsold' };

/**
 * Fully interactive sales dashboard derived from purchases
 */
export default function Sales() {
	const { purchases, updatePurchase } = usePurchase(); // Using PurchaseContext as backend
	const { user } = useAuth();
	const { showAlert } = useAlert();

	const [soldSales, setSoldSales] = useState<Sale[]>([]);
	const [unsoldSales, setUnsoldSales] = useState<Sale[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [editingSale, setEditingSale] = useState<Sale | null>(null);
	const [formData, setFormData] = useState(initialSaleForm);

	/** Compute sales from purchases */
	const fetchSales = useCallback(() => {
		setLoading(true);
		if (user) {
			const userPurchases = purchases.filter(p => p.userId === String(user.id));
			const derivedSales: Sale[] = userPurchases.map(p => ({
				id: String(p.id),
				productName: p.productName,
				buyer: p.buyer || user.fullName || 'Onbekend',
				salePrice: p.purchasePrice,
				saleDate: p.purchaseDate,
				status: p.sold ? 'sold' : 'unsold',
			}));
			setSoldSales(derivedSales.filter(s => s.status === 'sold'));
			setUnsoldSales(derivedSales.filter(s => s.status === 'unsold'));
		} else {
			setSoldSales([]);
			setUnsoldSales([]);
		}
		setLoading(false);
	}, [purchases, user]);

	useEffect(() => {
		fetchSales();
	}, [fetchSales]);

	/** Open edit dialog */
	const handleOpenDialog = (sale: Sale | null) => {
		setEditingSale(sale);
		if (sale) setFormData({ buyer: sale.buyer, status: sale.status });
		else setFormData(initialSaleForm);
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingSale(null);
	};

	const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	/** Save edits to sales (actually updates purchases in context) */
	const handleSave = () => {
		if (!editingSale) return;
		const updatedPurchases = purchases.map(p => {
			if (String(p.id) === editingSale.id) {
				return { ...p, buyer: formData.buyer, sold: formData.status === 'sold' };
			}
			return p;
		});
		updatePurchase(updatedPurchases.find(p => String(p.id) === editingSale.id) as Purchase);
		showAlert({ title: 'Succes', message: 'Verkoop succesvol bijgewerkt.', severity: 'success' });
		handleCloseDialog();
	};

	/** Delete sale (optional: remove purchase) */
	const handleDelete = (selectedIds: readonly (string | number)[]) => {
		if (!window.confirm(`Weet u zeker dat u ${selectedIds.length} verkoop(en) wilt verwijderen?`)) return;
		const updatedPurchases = purchases.filter(p => !selectedIds.includes(p.id));
		updatePurchase(updatedPurchases.find(p => String(p.id) === selectedIds[0]) as Purchase);
		showAlert({ title: 'Succes', message: `${selectedIds.length} verkoop(en) verwijderd.`, severity: 'success' });
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mt={4}>
				<CircularProgress />
				<Typography sx={{ ml: 2 }}>Verkoopgegevens laden...</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<div>
					<Typography variant="h4" component="h1" gutterBottom>Mijn Verkoop</Typography>
					<Typography variant="body1" color="text.secondary" paragraph>
						Hier vindt u een overzicht van uw producten op basis van uw aankopen.
					</Typography>
				</div>
			</Box>

			{/* Sold Table */}


			<TableComponent
				rows={soldSales}
				headCells={headCells}
				idKey="id"
				tableName="Verkocht"
				onEdit={id => handleOpenDialog(soldSales.find(s => s.id === id) || null)}
				onDelete={handleDelete}
			/>


			{/* Unsold Table */}

			<TableComponent
				rows={unsoldSales}
				headCells={headCells}
				idKey="id"
				tableName="Niet-verkocht"
				onEdit={id => handleOpenDialog(unsoldSales.find(s => s.id === id) || null)}
				onDelete={handleDelete}
			/>


			{/* Edit Dialog */}
			<Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
				<DialogTitle>{editingSale ? 'Verkoop Bewerken' : 'Nieuwe Verkoop'}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid size={{ xs: 12 }}>
							<TextField
								name="buyer"
								label="Koper"
								value={formData.buyer}
								onChange={handleFormChange}
								fullWidth
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField
								select
								name="status"
								label="Status"
								value={formData.status}
								onChange={handleFormChange}
								fullWidth
								SelectProps={{ native: true }}
							>
								<option value="unsold">Niet-verkocht</option>
								<option value="sold">Verkocht</option>
							</TextField>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Annuleren</Button>
					<Button onClick={handleSave} variant="contained">Opslaan</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
