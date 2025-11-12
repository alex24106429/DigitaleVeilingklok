import * as React from 'react';
import AlertDialog from './AlertDialog';

/**
 * Defines the options for displaying an alert.
 */
interface AlertOptions {
	/** The title of the alert dialog. */
	title: string;
	/** The main content message of the alert dialog. */
	message: string;
}

/**
 * Defines the shape of the context provided by AlertProvider.
 */
interface AlertContextType {
	/**
	 * Function to display an alert dialog.
	 * @param {AlertOptions} options - The title and message for the alert.
	 */
	showAlert: (options: AlertOptions) => void;
}

/**
 * React context for managing and displaying global alerts.
 * Provides a `showAlert` function to be used by child components.
 */
const AlertContext = React.createContext<AlertContextType>({
	showAlert: () => { throw new Error('useAlert must be used within an AlertProvider'); },
});

/**
 * Custom hook to access the alert context.
 * This provides a simple way to trigger alerts from any component
 * wrapped within an `AlertProvider`.
 * @returns {AlertContextType} The alert context value, containing the `showAlert` function.
 * @throws {Error} If used outside of an `AlertProvider`.
 */
export const useAlert = () => React.useContext(AlertContext);

/**
 * Provider component that makes the alert functionality available to its children.
 * It manages the state of the `AlertDialog` and renders it when `showAlert` is called.
 * @param {{ children: React.ReactNode }} props - The component props.
 * @param {React.ReactNode} props.children - The child components that will have access to the alert context.
 * @returns {JSX.Element} The provider component wrapping its children and the AlertDialog.
 */
export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
	const [alertState, setAlertState] = React.useState<AlertOptions & { open: boolean }>({
		open: false,
		title: '',
		message: '',
	});

	/**
	 * Shows the alert dialog with the given title and message.
	 * @param {AlertOptions} options - The content of the alert.
	 */
	const showAlert = ({ title, message }: AlertOptions) => {
		setAlertState({ open: true, title, message });
	};

	/**
	 * Closes the alert dialog.
	 */
	const handleClose = () => {
		setAlertState({ ...alertState, open: false });
	};

	// Memoize the context value to prevent unnecessary re-renders of consumers.
	const contextValue = React.useMemo(() => ({ showAlert }), []);

	return (
		<AlertContext.Provider value={contextValue}>
			{children}
			<AlertDialog
				open={alertState.open}
				title={alertState.title}
				message={alertState.message}
				onClose={handleClose}
			/>
		</AlertContext.Provider>
	);
};
