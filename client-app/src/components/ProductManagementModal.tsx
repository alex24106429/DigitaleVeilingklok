import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Checkbox, FormControlLabel, FormGroup, CircularProgress, Alert, TextField, IconButton } from '@mui/material';
import { Edit, Save, Cancel, Delete } from '@mui/icons-material';
import { Auction } from '../types/auction';
import { Product } from '../types/product';
import { auctionService } from '../api/services/auctionService';
import { useAlert } from './AlertProvider';

export interface ProductManagementModalProps {
	open: boolean;
	onClose: () => void;
	auction: Auction | null;
	availableProducts: Product[];
	linkedProducts: Product[];
	loadingProducts: boolean;
	errorProducts: string | null;
	selectedProductIds: number[];
	onProductToggle: (productId: number) => void;
	onLinkProducts: () => Promise<void>;
	onUnlinkProduct: (productId: number) => Promise<void>;
	onMaxPriceChange: (productId: number, newPrice: number) => Promise<void>;
	onAuctionUpdate?: (updatedAuction: Auction) => void;
	onAuctionDelete?: (auctionId: number) => void;
}
/**
 * Modal component for managing products linked to an auction.
 * @param param0 The component props.
 * @returns JSX.Element
 */
export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
	open,
	onClose,
	auction,
	availableProducts,
	linkedProducts,
	loadingProducts,
	errorProducts,
	selectedProductIds,
	onProductToggle,
	onLinkProducts,
	onUnlinkProduct,
	onMaxPriceChange,
	onAuctionUpdate,
	onAuctionDelete,
}) => {
	const { showAlert } = useAlert();
	const [isEditingAuction, setIsEditingAuction] = useState(false);
	const [editedDescription, setEditedDescription] = useState('');
	const [updatingAuction, setUpdatingAuction] = useState(false);
	const [deletingAuction, setDeletingAuction] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Local state to manage start price inputs and validation per product
    const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
    const [priceErrors, setPriceErrors] = useState<Record<number, string | null>>({});

	// Reset edit state when modal opens/closes or auction changes
	React.useEffect(() => {
		if (auction) {
			setEditedDescription(auction.description);
		}
		setIsEditingAuction(false);
		setErrorMessage(null);
	}, [auction, open]);

	// Initialize local price input values when linked products change
	React.useEffect(() => {
		const initialInputs: Record<number, string> = {};
		linkedProducts.forEach(p => {
			initialInputs[p.id] = p.maxPricePerUnit !== undefined && p.maxPricePerUnit !== null ? String(p.maxPricePerUnit) : '';
		});
		setPriceInputs(initialInputs);
		setPriceErrors({});
	}, [linkedProducts]);

	if (!auction) {
		return null;
	}

	const handleStartEdit = () => {
		setEditedDescription(auction.description);
		setIsEditingAuction(true);
		setErrorMessage(null);
	};

	const handleCancelEdit = () => {
		setEditedDescription(auction.description);
		setIsEditingAuction(false);
		setErrorMessage(null);
	};

	const handleSaveEdit = async () => {
		if (!editedDescription.trim()) {
			setErrorMessage('Auction description cannot be empty');
			return;
		}

		setUpdatingAuction(true);
		setErrorMessage(null);

		try {
			// Send complete auction object with updated description
			const updatedAuctionData = {
				...auction,
				description: editedDescription.trim(),
			};

			const response = await auctionService.updateAuction(auction.id, updatedAuctionData);

			if (response.data && onAuctionUpdate) {
				onAuctionUpdate(response.data);
				showAlert({
					title: 'Succes',
					message: 'Veiling succesvol bijgewerkt.',
					severity: 'success'
				});
			}
			setIsEditingAuction(false);
		} catch (error) {
			console.error('Failed to update auction:', error);
			setErrorMessage('Failed to update auction. Please try again.');
			showAlert({
				title: 'Fout',
				message: 'Er is een fout opgetreden bij het bijwerken van de veiling.',
				severity: 'error'
			});
		} finally {
			setUpdatingAuction(false);
		}
	};

	const handleDeleteAuction = async () => {
		if (!window.confirm(`Are you sure you want to delete the auction "${auction.description}"? This action cannot be undone.`)) {
			return;
		}

		setDeletingAuction(true);
		setErrorMessage(null);

		try {
			await auctionService.deleteAuction(auction.id);
			if (onAuctionDelete) {
				onAuctionDelete(auction.id);
			}
			showAlert({
				title: 'Succes',
				message: 'Veiling succesvol verwijderd.',
				severity: 'success'
			});
			onClose();
		} catch (error) {
			console.error('Failed to delete auction:', error);
			setErrorMessage('Failed to delete auction. Please try again.');
			showAlert({
				title: 'Fout',
				message: 'Er is een fout opgetreden bij het verwijderen van de veiling.',
				severity: 'error'
			});
		} finally {
			setDeletingAuction(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box display="flex" alignItems="center" gap={1}>
						{isEditingAuction ? (
							<TextField
								value={editedDescription}
								onChange={(e) => setEditedDescription(e.target.value)}
								variant="standard"
								size="small"
								sx={{ minWidth: 300 }}
								error={!!errorMessage && !editedDescription.trim()}
								helperText={errorMessage && !editedDescription.trim() ? 'Description cannot be empty' : ''}
							/>
						) : (
							<Typography variant="h6">Producten Beheren voor Veiling: {auction.description}</Typography>
						)}
					</Box>
					<Box>
						{isEditingAuction ? (
							<>
								<IconButton
									onClick={handleSaveEdit}
									disabled={updatingAuction || !editedDescription.trim()}
									color="primary"
									size="small"
								>
									<Save />
								</IconButton>
								<IconButton
									onClick={handleCancelEdit}
									disabled={updatingAuction}
									color="secondary"
									size="small"
								>
									<Cancel />
								</IconButton>
							</>
						) : (
							<>
								<IconButton
									onClick={handleStartEdit}
									color="primary"
									size="small"
									title="Edit auction name"
								>
									<Edit />
								</IconButton>
								<IconButton
									onClick={handleDeleteAuction}
									disabled={deletingAuction}
									color="error"
									size="small"
									title="Delete auction"
								>
									<Delete />
								</IconButton>
							</>
						)}
					</Box>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				{errorMessage && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{errorMessage}
					</Alert>
				)}
				<Box sx={{ mb: 4 }}>
					<Typography variant="h6" gutterBottom>Beschikbare Producten</Typography>
					{loadingProducts ? (
						<CircularProgress />
					) : errorProducts ? (
						<Alert severity="error">{errorProducts}</Alert>
					) : availableProducts.length === 0 ? (
						<Typography>Geen producten beschikbaar om te koppelen.</Typography>
					) : (
						<FormGroup>
							{availableProducts.map((product) => (
								<FormControlLabel
									key={product.id}
									control={
										<Checkbox
											checked={selectedProductIds.includes(product.id)}
											onChange={() => onProductToggle(product.id)}
										/>
									}
									label={`${product.name} (ID: ${product.id}) - Voorraad: ${product.stock}`}
								/>
							))}
						</FormGroup>
					)}
					<Button
						variant="contained"
						color="secondary"
						onClick={onLinkProducts}
						sx={{ mt: 2 }}
						disabled={selectedProductIds.length === 0}
					>
						Geselecteerde Producten Koppellen
					</Button>
				</Box>

				<Box>
					<Typography variant="h6" gutterBottom>Gekoppelde Producten</Typography>
					{linkedProducts.length === 0 ? (
						<Typography>Geen producten gekoppeld aan deze veiling.</Typography>
					) : (
						linkedProducts.map((product) => (
							<Box key={product.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
								<Typography variant="subtitle1">
									{product.name} (ID: {product.id})
								</Typography>
								<Typography variant="body2">
									Minimumprijs: {product.minimumPrice ?? 'Niet ingesteld'}
								</Typography>
								<Typography variant="body2">Huidige Startprijs: {product.maxPricePerUnit ?? 'Niet ingesteld'}</Typography>
								<TextField
									label="Start Prijs"
									type="number"
									value={priceInputs[product.id] ?? ''}
									onChange={(e) => {
										const v = e.target.value;
										setPriceInputs(prev => ({ ...prev, [product.id]: v }));
										setPriceErrors(prev => ({ ...prev, [product.id]: null }));
									}}
									onBlur={async (e) => {
										const raw = e.target.value;
										if (raw === '') {
											// Keep behavior consistent with previous implementation (allow empty)
											await onMaxPriceChange(product.id, NaN as unknown as number);
											return;
										}
										const parsed = parseFloat(raw);
										if (Number.isNaN(parsed)) {
											setPriceErrors(prev => ({ ...prev, [product.id]: 'Ongeldige waarde' }));
											return;
										}
										const min = product.minimumPrice ?? null;
										if (min !== null && parsed <= min) {
											setPriceErrors(prev => ({ ...prev, [product.id]: 'Startprijs moet hoger zijn dan minimumprijs' }));
											// Do not propagate invalid value
											return;
										}
										await onMaxPriceChange(product.id, parsed);
										showAlert({
											title: 'Startprijs opgeslagen',
											message: 'De startprijs is succesvol bijgewerkt.',
											severity: 'success',
											display: 'snackbar'
										});
									}}
									inputProps={{ step: "0.01", min: (product.minimumPrice ?? undefined) as unknown as number }}
									sx={{ mt: 1, mr: 2 }}
								/>
								{priceErrors[product.id] && (
									<Alert severity="error" sx={{ mt: 1, mr: 2 }}>
										{priceErrors[product.id]}
									</Alert>
								)}
								<Button
									variant="contained"
									color="error"
									onClick={() => onUnlinkProduct(product.id)}
									sx={{ mt: 2, ml: 1 }}
								>
									Ontkoppelen
								</Button>
							</Box>
						))
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary">Sluiten</Button>
			</DialogActions>
		</Dialog>
	);
};
