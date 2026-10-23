import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserSquare2,
} from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// ✅ zustand removed — auth now comes from AuthContext
import { useAuth } from '@/lib/auth-context';

import {
  useAdminLoginMutation,
  useCustomerLoginMutation,
  useStaffLoginMutation,
  useKitchenLoginMutation,
  useOrganizationLoginMutation,
  useCounterLoginMutation,
  getErrorMessage,
} from '@/tanstack/alltanstack';


const RESTAURANT_NAME = 'madhu';


const ORGANIZATION_NAME = 'FoodFlow Technologies'; 


const DEFAULT_STAFF_ROLE = 'counter_staff';

const DEFAULT_KITCHEN_ROLE = 'kitchen_staff';

interface LoginFormData {
  loginType: 'admin' | 'staff' | 'customer' | 'kitchen' | 'organization' | 'counter';
  role?: string;
  email: string;
  password: string;
}

// =================================================
// LOGIN OPTIONS
// =================================================
const loginOptions: {
  value: string;
  label: string;
  loginType: LoginFormData['loginType'];
  role?: string;
}[] = [
    // ---- generic (main) options ----
    // { value: 'admin', label: 'Admin', loginType: 'admin' },
    // // ✅ Staff -> /staff/auth/login with default role counter_staff
    // { value: 'staff', label: 'Staff', loginType: 'staff', role: DEFAULT_STAFF_ROLE },
    // { value: 'customer', label: 'Customer', loginType: 'customer' },

    // ---- specific (quick-login) options ----
    { value: 'organization', label: 'Organization', loginType: 'organization' },
    { value: 'admin_manager', label: 'Admin Manager', loginType: 'admin' },
    // Counter Staff -> dedicated POS login (/counter/counter_staff_login)
    { value: 'counter', label: 'Counter Staff', loginType: 'counter', role: DEFAULT_STAFF_ROLE },
    { value: 'kitchen_staff', label: 'Kitchen Staff', loginType: 'kitchen', role: DEFAULT_KITCHEN_ROLE},
    { value: 'customer_specific', label: 'Customer (Menu & Orders)', loginType: 'customer' },
    { value: 'staff_member', label: 'Staff Member', loginType: 'staff', role: DEFAULT_STAFF_ROLE },
  ];

