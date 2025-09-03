import Button from '@mui/material/Button';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { Typography } from '@mui/material';

export function HomePage() {
	return (
		<div className="App">
			<header className="App-header">
				{/* Gebruik een Typography component voor tekst */}
				<Typography variant="h3" component="h1" gutterBottom>
					Welkom bij de Digitale Veilingklok
				</Typography>

				{/* Gebruik de Button component */}
				<Button variant="contained" color="primary">
					Dit is een Material UI knop
				</Button>

				<br />

				<Button
					variant="outlined"
					color="secondary"
					startIcon={<AccessAlarmIcon />}
				>
					Knop met Icoon
				</Button>

			</header>
		</div>
	);
}

export default HomePage;