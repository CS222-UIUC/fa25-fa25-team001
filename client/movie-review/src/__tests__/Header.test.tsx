import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Header from '../components/Header'

// Mock next-auth
const mockSignOut = jest.fn()
const mockUseSession = jest.fn()

jest.mock('next-auth/react', () => ({
  signOut: (...args: any[]) => mockSignOut(...args),
  useSession: () => mockUseSession(),
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
  beforeEach(() => {
    mockSignOut.mockReset()
    mockUseSession.mockReset()
  })

  it('renders the MovieReview logo', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<Header />)

    expect(screen.getByText('MovieReview')).toBeInTheDocument()
  })

  it('shows sign in and sign up links when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<Header />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows profile and sign out when authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        image: '/test.jpg',
      },
      expires: '2024-12-31T23:59:59.999Z'
    }

    mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' })
    render(<Header />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })
})