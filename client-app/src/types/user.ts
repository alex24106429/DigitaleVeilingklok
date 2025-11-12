/**
 * Defines the roles a user can have within the application.
 */
export enum UserRole {
	/** A user who can participate in auctions to buy products. */
	Buyer = 0,
	/** A user responsible for managing and running auctions. */
	Auctioneer = 1,
	/** A user who supplies products for auction. */
	Supplier = 2,
	/** A user with administrative privileges over the system. */
	Admin = 3
}

/**
 * Represents a user object in the system.
 */
export interface User {
	/** The unique identifier for the user. */
	id: number;
	/** The full name of the user. */
	fullName: string;
	/** The user's email address, used for login and communication. */
	email: string;
	/** The role assigned to the user, determining their permissions. */
	role: UserRole;
}

/**
 * Defines the shape of the data required to register a new user.
 */
export interface RegisterUserRequest {
	/** The full name of the new user. */
	fullName: string;
	/** The email address for the new user. */
	email: string;
	/** The password for the new user's account. */
	password: string;
	/** The role to be assigned to the new user. */
	role: UserRole;
}

/**
 * Defines the shape of the credentials required for a user to log in.
 */
export interface LoginRequest {
	/** The user's email address. */
	email: string;
	/** The user's password. */
	password: string;
}

/**
 * Defines the shape of the data returned upon a successful login.
 */
export interface LoginResponse {
	/** The authentication token (JWT) for the user's session. */
	token: string;
	/** The authenticated user's data. */
	user: User;
}

/**
 * A generic wrapper for API responses.
 * It provides a standardized structure for both successful and failed requests.
 * @template T The type of the data expected in a successful response.
 */
export interface ApiResponse<T> {
	/** The data payload of a successful response. Undefined on error. */
	data?: T;
	/** An optional informational message from the server. */
	message?: string;
	/** An error message if the request failed. Undefined on success. */
	error?: string;
}