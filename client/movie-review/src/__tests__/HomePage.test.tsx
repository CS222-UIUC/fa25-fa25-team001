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

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)

    expect(screen.getByText('Movie Reviews')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<HomePage />)

    expect(screen.getByText('Discover and share your thoughts on the latest films')).toBeInTheDocument()
  })

  it('renders sign in and sign up buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Create an Account')).toBeInTheDocument()
  })

  it('renders trending section', () => {
    render(<HomePage />)

    expect(screen.getByText('Trending')).toBeInTheDocument()
  })
})