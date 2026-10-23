// // import { useState } from 'react';
// // import { useNavigate, Link } from 'react-router-dom';
// // import { motion } from 'framer-motion';
// // import { Coffee, Lock, User, ArrowRight, ArrowLeft, Mail, UserPlus } from 'lucide-react';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// // import { toast } from 'sonner';
// // import { useAuthStore, UserRole } from '@/lib/auth-store';

// // const Register = () => {
// //   const [name, setName] = useState('');
// //   const [username, setUsername] = useState('');
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [confirmPassword, setConfirmPassword] = useState('');
// //   const [role, setRole] = useState<UserRole>('customer');
// //   const [loading, setLoading] = useState(false);
// //   const navigate = useNavigate();
// //   const register = useAuthStore(s => s.register);

// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!name || !username || !password) { toast.error('Please fill all required fields'); return; }
// //     if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
// //     if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
// //     setLoading(true);
// //     setTimeout(() => {
// //       const result = register(name, username, email, password, role);
// //       if (result.success) {
// //         toast.success('Account created! Redirecting...');
// //         navigate(result.redirect);
// //       } else {
// //         toast.error(result.message || 'Registration failed');
// //       }
// //       setLoading(false);
// //     }, 500);
// //   };

// //   return (
// //     <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">
// //       <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
// //       <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

// //       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
// //         <div className="text-center mb-6">
// //           <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
// //             <ArrowLeft className="h-4 w-4" /> Back to Home
// //           </Link>
// //           <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
// //             <Coffee className="h-8 w-8 text-primary-foreground" />
// //           </div>
// //           <h1 className="text-3xl font-heading font-bold text-foreground">Create Account</h1>
// //           <p className="text-sm text-muted-foreground mt-1">Join CaféFlow today</p>
// //         </div>

// //         <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-3">
// //           <div>
// //             <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
// //             <div className="relative mt-1.5">
// //               <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="pl-9 h-11 rounded-xl" required />
// //             </div>
// //           </div>
// //           <div>
// //             <Label htmlFor="reg-username" className="text-sm font-medium">Username *</Label>
// //             <div className="relative mt-1.5">
// //               <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="reg-username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" className="pl-9 h-11 rounded-xl" required />
// //             </div>
// //           </div>
// //           <div>
// //             <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
// //             <div className="relative mt-1.5">
// //               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 h-11 rounded-xl" />
// //             </div>
// //           </div>
// //           <div>
// //             <Label htmlFor="reg-role" className="text-sm font-medium">Role</Label>
// //             <Select value={role} onValueChange={v => setRole(v as UserRole)}>
// //               <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="customer">Customer</SelectItem>
// //                 <SelectItem value="cashier">Counter Staff</SelectItem>
// //                 <SelectItem value="kitchen">Kitchen Staff</SelectItem>
// //                 <SelectItem value="admin">Admin</SelectItem>
// //                 <SelectItem value="organization">Organization</SelectItem>
// //               </SelectContent>
// //             </Select>
// //           </div>
// //           <div>
// //             <Label htmlFor="reg-password" className="text-sm font-medium">Password *</Label>
// //             <div className="relative mt-1.5">
// //               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-9 h-11 rounded-xl" required />
// //             </div>
// //           </div>
// //           <div>
// //             <Label htmlFor="reg-confirm" className="text-sm font-medium">Confirm Password *</Label>
// //             <div className="relative mt-1.5">
// //               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="reg-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="pl-9 h-11 rounded-xl" required />
// //             </div>
// //           </div>
// //           <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary" disabled={loading}>
// //             {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className="ml-2 h-4 w-4" />
// //           </Button>
// //         </form>

// //         <p className="text-center text-sm text-muted-foreground mt-6">
// //           Already have an account?{' '}
// //           <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
// //         </p>
// //       </motion.div>
// //     </div>
// //   );
// // };

// // export default Register;


// // import { useState } from 'react';
// // import { useNavigate, Link } from 'react-router-dom';
// // import { motion } from 'framer-motion';
// // import { Coffee, Lock, User, ArrowRight, ArrowLeft, Mail, Building2, Phone, Eye, EyeOff } from 'lucide-react';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// // import { toast } from 'sonner';
// // import { useForm, Controller } from 'react-hook-form';
// // import { zodResolver } from '@hookform/resolvers/zod';
// // import * as z from 'zod';
// // import { useRegisterMutation } from '@/tanstack/alltanstack';

