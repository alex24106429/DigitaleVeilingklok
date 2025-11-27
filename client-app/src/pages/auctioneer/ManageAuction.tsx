import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { AddAuctionModal } from '../../components/AddAuctionModal';
import { Auction } from '../../types/auction';
import { auctionService } from '../../api/services/auctionService';
import { productService } from '../../api/services/productService';
import { Product } from '../../types/product';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';

/**
 * Enum for auction status
*/
enum AuctionStatus {
	'Gepland',
	'Actief',
	'Gepauzeerd',
	'Gesloten',
	'Geannuleerd',
}

/**
 * ManageAuction component for auction management
 * @returns JSX.Element
 */
export default function ManageAuction() {

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [loadingAuctions, setLoadingAuctions] = useState(true);
	const [errorAuctions, setErrorAuctions] = useState<string | null>(null);

	const [products, setProducts] = useState<Product[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [errorProducts, setErrorProducts] = useState<string | null>(null);

	const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
	const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
	const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);

	// Fetch auctions
	useEffect(() => {
		const fetchAuctions = async () => {
			setLoadingAuctions(true);
			const { data, error } = await auctionService.getAllAuctions();
			if (error) {
				setErrorAuctions(error);
			} else if (data) {
				setAuctions(data);
			}
			setLoadingAuctions(false);
		};

		fetchAuctions();
	}, []);


	// Fetch products
	useEffect(() => {
		const fetchProducts = async () => {
			const response = await productService.getMyProducts();
			if (response.data) {
				setProducts(response.data.filter(p => !p.auctionId || p.auctionId !== selectedAuction?.id)); // Show unlinked products or products not linked to current auction
				if (selectedAuction) {
					setLinkedProducts(response.data.filter(p => p.auctionId === selectedAuction.id));
				}
			} else if (response.error) {
				setErrorProducts(response.error);
			}
			setLoadingProducts(false);
		};
		void fetchProducts();
	}, [selectedAuction]); // Re-fetch products when selectedAuction changes

	const handleOpenModal = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleAddAuction = (createdAuction: Auction) => {
		setAuctions((prev) => [...prev, createdAuction]);
		handleCloseModal();
	};

	const handleAuctionSelect = (event: SelectChangeEvent<string>) => {
		const auctionId = parseInt(event.target.value);
		const auction = auctions.find((a) => a.id === auctionId) || null;
		setSelectedAuction(auction);
		setSelectedProductIds([]); // Reset selected products when auction changes
	};

	const handleProductToggle = (productId: number) => {
		setSelectedProductIds((prev) =>
			prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
		);
	};

	const handleLinkProducts = async () => {
		if (!selectedAuction) return;

		for (const productId of selectedProductIds) {
			const productToUpdate = products.find(p => p.id === productId);
			if (productToUpdate) {
				// Create a DTO that omits server-managed fields
				const productDto = {
					name: productToUpdate.name,
					weight: productToUpdate.weight,
					imageUrl: productToUpdate.imageUrl,
					species: productToUpdate.species,
					stock: productToUpdate.stock,
					minimumPrice: productToUpdate.minimumPrice,
					potSize: productToUpdate.potSize, // Include optional fields
					stemLength: productToUpdate.stemLength, // Include optional fields
					auctionId: selectedAuction.id, // Link to the selected auction
				};
				const response = await productService.updateProduct(productId, productDto);
				if (response.data) {
					console.log(`Product ${productId} linked to auction ${selectedAuction.id}`);
					// Update the local state to reflect the change
					setProducts((prev) =>
						prev.filter((p) => p.id !== productId)
					);
					setLinkedProducts((prev) => [...prev, response.data!]); // Add to linked products
				} else if (response.error) {
					console.error(`Error linking product ${productId}:`, response.error);
					// Optionally, show an error message
				}
			}
		}
		setSelectedProductIds([]); // Clear selections after linking
	};

	const handleMaxPriceChange = async (productId: number, newPrice: number) => {
		const productToUpdate = linkedProducts.find(p => p.id === productId);
		if (productToUpdate) {
			const productDto = {
				name: productToUpdate.name,
				weight: productToUpdate.weight,
				imageUrl: productToUpdate.imageUrl,
				species: productToUpdate.species,
				stock: productToUpdate.stock,
				minimumPrice: productToUpdate.minimumPrice,
				potSize: productToUpdate.potSize,
				stemLength: productToUpdate.stemLength,
				auctionId: productToUpdate.auctionId,
				maxPricePerUnit: newPrice,
			};
			const response = await productService.updateProduct(productId, productDto);
			if (response.data) {
				console.log(`Product ${productId} max price updated to ${newPrice}`);
				setLinkedProducts((prev) =>
					prev.map((p) => (p.id === productId ? { ...p, maxPricePerUnit: newPrice } : p))
				);
			} else if (response.error) {
				console.error(`Error updating max price for product ${productId}:`, response.error);
			}
		}
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Veilingen Beheren
			</Typography>
			<Button variant="contained" color="primary" onClick={handleOpenModal} sx={{ mb: 2 }}>
				Nieuwe Veiling Aanmaken
			</Button>

			<AddAuctionModal
				open={isModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleAddAuction}
			/>
			{loadingAuctions && <Typography>Veilingen laden...</Typography>}
			{errorAuctions && <Typography color="error">{errorAuctions}</Typography>}
			{!loadingAuctions && !errorAuctions && (
				<Box padding={{ xs: 2, md: 4 }}>
					<Typography variant="h4" component="h2" gutterBottom color={"secondary.700"}>
						Beschikbare Veilingen
					</Typography>
					{auctions.length > 0 ? (
						<Grid container spacing={2}>
							{auctions.map((auction) => (
								<Grid key={auction.id} size={{ xs: 12, sm: 6, md: 4 }}>
									<Box border={1} borderColor="grey.300" borderRadius="8px" padding={2}>
										<Typography variant="h6">{auction.description}</Typography>
										<Typography>Starttijd: {new Date(auction.startsAt).toLocaleString()}</Typography>
										<Typography>Status: {AuctionStatus[auction.status]}</Typography>
										<Typography>Aantal: {auction.quantity}</Typography>
										<Typography>Minimumprijs: {auction.reservePrice}</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					) : (
						<Typography>Geen veilingen beschikbaar op dit moment.</Typography>
					)}
				</Box>
			)}
			<Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
				Producten Koppelen aan Veiling
			</Typography>
			<FormControl fullWidth sx={{ mb: 2 }}>
				<InputLabel id="select-auction-label">Selecteer een Veiling</InputLabel>

				<Select
					labelId="select-auction-label"
					id="select-auction"
					value={selectedAuction?.id.toString() || ''}
					label="Selecteer een Veiling"
					onChange={handleAuctionSelect}
					disabled={loadingAuctions || auctions.length === 0}
				>
					{auctions.map((auction) => (
						<MenuItem key={auction.id} value={auction.id}>
							{auction.description} (ID: {auction.id})
						</MenuItem>
					))}
				</Select>
			</FormControl>

			{loadingAuctions && <CircularProgress />}
			{errorAuctions && <Alert severity="error">{errorAuctions}</Alert>}

			{selectedAuction && (
				<Box sx={{ mt: 4 }}>
					<Typography variant="h6" gutterBottom>
						Beschikbare Producten voor Veiling {selectedAuction.description} (ID: {selectedAuction.id})
					</Typography>
					{loadingProducts ? (
						<CircularProgress />
					) : errorProducts ? (
						<Alert severity="error">{errorProducts}</Alert>
					) : products.length === 0 ? (
						<Typography>Geen producten beschikbaar.</Typography>
					) : (
						<FormGroup>
							{products.map((product) => (
								<FormControlLabel
									key={product.id}
									control={
										<Checkbox
											checked={selectedProductIds.includes(product.id)}
											onChange={() => handleProductToggle(product.id)}
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
						onClick={handleLinkProducts}
						sx={{ mt: 2 }}
						disabled={selectedProductIds.length === 0}
					>
						Geselecteerde Producten Koppelen
					</Button>
				</Box>
			)}

			<Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
				Gekoppelde Producten en Maximumprijs Instellen
			</Typography>
			{selectedAuction && linkedProducts.length > 0 ? (
				<Box>
					{linkedProducts.map((product) => (
						<Box key={product.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
							<Typography variant="subtitle1">
								{product.name} (ID: {product.id})
							</Typography>
							<Typography variant="body2">Huidige Maximumprijs: {product.maxPricePerUnit ?? 'Niet ingesteld'}</Typography>
							<FormControl sx={{ mt: 1 }}>
								<InputLabel htmlFor={`max-price-${product.id}`}>Maximumprijs</InputLabel>
								<input
									id={`max-price-${product.id}`}
									type="number"
									value={product.maxPricePerUnit ?? ''}
									onChange={(e) => handleMaxPriceChange(product.id, parseFloat(e.target.value))}
									step="0.01"
								/>
							</FormControl>
						</Box>
					))}
				</Box>
			) : (
				<Typography>Geen producten gekoppeld aan de geselecteerde veiling.</Typography>
			)}

			<Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
				Veiling Status Beheer
			</Typography>
		</Box>
	);
}

