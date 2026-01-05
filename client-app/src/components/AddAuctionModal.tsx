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
import { useAlert } from './AlertProvider';

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
	const { showAlert } = useAlert();
	const [description, setDescription] = useState('');
	const [startsAt, setStartsAt] = useState('');
	const [clockLocation, setClockLocation] = useState<ClockLocation>(ClockLocation.Naaldwijk);
	const [dateError, setDateError] = useState<string | null>(null);

	const validateStartDate = (dateString: string) => {
		if (new Date(dateString) <= new Date()) {
			setDateError('De startdatum en -tijd van de veiling moeten in de toekomst liggen.');
			return false;
		}
		setDateError(null);
		return true;
	};

	const handleSubmit = async () => {
		if (!user) {
			showAlert({
				title: 'Fout',
				message: 'Veilingmeester niet ingelogd.',
				severity: 'error'
			});
			return;
		}

		if (!validateStartDate(startsAt)) {
			return;
		}

		const newAuction: CreateAuctionDto = {
			description,
			startsAt,
			clockLocation,
			auctioneer: user,
		};

		const response = await auctionService.createAuction(newAuction);
		if (response.data) {
			showAlert({
				title: 'Succes',
				message: 'Veiling succesvol aangemaakt.',
				severity: 'success'
			});
			onSubmit(response.data); // Pass the created auction back
			onClose();
		} else {
			showAlert({
				title: 'Fout',
				message: response.error || 'Er is een fout opgetreden bij het aanmaken van de veiling.',
				severity: 'error'
			});
		}
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
					onChange={(e) => {
						setStartsAt(e.target.value);
						validateStartDate(e.target.value);
					}}
					InputLabelProps={{
						shrink: true,
					}}
					inputProps={{
						// Prevent selecting past dates/times (local timezone)
						min: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
					}}
					error={!!dateError}
					helperText={dateError}
				/>
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