// // // 1. Define the Zod Schema directly in the component file
// // const registerSchema = z.object({
// //   restaurant_name: z.string().min(1, 'Restaurant name is required'),
// //   name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
// //   email: z.string().email('Invalid email address'),
// //   phone: z.string().optional(),
// //   role: z.enum(['customer', 'cashier', 'kitchen', 'admin', 'organization']),
// //   password: z.string().min(6, 'Password must be at least 6 characters'),
// //   confirmPassword: z.string()
// // }).refine((data) => data.password === data.confirmPassword, {
// //   message: "Passwords do not match",
// //   path: ["confirmPassword"],
// // });

// // // Infer the TypeScript type from the Zod schema
// // type RegisterFormData = z.infer<typeof registerSchema>;

// // const Register = () => {
// //   const navigate = useNavigate();
// //   const registerMutation = useRegisterMutation();

// //   // State for toggling password visibility
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

// //   // Setup React-Hook-Form with the Zod schema
// //   // We extract 'reset' here to clear the form later
// //   const {
// //     register,
// //     handleSubmit,
// //     control,
// //     formState: { errors },
// //     reset 
// //   } = useForm<RegisterFormData>({
// //     resolver: zodResolver(registerSchema),
// //     defaultValues: {
// //       role: 'customer',
// //       phone: '',
// //     },
// //   });

// //   const onSubmit = (data: RegisterFormData) => {
// //     const payload = {
// //       restaurant_name: data.restaurant_name,
// //       name: data.name,
// //       email: data.email,
// //       role: data.role,
// //       password: data.password,
// //       phone: data.phone === "" ? undefined : data.phone, 
// //     };

// //     registerMutation.mutate(payload, {
// //       onSuccess: (response) => {
// //         toast.success(`Account created for ${response.name}! Redirecting...`);

// //         // Clear the form fields entirely
// //         reset(); 

// //         // Navigate based on role
// //         if (data.role === 'admin') navigate('/admin');
// //         else if (data.role === 'kitchen') navigate('/kitchen');
// //         else navigate('/login'); 
// //       },
// //       onError: (error: any) => {
// //         const errorMessage = error.response?.data?.detail || 'Registration failed';
// //         toast.error(errorMessage);
// //       },
// //     });
// //   };

// //   return (
// //     <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">
// //       <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
// //       <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

// //       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10 py-8">
// //         <div className="text-center mb-6">
// //           <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
// //             <ArrowLeft className="h-4 w-4" /> Back to Home
// //           </Link>
// //           <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
// //             <Coffee className="h-8 w-8 text-primary-foreground" />
// //           </div>
// //           <h1 className="text-3xl font-heading font-bold text-foreground">Create Account</h1>
// //           <p className="text-sm text-muted-foreground mt-1">Join CaféFlow today</p>
// //         </div>

// //         {/* Added autoComplete="off" to prevent aggressive browser autofill */}
// //         <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-4">

// //           <div>
// //             <Label htmlFor="restaurant_name" className="text-sm font-medium">Restaurant Name *</Label>
// //             <div className="relative mt-1.5">
// //               <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="restaurant_name" autoComplete="off" {...register('restaurant_name')} placeholder="Your restaurant's name" className="pl-9 h-11 rounded-xl" />
// //             </div>
// //             {errors.restaurant_name && <p className="text-xs text-red-500 mt-1">{errors.restaurant_name.message}</p>}
// //           </div>

// //           <div>
// //             <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
// //             <div className="relative mt-1.5">
// //               <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="name" autoComplete="off" {...register('name')} placeholder="Your full name" className="pl-9 h-11 rounded-xl" />
// //             </div>
// //             {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
// //           </div>

// //           <div>
// //             <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
// //             <div className="relative mt-1.5">
// //               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="email" type="email" autoComplete="off" {...register('email')} placeholder="you@example.com" className="pl-9 h-11 rounded-xl" />
// //             </div>
// //             {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
// //           </div>

// //           <div>
// //             <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
// //             <div className="relative mt-1.5">
// //               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input id="phone" autoComplete="off" {...register('phone')} placeholder="+1 234 567 890" className="pl-9 h-11 rounded-xl" />
// //             </div>
// //           </div>

