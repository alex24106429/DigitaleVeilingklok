import { CreateAuctionDto, Auction } from '../../types/auction';
import { ApiResponse } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';

const getAuthHeaders = (): HeadersInit => {
	const token = localStorage.getItem('token');
	if (!token) {
		throw new Error('No authentication token found.');
	}
	return {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	};
};

export const auctionService = {
	async createAuction(newAuction: CreateAuctionDto): Promise<ApiResponse<Auction>> {
		try {
			const response = await fetch(`${API_BASE_URL}/auctions`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(newAuction),
			});

			const data = await response.json();

			if (!response.ok) {
				return { error: data.message || 'Veiling aanmaken mislukt!' };
			}

			return { data };
		} catch (error) {
			console.error('Error creating auction:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het aanmaken van de veiling. Probeer het opnieuw.' };
		}
	},

	async getAuctionsByAuctioneer(auctioneerId: number): Promise<ApiResponse<Auction[]>> {
		try {
			// First, fetch all auctions
			const allAuctionsResponse = await this.getAllAuctions();

			if (allAuctionsResponse.error) {
				return { error: allAuctionsResponse.error };
			}

			// Filter auctions by the auctioneer's ID on the client-side
			const filteredAuctions = allAuctionsResponse.data?.filter(
				auction => auction.auctioneer.id === auctioneerId
			);

			return { data: filteredAuctions };
		} catch (error) {
			console.error('Error fetching and filtering auctioneer auctions:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het ophalen van de veilingen. Probeer het opnieuw.' };
		}
	},

	async getAllAuctions(): Promise<ApiResponse<Auction[]>> {
		try {
			const response = await fetch(`${API_BASE_URL}/auctions`, {
				method: 'GET',
				headers: getAuthHeaders(),
			});

			const data = await response.json();

			if (!response.ok) {
				return { error: data.message || 'Veilingen ophalen mislukt!' };
			}

			return { data };
		} catch (error) {
			console.error('Error fetching auctions:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het ophalen van de veilingen. Probeer het opnieuw.' };
		}
	},

	async startAuction(id: number): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${API_BASE_URL}/auctions/${id}/start`, {
				method: 'POST',
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.message || 'Veiling starten mislukt!' };
			}

			return { data: null, message: 'Veiling succesvol gestart.' };
		} catch (error) {
			console.error('Error starting auction:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het starten van de veiling. Probeer het opnieuw.' };
		}
	},

	async pauseAuction(id: number): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${API_BASE_URL}/auctions/${id}/pause`, {
				method: 'POST',
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.message || 'Veiling pauzeren mislukt!' };
			}

			return { data: null, message: 'Veiling succesvol gepauzeerd.' };
		} catch (error) {
			console.error('Error pausing auction:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het pauzeren van de veiling. Probeer het opnieuw.' };
		}
	},

	async endAuction(id: number): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${API_BASE_URL}/auctions/${id}/end`, {
				method: 'POST',
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.message || 'Veiling beëindigen mislukt!' };
			}

			return { data: null, message: 'Veiling succesvol beëindigd.' };
		} catch (error) {
			console.error('Error ending auction:', error);
			return { error: 'Er is een onverwachte fout opgetreden bij het beëindigen van de veiling. Probeer het opnieuw.' };
		}
	},
};