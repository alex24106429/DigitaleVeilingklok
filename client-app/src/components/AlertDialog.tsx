import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

/**
 * Props for the AlertDialog component.
 */
interface AlertDialogProps {
	/** If `true`, the dialog is open. */
	open: boolean;
	/** The title of the dialog. */
	title: string;
	/** The main content message of the dialog. */
	message: string;
	/** The function to call when the dialog requests to be closed. */
	onClose: () => void;
}

/**
 * A reusable alert dialog component.
 * It displays a title, a message, and a single "Ok" button to close it.
 *
 * @param {AlertDialogProps} props The props for the AlertDialog component.
 * @returns {JSX.Element} The rendered alert dialog.
 */
export default function AlertDialog({ open, title, message, onClose }: AlertDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{title}</DialogTitle>
			<DialogContent>
				<DialogContentText id="alert-dialog-description">
					{message}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				{/* eslint-disable-next-line jsx-a11y/no-autofocus */}
				<Button variant="contained" onClick={onClose} autoFocus>
					Ok
				</Button>
			</DialogActions>
		</Dialog>
	);
}
