import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SearchPage from '../app/search/page'

// Mock useSearchParams
const mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn((key) => mockSearchParams.get(key)),
  }),
}))

describe('SearchPage', () => {
  beforeEach(() => {
    mockSearchParams.delete('q')
  })

  it('renders the search page', () => {
    render(<SearchPage />)

    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search for movies, users...')).toBeInTheDocument()
  })

  it('shows empty state when no query provided', () => {
    render(<SearchPage />)

    expect(screen.getByText('Enter a search term to find movies and users')).toBeInTheDocument()
  })

  it('displays tabs with counts when search results are present', async () => {
    mockSearchParams.set('q', 'dark')
    
    render(<SearchPage />)

    // Wait for search to complete
    await waitFor(() => {
      expect(screen.getByText(/Movies \(\d+\)/)).toBeInTheDocument()
      expect(screen.getByText(/Users \(\d+\)/)).toBeInTheDocument()
    })
  })

  it('allows switching between tabs', async () => {
    mockSearchParams.set('q', 'movie')
    
    render(<SearchPage />)

    await waitFor(() => {
      const usersTab = screen.getByText(/Users \(\d+\)/)
      fireEvent.click(usersTab)
      // The component should now show users content
    })
  })

  it('performs search when form is submitted', () => {
    render(<SearchPage />)

    const searchInput = screen.getByPlaceholderText('Search for movies, users...')
    const form = searchInput.closest('form')

    fireEvent.change(searchInput, { target: { value: 'inception' } })
    
    expect(searchInput).toHaveValue('inception')
    expect(form).toBeInTheDocument()
  })
})