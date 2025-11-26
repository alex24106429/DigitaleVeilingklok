import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import AlertDialog from './AlertDialog';

describe('AlertDialog Component', () => {
	const defaultProps = {
		open: true,
		title: 'Test Title',
		message: 'Test Message',
		onClose: vi.fn(),
	};

	const renderWithTheme = (component: React.ReactNode) => {
		return render(
			<ThemeProvider theme={theme}>
				{component}
			</ThemeProvider>
		);
	};

	it('renders the title and message when open is true', () => {
		renderWithTheme(<AlertDialog {...defaultProps} />);

		// Check if title exists
		expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument();

		// Check if message exists
		expect(screen.getByText(/test message/i)).toBeInTheDocument();

		// Check if button exists
		expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
	});

	it('does not render content when open is false', () => {
		renderWithTheme(<AlertDialog {...defaultProps} open={false} />);

		// queryBy returns null if not found (unlike getBy which throws error)
		expect(screen.queryByText(/test title/i)).not.toBeInTheDocument();
	});

	it('calls the onClose handler when the Ok button is clicked', () => {
		// Reset the spy before this test
		const onCloseMock = vi.fn();

		renderWithTheme(<AlertDialog {...defaultProps} onClose={onCloseMock} />);

		const button = screen.getByRole('button', { name: /ok/i });

		// Simulate user click
		fireEvent.click(button);

		// Verify the function was called once
		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});
});
