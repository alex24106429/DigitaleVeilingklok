import Box from '@mui/material/Box';
import { lightGreen } from '@mui/material/colors';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';

export function HomePage() {
	return (
		<div>
			<Box bgcolor={lightGreen[50]} width="100vw" padding={"50px"}>
				<Typography variant="h2" gutterBottom color={lightGreen[900]}>
					Welkom bij de Digitale Veilingklok
				</Typography>
				<Typography mb="20px">
					Welkom bij de Digitale Veilingklok
				</Typography>

				<Button variant="contained" color="primary" sx={{ mr: 1 }}>
					Inloggen
				</Button>

				<Button variant="outlined">
					Meer info
				</Button>

			</Box>
		</div>
	);
}

export default HomePage;