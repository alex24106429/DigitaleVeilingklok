import * as React from 'react';
import {
	Box,
	Card,
	CardContent,
	Checkbox,
	Container,
	CssBaseline,
	Divider,
	FormControlLabel,
	FormGroup,
	InputAdornment,
	Paper,
	Slider,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import ImageIcon from '@mui/icons-material/Image';

export function StoreFront() {
	const [sort, setSort] = React.useState<'nieuw' | 'up' | 'down' | 'rating'>('nieuw');
	const [priceRange, setPriceRange] = React.useState<number[]>([0, 100]);
	const [locations, setLocations] = React.useState({
		aalsmeer: true,
		naaldwijk: true,
		venlo: true,
	});
	const [colors, setColors] = React.useState({
		blauw: true,
		rood: true,
		roze: true,
	});

	const handleSort = (_: React.MouseEvent<HTMLElement>, next: typeof sort | null) => {
		if (next) setSort(next);
	};

	const handlePrice = (_: Event, val: number | number[]) => {
		if (Array.isArray(val)) setPriceRange(val);
	};

	const products = Array.from({ length: 6 }).map((_, i) => ({
		id: i,
		title: 'Tekst',
		price: 0,
		footer: i % 2 === 0 ? 'Tijd nog over om te bieden:' : 'Veiling  Afgerond',
	}));

	return (
		<>
			<CssBaseline />
			<Container maxWidth="lg" sx={{ py: 3 }}>
				{ }
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					alignItems="center"
					sx={{ mb: 3 }}
				>
					<TextField
						placeholder="Zoek op..."
						size="small"
						fullWidth
						sx={{
							maxWidth: 420,
							'& .MuiOutlinedInput-root': { borderRadius: 20 },
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					<ToggleButtonGroup
						color="primary"
						exclusive
						size="small"
						value={sort}
						onChange={handleSort}
						sx={{
							'& .Mui-selected': {
								bgcolor: 'primary.main',
								color: 'primary.contrastText',
								'&:hover': { bgcolor: 'primary.dark' },
							},
						}}
					>
						<ToggleButton value="nieuw">Nieuw</ToggleButton>
						<ToggleButton value="up">Prijs Oplopend</ToggleButton>
						<ToggleButton value="down">Prijs aflopend</ToggleButton>
						<ToggleButton value="rating">Beoordeling</ToggleButton>
					</ToggleButtonGroup>
				</Stack>

				<Grid container spacing={3}>
					{ }
					<Grid size={{ xs: 12, md: 3 }}>
						<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
							<FormGroup sx={{ gap: 1 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={locations.aalsmeer}
											onChange={(e) =>
												setLocations((s) => ({ ...s, aalsmeer: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Van vestiging Aalsmeer"
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={locations.naaldwijk}
											onChange={(e) =>
												setLocations((s) => ({ ...s, naaldwijk: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Van vestiging Naaldwijk"
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={locations.venlo}
											onChange={(e) =>
												setLocations((s) => ({ ...s, venlo: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Van vestiging Venlo"
								/>
							</FormGroup>

							<Divider sx={{ my: 2 }} />

							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2">Prijs per pallet</Typography>
								<Typography variant="caption">${priceRange[0]}-{priceRange[1]}</Typography>
							</Stack>
							<Slider
								value={priceRange}
								onChange={handlePrice}
								valueLabelDisplay="off"
								min={0}
								max={100}
								sx={{ mt: 1 }}
							/>

							<Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
								Kleur
							</Typography>
							<FormGroup sx={{ gap: 0.5 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={colors.blauw}
											onChange={(e) =>
												setColors((s) => ({ ...s, blauw: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Blauw"
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={colors.rood}
											onChange={(e) =>
												setColors((s) => ({ ...s, rood: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Rood"
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={colors.roze}
											onChange={(e) =>
												setColors((s) => ({ ...s, roze: e.target.checked }))
											}
											size="small"
										/>
									}
									label="Roze"
								/>
							</FormGroup>
						</Paper>
					</Grid>

					{ }
					<Grid size={{ xs: 12, md: 9 }}>
						<Grid container spacing={3}>
							{products.map((p) => (
								<Grid size={{ xs: 12, sm: 6, lg: 4 }} key={p.id}>
									<Card variant="outlined" sx={{ borderRadius: 2 }}>
										<Box sx={{ position: 'relative', p: 2 }}>
											<Skeleton
												variant="rectangular"
												sx={{ bgcolor: 'grey.200', borderRadius: 1 }}
												height={180}
											/>
											<Box
												sx={{
													position: 'absolute',
													inset: 0,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													pointerEvents: 'none',
												}}
											>
												<ImageIcon sx={{ color: 'grey.400', fontSize: 64 }} />
											</Box>
										</Box>
										<CardContent sx={{ pt: 0 }}>
											<Typography variant="body2" gutterBottom>
												{p.title}
											</Typography>
											<Typography variant="subtitle1" fontWeight={700}>
												${p.price}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: 'block', mt: 1 }}
											>
												{p.footer}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					</Grid>
				</Grid>
			</Container>
		</>
	);
}