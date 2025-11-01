import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function InfoPage() {
	return (
		<div>
			<Box bgcolor={"primary.100"} width="100vw" padding={"50px"}>
				<Typography variant="h2" component="h1" gutterBottom color={"secondary.700"}>
					Wat is PetalBid?
				</Typography>
				<Typography mb="20px">
					PetalBid is hét digitale platform voor de sierteelt. Met PetalBid bieden we één centrale plek aan waar kwekers en kopers hun commerciële en logistieke processen eenvoudig kunnen afhandelen.
					Daarnaast biedt PetalBid functionaliteiten voor dienstverleners (zoals handelsagenten en transporteurs) en biedt het koppelingen (API) voor softwareleveranciers.
				</Typography>

			</Box>
		</div>
	)
}