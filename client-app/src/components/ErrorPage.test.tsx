import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ErrorPage from './ErrorPage';

describe('ErrorPage Component', () => {
	// Helper to wrap component in Router (needed for NavLink)
	const renderWithRouter = (component: React.ReactNode) => {
		return render(
			<MemoryRouter>
				{component}
			</MemoryRouter>
		);
	};

	it('renders the correct message for 404 status code', () => {
		renderWithRouter(<ErrorPage statusCode={404} />);

		expect(screen.getByRole('heading', { level: 1, name: /Pagina niet gevonden/i })).toBeInTheDocument();
	});

	it('renders the correct message for 403 status code', () => {
		renderWithRouter(<ErrorPage statusCode={403} />);

		expect(screen.getByRole('heading', { level: 1, name: /Toegang geweigerd/i })).toBeInTheDocument();
	});

	it('renders a fallback message for unknown status codes', () => {
		renderWithRouter(<ErrorPage statusCode={500} />);

		expect(screen.getByRole('heading', { level: 1, name: /Er is een fout opgetreden/i })).toBeInTheDocument();
	});

	it('renders a link to the home page', () => {
		renderWithRouter(<ErrorPage statusCode={404} />);

		const link = screen.getByRole('link', { name: /Terug naar home/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/');
	});

	it('renders the correct image from http.garden based on status code', () => {
		const testCode = 418;
		renderWithRouter(<ErrorPage statusCode={testCode} />);

		const img = screen.getByRole('img');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', `https://http.garden/${testCode}.avif`);
		// Verify alt text contains the status code
		expect(img).toHaveAttribute('alt', expect.stringContaining(testCode.toString()));
	});
});