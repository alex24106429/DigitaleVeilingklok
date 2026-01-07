import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Purchase } from '../types/purchase';

interface PurchaseContextType {
	purchases: Purchase[];
	addPurchase: (purchase: Purchase) => void;
	updatePurchase: (updatedPurchase: Purchase) => void;
	getPurchasesByUser: (userId: string) => Purchase[];
	clearPurchases: () => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

interface PurchaseProviderProps {
	children: ReactNode;
}

/**
 * Provider component for purchase context
 */
export function PurchaseProvider({ children }: PurchaseProviderProps) {
	const [purchases, setPurchases] = useState<Purchase[]>([]);

	const addPurchase = (purchase: Purchase) => {
		setPurchases(prev => [...prev, purchase]);
	};

	const updatePurchase = (updatedPurchase: Purchase) => {
		setPurchases(prev =>
			prev.map(purchase =>
				purchase.id === updatedPurchase.id ? updatedPurchase : purchase
			)
		);
	};

	const getPurchasesByUser = (userId: string) => {
		return purchases.filter(purchase => purchase.userId === userId);
	};

	const clearPurchases = () => {
		setPurchases([]);
	};

	const value: PurchaseContextType = {
		purchases,
		addPurchase,
		updatePurchase,
		getPurchasesByUser,
		clearPurchases,
	};

	return (
		<PurchaseContext.Provider value={value}>
			{children}
		</PurchaseContext.Provider>
	);
}

/**
 * Hook to use purchase context
 */
export function usePurchase() {
	const context = useContext(PurchaseContext);
	if (context === undefined) {
		throw new Error('usePurchase must be used within a PurchaseProvider');
	}
	return context;
}
