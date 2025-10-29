import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Reviews from '../components/Reviews'

jest.mock('@/actions/media', () => ({
  getMyReviews: jest.fn(async () => ({
    reviews: [
      { id: '1', movieTitle: 'The Dark Knight', rating: 5, comment: 'An amazing superhero movie with incredible performances!', date: '2020-01-01' },
      { id: '2', movieTitle: 'Inception', rating: 4, comment: 'Mind-bending and visually stunning', date: '2020-01-02' },
    ],
  })),
  createReview: jest.fn(async ({ movieTitle, rating, comment }) => ({
    review: { id: 'new', movieTitle, rating, comment, date: '2024-01-01' },
  })),
}));

describe('Reviews', () => {
  it('renders the reviews heading', () => {
    render(<Reviews />)

    expect(screen.getByText('Movie Reviews')).toBeInTheDocument()
  })

  it('renders existing reviews', async () => {
    render(<Reviews />)

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument()
      expect(screen.getByText('Inception')).toBeInTheDocument()
      expect(screen.getByText('An amazing superhero movie with incredible performances!')).toBeInTheDocument()
    })
  })

  it('renders the review form', () => {
    render(<Reviews />)

    expect(screen.getByText('Write a Review')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter movie title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Write your review...')).toBeInTheDocument()
    expect(screen.getByText('Submit Review')).toBeInTheDocument()
  })

  it('allows adding a new review', async () => {
    render(<Reviews />)

    const movieTitleInput = screen.getByPlaceholderText('Enter movie title')
    const reviewTextarea = screen.getByPlaceholderText('Write your review...')
    const submitButton = screen.getByText('Submit Review')

    fireEvent.change(movieTitleInput, { target: { value: 'Test Movie' } })
    fireEvent.change(reviewTextarea, { target: { value: 'This is a test review' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
      expect(screen.getByText('This is a test review')).toBeInTheDocument()
    })
  })

  it('displays star ratings', async () => {
    render(<Reviews />)

    await waitFor(() => {
      expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeInTheDocument() // 5 stars for Dark Knight
      expect(screen.getByText('⭐⭐⭐⭐')).toBeInTheDocument() // 4 stars for Inception
    })
  })
})