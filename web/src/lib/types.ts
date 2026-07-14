export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  about?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  role: 'GUEST' | 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  emailVerified?: boolean;
}