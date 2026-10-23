import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Mail, ArrowLeft, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
      toast.success('Reset link sent! Check your email.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
            {sent ? <CheckCircle2 className="h-8 w-8 text-primary-foreground" /> : <KeyRound className="h-8 w-8 text-primary-foreground" />}
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{sent ? 'Check Your Email' : 'Forgot Password?'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "We've sent a password reset link to your email" : "No worries, we'll send you reset instructions"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-4">
            <div>
              <Label htmlFor="forgot-email" className="text-sm font-medium">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 h-11 rounded-xl" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Mail className="h-10 w-10 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              We sent a reset link to <strong className="text-foreground">{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <Button variant="outline" className="rounded-xl" onClick={() => setSent(false)}>
              Try a different email
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
