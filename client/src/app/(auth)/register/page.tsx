'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'technician' | 'manager' | 'admin',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response.access_token) {
        auth.setToken(response.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <Image src="/logo.png" alt="GearGuard" width={120} height={120} className="w-32" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Create your account</h1>
          <p className="text-sm text-neutral-400">Join GearGuard today</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl">
          {error && (
            <div className="mb-6">
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              type="text"
              label="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />

            <Input
              id="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              disabled={isLoading}
              helperText="Must be at least 6 characters"
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />

            <Select
              id="role"
              label="User Type"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={[
                { value: 'user', label: 'User' },
                { value: 'technician', label: 'Technician' },
                { value: 'manager', label: 'Manager' },
                { value: 'admin', label: 'Administrator' },
              ]}
              required
              disabled={isLoading}
              helperText="Select the type of user you are registering as"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-500">Already have an account? </span>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
