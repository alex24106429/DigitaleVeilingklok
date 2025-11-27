import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { AlertProvider } from './AlertProvider';
import React from 'react';
import { AlertContext } from './AlertProvider';


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
		const showAlertAndAssert = async (severity: 'error' | 'warning' | 'info' | 'success') => {
			const TestComponent = () => {
				const { showAlert } = React.useContext(AlertContext);
				return (
					<button onClick={() => showAlert({
						title: 'Test Alert',
						message: 'This is a test alert message.',
						severity,
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
			expect(screen.getByText(/test alert/i)).toBeInTheDocument();
			expect(screen.getByText(/this is a test alert message./i)).toBeInTheDocument();
		}
	});
});
