import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { User } from '../../types/user';

export default function Account() {
	const [token, setToken] = useState("");
	const [id, setId] = useState(0);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState(0);

	useEffect(() => {
		try {
			const userString = localStorage.getItem('user');
			const token = localStorage.getItem('token') as string;
			if (userString) {
				const user: User = JSON.parse(userString);
				// eslint-disable-next-line react-hooks/set-state-in-effect
				setToken(token);
				setId(user.id);
				setFullName(user.fullName);
				setEmail(user.email);
				setRole(user.role);
			}
		} catch (error) {
			console.error("Failed to parse user from localStorage", error);
		}
	}, []);

	const handleSubmit = () => {
		localStorage.setItem("token", token);
		localStorage.user = JSON.stringify({ id, fullName, email, role });
	}

	return (
		<div>
			<Box component="form" onSubmit={handleSubmit} maxWidth="sm" margin="auto" mt="30px" padding="20px">
				<Typography>
					Veranderd hier de opgeslagen gegevens in je browser om de frontend te testen.<br />
					<b>Dit veranderd nog niet de gegevens in de backend of database.</b>
				</Typography>
				<Typography>
					Hier komt later:<br />
					Mogelijkheid om wachtwoord te wijzigen en contact- of bedrijfsgegevens aan te passen.
				</Typography>

				<TextField
					label="token"
					type="text"
					margin="normal"
					fullWidth
					required
					value={token}
					onChange={(e) => setToken(e.target.value)}
				/>

				<TextField
					label="id"
					type="number"
					margin="normal"
					fullWidth
					required
					value={id}
					onChange={(e) => setId(parseInt(e.target.value))}
				/>

				<TextField
					label="fullName"
					type="text"
					margin="normal"
					fullWidth
					required
					value={fullName}
					onChange={(e) => setFullName(e.target.value)}
				/>

				<TextField
					label="email"
					type="email"
					margin="normal"
					fullWidth
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				<TextField
					label="role"
					type="number"
					margin="normal"
					fullWidth
					required
					value={role}
					onChange={(e) => setRole(parseInt(e.target.value))}
					slotProps={{ htmlInput: { min: 0, max: 3 } }}
				/>

				<Typography>
					0: Koper<br />
					1: Veilingmeester<br />
					2: Leverancier<br />
					3: Administrator<br />
				</Typography>

				<Button
					type="submit"
					variant="contained"
					color="primary"
					size="large"
					fullWidth
				>
					Opslaan
				</Button>
			</Box>
		</div>
	);
}

