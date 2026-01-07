import React from 'react';
import '@testing-library/jest-dom';
import theme from '../theme';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { AlertProvider, AlertContext } from './AlertProvider';

describe('AlertProvider Component', () => {
	const renderWithTheme = (component: React.ReactNode) => {
		return render(
			<ThemeProvider theme={theme}>
				{component}
			</ThemeProvider>
		);
	};

	it('renders children correctly', () => {
		const ChildComponent = () => <div>Child Component</div>;

		renderWithTheme(<AlertProvider><ChildComponent /></AlertProvider>);

		expect(screen.getByText(/child component/i)).toBeInTheDocument();
	});

	it('shows alert when showAlert is called', async () => {
		const TestComponent = () => {
			const { showAlert } = React.useContext(AlertContext);
			return (
				<button onClick={() => showAlert({
					title: 'Test Alert',
					message: 'This is a test alert message.',
					severity: "error",
				})}>
					Show Alert
				</button>
			);
		};

		renderWithTheme(
			<AlertProvider>
				<TestComponent />
			</AlertProvider>
		);
		await fireEvent.click(screen.getByText(/show alert/i));
		// Use getAllByText because MUI Alert might render the text in a couple of places (content and title container), or verify presence
		expect(screen.getAllByText(/test alert/i)[0]).toBeInTheDocument();
		expect(screen.getByText(/this is a test alert message./i)).toBeInTheDocument();
	});
});
