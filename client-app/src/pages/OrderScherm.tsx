import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import TabelElement, { HeadCell } from '../components/TableComponent';

export default function OrderScherm() {
	interface BloemData {
		id: number;
		name: string;
		prijs: number;
		fusten: number;
		aantalf: number;
		datum: number;
	}

	const HeadCells: HeadCell<BloemData>[] = [
		{ id: 'name', numeric: false, disablePadding: true, label: 'Soort bloem' },
		{ id: 'prijs', numeric: true, label: 'Prijs (in Euro)' },
		{ id: 'fusten', numeric: true, label: 'Fusten (aantal)' },
		{ id: 'aantalf', numeric: true, label: 'Fusten geselecteerd' },
		{ id: 'datum', numeric: true, label: 'Datum' },
	];

	const Rows: BloemData[] = [
		{ id: 1, name: 'Theehybriden', prijs: 1.5, fusten: 100, aantalf: 70, datum: 30 },
		{ id: 2, name: 'Floribunda', prijs: 1.2, fusten: 100, aantalf: 67, datum: 30 },
	];
	return (
		<div>
			<Box>
				<Typography
					variant="h3"
					component="h1"
					align="center"
					sx={{ fontWeight: '600', mb: 5 }}
				>
					Maak een order aan
				</Typography>
				<TabelElement
					rows={Rows}
					headCells={HeadCells}
					idKey="id"
					tableName="Order Toevoegen"
				>
				</TabelElement>
			</Box>
		</div>
	)
}
