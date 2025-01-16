export interface User {
  id: string;
  name: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUser = Omit<User,'createdAt' | 'updatedAt'>;