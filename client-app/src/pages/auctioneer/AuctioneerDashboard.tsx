import { useEffect, useState, useRef } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	Container,
	FormControl,
	Grid,
	InputLabel,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Select,
	Typography,
	Divider,
	Chip,
	Paper,
	ListItemAvatar,
	Avatar,
	SelectChangeEvent
} from '@mui/material';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAlert } from '../../components/AlertProvider';
import { auctionService } from '../../api/services/auctionService';
import { productService } from '../../api/services/productService';
import { Auction } from '../../types/auction';
import { Product } from '../../types/product';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import GavelIcon from '@mui/icons-material/Gavel';
import InventoryIcon from '@mui/icons-material/Inventory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048';
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface AuctionState {
	auctionId: number;
	currentProduct: Product | null;
	currentPrice: number;
	isRunning: boolean;
	isPaused: boolean;
}

interface SaleLog {
	id: string;
	buyerName: string;
	quantity: number;
	price: number;
	productName: string;
	timestamp: Date;
}

export default function AuctioneerDashboard() {
	const { showAlert } = useAlert();
	const [connection, setConnection] = useState<HubConnection | null>(null);

	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [selectedAuctionId, setSelectedAuctionId] = useState<number | ''>('');
	const [auctionProducts, setAuctionProducts] = useState<Product[]>([]);

	// Ref to hold the latest products list to avoid stale closures in SignalR handlers without re-binding
	const auctionProductsRef = useRef<Product[]>([]);

	const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
	const [salesLog, setSalesLog] = useState<SaleLog[]>([]);
	const [isConnected, setIsConnected] = useState(false);

	const logEndRef = useRef<HTMLDivElement>(null);

	// Fetch auctions on mount
	useEffect(() => {
		const loadAuctions = async () => {
			const res = await auctionService.getAllAuctions();
			if (res.data) setAuctions(res.data);
		};
		void loadAuctions();
	}, []);

	// Fetch products when auction is selected
	useEffect(() => {
		if (selectedAuctionId) {
			const loadProducts = async () => {
				const res = await productService.getMyProducts({ force: true });
				if (res.data) {
					// Filter for this auction and sort by ID (as backend does)
					const sorted = res.data
						.filter(p => p.auctionId === selectedAuctionId)
						.sort((a, b) => a.id - b.id);
					setAuctionProducts(sorted);
				}
			};
			void loadProducts();
		} else {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setAuctionProducts([]);
		}
	}, [selectedAuctionId]);

	// Keep ref in sync with state
	useEffect(() => {
		auctionProductsRef.current = auctionProducts;
	}, [auctionProducts]);

	// SignalR Setup
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setConnection(null);
		setIsConnected(false);
		setAuctionState(null);
		setSalesLog([]);

		if (!selectedAuctionId) return;

		const newConnection = new HubConnectionBuilder()
			.withUrl(`${API_BASE_URL}/auctionHub`, {
				withCredentials: true,
			})
			.withAutomaticReconnect()
			.configureLogging(LogLevel.Information)
			.build();

		setConnection(newConnection);

		return () => {
			void newConnection.stop();
		};
	}, [selectedAuctionId]);

	useEffect(() => {
		if (connection && selectedAuctionId) {
			const startConnection = async () => {
				try {
					await connection.start();
					console.log('Auctioneer Connected to Hub');
					setIsConnected(true);
					await connection.invoke('JoinAuctionGroup', selectedAuctionId);
				} catch (err) {
					console.error('Connection failed: ', err);
					showAlert({ title: "Verbindingsfout", message: "Kon geen verbinding maken met de server.", severity: "error" });
				}
			};

			void startConnection();

			// Define handlers
			const handleAuctionState = (state: AuctionState) => {
				setAuctionState(state);
			};

			const handlePriceUpdate = (price: number) => {
				setAuctionState(prev => prev ? { ...prev, currentPrice: price } : null);
			};

			const handleLotSold = (data: { buyerName: string, quantity: number, price: number, productId: number, remainingStock: number }) => {
				// Use ref to find product name (prevents stale closure issues)
				const products = auctionProductsRef.current;
				const product = products.find(p => p.id === data.productId);

				// Update log
				const newLog: SaleLog = {
					id: Date.now().toString() + Math.random(),
					buyerName: data.buyerName,
					quantity: data.quantity,
					price: data.price,
					productName: product?.name || 'Onbekend Product',
					timestamp: new Date()
				};
				setSalesLog(prev => [newLog, ...prev]);

				// Update local product list stock
				setAuctionProducts(prev => prev.map(p => {
					if (p.id === data.productId) {
						return { ...p, stock: data.remainingStock };
					}
					return p;
				}));
			};

			const handleNextLot = (product: Product) => {
				showAlert({ title: "Nieuw Kavel", message: `${product.name} is nu actief.`, severity: "info", display: "snackbar" });
			};

			const handleAuctionEnded = () => {
				showAlert({ title: "Einde", message: "De veiling is afgelopen.", severity: "warning" });
				setAuctionState(prev => prev ? { ...prev, isRunning: false, isPaused: false, currentProduct: null } : null);
			};

			// Register handlers
			connection.on('AuctionState', handleAuctionState);
			connection.on('PriceUpdate', handlePriceUpdate);
			connection.on('LotSold', handleLotSold);
			connection.on('NextLot', handleNextLot);
			connection.on('AuctionEnded', handleAuctionEnded);

			// Cleanup listeners on unmount or dependency change
			return () => {
				connection.off('AuctionState', handleAuctionState);
				connection.off('PriceUpdate', handlePriceUpdate);
				connection.off('LotSold', handleLotSold);
				connection.off('NextLot', handleNextLot);
				connection.off('AuctionEnded', handleAuctionEnded);
			};
		}
	}, [connection, selectedAuctionId, showAlert]); // Removed auctionProducts dependency to prevent duplicate listeners

	const handleAuctionChange = (event: SelectChangeEvent<number>) => {
		setSelectedAuctionId(Number(event.target.value));
	};

	const handleStart = async () => {
		if (!selectedAuctionId) return;
		await auctionService.startAuction(selectedAuctionId);
	};

	const handlePause = async () => {
		if (!selectedAuctionId) return;
		await auctionService.pauseAuction(selectedAuctionId);
	};

	const handleStop = async () => {
		if (!selectedAuctionId) return;
		if (window.confirm("Weet u zeker dat u de veiling wilt beëindigen?")) {
			await auctionService.endAuction(selectedAuctionId);
		}
	};

	const handleNextLot = async () => {
		if (!selectedAuctionId) return;
		await auctionService.nextLot(selectedAuctionId);
	};

	// --- Render ---

	const currentProduct = auctionState?.currentProduct;
	const isRunning = auctionState?.isRunning;
	const isPaused = auctionState?.isPaused;

	return (
		<Container maxWidth="xl" sx={{ py: 3 }}>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Typography variant="h4" component="h1">
					Veiling Dashboard
				</Typography>
				<FormControl sx={{ minWidth: 250 }}>
					<InputLabel id="auction-select-label">Selecteer Veiling</InputLabel>
					<Select
						labelId="auction-select-label"
						value={selectedAuctionId}
						label="Selecteer Veiling"
						onChange={handleAuctionChange}
					>
						{auctions.map((a) => (
							<MenuItem key={a.id} value={a.id}>
								{a.description} ({new Date(a.startsAt).toLocaleDateString()})
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>

			{!selectedAuctionId ? (
				<Paper sx={{ p: 5, textAlign: 'center' }}>
					<Typography variant="h6" color="text.secondary">
						Selecteer een veiling om te beginnen.
					</Typography>
				</Paper>
			) : !isConnected ? (
				<Box display="flex" justifyContent="center" p={5}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={3}>
					{/* LEFT COLUMN: Controls & Monitor */}
					<Grid size={{ xs: 12, md: 8 }}>
						<Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
							<CardHeader
								title="Live Klok Monitor"
								action={
									<Chip
										label={isRunning ? "ACTIEF" : isPaused ? "GEPAUZEERD" : "GESTOPT"}
										color={isRunning ? "success" : isPaused ? "warning" : "default"}
										variant="filled"
									/>
								}
							/>
							<Divider />
							<CardContent>
								{currentProduct ? (
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, sm: 5 }}>
											<Box
												component="img"
												src={currentProduct.imageBase64 || '/images/placeholder.png'}
												alt={currentProduct.name}
												sx={{
													width: '100%',
													height: 300,
													objectFit: 'cover',
													borderRadius: 2,
													bgcolor: 'grey.100'
												}}
											/>
										</Grid>
										<Grid size={{ xs: 12, sm: 7 }} display="flex" flexDirection="column" justifyContent="space-between">
											<Box>
												<Typography variant="h3" fontWeight="bold" gutterBottom>
													{currentProduct.name}
												</Typography>
												<Typography variant="h6" color="text.secondary">
													{currentProduct.species}
												</Typography>
												<Box mt={2} display="flex" gap={1} flexWrap="wrap">
													<Chip icon={<InventoryIcon />} label={`Voorraad: ${currentProduct.stock} stuks`} />
													<Chip label={`Min. Prijs: ${euro.format(currentProduct.minimumPrice)}`} variant="outlined" />
													{currentProduct.potSize && <Chip label={`Potmaat: ${currentProduct.potSize}cm`} variant="outlined" />}
												</Box>
											</Box>

											<Box textAlign="center" py={3} sx={{ bgcolor: 'background.default', borderRadius: 2, mt: 2 }}>
												<Typography variant="body2" color="text.secondary">HUIDIGE PRIJS</Typography>
												<Typography variant="h1" fontWeight="bold" color="primary.main">
													{euro.format(auctionState?.currentPrice || 0)}
												</Typography>
											</Box>
										</Grid>
									</Grid>
								) : (
									<Box height={300} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
										<InventoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
										<Typography variant="h6" color="text.secondary">
											Geen product actief. Start de veiling of ga naar het volgende kavel.
										</Typography>
									</Box>
								)}

								{/* Control Bar */}
								<Box mt={4} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
									{!isRunning ? (
										<Button
											variant="contained"
											color="success"
											size="large"
											startIcon={<PlayArrowIcon />}
											onClick={handleStart}
											sx={{ minWidth: 150 }}
										>
											Start
										</Button>
									) : (
										<Button
											variant="contained"
											color="warning"
											size="large"
											startIcon={<PauseIcon />}
											onClick={handlePause}
											sx={{ minWidth: 150 }}
										>
											Pauze
										</Button>
									)}

									<Button
										variant="contained"
										color="info"
										size="large"
										startIcon={<SkipNextIcon />}
										onClick={handleNextLot}
										disabled={isRunning && !isPaused} // Can only skip if paused or stopped
									>
										Volgend Kavel
									</Button>

									<Button
										variant="outlined"
										color="error"
										size="large"
										startIcon={<StopIcon />}
										onClick={handleStop}
									>
										Stop Veiling
									</Button>
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* RIGHT COLUMN: Lists */}
					<Grid size={{ xs: 12, md: 4 }}>
						<Box height="100%" display="flex" flexDirection="column" gap={3}>
							{/* Sales Log */}
							<Card variant="outlined" sx={{ flexGrow: 1, maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
								<CardHeader
									title="Verkoop Logboek"
									avatar={<GavelIcon color="action" />}
									titleTypographyProps={{ variant: 'h6' }}
								/>
								<Divider />
								<List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
									{salesLog.length === 0 ? (
										<ListItem>
											<ListItemText secondary="Nog geen verkopen..." />
										</ListItem>
									) : (
										salesLog.map((log) => (
											<ListItem key={log.id} divider>
												<ListItemText
													primary={
														<Typography variant="subtitle2">
															{log.buyerName} kocht {log.quantity}x {log.productName}
														</Typography>
													}
													secondary={
														<Box display="flex" justifyContent="space-between" width="100%">
															<span>{log.timestamp.toLocaleTimeString()}</span>
															<Typography component="span" fontWeight="bold" color="success.main">
																{euro.format(log.price)} /st
															</Typography>
														</Box>
													}
												/>
											</ListItem>
										))
									)}
									<div ref={logEndRef} />
								</List>
							</Card>

							{/* Upcoming Lots */}
							<Card variant="outlined" sx={{ flexGrow: 1, maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
								<CardHeader
									title="Kavel Lijst"
									avatar={<InventoryIcon color="action" />}
									titleTypographyProps={{ variant: 'h6' }}
									subheader={`${auctionProducts.filter(p => p.stock > 0).length} kavels resterend`}
								/>
								<Divider />
								<List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
									{auctionProducts.map((p) => {
										const isCurrent = currentProduct?.id === p.id;
										const isSoldOut = p.stock <= 0;
										return (
											<ListItem
												key={p.id}
												sx={{
													opacity: isSoldOut ? 0.5 : 1,
													bgcolor: isCurrent ? 'action.selected' : 'inherit'
												}}
											>
												<ListItemAvatar>
													<Avatar src={p.imageBase64} variant="rounded">
														{p.name.charAt(0)}
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={
														<Typography
															variant="body2"
															fontWeight={isCurrent ? "bold" : "normal"}
															color={isSoldOut ? "text.secondary" : "text.primary"}
														>
															{p.name} {isSoldOut && "(Uitverkocht)"}
														</Typography>
													}
													secondary={`Voorraad: ${p.stock} | Start: ${euro.format(p.maxPricePerUnit ?? 2.0)}`}
												/>
												{isCurrent && <Chip label="Nu Actief" color="primary" size="small" />}
											</ListItem>
										);
									})}
								</List>
							</Card>
						</Box>
					</Grid>
				</Grid>
			)}
		</Container>
	);
}
