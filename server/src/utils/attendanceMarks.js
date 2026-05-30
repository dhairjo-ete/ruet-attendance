import { ATTENDANCE_RULES } from '../constants/attendanceRules.js'

export const calculateMarks = (percentage) => {
  for (const rule of ATTENDANCE_RULES) {
    if (percentage >= rule.minPercentage) {
      return rule.marks
    }
  }
  return 0
}