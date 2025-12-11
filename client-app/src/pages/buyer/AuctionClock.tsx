import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Typography,
	Container,
	Box,
	Paper,
	Stack,
	Button,
	IconButton,
	TextField,
	Chip,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Transaction type for auction purchases
 */
type Transaction = {
	buyer: string;
	qty: number;
	price: number; // per unit at transaction time
	sideBuy?: boolean; // meekoop
	id: string;
};
// Euro currency formatter
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * Clamps a number between a minimum and maximum value.
 * @param n The number to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

/**
 * Rounds a number to two decimal places.
 * @param n The number to round
 * @returns The rounded number
 */
function round2(n: number) {
	return Math.round(n * 100) / 100;
}
/**
 * Custom hook to manage intervals.
 * @param callback The function to call on each interval
 * @param delayMs The interval delay in milliseconds
 */
function useInterval(callback: () => void, delayMs: number | null) {
	const savedRef = useRef(callback);
	useEffect(() => {
		savedRef.current = callback;
	}, [callback]);
	useEffect(() => {
		if (delayMs == null) return;
		const id = setInterval(() => savedRef.current(), delayMs);
		return () => clearInterval(id);
	}, [delayMs]);
}
/**
 * AuctionClock component for the auction clock
 * @returns JSX.Element
 */
