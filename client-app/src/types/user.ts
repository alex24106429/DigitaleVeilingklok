export enum UserRole {
	Buyer = 0,
	Auctioneer = 1,
	Supplier = 2
}

export interface User {
	id: number;
	fullName: string;
	email: string;
	role: UserRole;
}

export interface RegisterUserRequest {
	fullName: string;
	email: string;
	password: string;
	role: UserRole;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface ApiResponse<T> {
	data?: T;
	message?: string;
	error?: string;
}