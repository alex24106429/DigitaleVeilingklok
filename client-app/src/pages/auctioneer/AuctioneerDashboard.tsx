import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Auction, AuctionStatus } from '../../types/auction';
import { Product } from '../../types/product';
import { auctionService } from '../../api/services/auctionService';
import { productService } from '../../api/services/productService';

/**
 * AuctioneerDashboard component for auctioneer dashboard
 * Displays live auction progress, bids/sales, and remaining products
 * @returns JSX.Element
 */
export default function AuctioneerDashboard() {
	const [activeAuction, setActiveAuction] = useState<Auction | null>(null);
	const [loadingAuction, setLoadingAuction] = useState(true);
	const [errorAuction, setErrorAuction] = useState<string | null>(null);

	const [auctionProducts, setAuctionProducts] = useState<Product[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(false);
	const [errorProducts, setErrorProducts] = useState<string | null>(null);

	// Fetch active auction (status = Active)
	useEffect(() => {
		const fetchActiveAuction = async () => {
			setLoadingAuction(true);
			setErrorAuction(null);
			try {
				const { data, error } = await auctionService.getAllAuctions();
				if (error) {
					setErrorAuction(error);
				} else if (data) {
					// Find the first active auction
					const active = data.find(a => a.status === AuctionStatus.Active);
					setActiveAuction(active || null);
				}
			} catch (err) {
				setErrorAuction('Failed to fetch active auction');
			}
			setLoadingAuction(false);
		};

		fetchActiveAuction();

		// Refresh auction status every 5 seconds
		const interval = setInterval(fetchActiveAuction, 5000);

		return () => clearInterval(interval);
	}, []);

	// Fetch products for the active auction
	useEffect(() => {
		const fetchProductsForAuction = async () => {
			if (!activeAuction) {
				setAuctionProducts([]);
				return;
			}

			setLoadingProducts(true);
			setErrorProducts(null);
			try {
				const { data, error } = await productService.getMyProducts();
				if (error) {
					setErrorProducts(error);
				} else if (data) {
					// Filter products linked to the active auction
					const linkedProducts = data.filter(p => p.auctionId === activeAuction.id);
					setAuctionProducts(linkedProducts);
				}
			} catch (err) {
				setErrorProducts('Failed to fetch auction products');
			}
			setLoadingProducts(false);
		};

		fetchProductsForAuction();
	}, [activeAuction]);

	const handlePauseAuction = async () => {
		if (!activeAuction) return;
		try {
			await auctionService.pauseAuction(activeAuction.id);
			setActiveAuction({ ...activeAuction, status: AuctionStatus.Paused });
		} catch (err) {
			setErrorAuction('Failed to pause auction');
		}
	};

	const handleEndAuction = async () => {
		if (!activeAuction) return;
		if (!confirm('Are you sure you want to end this auction?')) return;
		try {
			await auctionService.endAuction(activeAuction.id);
			setActiveAuction({ ...activeAuction, status: AuctionStatus.Ended });
		} catch (err) {
			setErrorAuction('Failed to end auction');
		}
	};

	const getStatusText = (status: AuctionStatus) => {
		const statuses: Record<AuctionStatus, string> = {
			[AuctionStatus.Pending]: 'Gepland',
			[AuctionStatus.Active]: 'Actief',
			[AuctionStatus.Paused]: 'Gepauzeerd',
			[AuctionStatus.Ended]: 'Gesloten',
		};
		return statuses[status] || 'Onbekend';
	};

	if (loadingAuction) {
		return (
			<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Veiling Dashboard
			</Typography>

			{errorAuction && <Alert severity="error" sx={{ mb: 2 }}>{errorAuction}</Alert>}

			{activeAuction ? (
				<Box>
					{/* Active Auction Card */}
					<Card sx={{ mb: 3, backgroundColor: 'primary.light' }}>
						<CardContent>
							<Grid container spacing={2} alignItems="center">
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="h5" component="h2" gutterBottom>
										{activeAuction.description}
									</Typography>
									<Typography color="textSecondary" gutterBottom>
										Start tijd: {new Date(activeAuction.startsAt).toLocaleString()}
									</Typography>
									<Typography variant="body1" gutterBottom>
										Status: <strong>{getStatusText(activeAuction.status)}</strong>
									</Typography>
									<Typography variant="body1">
										Reserve Prijs: €{activeAuction.reservePrice.toFixed(2)}
									</Typography>
								</Grid>

								<Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
									{activeAuction.status === AuctionStatus.Active && (
										<>
											<Button variant="contained" color="warning" onClick={handlePauseAuction}>
												Pauze Veiling
											</Button>
											<Button variant="contained" color="error" onClick={handleEndAuction}>
												Einde Veiling
											</Button>
										</>
									)}
									{activeAuction.status === AuctionStatus.Paused && (
										<Button
											variant="contained"
											color="success"
											onClick={async () => {
												try {
													await auctionService.startAuction(activeAuction.id);
													setActiveAuction({ ...activeAuction, status: AuctionStatus.Active });
												} catch (err) {
													setErrorAuction('Failed to resume auction');
												}
											}}
										>
											Pauzeer Veiling
										</Button>
									)}
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Auction Statistics */}
					<Grid container spacing={2} sx={{ mb: 3 }}>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Card>
								<CardContent>
									<Typography color="textSecondary" gutterBottom>
										Totaal Producten
									</Typography>
									<Typography variant="h5">
										{auctionProducts.length}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Card>
								<CardContent>
									<Typography color="textSecondary" gutterBottom>
										Totaal voorraad
									</Typography>
									<Typography variant="h5">
										{auctionProducts.reduce((sum, p) => sum + p.stock, 0)} units
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Card>
								<CardContent>
									<Typography color="textSecondary" gutterBottom>
										Recentlijk bijgewerkt
									</Typography>
									<Typography variant="h6">
										{new Date().toLocaleTimeString()}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>

					{/* Products in Auction */}
					<Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3, mb: 2 }}>
						Producten in deze Veiling
					</Typography>
					{errorProducts && <Alert severity="error" sx={{ mb: 2 }}>{errorProducts}</Alert>}
					{loadingProducts ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
							<CircularProgress />
						</Box>
					) : auctionProducts.length > 0 ? (
						<TableContainer component={Paper}>
							<Table>
								<TableHead sx={{ backgroundColor: 'primary.light' }}>
									<TableRow>
										<TableCell>Product</TableCell>
										<TableCell>Species</TableCell>
										<TableCell align="right">Stock</TableCell>
										<TableCell align="right">Min. Price</TableCell>
										<TableCell align="right">Pot Size</TableCell>
										<TableCell align="right">Stem Length</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{auctionProducts.map((product) => (
										<TableRow key={product.id}>
											<TableCell>{product.name}</TableCell>
											<TableCell>{product.species}</TableCell>
											<TableCell align="right">{product.stock}</TableCell>
											<TableCell align="right">€{product.minimumPrice.toFixed(2)}</TableCell>
											<TableCell align="right">{product.potSize || '-'}</TableCell>
											<TableCell align="right">{product.stemLength || '-'}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					) : (
						<Alert severity="info">Geen producten gekoppeld aan deze veiling.</Alert>
					)}
				</Box>
			) : (
				<Alert severity="info">Geen actieve veiling gevonden.</Alert>
			)}
		</Box>
	);
}


