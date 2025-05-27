// Import React and routing hooks
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Import icon component
import { Bell, Menu, Eye, EyeOff, User } from 'lucide-react';
// Import UI button component
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { userProfileService } from '@/lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { updateUserProfile } from '@/services/userProfileService';
import { supabase } from '@/lib/supabase';

export const Header = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string; password?: string } | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      userProfileService.getDefaultProfile().then(profile => {
        if (profile) {
          setUser({ name: profile.name || profile.email || 'Guest', email: profile.email });
          setEditForm({ name: profile.name || '', email: profile.email || '', password: profile.password || '' });
        setUserId(profile.id);
        } else {
          setUser({ name: 'Guest' });
        }
      }).catch(() => {
        setUser({ name: 'Guest' });
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const handleAccountClick = () => {
    setAccountModalOpen(true);
    setPopoverOpen(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      const updated = await updateUserProfile({
        id: userId,
        name: editForm.name,
        email: editForm.email,
        password: editForm.password || undefined,
      });
      setUser({ name: updated.name, email: updated.email });
      setEditForm({ name: updated.name, email: updated.email || '', password: updated.password || '' });
      toast({ description: 'Account details updated.' });
    } catch (err: any) {
      toast({ description: err.message || 'Failed to update account', variant: 'destructive' });
    }
    setEditing(false);
    setAccountModalOpen(false);
  };

  const handleEditClick = () => setEditing(true);
  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({ name: user?.name || '', email: user?.email || '', password: '' });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    navigate('/auth');
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    // Re-authenticate user with old password
    if (!user?.email) {
      toast({ description: 'User email not found.', variant: 'destructive' });
      setChangingPassword(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (signInError) {
      toast({ description: 'Old password is incorrect.', variant: 'destructive' });
      setChangingPassword(false);
      return;
    }
    // If old password is correct, update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ description: error.message || 'Failed to change password', variant: 'destructive' });
    } else {
      toast({ description: 'Password changed successfully.' });
      setChangePasswordModalOpen(false);
      setNewPassword('');
      setOldPassword('');
    }
  };

  const handleForgotPassword = async () => {
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setResetting(false);
    if (error) {
      toast({ description: error.message || 'Failed to send reset email', variant: 'destructive' });
    } else {
      toast({ description: 'Password reset email sent.' });
      setResetEmail('');
    }
  };

  return (
    // Header with fixed positioning and styling
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* App name on the left */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-primary">GiftWise</h1>
        </div>
        {/* Username and user details menu button on the right */}
        <div className="flex items-center gap-2">
          {session && user?.name ? (
            <span className="text-base font-medium text-[#233A6A]">{user.name}</span>
          ) : session && user?.email ? (
            <span className="text-base font-medium text-[#233A6A]">{user.email}</span>
          ) : (
            <span className="text-base font-medium text-[#233A6A]">Guest</span>
          )}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={popoverOpen ? 'default' : 'ghost'}
                size="icon"
                aria-label="User Menu"
                className={popoverOpen ? 'bg-[#233A6A] text-white' : 'hover:bg-[#233A6A] hover:text-white'}
              >
                <Menu size={22} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48">
              <div className="flex flex-col gap-2 py-2 px-2">
                <Button
                  variant="default"
                  className="w-full justify-start"
                  onClick={handleAccountClick}
                >
                  Your Account
                </Button>
                <Button variant="destructive" className="w-full justify-start hover:bg-[#b91c1c] hover:text-white focus:bg-[#b91c1c] focus:text-white"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out...' : 'Log Out'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Details</DialogTitle>
            </DialogHeader>
            {/* Hidden dummy input to absorb initial focus */}
            <input style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} autoFocus tabIndex={-1} />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={editForm.name}
                  readOnly={!editing}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus={editing}
                  tabIndex={editing ? 0 : -1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  readOnly={!editing}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              {editing ? (
                <>
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button onClick={handleEditClick}>Edit Details</Button>
                  <Button variant="secondary" onClick={() => setChangePasswordModalOpen(true)}>
                    Change Password
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Change Password Modal */}
        <Dialog open={changePasswordModalOpen} onOpenChange={setChangePasswordModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowOldPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
              <Input
                  type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowNewPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword || !oldPassword || !newPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
              <div className="text-xs text-gray-500">Forgot your password? Enter your email below to receive a reset link.</div>
              <Input
                type="email"
                placeholder="Email for reset"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
              />
              <Button onClick={handleForgotPassword} disabled={resetting || !resetEmail}>
                {resetting ? 'Sending...' : 'Send Reset Email'}
        </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};
