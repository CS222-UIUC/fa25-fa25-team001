import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '../components/HomePage'

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)

    expect(screen.getByText(/Your Ultimate/i)).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<HomePage />)

    expect(screen.getByText(/Discover, review, and track movies/i)).toBeInTheDocument()
  })

  it('renders sign in and sign up buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Get Started Free')).toBeInTheDocument()
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0)
  })

  it('renders trending section', () => {
    render(<HomePage />)

    expect(screen.getByText('Trending Movies')).toBeInTheDocument()
  })
})