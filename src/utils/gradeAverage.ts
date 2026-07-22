import { GradeUsers } from "@/types/grade";

/**
 * Weighted running average of a student's graded activities.
 *
 * promedio = Σ(nota_i × pct_i) / Σ(pct_i of graded activities)
 *
 * Only activities that already have a recorded grade contribute to the
 * result, so the average stays meaningful even when the section's
 * activity percentages don't add up to 100 or when the student has only
 * been graded on some of them. Returns `null` when there is nothing
 * graded yet (or the graded activities carry no weight), so callers can
 * render a neutral placeholder instead of a misleading 0.
 */
export function calculateWeightedAverage(grades: GradeUsers[]): number | null {
  if (!grades || grades.length === 0) return null;

  const totalWeight = grades.reduce(
    (sum, gradeItem) => sum + (Number(gradeItem.activity?.percentage) || 0),
    0,
  );
  if (totalWeight <= 0) return null;

  const weightedSum = grades.reduce(
    (sum, gradeItem) =>
      sum + Number(gradeItem.grade) * (Number(gradeItem.activity?.percentage) || 0),
    0,
  );

  return weightedSum / totalWeight;
}
