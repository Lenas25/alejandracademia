import { Activity } from "./activity";
import { User } from "./user";

export interface Course {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  initialDate: Date;
  endDate: Date;
  duration: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  activities: Activity[];
  tutor?:  User;
  id_tutor?: string;
}


export interface CreateCourse extends Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'activities'|'tutor'> {
  activities: {name:string; percentage:number; new?:boolean}[];
}