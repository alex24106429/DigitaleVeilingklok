import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import DocumentRenderer from './DocumentRenderer';

describe('DocumentRenderer Component', () => {
	const renderWithTheme = (component: React.ReactNode) => {
		return render(
			<ThemeProvider theme={theme}>
				{component}
			</ThemeProvider>
		);
	};

	it('renders plain markdown content', () => {
		renderWithTheme(<DocumentRenderer content={'Hello world'} />);

		expect(screen.getByText(/hello world/i)).toBeInTheDocument();
	});

	it('renders heading markdown as a heading element', () => {
		renderWithTheme(<DocumentRenderer content={'# Test Heading'} />);

		// react-markdown renders headings as semantic heading elements
		expect(screen.getByRole('heading', { name: /test heading/i })).toBeInTheDocument();
	});

	it('renders links from markdown', () => {
		renderWithTheme(<DocumentRenderer content={'[Link](https://example.com)'} />);

		const link = screen.getByRole('link', { name: /link/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href');
		expect((link as HTMLAnchorElement).href).toContain('example.com');
	});

	it('renders nothing for empty content', () => {
		renderWithTheme(<DocumentRenderer content={''} />);

		// There should be no visible text content
		expect(screen.queryByText(/./)).toBeNull();
	});
});
