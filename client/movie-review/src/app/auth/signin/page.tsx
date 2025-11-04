'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
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
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-sky-700 font-medium">
              Welcome back! Enter your credentials to log into your account.
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
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 glass-strong
                             placeholder-sky-600/60 text-sky-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 
                             focus:border-cyan-300 sm:text-sm transition-all"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-white/30 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-sky-800 font-medium"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-cyan-600 hover:text-cyan-500 transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold 
                         rounded-2xl text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-cyan-400/50 transition-all shadow-lg hover:shadow-xl glow-soft
                         ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-sky-700 font-medium">
              Don't have an account?{' '}
              <a
                href="/auth/signup"
                className="font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
              >
                Create account here
              </a>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}