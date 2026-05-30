import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { calculatePercentage } from '../utils/calculatePercentage.js'
import { calculateMarks } from '../utils/attendanceMarks.js'

const semesters = [
  '1st Year Odd Semester',
  '1st Year Even Semester',
  '2nd Year Odd Semester',
  '2nd Year Even Semester',
  '3rd Year Odd Semester',
  '3rd Year Even Semester',
  '4th Year Odd Semester',
  '4th Year Even Semester',
]

export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params

    const student = await Student.findById(studentId)
      .select('-password')
      .populate('enrolledCourses')

    if (!student) return res.status(404).json({ message: 'Student not found' })

    if (student.enrolledCourses) {
      student.enrolledCourses.sort((a, b) => {
        const indexA = semesters.indexOf(a.semester)
        const indexB = semesters.indexOf(b.semester)
        if (indexA !== indexB) return indexA - indexB
        return a.courseCode.localeCompare(b.courseCode)
      })
    }

    const report = []

    for (const course of student.enrolledCourses) {
      const records = await Attendance.find({
        student: studentId,
        course: course._id,
      })

      const total = records.length
      const present = records.filter(r => r.status === 'present').length
      const absent = total - present
      const percentage = calculatePercentage(present, total)
      const marks = calculateMarks(parseFloat(percentage))

      report.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        credit: course.credit,
        type: course.type,
        total,
        present,
        absent,
        percentage,
        marks,
        warning: percentage < 50 ? 'Cannot sit in final exam' :
                 percentage < 75 ? 'Not eligible for scholarship' : null,
      })
    }

    res.status(200).json({ student, report })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}