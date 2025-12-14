import '@testing-library/jest-dom'

// Minimal App Router mocks for Next.js client components in tests
const router = {
	push: jest.fn(),
	replace: jest.fn(),
	back: jest.fn(),
	forward: jest.fn(),
	refresh: jest.fn(),
	prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
	useRouter: () => router,
	usePathname: () => '/',
	useSearchParams: () => new URLSearchParams(),
}));

// Provide fetch in jsdom tests
global.fetch = jest.fn(async () => ({
	ok: true,
	status: 200,
	json: async () => ({ data: { movies: [], tvShows: [], games: [] } }),
}));