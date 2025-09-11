import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';

export function HomePage() {
	return (
		<div>
			<Box bgcolor={"primary.100"} width="100vw" padding={"50px"}>
				<Typography variant="h2" gutterBottom color={"secondary.700"}>
					Welkom bij PetalBid
				</Typography>
				<Typography mb="20px">
					Handel al je commerciële processen eenvoudig af op één plek. PetalBid, het wereldwijde platform voor de sierteeltsector!
				</Typography>

				<Button variant="contained" color="primary" sx={{ mr: 1 }}>
					Inloggen
				</Button>

				<Button variant="outlined" color="secondary">
					Meer info
				</Button>

			</Box>
		</div>
	);
}

export default HomePage;