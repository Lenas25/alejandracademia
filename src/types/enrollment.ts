import { Course } from "./course";
import { User } from "./user";


export interface Enrollment{
    id: number;
    final_grade: number;
    enrollment_date: Date;
    user: User[] | User;
    course: Course[];
    active: boolean;
}

export interface CreateEnrollment{
    users: {id:string}[];
}

export interface SingleEnrollment{
    id: number;
    final_grade: number;
    enrollment_date: Date;
    user: User;
    course: Course;
    active: boolean;
}