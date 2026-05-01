'use client';

import { useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { APIError } from '@/src/app/lib/api';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface TouchedFields {
  name: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  role: boolean;
}

// Extract validation logic for reusability
const validateField = (field: keyof FormData, value: string, formData?: FormData): string => {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters long';
      return '';
    
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
      return '';
    
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    
    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (formData && value !== formData.password) return 'Passwords do not match';
      return '';
    
    default:
      return '';
  }
};

const validateForm = (formData: FormData): string[] => {
  const errors: string[] = [];

  if (!formData.name.trim()) errors.push('Name is required');
  if (!formData.email.trim()) errors.push('Email is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Please enter a valid email address');
  if (!formData.password) errors.push('Password is required');
  if (formData.password.length < 6) errors.push('Password must be at least 6 characters long');
  if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');

  return errors;
};

// Create a wrapper component that uses searchParams
function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    role: false
  });
  
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Memoized field error getter
  const getFieldError = useCallback((field: keyof FormData): string => {
    if (!touched[field]) return '';
    return validateField(field, formData[field], formData);
  }, [formData, touched]);

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    return validateForm(formData).length === 0;
  }, [formData]);

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    const allTouched = Object.keys(touched).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {} as TouchedFields);
    setTouched(allTouched);

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      
      // Focus the first invalid field
      const firstInvalidField = Object.keys(formData).find(field => 
        validateField(field as keyof FormData, formData[field as keyof FormData], formData)
      );
      if (firstInvalidField) {
        const element = document.getElementById(firstInvalidField);
        element?.focus();
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      router.push(redirectTo);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      if (err instanceof APIError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation for password match
  const passwordMatchError = formData.password && formData.confirmPassword && 
                            formData.password !== formData.confirmPassword && 
                            touched.confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 space-y-8 border border-zinc-200 dark:border-zinc-700">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Or{' '}
              <Link
                href={`/login${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          {/* Server Error Alert */}
          {error && !validateForm(formData).includes(error) && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`block w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                    getFieldError('name') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your full name"
                />
                {getFieldError('name') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('name')}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`block w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                    getFieldError('email') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('email')}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`block w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                    getFieldError('password') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                {getFieldError('password') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('password')}</p>
                )}
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Must be at least 6 characters long
                </p>
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Account Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`block w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                    passwordMatchError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Confirm your password"
                />
                {passwordMatchError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function Register() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="animate-pulse bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 w-full max-w-md space-y-8 border border-zinc-200 dark:border-zinc-700">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}