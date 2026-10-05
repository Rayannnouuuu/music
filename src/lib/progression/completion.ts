// Guards exercise XP against being farmed by repeated clicks: each exercise
// can only pay out once per calendar day. Without this, "Marquer comme fait"
// had no memory of its own effect, so XP/levels were trivially free and the
// whole progression system measured nothing real.
export function hasCompletedExerciseToday(
  completedByDay: Record<string, string[]>,
  day: string,
  exerciseId: string,
): boolean {
  return (completedByDay[day] ?? []).includes(exerciseId)
}

export function recordExerciseCompletion(
  completedByDay: Record<string, string[]>,
  day: string,
  exerciseId: string,
): Record<string, string[]> {
  if (hasCompletedExerciseToday(completedByDay, day, exerciseId)) return completedByDay
  return { ...completedByDay, [day]: [...(completedByDay[day] ?? []), exerciseId] }
}
