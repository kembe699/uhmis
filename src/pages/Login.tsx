import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import SetupPassword from './SetupPassword';
import { Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showFirstTimeLogin, setShowFirstTimeLogin] = useState(false);
  const [pendingUserEmail, setPendingUserEmail] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try to sign in first
      await signIn(email, password);
      toast.success('Welcome back!');
      
      // Wait for auth state to update and get user data
      // The AuthContext will handle loading user data from the API
      // Use a small delay to let the auth context update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get updated user from auth context (it should be updated by now)
      // For now, redirect to dashboard - the ProtectedRoute will handle role-based redirects
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetupComplete = () => {
    setShowPasswordSetup(false);
    setShowFirstTimeLogin(false);
    setPendingUserEmail('');
    setEmail('');
    setPassword('');
    toast.success('Account setup complete! Please sign in with your new password.');
  };

  const handleFirstTimeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Skip Firestore validation and go directly to password setup
      // The SetupPassword component will handle validation when creating the Firebase Auth account
      setPendingUserEmail(email);
      setShowPasswordSetup(true);
      setShowFirstTimeLogin(false);
      setLoading(false);
    } catch (err: any) {
      console.error('Error in first time login:', err);
      setError('Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show password setup component if needed
  if (showPasswordSetup) {
    return <SetupPassword email={pendingUserEmail} onComplete={handlePasswordSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2">
              <img src="/logo.jpeg" alt="Universal Hospital Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Universal Hospital</h1>
              <p className="text-primary-foreground/70">Health Management Information System</p>
            </div>
          </div>
          
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold leading-tight">
                Fast. Simple. Reliable.
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Designed for field clinics with high patient volume and limited connectivity.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 pt-6">
              <div className="bg-primary-foreground/10 rounded-lg px-4 py-3">
                <p className="font-medium">Universal Hospital</p>
                <p className="text-sm text-primary-foreground/60">Main Hospital</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-foreground/5 rounded-full" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-foreground/5 rounded-full" />
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1">
              <img src="/logo.jpeg" alt="Universal Hospital Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Universal Hospital</h1>
              <p className="text-xs text-muted-foreground">HMIS</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {showFirstTimeLogin ? 'Set up your account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {showFirstTimeLogin ? 'Enter your email to create your password' : 'Sign in to access the HMIS'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Login Forms */}
          {showFirstTimeLogin ? (
            /* First Time Login Form */
            <form onSubmit={handleFirstTimeLogin} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-1">First Time Login</p>
                <p className="text-xs text-blue-700">
                  Enter the email address your administrator used to create your account.
                </p>
              </div>

              <div className="form-field">
                <Label htmlFor="email" className="form-label">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : null}
                Continue Setup
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setShowFirstTimeLogin(false);
                  setEmail('');
                  setError('');
                }}
                disabled={loading}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            /* Regular Login Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="form-field">
                <Label htmlFor="email" className="form-label">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  className="h-12"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="password" className="form-label">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
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

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : null}
                Sign In
              </Button>

            </form>
          )}

          {/* Footer */}
          <div className="text-center mt-6">
            {showFirstTimeLogin ? (
              <p className="text-xs text-muted-foreground">
                Already have a password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstTimeLogin(false);
                    setEmail('');
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  Click here to login
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                New User?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstTimeLogin(true);
                    setEmail('');
                    setPassword('');
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  Click here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
