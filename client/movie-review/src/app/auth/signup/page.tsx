'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { email, username, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

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
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/auth/signin?message=Account created successfully');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300 px-4 sm:px-6 lg:px-8 pt-5">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-sky-700 font-medium">
              Join our community to review and discover movies and connect with other users.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <p className="text-rose-600 text-center text-sm font-medium bg-rose-100/50 backdrop-blur-sm rounded-xl py-2">
                {error}
              </p>
            )}

            <div className="rounded-xl space-y-3">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none relative block w-full px-4 py-3 glass-strong
                             placeholder-sky-600/60 text-sky-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 
                             focus:border-cyan-300 sm:text-sm transition-all"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 glass-strong
                             placeholder-sky-600/60 text-sky-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 
                             focus:border-cyan-300 sm:text-sm transition-all"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 glass-strong
                             placeholder-sky-600/60 text-sky-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 
                             focus:border-cyan-300 sm:text-sm transition-all"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 glass-strong
                             placeholder-sky-600/60 text-sky-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 
                             focus:border-cyan-300 sm:text-sm transition-all"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm 
                           font-semibold rounded-2xl text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 focus:outline-none 
                           focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/50 transition-all shadow-lg hover:shadow-xl glow-soft
                           ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-sky-700 font-medium">
                Already have an account?{' '}
                <a
                  href="/auth/signin"
                  className="font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}