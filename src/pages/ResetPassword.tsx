import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if user is authenticated (session exists)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Session missing. Please use the reset link from your email.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message || 'Failed to reset password.');
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setLoading(false);
    navigate('/auth', { state: { message: 'Password reset successful. Please log in with your new password.' } });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <span className="text-2xl font-bold text-[#233A6A] mt-2">Reset Your Password</span>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <Button type="button" variant="link" className="w-full" onClick={() => navigate('/auth')}>
            Back to Login
          </Button>
        </form>
      </Card>
    </div>
  );
} 