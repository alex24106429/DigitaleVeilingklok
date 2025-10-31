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
	InputAdornment,
	Slider,
	Divider,
	Chip,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

type Transaction = {
	buyer: string;
	qty: number;
	price: number; // per unit at transaction time
	sideBuy?: boolean; // meekoop
	id: string;
};

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function round2(n: number) {
	return Math.round(n * 100) / 100;
}

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

export default function AuctionClock() {
	// Lot/product settings
	const [product, setProduct] = useState('Rozen (A1)');
	const [origin, setOrigin] = useState('Aalsmeer');
	const [totalQty, setTotalQty] = useState(100);
	const [minPerBuy, setMinPerBuy] = useState(10); // minimum afname per koop
	const [orderStep, setOrderStep] = useState(10); // stapgrootte in aantallen

	// Clock settings
	const [startPrice, setStartPrice] = useState(0.5); // €/stuk
	const [floorPrice, setFloorPrice] = useState(0.2); // €/stuk
	const [priceStep, setPriceStep] = useState(0.01); // €/tik
	const [ticksPerSecond, setTicksPerSecond] = useState(3); // snelheid

	// Runtime state
	const [running, setRunning] = useState(false);
	const [ticks, setTicks] = useState(0);
	const [remainingQty, setRemainingQty] = useState(totalQty);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [pausedForSale, setPausedForSale] = useState(false); // true na koop, om meekopen mogelijk te maken

	// Purchase dialog state
	const [purchaseOpen, setPurchaseOpen] = useState(false);
	const [buyer, setBuyer] = useState('Koper A');
	const [buyQty, setBuyQty] = useState(minPerBuy);
	const [sideBuyMode, setSideBuyMode] = useState<null | { price: number }>(null); // meekoop prijs
	const [errors, setErrors] = useState<{ qty?: string }>({});

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

	const canStart = useMemo(() => {
		return (
			totalQty > 0 &&
			startPrice > floorPrice &&
			priceStep > 0 &&
			ticksPerSecond > 0 &&
			remainingQty > 0
		);
	}, [totalQty, startPrice, floorPrice, priceStep, ticksPerSecond, remainingQty]);

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

	const handleStartPause = () => {
		if (!running) {
			// If clock is at floor or no quantity, don't start
			if (!canStart) return;
			setPausedForSale(false);
			setRunning(true);
		} else {
			setRunning(false);
		}
	};

	const handleReset = () => {
		setRunning(false);
		setTicks(0);
		setRemainingQty(totalQty);
		setTransactions([]);
		setPausedForSale(false);
		setSideBuyMode(null);
	};

	const openBuyDialog = (sideBuy?: boolean) => {
		setRunning(false);
		setPausedForSale(true);
		setSideBuyMode(sideBuy ? { price: currentPrice } : null);
		// Default qty
		setBuyQty(Math.min(Math.max(minPerBuy, orderStep ? orderStep : minPerBuy), remainingQty));
		setPurchaseOpen(true);
	};

	const commitPurchase = () => {
		if (errors.qty) return;
		const price = sideBuyMode?.price ?? currentPrice;
		const qty = buyQty;
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
	};

	const resumeAfterSales = () => {
		setPausedForSale(false);
		setSideBuyMode(null);
		if (remainingQty > 0 && currentPrice > floorPrice) {
			setRunning(true);
		}
	};

	const finishLot = () => {
		setRunning(false);
		setPausedForSale(false);
		setSideBuyMode(null);
		setRemainingQty(0);
	};

	const canBuy = remainingQty > 0 && currentPrice > 0 && !purchaseOpen;
	const atFloor = currentPrice <= floorPrice + 1e-9;

	return (
		<>
			<Chip
				label={`Resterend: ${remainingQty}`}
				color={remainingQty > 0 ? 'default' : 'warning'}
				variant="filled"
				sx={{ fontWeight: 600 }}
			/>

			<Container maxWidth="lg" sx={{ py: 3 }}>
				<Grid container spacing={3}>
					{/* Clock & Controls */}
					<Grid size={{ xs: 12, md: 7 }}>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
								<Stack spacing={0.5}>
									<Typography variant="h6">{product}</Typography>
									<Typography variant="body2" color="text.secondary">
										Herkomst: {origin} • Kavel: {totalQty} stuks • Min. afname: {minPerBuy} • Stap: {orderStep}
									</Typography>
								</Stack>
								<Chip
									color="primary"
									variant="outlined"
									label={`Start: ${euro.format(startPrice)} • Bodem: ${euro.format(floorPrice)}`}
								/>
							</Stack>

							<Divider sx={{ my: 2 }} />

							<Grid container spacing={2} alignItems="center">
								<Grid size={{ xs: 12, md: 6 }}>
									<Box
										sx={{
											position: 'relative',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: 260,
										}}
									>
										<CircularProgress
											variant="determinate"
											value={progressPct}
											size={220}
											thickness={5}
											color={atFloor ? 'warning' : 'primary'}
										/>
										<CircularProgress
											variant="determinate"
											value={100}
											size={240}
											thickness={1.5}
											color="inherit"
											sx={{ position: 'absolute', opacity: 0.25 }}
										/>
										<Stack
											spacing={1}
											alignItems="center"
											sx={{ position: 'absolute', textAlign: 'center' }}
										>
											<Typography variant="overline" color="text.secondary">
												Huidige prijs
											</Typography>
											<Typography variant="h2" sx={{ fontWeight: 700 }}>
												{euro.format(currentPrice)}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{ticks} tikken • {ticksPerSecond} t/s • stap {euro.format(priceStep)}
											</Typography>
										</Stack>
									</Box>
								</Grid>

								<Grid size={{ xs: 12, md: 6 }}>
									<Stack spacing={2}>
										<Stack direction="row" spacing={1}>
											<Tooltip title={running ? 'Pauzeer' : 'Start'}>
												<span>
													<IconButton
														color={running ? 'warning' : 'primary'}
														onClick={handleStartPause}
														disabled={!running && !canStart}
														size="large"
													>
														{running ? <PauseIcon /> : <PlayArrowIcon />}
													</IconButton>
												</span>
											</Tooltip>
											<Tooltip title="Reset kavel">
												<span>
													<IconButton color="default" onClick={handleReset} size="large">
														<RestartAltIcon />
													</IconButton>
												</span>
											</Tooltip>
											<Tooltip title="Koop op huidige prijs">
												<span>
													<IconButton
														color="success"
														onClick={() => openBuyDialog(false)}
														disabled={!canBuy || atFloor}
														size="large"
													>
														<ShoppingCartIcon />
													</IconButton>
												</span>
											</Tooltip>
										</Stack>

										{pausedForSale && remainingQty > 0 && (
											<Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
												<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
													<Chip
														color="success"
														label={`Laat meekopen op ${euro.format(currentPrice)}`}
														variant="filled"
													/>
													<Stack direction="row" spacing={1}>
														<Button
															size="small"
															startIcon={<AddIcon />}
															onClick={() => openBuyDialog(true)}
															variant="contained"
															color="success"
														>
															Meekoop toevoegen
														</Button>
														<Button
															size="small"
															startIcon={<ArrowForwardIcon />}
															onClick={resumeAfterSales}
															variant="outlined"
														>
															Doorgaan met afklokken
														</Button>
														<Button size="small" color="warning" onClick={finishLot}>
															Kavel afronden
														</Button>
													</Stack>
												</Stack>
											</Paper>
										)}

										<Divider />

										<TextField
											label="Snelheid (tikken/sec)"
											type="number"
											value={ticksPerSecond}
											onChange={(e) => setTicksPerSecond(clamp(Number(e.target.value), 1, 20))}
											inputProps={{ min: 1, max: 20, step: 1 }}
											size="small"
										/>
										<Slider
											value={ticksPerSecond}
											min={1}
											max={20}
											step={1}
											valueLabelDisplay="auto"
											onChange={(_, v) => setTicksPerSecond(v as number)}
										/>
									</Stack>
								</Grid>
							</Grid>
						</Paper>
					</Grid>

					{/* Settings & Info */}
					<Grid size={{ xs: 12, md: 5 }}>
						<Stack spacing={3}>
							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography variant="subtitle1" gutterBottom>
									Kavelinstellingen
								</Typography>
								<Grid container spacing={2}>
									<Grid size={12}>
										<TextField
											fullWidth
											label="Product"
											value={product}
											onChange={(e) => setProduct(e.target.value)}
										/>
									</Grid>
									<Grid size={{ xs: 12, sm: 6 }}>
										<TextField
											fullWidth
											label="Herkomst"
											value={origin}
											onChange={(e) => setOrigin(e.target.value)}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 3 }}>
										<TextField
											fullWidth
											type="number"
											label="Kavelomvang"
											value={totalQty}
											onChange={(e) => setTotalQty(Math.max(0, Number(e.target.value)))}
											inputProps={{ min: 0, step: 1 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 3 }}>
										<TextField
											fullWidth
											type="number"
											label="Resterend"
											value={remainingQty}
											onChange={(e) =>
												setRemainingQty(clamp(Number(e.target.value), 0, totalQty))
											}
											inputProps={{ min: 0, max: totalQty, step: 1 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<TextField
											fullWidth
											type="number"
											label="Min. afname"
											value={minPerBuy}
											onChange={(e) => setMinPerBuy(Math.max(1, Number(e.target.value)))}
											inputProps={{ min: 1, step: 1 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<TextField
											fullWidth
											type="number"
											label="Stapgrootte"
											value={orderStep}
											onChange={(e) => setOrderStep(Math.max(1, Number(e.target.value)))}
											inputProps={{ min: 1, step: 1 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<TextField
											fullWidth
											type="number"
											label="Prijsstap €/tik"
											value={priceStep}
											onChange={(e) => setPriceStep(Math.max(0.001, Number(e.target.value)))}
											InputProps={{
												startAdornment: <InputAdornment position="start">€</InputAdornment>,
											}}
											inputProps={{ min: 0.001, step: 0.001 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 6 }}>
										<TextField
											fullWidth
											type="number"
											label="Startprijs €/stuk"
											value={startPrice}
											onChange={(e) => setStartPrice(Math.max(0.01, Number(e.target.value)))}
											InputProps={{
												startAdornment: <InputAdornment position="start">€</InputAdornment>,
											}}
											inputProps={{ min: 0.01, step: 0.01 }}
										/>
									</Grid>
									<Grid size={{ xs: 6, sm: 6 }}>
										<TextField
											fullWidth
											type="number"
											label="Bodemprijs €/stuk"
											value={floorPrice}
											onChange={(e) => setFloorPrice(Math.max(0, Number(e.target.value)))}
											InputProps={{
												startAdornment: <InputAdornment position="start">€</InputAdornment>,
											}}
											inputProps={{ min: 0, step: 0.01 }}
										/>
									</Grid>
								</Grid>
							</Paper>

							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography variant="subtitle1" gutterBottom>
									Transacties
								</Typography>
								{transactions.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										Nog geen transacties.
									</Typography>
								) : (
									<Stack spacing={1.5}>
										{transactions.map((t) => (
											<Stack
												key={t.id}
												direction="row"
												alignItems="center"
												justifyContent="space-between"
												sx={{
													p: 1,
													borderRadius: 1,
													border: '1px solid',
													borderColor: 'divider',
													bgcolor: t.sideBuy ? 'success.50' : 'background.paper',
												}}
											>
												<Stack direction="row" spacing={1} alignItems="center">
													<Chip size="small" label={t.buyer} color={t.sideBuy ? 'success' : 'primary'} />
													<Typography variant="body2">
														{t.qty} × {euro.format(t.price)} ={' '}
														<strong>{euro.format(round2(t.qty * t.price))}</strong>
													</Typography>
												</Stack>
												{t.sideBuy && <Chip size="small" label="Meekoop" color="success" variant="outlined" />}
											</Stack>
										))}
										<Divider />
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" color="text.secondary">
												Verkocht totaal:{' '}
												{transactions.reduce((s, t) => s + t.qty, 0)} / {totalQty}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Opbrengst:{' '}
												<strong>
													{euro.format(
														round2(transactions.reduce((s, t) => s + t.qty * t.price, 0))
													)}
												</strong>
											</Typography>
										</Stack>
									</Stack>
								)}
							</Paper>
						</Stack>
					</Grid>
				</Grid>
			</Container>

			{/* Purchase dialog */}
			<Dialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>{sideBuyMode ? 'Meekopen op huidige prijs' : 'Koop kavel-deel'}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2}>
						<TextField
							label="Koper"
							value={buyer}
							onChange={(e) => setBuyer(e.target.value)}
							fullWidth
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
					<Button onClick={() => setPurchaseOpen(false)}>Annuleren</Button>
					<Button
						onClick={commitPurchase}
						variant="contained"
						disabled={Boolean(errors.qty) || buyQty <= 0}
						color="success"
					>
						Bevestig
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
