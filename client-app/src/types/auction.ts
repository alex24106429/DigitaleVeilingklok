import { ClockLocation } from './clockLocation';
import { User } from './user';

export enum AuctionStatus {
	Pending = 0,
	Active = 1,
	Paused = 2,
	Ended = 3,
}

export interface CreateAuctionDto {
	description: string;
	startsAt: string; // ISO 8601 string
	clockLocation: ClockLocation;
	auctioneer: User;
}

export interface Auction {
	id: number;
	description: string;
	startsAt: string; // ISO 8601 string
	quantity: number;
	reservePrice: number;
	clockLocation: ClockLocation;
	status: AuctionStatus; // Add auction status
	auctioneer: User;
}