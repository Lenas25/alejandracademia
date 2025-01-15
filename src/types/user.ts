export interface User {
  id: number;
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

export interface CreateUser extends Omit<User,'createdAt' | 'updatedAt'> {
}