const StaffLogin = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedLoginOption, setSelectedLoginOption] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>();

  const currentLoginType = watch('loginType');

  const adminLoginMutation = useAdminLoginMutation();
  const customerLoginMutation = useCustomerLoginMutation();
  const staffLoginMutation = useStaffLoginMutation();
  const kitchenLoginMutation = useKitchenLoginMutation();
  const organizationLoginMutation = useOrganizationLoginMutation();
  const counterLoginMutation = useCounterLoginMutation();

 
  const handleSuccess = (response: any, appRole: string) => {
    // Backend may still return 200 with {message, error} on failure
    if (!response?.access_token) {
      toast.error(response?.error || response?.message || 'Login failed');
      return;
    }

    const loggedInUser = {
      ...response.user,
      role: appRole,
    };

    // Saves token + user in state AND localStorage (see auth-context.tsx)
    setAuth(loggedInUser, response.access_token);

    toast.success('Welcome back! Redirecting...');

    if (appRole === 'organization') navigate('/organization');
    else if (appRole === 'admin') navigate('/admin');
    else if (appRole === 'customer') navigate('/menu');
    else if (appRole === 'kitchen_staff') navigate('/kitchen');
    else if (appRole === 'counter') navigate('/pos');
    else navigate('/staff');
  };

  // ===================================================
  // FORM SUBMIT
  // ===================================================
  const onSubmit = (data: LoginFormData) => {
    if (!selectedLoginOption || !data.loginType) {
      toast.error('Please select a login type first');
      return;
    }

    // ORGANIZATION LOGIN
    if (data.loginType === 'organization') {
      organizationLoginMutation.mutate(
        {
          organization_name: ORGANIZATION_NAME,
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: (response) => handleSuccess(response, 'organization'),
          onError: (error: any) => {
            toast.error(
              error.response?.data?.detail || 'Invalid organization credentials'
            );
          },
        }
      );
      return;
    }

    // COUNTER (POS) LOGIN
    if (data.loginType === 'counter') {
      counterLoginMutation.mutate(
        {
          restaurant_name: RESTAURANT_NAME,
          email: data.email,
          password: data.password,
          role_name: data.role || DEFAULT_STAFF_ROLE,
        },
        {
          onSuccess: (response) => handleSuccess(response, 'counter'),
          onError: (error: any) => {
            toast.error(
              error.response?.data?.detail || 'Invalid counter staff credentials'
            );
          },
        }
      );
      return;
    }

    const payload = {
      restaurant_name: RESTAURANT_NAME,
      email: data.email,
      password: data.password,
    };

    // ADMIN LOGIN
    if (data.loginType === 'admin') {
      adminLoginMutation.mutate(payload, {
        onSuccess: (response) => handleSuccess(response, 'admin'),
        onError: (error: any) => {
          toast.error(error.response?.data?.detail || 'Invalid admin credentials');
        },
      });
    }

    // KITCHEN LOGIN
// KITCHEN LOGIN
else if (data.loginType === 'kitchen') {
  kitchenLoginMutation.mutate(
    { ...payload, role: DEFAULT_KITCHEN_ROLE },
    {
      onSuccess: (response) => handleSuccess(response, 'kitchen_staff'),
      onError: (error: any) => {
        toast.error(getErrorMessage(error, 'Invalid kitchen credentials'));
      },
    }
  );
}


    // STAFF LOGIN (attendance / leave / issues portal)
    else if (data.loginType === 'staff') {
      staffLoginMutation.mutate(
        {
          ...payload,
          role: data.role || DEFAULT_STAFF_ROLE,
        },
        {
          onSuccess: (response) => handleSuccess(response, 'staff'),
          onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Invalid staff credentials');
          },
        }
      );
    }

    // CUSTOMER LOGIN
    else if (data.loginType === 'customer') {
      customerLoginMutation.mutate(payload, {
        onSuccess: (response) => handleSuccess(response, 'customer'),
        onError: (error: any) => {
          toast.error(error.response?.data?.detail || 'Invalid customer credentials');
        },
      });
    }

    else {
      toast.error('Please select a valid login type');
    }
  };

  // ===================================================
  // LOGIN OPTION (DROPDOWN) CHANGE HANDLER
  // ===================================================
  const handleLoginOptionChange = (value: string) => {
    setSelectedLoginOption(value);
    const opt = loginOptions.find((o) => o.value === value);
    if (!opt) return;

    setValue('loginType', opt.loginType, { shouldValidate: true });

    if (opt.role) {
      setValue('role', opt.role, { shouldValidate: true });
    } else {
      setValue('role', undefined, { shouldValidate: true });
    }
  };

  const isLoading =
    adminLoginMutation.isPending ||
    customerLoginMutation.isPending ||
    staffLoginMutation.isPending ||
    kitchenLoginMutation.isPending ||
    organizationLoginMutation.isPending ||
    counterLoginMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 py-8"
      >
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
            <Coffee className="h-8 w-8 text-primary-foreground" />
          </div>

          <h1 className="text-3xl font-heading font-bold text-foreground">
            CaféFlow
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            {currentLoginType === 'kitchen'
              ? 'Kitchen Staff Login'
              : currentLoginType === 'counter'
                ? 'Counter / POS Login'
                : 'Sign in to your workspace'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">New here?</span>
            <Link
              to="/register"
              className="text-sm text-primary hover:underline font-medium"
            >
              Create Account
            </Link>
          </div>

          <div>
            <Label className="text-sm font-medium">Login As</Label>
            <div className="relative mt-1.5">
              <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={selectedLoginOption}
                onValueChange={handleLoginOptionChange}
              >
                <SelectTrigger className="pl-9 h-11 rounded-xl">
                  <SelectValue placeholder="Select login type" />
                </SelectTrigger>
                <SelectContent>
                  {loginOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.loginType && (
              <p className="text-xs text-destructive mt-1">
                Please select a login type
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="off"
                {...register('email')}
                placeholder="you@example.com"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                placeholder="Enter password"
                className="pl-9 pr-10 h-11 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary mt-2"
            disabled={isLoading || !selectedLoginOption}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
