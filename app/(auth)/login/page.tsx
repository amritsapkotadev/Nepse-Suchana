'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        login(json.token, json.user);
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error(json.error || 'Login failed');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 mb-4">
            <span className="text-3xl">📈</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to access your portfolio
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" 
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" 
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition shadow-lg hover:shadow-xl disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
