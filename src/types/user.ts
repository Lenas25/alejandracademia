import { Section } from "./section";

export interface User {
  id: string | number;
  name?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  phone?: string;
  sections?: Section[];
  createdAt?: Date;
  updatedAt?: Date;
  final_grade?: number;

}

export type CreateUser = Omit<User,'createdAt' | 'updatedAt'>;