// //           <div>
// //             <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
// //             <Controller
// //               name="role"
// //               control={control}
// //               render={({ field }) => (
// //                 <Select value={field.value} onValueChange={field.onChange}>
// //                   <SelectTrigger className="mt-1.5 h-11 rounded-xl">
// //                     <SelectValue placeholder="Select a role" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="customer">Customer</SelectItem>
// //                     <SelectItem value="cashier">Counter Staff</SelectItem>
// //                     <SelectItem value="kitchen">Kitchen Staff</SelectItem>
// //                     <SelectItem value="admin">Admin</SelectItem>
// //                     <SelectItem value="organization">Organization</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               )}
// //             />
// //             {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
// //           </div>

// //           <div>
// //             <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
// //             <div className="relative mt-1.5">
// //               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input 
// //                 id="password" 
// //                 type={showPassword ? "text" : "password"} 
// //                 autoComplete="new-password" 
// //                 {...register('password')} 
// //                 placeholder="Min 6 characters" 
// //                 className="pl-9 pr-10 h-11 rounded-xl" 
// //               />
// //               <button
// //                 type="button"
// //                 onClick={() => setShowPassword(!showPassword)}
// //                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
// //               >
// //                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
// //               </button>
// //             </div>
// //             {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
// //           </div>

// //           <div>
// //             <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
// //             <div className="relative mt-1.5">
// //               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //               <Input 
// //                 id="confirmPassword" 
// //                 type={showConfirmPassword ? "text" : "password"} 
// //                 autoComplete="new-password" 
// //                 {...register('confirmPassword')} 
// //                 placeholder="Repeat password" 
// //                 className="pl-9 pr-10 h-11 rounded-xl" 
// //               />
// //               <button
// //                 type="button"
// //                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
// //                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
// //               >
// //                 {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
// //               </button>
// //             </div>
// //             {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
// //           </div>

// //           <Button 
// //             type="submit" 
// //             className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary mt-2" 
// //             disabled={registerMutation.isPending}
// //           >
// //             {registerMutation.isPending ? 'Creating account...' : 'Create Account'} 
// //             <ArrowRight className="ml-2 h-4 w-4" />
// //           </Button>
// //         </form>

// //         <p className="text-center text-sm text-muted-foreground mt-6">
// //           Already have an account?{' '}
// //           <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
// //         </p>
// //       </motion.div>
// //     </div>
// //   );
// // };

// // export default Register;

// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Coffee, Lock, User, ArrowRight, ArrowLeft, Mail, Building2, Phone, Eye, EyeOff } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// // Import BOTH hooks now
// import { useAdminRegisterMutation, useCustomerRegisterMutation } from '@/tanstack/alltanstack';

// const registerSchema = z.object({
//   restaurant_name: z.string().min(1, 'Restaurant name is required'),
//   name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
//   email: z.string().email('Invalid email address'),
//   phone: z.string().optional(),
//   role: z.enum(['customer', 'cashier', 'kitchen', 'admin', 'organization']),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
//   confirmPassword: z.string()
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords do not match",
//   path: ["confirmPassword"],
// });

// type RegisterFormData = z.infer<typeof registerSchema>;

// const Register = () => {
//   const navigate = useNavigate();

//   // Initialize both hooks
//   const adminRegisterMutation = useAdminRegisterMutation();
//   const customerRegisterMutation = useCustomerRegisterMutation();

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     control,
//     formState: { errors },
//     reset 
//   } = useForm<RegisterFormData>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       role: 'customer',
//       phone: '',
//     },
//   });

//   // Reusable success handler
//   const handleSuccess = (response: any, role: string) => {
//     toast.success(`Account created successfully! Redirecting...`);
//     reset(); 
//     if (role === 'admin') navigate('/admin');
//     else if (role === 'kitchen') navigate('/kitchen');
//     else navigate('/login'); 
//   };

//   const onSubmit = (data: RegisterFormData) => {
//     const payload = {
//       restaurant_name: data.restaurant_name,
//       name: data.name,
//       email: data.email,
//       role: data.role,
//       password: data.password,
//       phone: data.phone === "" ? undefined : data.phone, 
//     };

//     // Explicitly call the right mutation based on the role
//     if (data.role === 'admin') {
//       adminRegisterMutation.mutate(payload, {
//         onSuccess: (res) => handleSuccess(res, data.role),
//         onError: (error: any) => {
//           toast.error(error.response?.data?.detail || 'Admin registration failed');
//         },
//       });
//     } else {
//       customerRegisterMutation.mutate(payload, {
//         onSuccess: (res) => handleSuccess(res, data.role),
//         onError: (error: any) => {
//           toast.error(error.response?.data?.detail || 'Registration failed');
//         },
//       });
//     }
//   };

