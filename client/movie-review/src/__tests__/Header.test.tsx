import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Header from '../components/Header'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

// Mock search server action
jest.mock('@/actions/search', () => ({
  searchEverything: jest.fn(async () => ({ users: [], movies: [] })),
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Header', () => {
  it('renders the MovieReview logo', () => {
    const mockUseSession = require('next-auth/react').useSession
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    expect(screen.getByText('MovieReview')).toBeInTheDocument()
  })

  it('shows sign in and sign up links when not authenticated', () => {
    const mockUseSession = require('next-auth/react').useSession
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows dashboard and sign out when authenticated', () => {
    const mockUseSession = require('next-auth/react').useSession
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: '/test.jpg',
        },
      },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })
})