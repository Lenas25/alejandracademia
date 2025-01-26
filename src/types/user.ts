import { Course } from "./course";

export interface User {
  id: string;
  name: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  courses: Course[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUser = Omit<User,'createdAt' | 'updatedAt'>;