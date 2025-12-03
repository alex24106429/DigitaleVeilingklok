import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import {
	Typography, Box, CircularProgress, Button, Dialog, DialogActions,
	DialogContent, DialogTitle, TextField, Grid, InputAdornment,
	IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlert } from '../../components/AlertProvider';
import TableComponent, { HeadCell } from '../../components/TableComponent';
import { Product } from '../../types/product';
import { productService, ProductDto } from '../../api/services/productService';

const headCells: readonly HeadCell<Product>[] = [
	{ id: 'id', numeric: true, disablePadding: false, label: 'ID' },
	{ id: 'name', numeric: false, disablePadding: false, label: 'Naam' },
	{ id: 'species', numeric: false, disablePadding: false, label: 'Soort' },
	{ id: 'stock', numeric: true, disablePadding: false, label: 'Voorraad' },
	{ id: 'minimumPrice', numeric: true, disablePadding: false, label: 'Min. Prijs (€)' },
	{ id: 'auctionId', numeric: true, disablePadding: false, label: 'Veiling ID' },
];

const initialFormData: ProductDto = {
	name: '',
	species: '',
	weight: 0,
	imageBase64: '',
	stock: 1,
	minimumPrice: 0.01,
	potSize: undefined,
	stemLength: undefined,
};
/**
 * Manages the products for the grower, including creating, updating, and deleting products.
 * @returns JSX.Element
 */
export default function ProductManagement() {
	const { showAlert } = useAlert();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [formData, setFormData] = useState<ProductDto>(initialFormData);

	const fetchProducts = useCallback(async (force = false) => {
		setLoading(true);
		const response = await productService.getMyProducts({ force });
		if (response.data) {
			setProducts(response.data);
		} else {
			showAlert({ title: "Fout", message: response.error || 'Kon producten niet ophalen.', severity: 'error' });
		}
		setLoading(false);
	}, [showAlert]);

	useEffect(() => {
		// Initial load
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchProducts(false);
	}, [fetchProducts]);

	const handleOpenDialog = (product: Product | null = null) => {
		setEditingProduct(product);
		if (product) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, supplierId, auctionId, ...dto } = product;
			setFormData(dto);
		} else {
			setFormData(initialFormData);
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingProduct(null);
	};

	const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'number' ? Number(value) : value,
		}));
	};

	const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				setFormData(prev => ({ ...prev, imageBase64: base64String }));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setFormData(prev => ({ ...prev, imageBase64: '' }));
	};

	const handleSave = async () => {
		let response;
		if (editingProduct) {
			response = await productService.updateProduct(editingProduct.id, formData);
		} else {
			response = await productService.createProduct(formData);
		}

		if (response.data) {
			showAlert({ title: 'Succes', message: `Product succesvol ${editingProduct ? 'bijgewerkt' : 'aangemaakt'}.`, severity: "success" });
			handleCloseDialog();
			// Force refresh to bypass cache after mutation
			fetchProducts(true);
		} else {
			showAlert({ title: 'Fout', message: response.error || 'Opslaan mislukt.', severity: 'error' });
		}
	};

	const handleDelete = async (selectedIds: readonly (string | number)[]) => {
		if (!window.confirm(`Weet u zeker dat u ${selectedIds.length} product(en) wilt verwijderen?`)) return;

		const deletionPromises = selectedIds.map(id => productService.deleteProduct(id as number));
		const results = await Promise.all(deletionPromises);

		const failedDeletions = results.filter(res => res.error);
		if (failedDeletions.length > 0) {
			showAlert({
				title: 'Fout bij verwijderen',
				severity: 'error',
				message: `Kon ${failedDeletions.length} van de ${selectedIds.length} product(en) niet verwijderen. Fout: ${failedDeletions[0].error}`,
			});
		} else {
			showAlert({ title: 'Succes', message: `${selectedIds.length} product(en) succesvol verwijderd.`, severity: 'success' });
		}

		// Force refresh to bypass cache after mutation
		fetchProducts(true);
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mt={4}>
				<CircularProgress />
				<Typography sx={{ ml: 2 }}>Producten laden...</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<div>
					<Typography variant="h4" component="h1" gutterBottom>
						Productbeheer
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Beheer hier uw aangeboden producten en kavels.
					</Typography>
				</div>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
				>
					Nieuw Product
				</Button>
			</Box>

			<TableComponent
				rows={products}
				headCells={headCells}
				idKey="id"
				tableName="Mijn Producten"
				onDelete={handleDelete}
				onEdit={(id) => handleOpenDialog(products.find(p => p.id === id) || null)}
			/>

			<Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
				<DialogTitle>{editingProduct ? 'Product Bewerken' : 'Nieuw Product Toevoegen'}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField name="name" label="Productnaam" value={formData.name} onChange={handleFormChange} fullWidth />
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField name="species" label="Soort" value={formData.species} onChange={handleFormChange} fullWidth />
						</Grid>
						
						{/* Image Upload Section */}
						<Grid size={12}>
							<Box sx={{ border: '1px dashed grey', p: 2, textAlign: 'center', borderRadius: 2 }}>
								{formData.imageBase64 ? (
									<Box position="relative" display="inline-block">
										<img 
											src={formData.imageBase64} 
											alt="Preview" 
											style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} 
										/>
										<IconButton 
											onClick={handleRemoveImage}
											color="error"
											sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								) : (
									<Button
										variant="outlined"
										component="label"
										startIcon={<PhotoCamera />}
									>
										Afbeelding kiezen
										<input
											type="file"
											hidden
											accept="image/*"
											onChange={handleImageUpload}
										/>
									</Button>
								)}
							</Box>
						</Grid>

						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField name="stock" label="Voorraad (stuks)" type="number" value={formData.stock} onChange={handleFormChange} fullWidth inputProps={{ min: 1 }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField name="minimumPrice" label="Min. prijs" type="number" value={formData.minimumPrice} onChange={handleFormChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} inputProps={{ min: 0.01, step: 0.01 }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField name="weight" label="Gewicht (kg)" type="number" value={formData.weight} onChange={handleFormChange} fullWidth inputProps={{ min: 0 }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField name="potSize" label="Potmaat (cm)" type="number" value={formData.potSize || ''} onChange={handleFormChange} fullWidth inputProps={{ min: 0 }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField name="stemLength" label="Steellengte (cm)" type="number" value={formData.stemLength || ''} onChange={handleFormChange} fullWidth inputProps={{ min: 0 }} />
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