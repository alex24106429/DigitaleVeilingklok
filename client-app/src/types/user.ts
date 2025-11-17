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
	/** Indicates whether the user has enabled TOTP 2FA. */
	isTotpEnabled: boolean;
}
