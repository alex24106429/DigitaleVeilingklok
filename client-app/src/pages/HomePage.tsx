import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import { use } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
	const {user} = useAuth();
	return (
		<div>
			<Box bgcolor={"primary.100"} width="100vw" padding={"50px"}>
				<Typography variant="h2" component="h1" gutterBottom color={"secondary.700"}>
					Welkom bij PetalBid
				</Typography>
				<Typography mb="20px">
					Handel al je commerciële processen eenvoudig af op één plek. PetalBid, het wereldwijde platform voor de sierteeltsector!
				</Typography>
				{!user && (
				<a href="/login" style={{ textDecoration: 'none' }}>
				<Button variant="contained" color="primary" sx={{ mr: 1 }}>
					Inloggen	
				</Button>
				</a>
				)}
				<Button variant="outlined" color="secondary">
					Meer info
				</Button>

			</Box>
		</div>
	);
}

export default HomePage;