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
	SelectChangeEvent,
	IconButton,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	DialogActions
} from '@mui/material';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAlert } from '../../components/AlertProvider';
import { auctionService } from '../../api/services/auctionService';
import { productService, ProductDto } from '../../api/services/productService';
import { Auction } from '../../types/auction';
import { Product } from '../../types/product';
import { AddAuctionModal } from '../../components/AddAuctionModal';
import { ProductManagementModal } from '../../components/ProductManagementModal';

// Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import GavelIcon from '@mui/icons-material/Gavel';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';
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
/**
 * Auctioneer Dashboard page component.
 * @returns JSX.Element representing the Auctioneer Dashboard.
 */
export default function AuctioneerDashboard() {
	const { showAlert } = useAlert();
	const [connection, setConnection] = useState<HubConnection | null>(null);

	// --- State: General Data ---
	const [auctions, setAuctions] = useState<Auction[]>([]);
	const [selectedAuctionId, setSelectedAuctionId] = useState<number | ''>('');
	const [auctionProducts, setAuctionProducts] = useState<Product[]>([]); // Products for the ACTIVE auction view

	// Ref for SignalR to avoid stale closures
	const auctionProductsRef = useRef<Product[]>([]);

	// --- State: Real-time ---
	const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
	const [salesLog, setSalesLog] = useState<SaleLog[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const logEndRef = useRef<HTMLDivElement>(null);

	// --- State: Modals ---
	const [isAddAuctionModalOpen, setIsAddAuctionModalOpen] = useState(false);
	const [isEditAuctionModalOpen, setIsEditAuctionModalOpen] = useState(false);
	const [editAuctionDescription, setEditAuctionDescription] = useState('');

	// --- State: Product Management Modal ---
	const [isProductManagementModalOpen, setIsProductManagementModalOpen] = useState(false);
	const [modalAvailableProducts, setModalAvailableProducts] = useState<Product[]>([]);
	const [modalLinkedProducts, setModalLinkedProducts] = useState<Product[]>([]);
	const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

	// -------------------------------------------------------------------------
	// Data Fetching
	// -------------------------------------------------------------------------

	const loadAuctions = async () => {
		const res = await auctionService.getAllAuctions();
		if (res.data) setAuctions(res.data);
	};

	useEffect(() => {
		void loadAuctions();
	}, []);

	// Load products for the selected auction (Dashboard View)
	const loadAuctionProducts = async () => {
		if (!selectedAuctionId) {
			setAuctionProducts([]);
			return;
		}
		const res = await productService.getMyProducts({ force: true });
		if (res.data) {
			const sorted = res.data
				.filter(p => p.auctionId === selectedAuctionId)
				.sort((a, b) => a.id - b.id);
			setAuctionProducts(sorted);
		}
	};

	useEffect(() => {
		void loadAuctionProducts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedAuctionId]);

	// Sync ref
	useEffect(() => {
		auctionProductsRef.current = auctionProducts;
	}, [auctionProducts]);

	// -------------------------------------------------------------------------
	// SignalR Logic
	// -------------------------------------------------------------------------

	useEffect(() => {
		// Reset
		setConnection(null);
		setIsConnected(false);
		setAuctionState(null);
		setSalesLog([]);

		if (!selectedAuctionId) return;

		const newConnection = new HubConnectionBuilder()
			.withUrl(`${API_BASE_URL}/auctionHub`, { withCredentials: true })
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
					// showAlert({ title: "Verbindingsfout", message: "Kon geen verbinding maken met de server.", severity: "error" });
				}
			};

			void startConnection();

			const handleAuctionState = (state: AuctionState) => setAuctionState(state);
			const handlePriceUpdate = (price: number) => setAuctionState(prev => prev ? { ...prev, currentPrice: price } : null);

			const handleLotSold = (data: { buyerName: string, quantity: number, price: number, productId: number, remainingStock: number }) => {
				const products = auctionProductsRef.current;
				const product = products.find(p => p.id === data.productId);

				const newLog: SaleLog = {
					id: Date.now().toString() + Math.random(),
					buyerName: data.buyerName,
					quantity: data.quantity,
					price: data.price,
					productName: product?.name || 'Onbekend Product',
					timestamp: new Date()
				};
				setSalesLog(prev => [newLog, ...prev]);

				// Update local list
				setAuctionProducts(prev => prev.map(p => {
					if (p.id === data.productId) return { ...p, stock: data.remainingStock };
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

			connection.on('AuctionState', handleAuctionState);
			connection.on('PriceUpdate', handlePriceUpdate);
			connection.on('LotSold', handleLotSold);
			connection.on('NextLot', handleNextLot);
			connection.on('AuctionEnded', handleAuctionEnded);

			return () => {
				connection.off('AuctionState', handleAuctionState);
				connection.off('PriceUpdate', handlePriceUpdate);
				connection.off('LotSold', handleLotSold);
				connection.off('NextLot', handleNextLot);
				connection.off('AuctionEnded', handleAuctionEnded);
			};
		}
	}, [connection, selectedAuctionId, showAlert]);

	// -------------------------------------------------------------------------
	// Handlers: Auction Controls (Start/Stop/Next)
	// -------------------------------------------------------------------------

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

	// -------------------------------------------------------------------------
	// Handlers: Auction Management (Create / Edit / Delete)
	// -------------------------------------------------------------------------

	const handleCreateAuctionSuccess = (newAuction: Auction) => {
		void loadAuctions();
		setSelectedAuctionId(newAuction.id); // Auto-select created
	};

	const openEditAuctionModal = () => {
		const auction = auctions.find(a => a.id === selectedAuctionId);
		if (auction) {
			setEditAuctionDescription(auction.description);
			setIsEditAuctionModalOpen(true);
		}
	};

	const handleSaveEditAuction = async () => {
		if (!selectedAuctionId || !editAuctionDescription.trim()) return;
		const auction = auctions.find(a => a.id === selectedAuctionId);
		if (!auction) return;

		await auctionService.updateAuction(selectedAuctionId, { ...auction, description: editAuctionDescription });
		showAlert({ title: "Succes", message: "Veilingnaam bijgewerkt.", severity: "success" });
		setIsEditAuctionModalOpen(false);
		void loadAuctions();
	};

	const handleDeleteAuction = async () => {
		if (!selectedAuctionId) return;
		const auction = auctions.find(a => a.id === selectedAuctionId);
		const name = auction ? auction.description : 'deze veiling';

		if (window.confirm(`Weet u zeker dat u "${name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
			const res = await auctionService.deleteAuction(selectedAuctionId);
			if (res.error) {
				showAlert({ title: "Fout", message: res.error || "Kon veiling niet verwijderen.", severity: "error" });
			} else {
				showAlert({ title: "Succes", message: "Veiling verwijderd.", severity: "success" });
				setSelectedAuctionId('');
				void loadAuctions();
			}
		}
	};

	// -------------------------------------------------------------------------
	// Handlers: Product Management Logic
	// -------------------------------------------------------------------------

	const handleOpenProductManagement = async () => {
		if (!selectedAuctionId) return;

		// Fetch fresh data for the modal (all products to allow linking)
		const res = await productService.getMyProducts({ force: true });
		if (res.data) {
			setModalLinkedProducts(res.data.filter(p => p.auctionId === selectedAuctionId));
			setModalAvailableProducts(res.data.filter(p => !p.auctionId));
		}
		setSelectedProductIds([]);
		setIsProductManagementModalOpen(true);
	};

	const handleLinkProducts = async () => {
		if (!selectedAuctionId) return;
		for (const pid of selectedProductIds) {
			const p = modalAvailableProducts.find(x => x.id === pid);
			if (p) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, supplierId, auctionId, ...rest } = p;
				const updateData: ProductDto = { ...rest, auctionId: selectedAuctionId };
				await productService.updateProduct(pid, updateData);
			}
		}
		showAlert({ title: "Succes", message: "Producten gekoppeld", severity: "success" });

		// Refresh modal data AND dashboard list
		const res = await productService.getMyProducts({ force: true });
		if (res.data) {
			setModalLinkedProducts(res.data.filter(p => p.auctionId === selectedAuctionId));
			setModalAvailableProducts(res.data.filter(p => !p.auctionId));
			// Also update the dashboard view immediately
			setAuctionProducts(res.data.filter(p => p.auctionId === selectedAuctionId).sort((a, b) => a.id - b.id));
		}
		setSelectedProductIds([]);
	};

	const handleUnlinkProduct = async (pid: number) => {
		if (!selectedAuctionId) return;
		const p = modalLinkedProducts.find(x => x.id === pid);
		if (p) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, supplierId, auctionId, ...rest } = p;
			const updateData: ProductDto = { ...rest, auctionId: undefined };
			await productService.updateProduct(pid, updateData);

			// Refresh logic
			const res = await productService.getMyProducts({ force: true });
			if (res.data) {
				setModalLinkedProducts(res.data.filter(prod => prod.auctionId === selectedAuctionId));
				setModalAvailableProducts(res.data.filter(prod => !prod.auctionId));
				setAuctionProducts(res.data.filter(prod => prod.auctionId === selectedAuctionId).sort((a, b) => a.id - b.id));
			}
		}
	};

	const handleMaxPriceChange = async (id: number, price: number) => {
		if (!selectedAuctionId) return;
		const p = modalLinkedProducts.find(x => x.id === id);
		if (p) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id: pid, supplierId, auctionId, ...rest } = p;
			const updateData: ProductDto = { ...rest, auctionId: selectedAuctionId, maxPricePerUnit: price };
			await productService.updateProduct(id, updateData);
			// Optimistic local update for modal
			setModalLinkedProducts(prev => prev.map(prod => prod.id === id ? { ...prod, maxPricePerUnit: price } : prod));
		}
	};

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	const currentProduct = auctionState?.currentProduct;
	const isRunning = auctionState?.isRunning;
	const isPaused = auctionState?.isPaused;
	const selectedAuction = auctions.find(a => a.id === selectedAuctionId) || null;

	return (
		<Container maxWidth="xl" sx={{ py: 3 }}>
			{/* Top Bar: Title & Auction Selection */}
			<Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={3} gap={2}>
				<Typography variant="h4" component="h1">
					Veiling Dashboard
				</Typography>

				<Box display="flex" alignItems="center" gap={1}>
					<FormControl sx={{ minWidth: 250 }} size="small">
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

					<Tooltip title="Nieuwe Veiling">
						<IconButton
							onClick={() => setIsAddAuctionModalOpen(true)}
							color="primary"
							sx={{ border: '1px solid', borderColor: 'divider' }}
						>
							<AddIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title="Bewerk Naam">
						<IconButton
							onClick={openEditAuctionModal}
							disabled={!selectedAuctionId}
							sx={{ border: '1px solid', borderColor: 'divider' }}
						>
							<EditIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title="Verwijder Veiling">
						<IconButton
							onClick={handleDeleteAuction}
							disabled={!selectedAuctionId}
							color="error"
							sx={{ border: '1px solid', borderColor: 'divider' }}
						>
							<DeleteIcon />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Main Content Area */}
			{!selectedAuctionId ? (
				<Paper sx={{ p: 5, textAlign: 'center' }}>
					<Typography variant="h6" color="text.secondary">
						Selecteer een veiling of maak een nieuwe aan om te beginnen.
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
										disabled={isRunning && !isPaused}
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
							<Card variant="outlined" sx={{ flexGrow: 1, maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
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

							{/* Upcoming Lots with Management Button */}
							<Card variant="outlined" sx={{ flexGrow: 1, maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
								<CardHeader
									title="Kavel Lijst"
									avatar={<InventoryIcon color="action" />}
									titleTypographyProps={{ variant: 'h6' }}
									subheader={`${auctionProducts.filter(p => p.stock > 0).length} kavels resterend`}
									action={
										<Tooltip title="Producten Beheren / Koppelen">
											<IconButton onClick={handleOpenProductManagement}>
												<SettingsIcon />
											</IconButton>
										</Tooltip>
									}
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
									{auctionProducts.length === 0 && (
										<ListItem>
											<ListItemText secondary="Geen kavels gekoppeld. Klik op het tandwiel om producten toe te voegen." />
										</ListItem>
									)}
								</List>
							</Card>
						</Box>
					</Grid>
				</Grid>
			)}

			{/* Modals */}
			<AddAuctionModal
				open={isAddAuctionModalOpen}
				onClose={() => setIsAddAuctionModalOpen(false)}
				onSubmit={handleCreateAuctionSuccess}
			/>

			{/* Edit Auction Name Dialog */}
			<Dialog open={isEditAuctionModalOpen} onClose={() => setIsEditAuctionModalOpen(false)}>
				<DialogTitle>Veiling Naam Bewerken</DialogTitle>
				<DialogContent>
					<TextField
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
						margin="dense"
						label="Omschrijving"
						type="text"
						fullWidth
						value={editAuctionDescription}
						onChange={(e) => setEditAuctionDescription(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsEditAuctionModalOpen(false)}>Annuleren</Button>
					<Button onClick={handleSaveEditAuction} variant="contained">Opslaan</Button>
				</DialogActions>
			</Dialog>

			{/* Product Management Modal */}
			<ProductManagementModal
				open={isProductManagementModalOpen}
				onClose={() => setIsProductManagementModalOpen(false)}
				auction={selectedAuction}
				availableProducts={modalAvailableProducts}
				linkedProducts={modalLinkedProducts}
				loadingProducts={false}
				errorProducts={null}
				selectedProductIds={selectedProductIds}
				onProductToggle={(id) => {
					setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
				}}
				onLinkProducts={handleLinkProducts}
				onUnlinkProduct={handleUnlinkProduct}
				onMaxPriceChange={handleMaxPriceChange}
			/>
		</Container>
	);
}
