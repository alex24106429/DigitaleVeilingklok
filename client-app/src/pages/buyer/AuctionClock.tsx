import { useEffect, useState } from 'react';
import {
	Typography,
	Container,
	Box,
	Paper,
	Stack,
	Button,
	TextField,
	CircularProgress,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	Grid,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Avatar,
	Card,
	CardHeader,
	Divider
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import { useAlert } from '../../components/AlertProvider';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { auctionService } from '../../api/services/auctionService';
import { productService } from '../../api/services/productService';
import { Auction } from '../../types/auction';
import { Product } from '../../types/product';
import PriceHistoryModal from '../../components/PriceHistoryModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface AuctionState {
	auctionId: number;
	currentProduct: Product | null;
	currentPrice: number;
	isRunning: boolean;
	isPaused: boolean;
}
/**
 * Auction Clock page component for buyers to participate in auctions.
 * @returns JSX.Element representing the Auction Clock page.
 */
export default function AuctionClock() {
	const { showAlert } = useAlert();
	const [connection, setConnection] = useState<HubConnection | null>(null);

	// Auction Selection
	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [selectedAuctionId, setSelectedAuctionId] = useState<number | ''>('');

	// Data
	const [auctionProducts, setAuctionProducts] = useState<Product[]>([]);

	// Clock State
	const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
	const [connected, setConnected] = useState(false);

	// Purchase State
	const [buyQty, setBuyQty] = useState(1);
	const [submitting, setSubmitting] = useState(false);

	// History Dialog
	const [historyOpen, setHistoryOpen] = useState(false);

	// Fetch active auctions on mount
	useEffect(() => {
		const loadAuctions = async () => {
			const res = await auctionService.getAllAuctions();
			if (res.data) setAuctions(res.data);
		};
		void loadAuctions();
	}, []);

	// Fetch products when auction selected
	useEffect(() => {
		if (selectedAuctionId) {
			const loadProducts = async () => {
				const res = await productService.getMyProducts({ force: true });
				if (res.data) {
					// Filter for this auction and sort by ID (as backend does for queue order)
					const sorted = res.data
						.filter(p => p.auctionId === selectedAuctionId)
						.sort((a, b) => a.id - b.id);
					setAuctionProducts(sorted);
				}
			};
			void loadProducts();
		} else {
			setAuctionProducts([]);
		}
	}, [selectedAuctionId]);

	// Reset quantity when product changes
	useEffect(() => {
		if (auctionState?.currentProduct) {
			setBuyQty(1);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auctionState?.currentProduct?.id]);

	// Setup SignalR connection logic
	useEffect(() => {
		// Reset state when switching auctions
		setConnected(false);
		setAuctionState(null);

		if (!selectedAuctionId) {
			setConnection(null);
			return;
		}

		// Create new connection
		const newConnection = new HubConnectionBuilder()
			.withUrl(`${API_BASE_URL}/auctionHub`, {
				withCredentials: true, // Use cookie for auth
			})
			.withAutomaticReconnect()
			.configureLogging(LogLevel.Information)
			.build();

		setConnection(newConnection);

		// Cleanup: stop connection when component unmounts or auctionId changes
		return () => {
			void newConnection.stop();
		};
	}, [selectedAuctionId]);

	// Handle SignalR events
	useEffect(() => {
		if (connection && selectedAuctionId) {
			const startConnection = async () => {
				try {
					await connection.start();
					console.log('Connected to AuctionHub');
					setConnected(true);
					await connection.invoke('JoinAuctionGroup', selectedAuctionId);
				} catch (err) {
					console.error('Connection failed: ', err);
				}
			};

			void startConnection();

			connection.on('AuctionState', (state: AuctionState) => {
				setAuctionState(state);
			});

			connection.on('PriceUpdate', (price: number) => {
				setAuctionState(prev => prev ? { ...prev, currentPrice: price } : null);
			});

			connection.on('BidRejected', (message: string) => {
				showAlert({ title: "Mislukt", message, severity: "error" });
				setSubmitting(false);
			});

			connection.on('LotSold', (data: { buyerName: string, quantity: number, price: number, productId: number, remainingStock: number }) => {
				showAlert({
					title: "Verkocht",
					message: `${data.quantity} stuks verkocht aan ${data.buyerName} voor ${euro.format(data.price)}`,
					severity: "info",
					display: "inline"
				});

				// Update local stock list
				setAuctionProducts(prev => prev.map(p =>
					p.id === data.productId ? { ...p, stock: data.remainingStock } : p
				));

				// Update current product state if it matches
				setAuctionState(prev => {
					if (prev && prev.currentProduct && prev.currentProduct.id === data.productId) {
						return {
							...prev,
							currentProduct: { ...prev.currentProduct, stock: data.remainingStock }
						};
					}
					return prev;
				});

				setSubmitting(false);
			});

			connection.on('NextLot', (product: Product) => {
				showAlert({ title: "Volgend Kavel", message: `Nieuw product: ${product.name}`, severity: "info" });
			});

			connection.on('AuctionEnded', () => {
				showAlert({ title: "Veiling", message: "De veiling is afgelopen.", severity: "warning" });
				setAuctionState(null);
			});
		}
	}, [connection, selectedAuctionId, showAlert]);

	const commitPurchase = async () => {
		if (!connection || !selectedAuctionId || !auctionState?.currentProduct) return;

		if (buyQty <= 0) {
			showAlert({ title: "Ongeldig aantal", message: "Aantal moet minimaal 1 zijn.", severity: "warning" });
			return;
		}

		if (buyQty > auctionState.currentProduct.stock) {
			showAlert({ title: "Ongeldig aantal", message: `Er zijn slechts ${auctionState.currentProduct.stock} stuks beschikbaar.`, severity: "warning" });
			return;
		}

		setSubmitting(true);
		try {
			await connection.invoke('PlaceBid', selectedAuctionId, buyQty);
			// We wait for server response (LotSold or BidRejected) to close loading via event listeners
		} catch (err) {
			console.error(err);
			setSubmitting(false);
		}
	};

	// Determine UI State
	const product = auctionState?.currentProduct;
	const currentPrice = auctionState?.currentPrice ?? 0;
	const isRunning = auctionState?.isRunning ?? false;
	const isSoldOut = product ? product.stock <= 0 : true;

	// Visuals for clock
	const maxPrice = product?.maxPricePerUnit ?? 2.0;
	const minPrice = product?.minimumPrice ?? 0.1; // Use product's minimum price, fallback to 0.1
	const percentage = maxPrice > minPrice
		? Math.max(0, Math.min(100, ((maxPrice - currentPrice) / (maxPrice - minPrice)) * 100))
		: 0;

	// Filter products to show upcoming (products with ID greater than current, or all if none current)
	// We assume backend moves sequentially by ID.
	const upcomingProducts = auctionProducts.filter(p => !product || p.id > product.id);

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			<Typography variant="h4" gutterBottom>Digitale Veilingklok</Typography>

			<FormControl fullWidth sx={{ mb: 4, maxWidth: 600 }}>
				<InputLabel>Kies een Veiling</InputLabel>
				<Select
					value={selectedAuctionId}
					label="Kies een Veiling"
					onChange={(e) => setSelectedAuctionId(Number(e.target.value))}
				>
					{auctions.map(a => (
						<MenuItem key={a.id} value={a.id}>{a.description} - {new Date(a.startsAt).toLocaleDateString()}</MenuItem>
					))}
				</Select>
			</FormControl>

			{!selectedAuctionId && (
				<Typography>Selecteer een veiling om te beginnen.</Typography>
			)}

			{selectedAuctionId && !connected && (
				<CircularProgress />
			)}

			{selectedAuctionId && connected && !auctionState && (
				<Typography>Wachten op veiling data...</Typography>
			)}

			{auctionState && (
				<Grid container spacing={3}>
					{/* Clock Column */}
					<Grid size={{ xs: 12, md: 8 }}>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Paper variant="outlined" sx={{ p: 4, width: '100%' }}>
								<Stack spacing={3} alignItems="center">
									{/* Product Info */}
									{product ? (
										<Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
											<Typography variant="h4" fontWeight={600}>
												{product.name}
											</Typography>
											<Typography variant="body1" color="text.secondary">
												Soort: {product.species} • Voorraad: {product.stock} stuks
											</Typography>
											<Box
												component="img"
												src={product.imageBase64 || '/images/placeholder.png'}
												alt={product.name}
												sx={{
													width: 200,
													height: 200,
													objectFit: 'cover',
													borderRadius: 2,
													bgcolor: 'grey.100'
												}}
											/>
										</Stack>
									) : (
										<Typography variant="h5">Wachten op volgend kavel...</Typography>
									)}

									{/* Price Display */}
									<Box
										sx={{
											position: 'relative',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: 320,
										}}
									>
										<CircularProgress
											variant="determinate"
											value={percentage}
											size={280}
											thickness={5}
											color={isRunning ? "primary" : "warning"}
										/>
										<Stack
											spacing={1}
											alignItems="center"
											sx={{ textAlign: 'center', position: 'absolute' }}
										>
											<Typography variant="overline" color="text.secondary">Huidige prijs</Typography>
											<Typography variant="h1" fontWeight={700}>
												{euro.format(currentPrice)}
											</Typography>
										</Stack>
									</Box>

									{/* Purchase Controls */}
									<Stack spacing={2} width="100%" maxWidth={400}>
										<TextField
											label="Aantal te kopen"
											type="number"
											value={buyQty}
											onChange={(e) => setBuyQty(Math.max(1, parseInt(e.target.value) || 0))}
											fullWidth
											disabled={!isRunning || isSoldOut || submitting}
											inputProps={{ min: 1, max: product?.stock }}
											helperText={product ? `Beschikbaar: ${product.stock}` : ''}
										/>

										<Box display="flex" gap={2}>
											<Button
												variant="outlined"
												color="info"
												startIcon={<HistoryIcon />}
												onClick={() => setHistoryOpen(true)}
												disabled={!product}
												sx={{ flex: 1 }}
											>
												Historie
											</Button>

											<Button
												variant="contained"
												color="success"
												size="large"
												startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <ShoppingCartIcon />}
												onClick={commitPurchase}
												disabled={!isRunning || isSoldOut || submitting}
												sx={{ flex: 2, height: 60, fontSize: '1.2rem' }}
											>
												KOOP NU
											</Button>
										</Box>
									</Stack>
								</Stack>
							</Paper>
						</Box>
					</Grid>

					{/* Upcoming Products Column */}
					<Grid size={{ xs: 12, md: 4 }}>
						<Card variant="outlined" sx={{ height: '100%', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
							<CardHeader
								title="Volgende Kavels"
								avatar={<InventoryIcon color="action" />}
								titleTypographyProps={{ variant: 'h6' }}
								subheader={`${upcomingProducts.length} kavels in de wachtrij`}
							/>
							<Divider />
							<List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
								{upcomingProducts.length === 0 ? (
									<ListItem>
										<ListItemText secondary="Geen verdere kavels." />
									</ListItem>
								) : (
									upcomingProducts.map((p) => (
										<ListItem key={p.id} divider>
											<ListItemAvatar>
												<Avatar src={p.imageBase64} variant="rounded">
													{p.name.charAt(0)}
												</Avatar>
											</ListItemAvatar>
											<ListItemText
												primary={
													<Typography variant="body2" fontWeight="bold">
														{p.name}
													</Typography>
												}
												secondary={`Voorraad: ${p.stock} | Start: ${euro.format(p.maxPricePerUnit ?? 2.0)}`}
											/>
										</ListItem>
									))
								)}
							</List>
						</Card>
					</Grid>
				</Grid>
			)}

			{/* Price History Modal */}
			<PriceHistoryModal
				open={historyOpen}
				onClose={() => setHistoryOpen(false)}
				product={product || null}
			/>
		</Container>
	);
}
