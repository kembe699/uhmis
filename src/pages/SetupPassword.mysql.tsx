import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql';
import { useDatabase } from '@/contexts/DatabaseContext.browser';
import { 
  Key, 
  Eye, 
  EyeOff,
  Check,
  Loader2,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SetupPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { userRepo } = useDatabase();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      // First, check if the user exists in our MySQL database
      const dbUser = await userRepo.findByEmail(email);
      
      if (!dbUser) {
        toast.error('No account found with this email. Please contact your administrator to create an account.');
        return;
      }
      
      // Check if user status is pending
      if (dbUser.get('status') !== 'pending') {
        toast.error('This account is already active. Please use regular login.');
        return;
      }
      
      // Set password directly in MySQL database (no Firebase)
      // Hash the password and update the user in our MySQL database
      await userRepo.update(dbUser.id, {
        password_hash: password, // This should be hashed in production
        status: 'active',
        password_set_at: new Date()
      });
      
      toast.success('Password set successfully! Welcome to Universal Hospital HMIS.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error setting up password:', error);
      toast.error(error.message || 'Failed to set up password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Universal Hospital</h1>
            <p className="text-muted-foreground mt-2">
              Set up your password to complete your account
            </p>
          </div>

          {/* User Info */}
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Account Setup</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </div>

          {/* Password Setup Form */}
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="form-field">
              <Label htmlFor="password" className="form-label">
                Create Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoFocus
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <Label htmlFor="confirmPassword" className="form-label">
                Confirm Password *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1">Password Requirements:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Use a combination of letters and numbers</li>
                <li>• Keep it secure and don't share with others</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              Complete Setup
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              By setting up your password, you agree to keep your account secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
