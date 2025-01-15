import { Activity } from "./activity";
import { SingleEnrollment } from "./enrollment";

export interface AsignGrade {
  id_activity: number;
  grades: GradeSave[];
}

interface GradeSave {
  id_enrollment: number;
  grade: number;
}

export interface Grade{
  id_activity: number;
  id_enrollment: number;
  grade: number;
  enrollment: SingleEnrollment;
}

export interface GradeReceive{
  id_activity: number;
  id_enrollment: number;
  grade: number;
}

export interface GradeUsers{
  id_activity: number;
  id_enrollment: number;
  grade: number;
  activity: Activity;
}