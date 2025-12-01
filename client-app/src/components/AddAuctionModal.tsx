import React, { useState } from 'react';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Alert
} from '@mui/material';
import { ClockLocation } from '../types/clockLocation';
import { CreateAuctionDto, Auction } from '../types/auction';
import { auctionService } from '../api/services/auctionService';
import { useAuth } from '../contexts/AuthContext';

export interface AddAuctionModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (auction: Auction) => void;
}
/**
 * Modal component for adding a new auction.
 * @param param0 The component props.
 * @returns JSX.Element
 */
export const AddAuctionModal: React.FC<AddAuctionModalProps> = ({ open, onClose, onSubmit }) => {
	const { user } = useAuth();
	const [description, setDescription] = useState('');
	const [startsAt, setStartsAt] = useState('');
	const [clockLocation, setClockLocation] = useState<ClockLocation>(ClockLocation.Naaldwijk);
	const [dateError, setDateError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!user) {
			console.error('Auctioneer not logged in.');
			return;
		}

		if (new Date(startsAt) <= new Date()) {
			setDateError('De startdatum en -tijd van de veiling moeten in de toekomst liggen.');
			return;
		} else {
			setDateError(null);
		}

		const newAuction: CreateAuctionDto = {
			description,
			startsAt,
			clockLocation,
			auctioneer: user,
		};

		const response = await auctionService.createAuction(newAuction);
		if (response.data) {
			onSubmit(response.data); // Pass the created auction back
		} else {
			console.error('Error creating auction:', response.error);
		}
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Veiling Toevoegen</DialogTitle>
			<DialogContent>
				<TextField
					margin="dense"
					id="description"
					label="Omschrijving"
					type="text"
					fullWidth
					variant="standard"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<TextField
					margin="dense"
					id="startsAt"
					label="Startdatum en tijd"
					type="datetime-local"
					fullWidth
					variant="standard"
					value={startsAt}
					onChange={(e) => setStartsAt(e.target.value)}
					InputLabelProps={{
						shrink: true,
					}}
					error={!!dateError}
					helperText={dateError}
				/>
				{dateError && <Alert severity="error" sx={{ mt: 1 }}>{dateError}</Alert>}
				<FormControl fullWidth margin="dense" variant="standard">
					<InputLabel id="clock-location-label">Locatie Veilingklok</InputLabel>
					<Select
						labelId="clock-location-label"
						id="clockLocation"
						value={clockLocation}
						onChange={(e) => setClockLocation(e.target.value as ClockLocation)}
						label="Locatie Veilingklok"
					>
						{Object.keys(ClockLocation)
							.filter(key => isNaN(Number(key)))
							.map((key) => (
								<MenuItem key={key} value={ClockLocation[key as keyof typeof ClockLocation]}>
									{key}
								</MenuItem>
							))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Annuleren</Button>
				<Button onClick={handleSubmit} disabled={!description || !startsAt || !!dateError}>Toevoegen</Button>
			</DialogActions>
		</Dialog>
	);
};