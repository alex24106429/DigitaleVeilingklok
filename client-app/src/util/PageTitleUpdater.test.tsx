import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Link, Routes, Route } from 'react-router-dom';
import { PageTitleUpdater } from './PageTitleUpdater';

describe('PageTitleUpdater', () => {
	const mockTitleMap = {
		'/': 'Home',
		'/login': 'Login Page',
		'/about': 'About Us'
	};

	beforeEach(() => {
		// Reset document title before each test
		document.title = 'Original Title';
	});

	it('sets the title correctly for a known route', () => {
		render(
			<MemoryRouter initialEntries={['/login']}>
				<PageTitleUpdater titleMap={mockTitleMap} />
			</MemoryRouter>
		);

		expect(document.title).toBe('Login Page | PetalBid');
	});

	it('sets the default title for an unknown route', () => {
		render(
			<MemoryRouter initialEntries={['/unknown-page']}>
				<PageTitleUpdater titleMap={mockTitleMap} />
			</MemoryRouter>
		);

		expect(document.title).toBe('PetalBid');
	});

	it('updates the title dynamically when the user navigates', () => {
		render(
			<MemoryRouter initialEntries={['/']}>
				<PageTitleUpdater titleMap={mockTitleMap} />
				<Routes>
					<Route path="/" element={<Link to="/about">Go to About</Link>} />
					<Route path="/about" element={<div>About Page</div>} />
				</Routes>
			</MemoryRouter>
		);

		// Check initial title at root '/'
		expect(document.title).toBe('Home | PetalBid');

		// Click link to navigate to '/about'
		fireEvent.click(screen.getByText('Go to About'));

		// Check updated title
		expect(document.title).toBe('About Us | PetalBid');
	});
});