import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { AddAuctionModal } from '../../components/AddAuctionModal';
import { ProductManagementModal } from '../../components/ProductManagementModal';
import { useAlert } from '../../components/AlertProvider';
import { Auction } from '../../types/auction';
import { Product } from '../../types/product';
import { auctionService } from '../../api/services/auctionService';
import { productService, ProductDto } from '../../api/services/productService';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

enum AuctionStatus {
	'Gepland',
	'Actief',
	'Gepauzeerd',
	'Gesloten'
}

export default function ManageAuction() {
	const { showAlert } = useAlert();
	const [isAddAuctionModalOpen, setIsAddAuctionModalOpen] = useState(false);
	const [isProductManagementModalOpen, setIsProductManagementModalOpen] = useState(false);

	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [loadingAuctions, setLoadingAuctions] = useState(true);

	// Products
	const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
	const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
	const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
	const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

	const fetchAuctions = async () => {
		setLoadingAuctions(true);
		const { data } = await auctionService.getAllAuctions();
		if (data) setAuctions(data);
		setLoadingAuctions(false);
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void fetchAuctions();
	}, []);

	// --- Auction Control Handlers ---

	const handleStart = async (id: number) => {
		await auctionService.startAuction(id);
		showAlert({ title: "Info", message: "Veiling gestart", severity: "success" });
		void fetchAuctions();
	};

	const handlePause = async (id: number) => {
		await auctionService.pauseAuction(id);
		showAlert({ title: "Info", message: "Veiling gepauzeerd", severity: "warning" });
		void fetchAuctions();
	};

	const handleStop = async (id: number) => {
		await auctionService.endAuction(id);
		showAlert({ title: "Info", message: "Veiling beëindigd", severity: "info" });
		void fetchAuctions();
	};

	// --- Modal / Product Logic (Existing) ---

	const handleOpenProductManagementModal = async (auction: Auction) => {
		setSelectedAuction(auction);
		// Fetch products
		const res = await productService.getMyProducts({ force: true });
		if (res.data) {
			setLinkedProducts(res.data.filter(p => p.auctionId === auction.id));
			setAvailableProducts(res.data.filter(p => !p.auctionId));
		}
		setIsProductManagementModalOpen(true);
	};

	const handleLinkProducts = async () => {
		if (!selectedAuction) return;
		for (const pid of selectedProductIds) {
			const p = availableProducts.find(x => x.id === pid);
			if (p) {
				// Create a proper DTO from the product
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, supplierId, auctionId, ...rest } = p;
				const updateData: ProductDto = { ...rest, auctionId: selectedAuction.id };
				await productService.updateProduct(pid, updateData);
			}
		}
		showAlert({ title: "Success", message: "Producten gekoppeld", severity: "success" });
		// Refresh logic
		if (selectedAuction) {
			const res = await productService.getMyProducts({ force: true });
			if (res.data) {
				setLinkedProducts(res.data.filter(p => p.auctionId === selectedAuction.id));
				setAvailableProducts(res.data.filter(p => !p.auctionId));
			}
		}
		setSelectedProductIds([]);
	};

	const handleUnlinkProduct = async (pid: number) => {
		const p = linkedProducts.find(x => x.id === pid);
		if (p) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, supplierId, auctionId, ...rest } = p;
			const updateData: ProductDto = { ...rest, auctionId: undefined }; // or null based on backend
			await productService.updateProduct(pid, updateData);

			// Refresh
			if (selectedAuction) {
				const res = await productService.getMyProducts({ force: true });
				if (res.data) {
					setLinkedProducts(res.data.filter(prod => prod.auctionId === selectedAuction.id));
					setAvailableProducts(res.data.filter(prod => !prod.auctionId));
				}
			}
		}
	};

	// --- Render ---

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom>Veilingbeheer</Typography>
			<Button variant="contained" onClick={() => setIsAddAuctionModalOpen(true)} sx={{ mb: 2 }}>
				Nieuwe Veiling
			</Button>

			{loadingAuctions ? <CircularProgress sx={{ display: 'block', my: 2 }} /> : (
				<Grid container spacing={2}>
					{auctions.map(auction => (
						<Grid key={auction.id} size={{ xs: 12, md: 6, lg: 4 }}>
							<Box border={1} borderColor="grey.300" borderRadius={2} p={2}>
								<Typography variant="h6">{auction.description}</Typography>
								<Typography variant="body2" color="text.secondary">
									Status: {AuctionStatus[auction.status]} <br />
									Start: {new Date(auction.startsAt).toLocaleString()}
								</Typography>

								<Box mt={2} display="flex" gap={1}>
									<Button size="small" variant="outlined" onClick={() => handleOpenProductManagementModal(auction)}>
										Producten
									</Button>
									<Button size="small" color="success" onClick={() => handleStart(auction.id)} title="Start">
										<PlayArrowIcon />
									</Button>
									<Button size="small" color="warning" onClick={() => handlePause(auction.id)} title="Pauze">
										<PauseIcon />
									</Button>
									<Button size="small" color="error" onClick={() => handleStop(auction.id)} title="Stop">
										<StopIcon />
									</Button>
								</Box>
							</Box>
						</Grid>
					))}
				</Grid>
			)}

			{/* Modals */}
			<AddAuctionModal
				open={isAddAuctionModalOpen}
				onClose={() => setIsAddAuctionModalOpen(false)}
				onSubmit={() => { void fetchAuctions(); }}
			/>

			<ProductManagementModal
				open={isProductManagementModalOpen}
				onClose={() => setIsProductManagementModalOpen(false)}
				auction={selectedAuction}
				availableProducts={availableProducts}
				linkedProducts={linkedProducts}
				loadingProducts={false}
				errorProducts={null}
				selectedProductIds={selectedProductIds}
				onProductToggle={(id) => {
					setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
				}}
				onLinkProducts={handleLinkProducts}
				onUnlinkProduct={handleUnlinkProduct}
				onMaxPriceChange={async (id, price) => {
					const p = linkedProducts.find(x => x.id === id);
					if (p) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { id: pid, supplierId, auctionId, ...rest } = p;
						const updateData: ProductDto = { ...rest, auctionId: selectedAuction!.id, maxPricePerUnit: price };
						await productService.updateProduct(id, updateData);
						// Refresh local state to reflect change if needed
						setLinkedProducts(prev => prev.map(prod => prod.id === id ? { ...prod, maxPricePerUnit: price } : prod));
					}
				}}
			/>
		</Box>
	);
}
