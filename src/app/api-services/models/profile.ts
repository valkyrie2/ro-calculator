export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  status: string;
  role: UserRole;
  /** ISO timestamp; empty string when the user has no premium grant. */
  premiumExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}
