import Box from '@mui/material/Box';
import {Typography } from '@mui/material';
import TabelElement  from '../components/TabelElement';
export default function OrderScherm() {

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
				<TabelElement>

				</TabelElement>
			</Box>

		</div>
	)


}
