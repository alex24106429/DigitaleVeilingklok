import * as React from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
/**
 * Defines the options for displaying an alert.
 */
interface AlertOptions {
	/** The title of the alert dialog. */
	title: string;
	/** The main content message of the alert dialog. */
	message: string;
	/** The severity level of the alert. */
	severity?: 'error' | 'warning' | 'info' | 'success';
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
	clearAlert?: () => void;
	alert?: AlertOptions & { open: boolean };
}

/**
 * React context for managing and displaying global alerts.
 * Provides a `showAlert` function to be used by child components.
 */
export const AlertContext = React.createContext<AlertContextType>({
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
	const showAlert = ({ title, message, severity }: AlertOptions) => {
		setAlertState({ open: true, title, message, severity });
	};

	/**
	 * Closes the alert dialog.
	 */
	const handleClose = () => {
		setAlertState({ ...alertState, open: false });
	};

	const clearAlert = () => {
		setAlertState({ open: false, title: '', message: '' });
	};

	// Memoize the context value to prevent unnecessary re-renders of consumers.
	const contextValue = React.useMemo(() => ({ showAlert, clearAlert, alert: alertState }), [alertState]);

	return (
		<AlertContext.Provider value={contextValue}>
			{children}
			<AlertDialog
				open={alertState.open}
				title={alertState.title}
				message={alertState.message}
				severity={alertState.severity}
				onClose={handleClose}
			/>
		</AlertContext.Provider>
	);
}

/**
 * A simple AlertDialog implemented using MUI Snackbar + Alert.
 */
function AlertDialog({ open, title, message, onClose, severity = 'error' }: {
	open: boolean;
	title: string;
	message: string;
	onClose: () => void;
	severity?: 'error' | 'warning' | 'info' | 'success';
}) {
	return (
		<Snackbar open={open} autoHideDuration={6000} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
			<Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
				{title && <AlertTitle>{title}</AlertTitle>}
				{message}
			</Alert>
		</Snackbar>
	);
}

	/**
 * AlertSlot renders the current provider alert inline in the document flow.
 * Place <AlertSlot /> under a form or in a layout to show alerts triggered via useAlert().
 */
export function AlertSlot() {
    const ctx = React.useContext(AlertContext);
    if (!ctx) return null;
    const { alert, clearAlert } = ctx;
    if (!alert || !alert.open) return null;

    return (
        <Box mt={2}>
            <Alert severity={alert.severity ?? 'error'} onClose={clearAlert}>
                {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
                {alert.message}
            </Alert>
        </Box>
    );
};

