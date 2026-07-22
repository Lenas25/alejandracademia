import { Section } from "./section";
import { User } from "./user";

// Enrollment relates to a Section (renamed from the old Course) — mirrors
// BackSpa `src/enrollment/entities/enrollment.entity.ts`'s `section` field,
// which is a `@ManyToOne` (singular), not an array. Fixed per PR3
// verify-report WARNING — the plural `Enrollment` interface had kept the
// array cardinality from the pre-rename `course: Course[]` field, while the
// singular `SingleEnrollment` below was already correct.
export interface Enrollment{
    id: number;
    final_grade: number;
    enrollment_date: Date;
    user: User[] | User;
    section: Section;
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
    section: Section;
    active: boolean;
}