//   // UI loading state if EITHER mutation is firing
//   const isLoading = adminRegisterMutation.isPending || customerRegisterMutation.isPending;

//   return (
//     <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">
//       <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
//       <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10 py-8">
//         <div className="text-center mb-6">
//           <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
//             <ArrowLeft className="h-4 w-4" /> Back to Home
//           </Link>
//           <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
//             <Coffee className="h-8 w-8 text-primary-foreground" />
//           </div>
//           <h1 className="text-3xl font-heading font-bold text-foreground">Create Account</h1>
//           <p className="text-sm text-muted-foreground mt-1">Join CaféFlow today</p>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-4">

//           <div>
//             <Label htmlFor="restaurant_name" className="text-sm font-medium">Restaurant Name *</Label>
//             <div className="relative mt-1.5">
//               <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input id="restaurant_name" autoComplete="off" {...register('restaurant_name')} placeholder="Your restaurant's name" className="pl-9 h-11 rounded-xl" />
//             </div>
//             {errors.restaurant_name && <p className="text-xs text-red-500 mt-1">{errors.restaurant_name.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
//             <div className="relative mt-1.5">
//               <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input id="name" autoComplete="off" {...register('name')} placeholder="Your full name" className="pl-9 h-11 rounded-xl" />
//             </div>
//             {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
//             <div className="relative mt-1.5">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input id="email" type="email" autoComplete="off" {...register('email')} placeholder="you@example.com" className="pl-9 h-11 rounded-xl" />
//             </div>
//             {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
//             <div className="relative mt-1.5">
//               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input id="phone" autoComplete="off" {...register('phone')} placeholder="+1 234 567 890" className="pl-9 h-11 rounded-xl" />
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
//             <Controller
//               name="role"
//               control={control}
//               render={({ field }) => (
//                 <Select value={field.value} onValueChange={field.onChange}>
//                   <SelectTrigger className="mt-1.5 h-11 rounded-xl">
//                     <SelectValue placeholder="Select a role" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="customer">Customer</SelectItem>
//                     <SelectItem value="cashier">Counter Staff</SelectItem>
//                     <SelectItem value="kitchen">Kitchen Staff</SelectItem>
//                     <SelectItem value="admin">Admin</SelectItem>
//                     <SelectItem value="organization">Organization</SelectItem>
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//             {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
//             <div className="relative mt-1.5">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input 
//                 id="password" 
//                 type={showPassword ? "text" : "password"} 
//                 autoComplete="new-password" 
//                 {...register('password')} 
//                 placeholder="Min 6 characters" 
//                 className="pl-9 pr-10 h-11 rounded-xl" 
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
//               >
//                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </button>
//             </div>
//             {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
//             <div className="relative mt-1.5">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input 
//                 id="confirmPassword" 
//                 type={showConfirmPassword ? "text" : "password"} 
//                 autoComplete="new-password" 
//                 {...register('confirmPassword')} 
//                 placeholder="Repeat password" 
//                 className="pl-9 pr-10 h-11 rounded-xl" 
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
//               >
//                 {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </button>
//             </div>
//             {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
//           </div>

//           <Button 
//             type="submit" 
//             className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary mt-2" 
//             disabled={isLoading}
//           >
//             {isLoading ? 'Creating account...' : 'Create Account'} 
//             <ArrowRight className="ml-2 h-4 w-4" />
//           </Button>
//         </form>

//         <p className="text-center text-sm text-muted-foreground mt-6">
//           Already have an account?{' '}
//           <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
//         </p>
//       </motion.div>
//     </div>
//   );
// };

// export default Register;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Coffee,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Mail,
  Building2,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';

import {
  useForm,
  Controller,
} from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  useAdminRegisterMutation,
  useCustomerRegisterMutation,
} from '@/tanstack/alltanstack';


// =====================================================
// REGISTER SCHEMA
// =====================================================

const registerSchema = z.object({

  restaurant_name: z
    .string()
    .min(1, 'Restaurant name is required'),

  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),

  email: z
    .string()
    .email('Invalid email address'),

  phone: z
    .string()
    .optional(),

  role: z.enum([
    'customer',
    'cashier',
    'kitchen',
    'admin',
    'organization'
  ]),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),

  confirmPassword: z
    .string(),

}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);


