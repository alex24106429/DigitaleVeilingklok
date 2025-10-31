import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface AlertDialogProps {
	open: boolean;
	title: string;
	message: string;
	onClose: () => void;
}

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
