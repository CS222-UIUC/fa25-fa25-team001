import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the file upload functionality
const mockFileUpload = jest.fn()

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock server actions used by Profile page
jest.mock('@/actions/user', () => ({
  getUserProfile: jest.fn(async () => ({
    success: true,
    user: { id: '1', username: 'Test User', email: 'test@example.com', profilePicture: '/test.jpg' },
  })),
  updateUserProfile: jest.fn(async (data) => ({ success: true, user: { id: '1', username: data.username, email: data.email, profilePicture: data.profilePicture } })),
}));
jest.mock('@/actions/upload', () => ({
  uploadProfilePicture: jest.fn(async (file) => ({ success: true, url: '/uploads/profiles/test.jpg' })),
}));

describe('Profile Picture Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockUseSession = require('next-auth/react').useSession
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          image: '/test.jpg',
        },
      },
      status: 'authenticated',
    })
  })

  it('accepts only jpg, png, and svg files', async () => {
    const ProfilePage = require('../app/user/profile/page').default
    render(<ProfilePage />)

    // Click edit to show file input
    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(fileInput).toHaveAttribute('accept', '.jpg,.jpeg,.png,.svg')
  })

  it('validates file size limit of 1MB', async () => {
    // Mock alert
    global.alert = jest.fn()

    const ProfilePage = require('../app/user/profile/page').default
    render(<ProfilePage />)

    // Click edit to show file input
    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    // Create a mock file larger than 1MB
    const largefile = new File(['x'.repeat(1024 * 1024 + 1)], 'large.jpg', {
      type: 'image/jpeg',
    })

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [largefile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('File size must be less than 1MB.')
      })
    }
  })

  it('validates file type restrictions', async () => {
    global.alert = jest.fn()

    const ProfilePage = require('../app/user/profile/page').default
    render(<ProfilePage />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    // Create a mock file with invalid type
    const invalidFile = new File(['content'], 'test.txt', {
      type: 'text/plain',
    })

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please select a JPG, PNG, or SVG file.')
      })
    }
  })

  it('accepts valid image files', async () => {
    const ProfilePage = require('../app/user/profile/page').default
    render(<ProfilePage />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    // Create a valid image file
    const validFile = new File(['image content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:test-url')

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument()
      })
    }
  })

  it('shows file type and size restrictions', () => {
    const ProfilePage = require('../app/user/profile/page').default
    render(<ProfilePage />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    expect(screen.getByText('JPG, PNG, or SVG. Max 1MB.')).toBeInTheDocument()
  })
})