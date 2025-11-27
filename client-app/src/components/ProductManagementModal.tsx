import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Checkbox, FormControlLabel, FormGroup, CircularProgress, Alert, TextField } from '@mui/material';
import { Auction } from '../types/auction';
import { Product } from '../types/product';

interface ProductManagementModalProps {
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
}) => {
	if (!auction) {
		return null;
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>Producten Beheren voor Veiling: {auction.description}</DialogTitle>
			<DialogContent dividers>
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
						Geselecteerde Producten Koppelen
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
								<Typography variant="body2">Huidige Maximumprijs: {product.maxPricePerUnit ?? 'Niet ingesteld'}</Typography>
								<TextField
									label="Maximumprijs"
									type="number"
									value={product.maxPricePerUnit ?? ''}
									onChange={(e) => onMaxPriceChange(product.id, parseFloat(e.target.value))}
									inputProps={{ step: "0.01" }}
									sx={{ mt: 1, mr: 2 }}
								/>
								<Button
									variant="outlined"
									color="error"
									onClick={() => onUnlinkProduct(product.id)}
									sx={{ mt: 1 }}
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