type RegisterFormData =
  z.infer<typeof registerSchema>;


// =====================================================
// REGISTER COMPONENT
// =====================================================

const Register = () => {

  const navigate = useNavigate();


  // ===================================================
  // MUTATIONS
  // ===================================================

  const adminRegisterMutation =
    useAdminRegisterMutation();

  const customerRegisterMutation =
    useCustomerRegisterMutation();


  // ===================================================
  // PASSWORD VISIBILITY
  // ===================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // ===================================================
  // REACT HOOK FORM
  // ===================================================

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({

    resolver: zodResolver(registerSchema),

    defaultValues: {
      role: 'customer',
      phone: '',
    },

  });


  // ===================================================
  // SUCCESS HANDLER
  // ===================================================

  const handleSuccess = () => {

    toast.success(
      'Account created successfully! Please login.'
    );

    // Clear registration form
    reset();

    // IMPORTANT:
    // Never directly open protected dashboard
    // after registration.
    //
    // User must login first.
    navigate('/login', {
      replace: true,
    });

  };


  // ===================================================
  // SUBMIT
  // ===================================================

  const onSubmit = (
    data: RegisterFormData
  ) => {

    const payload = {

      restaurant_name:
        data.restaurant_name,

      name:
        data.name,

      email:
        data.email,

      role:
        data.role,

      password:
        data.password,

      phone:
        data.phone === ''
          ? undefined
          : data.phone,

    };


    console.log(
      'REGISTER PAYLOAD:',
      payload
    );


    // =================================================
    // ADMIN REGISTER
    // =================================================

    if (
      data.role === 'admin'
    ) {

      adminRegisterMutation.mutate(
        payload,
        {

          onSuccess: (response) => {

            console.log(
              'ADMIN REGISTER SUCCESS:',
              response
            );

            handleSuccess();

          },

          onError: (error: any) => {

            console.log(
              'ADMIN REGISTER ERROR:',
              error.response?.data
            );

            toast.error(
              error.response?.data?.detail ||
              'Admin registration failed'
            );

          },

        }
      );

    }


    // =================================================
    // CUSTOMER / STAFF / KITCHEN / ORGANIZATION
    // =================================================

    else {

      customerRegisterMutation.mutate(
        payload,
        {

          onSuccess: (response) => {

            console.log(
              'REGISTER SUCCESS:',
              response
            );

            handleSuccess();

          },

          onError: (error: any) => {

            console.log(
              'REGISTER ERROR:',
              error.response?.data
            );

            toast.error(
              error.response?.data?.detail ||
              'Registration failed'
            );

          },

        }
      );

    }

  };


  // ===================================================
  // LOADING
  // ===================================================

  const isLoading =
    adminRegisterMutation.isPending ||
    customerRegisterMutation.isPending;


  // ===================================================
  // UI
  // ===================================================

  return (

    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body gradient-mesh relative overflow-hidden">


      {/* Background */}

      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />


      <motion.div

        initial={{
          opacity: 0,
          y: 20
        }}

        animate={{
          opacity: 1,
          y: 0
        }}

        className="w-full max-w-md relative z-10 py-8"

      >


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="text-center mb-6">


          {/* BACK TO HOME */}

          <Link

            to="/"

            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"

          >

            <ArrowLeft className="h-4 w-4" />

            Back to Home

          </Link>


          {/* LOGO */}

          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">

            <Coffee className="h-8 w-8 text-primary-foreground" />

          </div>


          <h1 className="text-3xl font-heading font-bold text-foreground">

            Create Account

          </h1>


          <p className="text-sm text-muted-foreground mt-1">

            Join CaféFlow today

          </p>

        </div>


        {/* =================================================
            REGISTER FORM
        ================================================= */}

        <form

          onSubmit={handleSubmit(onSubmit)}

          autoComplete="off"

          className="bg-card rounded-2xl border border-border p-6 cafe-shadow-lg space-y-4"

        >


          {/* =================================================
              RESTAURANT NAME
          ================================================= */}

          <div>

            <Label
              htmlFor="restaurant_name"
              className="text-sm font-medium"
            >

              Restaurant Name *

            </Label>


            <div className="relative mt-1.5">

              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />


              <Input

                id="restaurant_name"

                autoComplete="off"

                {...register(
                  'restaurant_name'
                )}

                placeholder="Your restaurant's name"

                className="pl-9 h-11 rounded-xl"

              />

            </div>


            {errors.restaurant_name && (

              <p className="text-xs text-red-500 mt-1">

                {errors.restaurant_name.message}

              </p>

            )}

          </div>


          {/* =================================================
              FULL NAME
          ================================================= */}

          <div>

            <Label
              htmlFor="name"
              className="text-sm font-medium"
            >

              Full Name *

            </Label>


            <div className="relative mt-1.5">

              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />


              <Input

                id="name"

                autoComplete="off"

                {...register('name')}

                placeholder="Your full name"

                className="pl-9 h-11 rounded-xl"

              />

            </div>


            {errors.name && (

              <p className="text-xs text-red-500 mt-1">

                {errors.name.message}

              </p>

            )}

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div>

            <Label
              htmlFor="email"
              className="text-sm font-medium"
            >

              Email *

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

              <p className="text-xs text-red-500 mt-1">

                {errors.email.message}

              </p>

            )}

          </div>


          {/* =================================================
              PHONE
          ================================================= */}

          <div>

            <Label
              htmlFor="phone"
              className="text-sm font-medium"
            >

              Phone (Optional)

            </Label>


            <div className="relative mt-1.5">

              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />


              <Input

                id="phone"

                autoComplete="off"

                {...register('phone')}

                placeholder="+91 9876543210"

                className="pl-9 h-11 rounded-xl"

              />

            </div>

          </div>


          {/* =================================================
              ROLE
          ================================================= */}

          <div>

            <Label
              htmlFor="role"
              className="text-sm font-medium"
            >

              Role *

            </Label>


            <Controller

              name="role"

              control={control}

              render={({ field }) => (

                <Select

                  value={field.value}

                  onValueChange={field.onChange}

                >

                  <SelectTrigger className="mt-1.5 h-11 rounded-xl">

                    <SelectValue
                      placeholder="Select a role"
                    />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectItem value="customer">

                      Customer

                    </SelectItem>


                    <SelectItem value="cashier">

                      Counter Staff

                    </SelectItem>


                    <SelectItem value="kitchen">

                      Kitchen Staff

                    </SelectItem>


                    <SelectItem value="admin">

                      Admin

                    </SelectItem>


                    <SelectItem value="organization">

                      Organization

                    </SelectItem>

                  </SelectContent>

                </Select>

              )}

            />


            {errors.role && (

              <p className="text-xs text-red-500 mt-1">

                {errors.role.message}

              </p>

            )}

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div>

            <Label
              htmlFor="password"
              className="text-sm font-medium"
            >

              Password *

            </Label>


            <div className="relative mt-1.5">

              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />


              <Input

                id="password"

                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }

                autoComplete="new-password"

                {...register('password')}

                placeholder="Min 6 characters"

                className="pl-9 pr-10 h-11 rounded-xl"

              />


              <button

                type="button"

                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }

                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"

              >

                {showPassword

                  ? <EyeOff className="h-4 w-4" />

                  : <Eye className="h-4 w-4" />

                }

              </button>

            </div>


            {errors.password && (

              <p className="text-xs text-red-500 mt-1">

                {errors.password.message}

              </p>

            )}

          </div>


          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <div>

            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
            >

              Confirm Password *

            </Label>


            <div className="relative mt-1.5">

              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />


              <Input

                id="confirmPassword"

                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }

                autoComplete="new-password"

                {...register('confirmPassword')}

                placeholder="Repeat password"

                className="pl-9 pr-10 h-11 rounded-xl"

              />


              <button

                type="button"

                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }

                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"

              >

                {showConfirmPassword

                  ? <EyeOff className="h-4 w-4" />

                  : <Eye className="h-4 w-4" />

                }

              </button>

            </div>


            {errors.confirmPassword && (

              <p className="text-xs text-red-500 mt-1">

                {errors.confirmPassword.message}

              </p>

            )}

          </div>


          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <Button

            type="submit"

            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-5 rounded-xl glow-primary mt-2"

            disabled={isLoading}

          >

            {isLoading
              ? 'Creating account...'
              : 'Create Account'}

            <ArrowRight className="ml-2 h-4 w-4" />

          </Button>

        </form>


        {/* =================================================
            ALREADY HAVE ACCOUNT
        ================================================= */}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Sign In
          </button>
        </p>


      </motion.div>

    </div>

  );

};


export default Register;