export default function AuctionClock() {
	const { user } = useAuth();

	// Lot/product settings
	const [product, setProduct] = useState('Rozen (A1)');
	const [species, setSpecies] = useState('Rosa');
	const [origin, setOrigin] = useState('Aalsmeer');
	const [totalQty, setTotalQty] = useState(100);
	const [minPerBuy, setMinPerBuy] = useState(10); // minimum afname per koop
	const [orderStep, setOrderStep] = useState(10); // stapgrootte in aantallen

	// Clock settings
	const [startPrice, setStartPrice] = useState(0.5); // €/stuk
	const [floorPrice, setFloorPrice] = useState(0.2); // €/stuk
	const [priceStep, setPriceStep] = useState(0.01); // €/tik
	const [ticksPerSecond] = useState(3); // Fixed speed - removed user control

	// Runtime state
	const [running, setRunning] = useState(false);
	const [ticks, setTicks] = useState(0);
	const [remainingQty, setRemainingQty] = useState(totalQty);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [pausedForSale, setPausedForSale] = useState(false); // true na koop, om meekopen mogelijk te maken

	// Purchase dialog state
	const [purchaseOpen, setPurchaseOpen] = useState(false);
	const [buyer, setBuyer] = useState(user?.fullName || 'Koper A');
	const [buyQty, setBuyQty] = useState(minPerBuy);
	const [sideBuyMode, setSideBuyMode] = useState<null | { price: number }>(null); // meekoop prijs
	const [errors, setErrors] = useState<{ qty?: string }>({});
	const [submitting, setSubmitting] = useState(false);

	// Derived values
	const priceRange = Math.max(0.00001, startPrice - floorPrice);
	const currentPrice = useMemo(() => {
		const p = round2(startPrice - ticks * priceStep);
		return clamp(p, floorPrice, startPrice);
	}, [startPrice, floorPrice, priceStep, ticks]);
	const progressPct = useMemo(() => {
		// 0% at startPrice, 100% at floorPrice
		const dropped = startPrice - currentPrice;
		return clamp((dropped / priceRange) * 100, 0, 100);
	}, [startPrice, currentPrice, priceRange]);

	// Check if sold out
	const isSoldOut = remainingQty <= 0;

	// Timer
	useInterval(
		() => {
			setTicks((t) => {
				const next = t + 1;
				const nextPrice = round2(startPrice - next * priceStep);
				// Stop at floor price
				if (nextPrice <= floorPrice) {
					setRunning(false);
					return Math.ceil((startPrice - floorPrice) / priceStep);
				}
				return next;
			});
		},
		running ? Math.max(10, Math.round(1000 / ticksPerSecond)) : null
	);

	// Reset remainingQty when totalQty changes
	useEffect(() => {
		setRemainingQty(totalQty);
	}, [totalQty]);

	// Update buyer name when user changes
	useEffect(() => {
		if (user) {
			setBuyer(user.fullName || 'Koper A');
		}
	}, [user]);

	// Validate buy quantity
	useEffect(() => {
		setErrors(() => {
			const e: {
				qty?: string | undefined;
			} = {};
			if (buyQty <= 0) {
				e.qty = 'Aantal moet groter dan 0 zijn';
			} else if (buyQty > remainingQty) {
				e.qty = `Maximaal ${remainingQty}`;
			} else if (buyQty < minPerBuy) {
				e.qty = `Minimale afname is ${minPerBuy}`;
			} else if ((buyQty - minPerBuy) % orderStep !== 0) {
				e.qty = `Na de minimumafname in stappen van ${orderStep}`;
			}
			return e;
		});
	}, [buyQty, remainingQty, minPerBuy, orderStep]);

	// Open purchase dialog
	const openBuyDialog = (sideBuy?: boolean) => {
		if (isSoldOut) return;
		setRunning(false);
		setPausedForSale(true);
		setSideBuyMode(sideBuy ? { price: currentPrice } : null);
		// Default qty
		setBuyQty(Math.min(Math.max(minPerBuy, orderStep ? orderStep : minPerBuy), remainingQty));
		setPurchaseOpen(true);
	};

	// Commit purchase
	const commitPurchase = async () => {
		if (errors.qty || !user) return;
		if (isSoldOut) return;

		setSubmitting(true);
		try {
			const price = sideBuyMode?.price ?? currentPrice;
			const qty = buyQty;

			// TODO: Integrate with purchase system when context is available
			// For now, just add to local transactions for display

			// Add to local transactions for display
			const tx: Transaction = {
				buyer: buyer.trim() || 'Onbekend',
				qty,
				price,
				sideBuy: Boolean(sideBuyMode),
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			};
			setTransactions((prev) => [...prev, tx]);
			setRemainingQty((r) => r - qty);
			setPurchaseOpen(false);
			// keep paused after first purchase to allow more side buys
			setPausedForSale(true);
			// If no remaining, end
			if (remainingQty - qty <= 0) {
				setRunning(false);
			}
		} catch (err) {
			console.error('Purchase error:', err);
		} finally {
			setSubmitting(false);
		}
	};

	// Resume clock after sales
	const resumeAfterSales = () => {
		setPausedForSale(false);
		setSideBuyMode(null);
		if (remainingQty > 0 && currentPrice > floorPrice) {
			setRunning(true);
		}
	};

	// Finish lot immediately
	const finishLot = () => {
		setRunning(false);
		setPausedForSale(false);
		setSideBuyMode(null);
		setRemainingQty(0);
	};

	// Check if buyer can make a purchase
	const canBuy = remainingQty > 0 && currentPrice > 0 && !purchaseOpen && !!user;
	const atFloor = currentPrice <= floorPrice + 1e-9;

	return (
		<>
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<Paper variant="outlined" sx={{ p: 4, maxWidth: 600, width: '100%' }}>
						<Stack spacing={3} alignItems="center">
							{/* Product Info */}
							<Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
								<Typography variant="h4" fontWeight={600}>
									{product}
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Soort: {species} • Herkomst: {origin} • Kavel: {totalQty} stuks • Min. afname: {minPerBuy} • Stap: {orderStep}
								</Typography>
								<Chip
									color="primary"
									variant="outlined"
									label={`Start: ${euro.format(startPrice)} • Bodem: ${euro.format(floorPrice)}`}
								/>
							</Stack>

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
									value={progressPct}
									size={280}
									thickness={5}
									color={atFloor ? 'warning' : isSoldOut ? 'error' : 'primary'}
								/>
								<CircularProgress
									variant="determinate"
									value={100}
									size={300}
									thickness={1.5}
									color="inherit"
									sx={{ position: 'absolute', opacity: 0.25 }}
								/>
								<Stack
									spacing={1}
									alignItems="center"
									sx={{ textAlign: 'center', position: 'absolute' }}
								>
									<Typography
										variant="overline"
										color="text.secondary"
										sx={{
											textAlign: 'center',
											width: '100%',
											display: 'block'
										}}
									>
										{isSoldOut ? 'Uitverkocht' : 'Huidige prijs'}
									</Typography>
									<Typography
										variant="h1"
										sx={{
											fontWeight: 700,
											textAlign: 'left',
											width: '100%',
											display: 'block'
										}}
										color={isSoldOut ? 'error' : 'inherit'}
									>
										{isSoldOut ? 'Uitverkocht' : euro.format(currentPrice)}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											textAlign: 'center',
											width: '100%',
											display: 'block'
										}}
									>
										{!isSoldOut && `${ticks} tikken • Stap ${euro.format(priceStep)}`}
									</Typography>
								</Stack>
							</Box>

							{/* Purchase Section */}
							<Stack spacing={3} alignItems="center">
								{/* Main Purchase Button */}
								<Box sx={{ textAlign: 'center' }}>
									<Tooltip title={isSoldOut ? 'Uitverkocht' : 'Koop op huidige prijs'}>
										<span>
											<IconButton
												color={isSoldOut ? 'error' : 'success'}
												onClick={() => openBuyDialog(false)}
												disabled={!canBuy || atFloor || isSoldOut}
												size="large"
												sx={{
													width: 140,
													height: 140,
													border: `4px solid`,
													borderColor: isSoldOut ? 'error.main' : 'success.main',
													'&:hover': {
														backgroundColor: isSoldOut ? 'error.light' : 'success.light',
														borderColor: isSoldOut ? 'error.dark' : 'success.dark',
													},
												}}
											>
												<ShoppingCartIcon sx={{ fontSize: 56 }} />
											</IconButton>
										</span>
									</Tooltip>
									<Typography variant="h5" color={isSoldOut ? 'error' : 'success.main'} sx={{ mt: 2, fontWeight: 600 }}>
										{isSoldOut ? 'Uitverkocht' : 'Koop Nu'}
									</Typography>
								</Box>

								{/* Side Buy Options */}
								{pausedForSale && remainingQty > 0 && (
									<Paper variant="outlined" sx={{ p: 3, bgcolor: 'success.50', borderColor: 'success.main', width: '100%' }}>
										<Stack spacing={3} alignItems="center">
											<Chip
												color="success"
												label={`Meekopen mogelijk: ${euro.format(currentPrice)}`}
												variant="filled"
											/>
											<Stack direction="row" spacing={2} justifyContent="center">
												<Button
													size="large"
													startIcon={<AddIcon />}
													onClick={() => openBuyDialog(true)}
													variant="contained"
													color="success"
												>
													Meekopen
												</Button>
												<Button
													size="large"
													startIcon={<ArrowForwardIcon />}
													onClick={resumeAfterSales}
													variant="outlined"
													color="success"
												>
													Doorgaan
												</Button>
												<Button size="large" color="warning" onClick={finishLot} variant="outlined">
													Afronden
												</Button>
											</Stack>
										</Stack>
									</Paper>
								)}
							</Stack>
						</Stack>
					</Paper>
				</Box>
			</Container>

			{/* Purchase dialog */}
			<Dialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>{sideBuyMode ? 'Meekopen op huidige prijs' : 'Koop kavel-deel'}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2}>
						<TextField
							label="Koper"
							value={buyer}
							fullWidth
							InputProps={{
								readOnly: true,
							}}
						/>
						<TextField
							label="Aantal"
							type="number"
							value={buyQty}
							onChange={(e) => setBuyQty(Math.max(0, Number(e.target.value)))}
							inputProps={{ min: 1, step: 1 }}
							error={Boolean(errors.qty)}
							helperText={errors.qty || `Beschikbaar: ${remainingQty}`}
							fullWidth
						/>
						<TextField
							label="Prijs per stuk"
							value={euro.format(sideBuyMode?.price ?? currentPrice)}
							fullWidth
							InputProps={{
								readOnly: true,
							}}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPurchaseOpen(false)} disabled={submitting}>Annuleren</Button>
					<Button
						onClick={commitPurchase}
						variant="contained"
						disabled={Boolean(errors.qty) || buyQty <= 0 || submitting}
						color="success"
					>
						{submitting ? 'Verwerken...' : 'Bevestig'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
