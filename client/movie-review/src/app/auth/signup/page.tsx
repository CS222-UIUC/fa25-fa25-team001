'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Film, Loader2 } from 'lucide-react'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?message=Account created successfully')
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/c38a2d52-138e-48a3-ab68-36787ece46b3/eeb03fc9-99c6-438e-824d-32917ce55783/US-en-20240101-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center opacity-20 blur-sm scale-105"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Film className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tighter">MovieReview</span>
        </Link>
      </div>

      <div className="w-full max-w-md p-8 bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account</h2>
          <p className="text-muted-foreground">Join our community of movie enthusiasts</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                placeholder="Password (min. 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/25"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
