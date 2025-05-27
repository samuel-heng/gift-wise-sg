import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { userProfileService } from '@/lib/db';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const navigate = useNavigate();

  // Hide header and bottom nav when on Auth page
  useEffect(() => {
    const header = document.querySelector('header') as HTMLElement | null;
    const nav = document.querySelector('nav') as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;
    const bottomNav = document.querySelector('.bottom-nav') as HTMLElement | null;
    const pageBottomBar = document.querySelector('.page-bottom-bar') as HTMLElement | null;
    if (header) header.style.display = 'none';
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (pageBottomBar) pageBottomBar.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
      if (pageBottomBar) pageBottomBar.style.display = '';
    };
  }, []);

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (type === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "https://giftwisesg.com/auth"
          }
        });
        if (result.error) {
          setError(result.error.message);
        } else if (result.data?.user) {
          // Create user profile in backend
          const apiUrl = import.meta.env.VITE_API_URL || "";
          await import('axios').then(({ default: axios }) =>
            axios.post(`${apiUrl}/api/user-profile`, {
              id: result.data.user.id,
              name: username,
              email: email
            })
          );
          setSignupSuccess(true);
        } else {
          setError('');
        }
      }
      if (type === 'login' && result.data?.user) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setResetting(true);
    setResetMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setResetting(false);
    if (error) {
      setResetMessage(error.message || 'Failed to send reset email');
    } else {
      setResetMessage('Password reset email sent. Please check your inbox.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <span className="text-2xl font-bold text-[#233A6A] mt-2">Welcome to GiftWise!</span>
        </div>
        {signupSuccess && (
          <div className="mb-4 text-green-700 text-center font-medium">
            Check your email for a confirmation link before logging in.
          </div>
        )}
        <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')} className="w-full">
          <TabsList className="w-full flex mb-6">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            {showForgotPassword ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
                className="space-y-4"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  autoFocus
                />
                {resetMessage && <div className={resetMessage.includes('sent') ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{resetMessage}</div>}
                <Button type="submit" className="w-full" disabled={resetting || !resetEmail}>
                  {resetting ? 'Sending...' : 'Send Reset Email'}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={() => { setShowForgotPassword(false); setResetMessage(null); }}>
                  Back to Login
                </Button>
              </form>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAuth('login');
                }}
                className="space-y-4"
              >
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={tab === 'login'}
                />
                <div className="relative">
                  <Input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowLoginPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={() => setShowForgotPassword(true)}>
                  Forgot your password?
                </Button>
              </form>
            )}
          </TabsContent>
          <TabsContent value="signup">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAuth('signup');
              }}
              className="space-y-4"
            >
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus={tab === 'signup'}
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <Input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowSignupPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 