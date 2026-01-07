import { api } from '../client';
import { CreateAuctionDto, Auction } from '../../types/auction';
import { ApiResponse } from '../../types/api';

/**
 * Service for handling auction-related API calls.
 */
export const auctionService = {
	/** Creates a new auction. */
	createAuction: (data: CreateAuctionDto) => api.post<Auction>('/auctions', data),

	/** Retrieves all auctions. */
	getAllAuctions: () => api.get<Auction[]>('/auctions'),

	/** Retrieves auctions filtered by a specific auctioneer ID. */
	async getAuctionsByAuctioneer(id: number): Promise<ApiResponse<Auction[]>> {
		const res = await auctionService.getAllAuctions();
		return res.data ? { data: res.data.filter(a => a.auctioneer.id === id) } : res;
	},

	/** Updates an existing auction. */
	updateAuction: (id: number, data: Auction) => api.put<Auction>(`/auctions/${id}`, data),

	/** Deletes an auction. */
	deleteAuction: (id: number) => api.delete(`/auctions/${id}`),

	/** Starts an auction by ID. */
	startAuction: (id: number) => api.post<null>(`/auctions/${id}/start`),

	/** Pauses an auction by ID. */
	pauseAuction: (id: number) => api.post<null>(`/auctions/${id}/pause`),

	/** Ends an auction by ID. */
	endAuction: (id: number) => api.post<null>(`/auctions/${id}/end`),

	/** Moves to the next lot in an auction by ID. */
	nextLot: (id: number) => api.post<null>(`/auctions/${id}/next`),
};
