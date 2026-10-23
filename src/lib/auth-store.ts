// import { create } from 'zustand';

// export type UserRole = 'admin' | 'cashier' | 'kitchen' | 'customer' | 'staff' | 'organization';

// export interface AuthUser {
//   id: string;
//   username: string;
//   name: string;
//   role: UserRole;
//   email?: string;
// }

// interface AuthStore {
//   user: AuthUser | null;
//   isAuthenticated: boolean;
//   login: (username: string, password: string) => { success: boolean; redirect: string };
//   register: (name: string, username: string, email: string, password: string, role: UserRole) => { success: boolean; redirect: string; message?: string };
//   logout: () => void;
// }

// const roleRedirects: Record<UserRole, string> = {
//   admin: '/admin',
//   cashier: '/pos',
//   kitchen: '/kitchen',
//   customer: '/menu?table=1',
//   staff: '/staff',
//   organization: '/organization',
// };

// const users: (AuthUser & { password: string })[] = [
//   { id: '1', username: 'admin', password: 'admin123', name: 'Admin Manager', role: 'admin', email: 'admin@cafe.com' },
//   { id: '2', username: 'cashier', password: 'cash123', name: 'Front Desk', role: 'cashier', email: 'cashier@cafe.com' },
//   { id: '3', username: 'kitchen', password: 'kitchen123', name: 'Chef Station', role: 'kitchen', email: 'kitchen@cafe.com' },
//   { id: '4', username: 'customer', password: 'customer123', name: 'Guest User', role: 'customer', email: 'guest@cafe.com' },
//   { id: '5', username: 'staff', password: 'staff123', name: 'Staff Member', role: 'staff', email: 'staff@cafe.com' },
//   { id: '6', username: 'org', password: 'org123', name: 'Organization Owner', role: 'organization', email: 'org@cafeflow.com' },
// ];

// export const useAuthStore = create<AuthStore>((set) => ({
//   user: null,
//   isAuthenticated: false,

//   login: (username, password) => {
//     const found = users.find(u => u.username === username && u.password === password);
//     if (found) {
//       const { password: _, ...user } = found;
//       set({ user, isAuthenticated: true });
//       return { success: true, redirect: roleRedirects[found.role] };
//     }
//     return { success: false, redirect: '' };
//   },

//   register: (name, username, email, password, role) => {
//     if (users.find(u => u.username === username)) {
//       return { success: false, redirect: '', message: 'Username already taken' };
//     }
//     const newUser: AuthUser & { password: string } = {
//       id: String(Date.now()),
//       username,
//       password,
//       name,
//       role,
//       email,
//     };
//     users.push(newUser);
//     const { password: _, ...user } = newUser;
//     set({ user, isAuthenticated: true });
//     return { success: true, redirect: roleRedirects[role] };
//   },

//   logout: () => set({ user: null, isAuthenticated: false }),
// }));


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'cashier' | 'kitchen_staff' | 'customer' | 'staff' | 'organization';

// 1. Updated to match the exact UserResponse coming from your FastAPI backend
export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  role: UserRole | string;
  restaurant_name?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // 2. We no longer do the API fetching/checking in the store. 
  // We just pass the successful data IN from the TanStack mutation.
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

// 3. Using Zustand's 'persist' middleware automatically saves the user/token to localStorage!
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Simply update the state with the data from the backend
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      // Wipe everything on logout
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'cafeflow-auth-storage', // The key used in your browser's Local Storage
    }
  )
);