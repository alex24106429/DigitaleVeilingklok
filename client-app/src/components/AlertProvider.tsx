import * as React from 'react';
import AlertDialog from './AlertDialog';

interface AlertOptions {
	title: string;
	message: string;
}

interface AlertContextType {
	showAlert: (options: AlertOptions) => void;
}

const AlertContext = React.createContext<AlertContextType>({
	showAlert: () => { throw new Error('useAlert must be used within an AlertProvider'); },
});

export const useAlert = () => React.useContext(AlertContext);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
	const [alertState, setAlertState] = React.useState<AlertOptions & { open: boolean }>({
		open: false,
		title: '',
		message: '',
	});

	const showAlert = ({ title, message }: AlertOptions) => {
		setAlertState({ open: true, title, message });
	};

	const handleClose = () => {
		setAlertState({ ...alertState, open: false });
	};

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
