import Box from '@mui/material/Box';
import { Button, Typography, Grid } from '@mui/material';
import { Add, FormatListBulleted, Mail, Schedule, Visibility } from '@mui/icons-material';

const primaryColor = '#5A3973';

const buttonSx = {
	color: primaryColor,
	borderColor: primaryColor,
	borderRadius: '12px',
	textTransform: 'none',
	justifyContent: 'flex-start',
	padding: '12px 24px',
	fontWeight: 600,
	fontSize: '1rem',
	'&:hover': {
		borderColor: primaryColor,
		backgroundColor: 'rgba(90, 57, 115, 0.04)',
	},
};

const dashboardActions = [
	{ text: 'Bekijk verkooporders', icon: <Visibility /> },
	{ text: 'Order aanmaken', icon: <Add /> },
	{ text: 'Naar klokverkoop', icon: <Schedule /> },
	{ text: 'Veilbrief aanmaken', icon: <Mail /> },
	{ text: 'Catalogus', icon: <FormatListBulleted /> },
];

export function GrowerDashboard() {
	return (
		<div>
			<Box maxWidth="sm" margin="auto" mt={5} p={3}>
				<Typography
					variant="h3"
					component="h1"
					align="center"
					sx={{ fontWeight: '600', mb: 5 }}
				>
					Leverancier dashboard
				</Typography>
				<Grid container spacing={2.5}>
					{dashboardActions.map((action, index) => (
						<Grid size={{ xs: 12, sm: 6 }} key={index}>
							<Button
								fullWidth
								variant="outlined"
								startIcon={action.icon}
								sx={buttonSx}
							>
								{action.text}
							</Button>
						</Grid>
					))}
				</Grid>
			</Box>
		</div>
	);
}

export default GrowerDashboard;