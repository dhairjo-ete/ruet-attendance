import { LAB_GROUPS } from '../constants/labGroups.js'

export const getEligibleStudents = (course, date) => {
  if (course.type === 'theory') {
    return course.students
  }

  const d = new Date(date)
  const weekNumber = Math.ceil(d.getDate() / 7)

  let eligibleGroup

  if (course.labCredit === 1.5) {
    const dayOfWeek = d.getDay()
    eligibleGroup = dayOfWeek % 2 === 0
      ? LAB_GROUPS.FIRST_30
      : LAB_GROUPS.SECOND_30
  } else {
    eligibleGroup = weekNumber % 2 !== 0
      ? LAB_GROUPS.FIRST_30
      : LAB_GROUPS.SECOND_30
  }

  return course.students.filter(s => s.labGroup === eligibleGroup)
}