import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { AddAuctionModal } from '../../components/AddAuctionModal';
import { Auction } from '../../types/auction';
import { auctionService } from '../../api/services/auctionService';
import { productService } from '../../api/services/productService';
import { Product } from '../../types/product';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { ProductManagementModal } from '../../components/ProductManagementModal';
import { useAlert } from '../../components/AlertProvider';

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
	const { showAlert } = useAlert();

	const [isAddAuctionModalOpen, setIsAddAuctionModalOpen] = useState(false);
	const [isProductManagementModalOpen, setIsProductManagementModalOpen] = useState(false);
	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [loadingAuctions, setLoadingAuctions] = useState(true);
	const [errorAuctions, setErrorAuctions] = useState<string | null>(null);

	const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
	const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
	const [allProducts, setAllProducts] = useState<Product[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [errorProducts, setErrorProducts] = useState<string | null>(null);

	const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
	const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

	// Helper to get YYYY-MM-DD portion of a date string or Date
	const getDateOnly = (value: string | Date | undefined | null) => {
		if (!value) return '';
		if (value instanceof Date) {
			return value.toISOString().split('T')[0];
		}
		const s = value as string;
		return s.includes('T') ? s.split('T')[0] : s;
	};

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

		// Also fetch all products for counts and quick filtering
		const fetchAllProducts = async () => {
			const res = await productService.getMyProducts({ force: true });
			if (res.data) setAllProducts(res.data);
		};
		void fetchAllProducts();
	}, []);


	// Fetch available and linked products for the selected auction
	useEffect(() => {
		const fetchProductsForAuction = async () => {
			setLoadingProducts(true);
			setErrorProducts(null);

			if (!selectedAuction) {
				setAvailableProducts([]);
				setLinkedProducts([]);
				setLoadingProducts(false);
				return;
			}

			const auctionDateOnly = getDateOnly(selectedAuction.startsAt);

			const response = await productService.getMyProducts({ force: true });
			if (response.data) {
				// Show only products with saleDate matching the auction date
				setAvailableProducts(
					response.data.filter(p => !p.auctionId && getDateOnly(p.saleDate) === auctionDateOnly)
				);
				// Show all linked products regardless of saleDate
				setLinkedProducts(
					response.data.filter(p => p.auctionId === selectedAuction.id)
				);
			} else if (response.error) {
				setErrorProducts(response.error);
			}
			setLoadingProducts(false);
		};

		void fetchProductsForAuction();
	}, [selectedAuction]); // Re-fetch products when selectedAuction changes

	const handleOpenAddAuctionModal = () => {
		setIsAddAuctionModalOpen(true);
	};

	const handleCloseAddAuctionModal = () => {
		setIsAddAuctionModalOpen(false);
	};

	const handleAddAuction = (createdAuction: Auction) => {
		setAuctions((prev) => [...prev, createdAuction]);
		handleCloseAddAuctionModal();
	};

	const handleOpenProductManagementModal = (auction: Auction) => {
		setSelectedAuction(auction);
		setIsProductManagementModalOpen(true);
		setSelectedProductIds([]); // Clear any previous selections
	};

	const handleCloseProductManagementModal = () => {
		setIsProductManagementModalOpen(false);
		setSelectedAuction(null); // Clear selected auction when closing modal
		// Re-fetch auctions to update product counts if necessary
		const fetchAuctions = async () => {
			const { data, error } = await auctionService.getAllAuctions();
			if (error) {
				console.error("Error re-fetching auctions:", error);
			} else if (data) {
				setAuctions(data);
			}
		};
		void fetchAuctions();
	};

	const handleProductToggle = (productId: number) => {
		setSelectedProductIds((prev) =>
			prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
		);
	};

	const handleLinkProducts = async () => {
		if (!selectedAuction) return;

		const successfulLinks: Product[] = [];
		const failedLinks: string[] = [];

		for (const productId of selectedProductIds) {
			const productToUpdate = availableProducts.find(p => p.id === productId);
			if (productToUpdate) {
				// Ensure product saleDate aligns with auction date by setting it
				const auctionDateOnly = getDateOnly(selectedAuction.startsAt);
				const productDto = {
					name: productToUpdate.name,
					weight: productToUpdate.weight,
					imageBase64: productToUpdate.imageBase64,
					species: productToUpdate.species,
					stock: productToUpdate.stock,
					minimumPrice: productToUpdate.minimumPrice,
					potSize: productToUpdate.potSize,
					stemLength: productToUpdate.stemLength,
					auctionId: selectedAuction.id,
					saleDate: auctionDateOnly,
				};
				const response = await productService.updateProduct(productId, productDto);
				if (response.data) {
					console.log(`Product ${productId} linked to auction ${selectedAuction.id}`);
					successfulLinks.push(response.data);
					// Update allProducts for counts
					setAllProducts(prev => prev.map(p => p.id === response.data!.id ? response.data! : p));
				} else if (response.error) {
					console.error(`Error linking product ${productId}:`, response.error);
					failedLinks.push(productToUpdate.name);
				}
			}
		}

		// Update state
		setAvailableProducts((prev) =>
			prev.filter((p) => !selectedProductIds.includes(p.id))
		);
		setLinkedProducts((prev) => [...prev, ...successfulLinks]);
		setSelectedProductIds([]); // Clear selections after linking

		// Show alerts
		if (successfulLinks.length > 0) {
				showAlert({
					title: 'Succes',
					message: `${successfulLinks.length} product(en) succesvol gekoppeld aan de veiling.`,
					severity: 'success'
				});
		}

		if (failedLinks.length > 0) {
			showAlert({
				title: 'Fout',
				message: `Kon ${failedLinks.length} product(en) niet koppelen: ${failedLinks.join(', ')}`,
				severity: 'error'
			});
		}
	};

	const handleUnlinkProduct = async (productId: number) => {
		if (!selectedAuction) return;

		const productToUpdate = linkedProducts.find(p => p.id === productId);
		if (productToUpdate) {
			const productDto = {
				name: productToUpdate.name,
				weight: productToUpdate.weight,
				imageBase64: productToUpdate.imageBase64,
				species: productToUpdate.species,
				stock: productToUpdate.stock,
				minimumPrice: productToUpdate.minimumPrice,
				potSize: productToUpdate.potSize,
				stemLength: productToUpdate.stemLength,
				auctionId: undefined, // Unlink the product by setting auctionId to undefined
			};
			const response = await productService.updateProduct(productId, productDto);
			if (response.data) {
				console.log(`Product ${productId} unlinked from auction ${selectedAuction.id}`);
				setLinkedProducts((prev) => prev.filter((p) => p.id !== productId));
				setAvailableProducts((prev) => [...prev, response.data!]); // Add back to available products
				// Update allProducts for counts
				setAllProducts(prev => prev.map(p => p.id === response.data!.id ? response.data! : p));
				showAlert({
					title: 'Succes',
					message: `Product "${productToUpdate.name}" succesvol ontkoppeld van de veiling.`,
					severity: 'success'
				});
			} else if (response.error) {
				console.error(`Error unlinking product ${productId}:`, response.error);
				showAlert({
					title: 'Fout',
					message: `Kon product "${productToUpdate.name}" niet ontkoppelen.`,
					severity: 'error'
				});
			}
		}
	};

	const handleMaxPriceChange = async (productId: number, newPrice: number) => {
		const productToUpdate = linkedProducts.find(p => p.id === productId);
		if (productToUpdate) {
			const productDto = {
				name: productToUpdate.name,
				weight: productToUpdate.weight,
				imageBase64: productToUpdate.imageBase64,
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
				// Update allProducts for counts
				setAllProducts(prev => prev.map(p => p.id === response.data!.id ? { ...p, maxPricePerUnit: newPrice } : p));
				showAlert({
					title: 'Succes',
					message: `Start prijs voor "${productToUpdate.name}" succesvol bijgewerkt naar €${newPrice.toFixed(2)}.`,
					severity: 'success'
				});
			} else if (response.error) {
				console.error(`Error updating max price for product ${productId}:`, response.error);
				showAlert({
					title: 'Fout',
					message: `Kon start prijs voor "${productToUpdate.name}" niet bijwerken.`,
					severity: 'error'
				});
			}
		}
	};

	const handleAuctionUpdate = (updatedAuction: Auction) => {
		// Update the auctions list with the updated auction
		setAuctions((prev) =>
			prev.map((auction) =>
				auction.id === updatedAuction.id ? updatedAuction : auction
			)
		);
		// Update the selected auction if it matches
		if (selectedAuction && selectedAuction.id === updatedAuction.id) {
			setSelectedAuction(updatedAuction);
		}
	};

	const handleAuctionDelete = (auctionId: number) => {
		// Remove the auction from the auctions list
		setAuctions((prev) => prev.filter((auction) => auction.id !== auctionId));
		// Close the modal if the deleted auction was selected
		if (selectedAuction && selectedAuction.id === auctionId) {
			setIsProductManagementModalOpen(false);
			setSelectedAuction(null);
		}
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Veilingen Beheren
			</Typography>
			<Button variant="contained" color="primary" onClick={handleOpenAddAuctionModal} sx={{ mb: 2 }}>
				Nieuwe Veiling Aanmaken
			</Button>

			<AddAuctionModal
				open={isAddAuctionModalOpen}
				onClose={handleCloseAddAuctionModal}
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
									<Button
										variant="outlined"
										sx={{
											width: '100%',
											textAlign: 'left',
											p: 2,
											display: 'block',
											borderColor: 'grey.300',
											borderRadius: '8px',
											'&:hover': {
												borderColor: 'primary.main',
											},
										}}
										onClick={() => handleOpenProductManagementModal(auction)}
									>
										<Typography variant="h6">{auction.description}</Typography>
										<Typography>Starttijd: {new Date(auction.startsAt).toLocaleString()}</Typography>
										<Typography>Status: {AuctionStatus[auction.status]}</Typography>
										<Typography>
											Aantal gekoppelde producten: {
												allProducts.filter(p => p.auctionId === auction.id).length
											}
										</Typography>

									</Button>
								</Grid>
							))}
						</Grid>
					) : (
						<Typography>Geen veilingen beschikbaar op dit moment.</Typography>
					)}
				</Box>
			)}

			<ProductManagementModal
				open={isProductManagementModalOpen}
				onClose={handleCloseProductManagementModal}
				auction={selectedAuction}
				availableProducts={availableProducts}
				linkedProducts={linkedProducts}
				loadingProducts={loadingProducts}
				errorProducts={errorProducts}
				selectedProductIds={selectedProductIds}
				onProductToggle={handleProductToggle}
				onLinkProducts={handleLinkProducts}
				onUnlinkProduct={handleUnlinkProduct}
				onMaxPriceChange={handleMaxPriceChange}
				onAuctionUpdate={handleAuctionUpdate}
				onAuctionDelete={handleAuctionDelete}
			/>

			<Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
				Veiling Status Beheer
			</Typography>
		</Box>
	);
}
