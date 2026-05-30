import Attendance from '../models/Attendance.js'
import Course from '../models/Course.js'
import { getEligibleStudents } from '../utils/getEligibleStudents.js'

export const takeAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body
    const teacherId = req.user.id

    const existing = await Attendance.findOne({
      course: courseId,
      date,
      teacher: teacherId,
    })

    if (existing) {
      return res.status(400).json({ message: 'Attendance already taken for this course on this date' })
    }

    const attendanceRecords = records.map(r => ({
      course: courseId,
      student: r.studentId,
      teacher: teacherId,
      date,
      status: r.status,
      labGroup: r.labGroup || null,
    }))

    await Attendance.insertMany(attendanceRecords)
    res.status(201).json({ message: 'Attendance saved successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getEligibleStudentsForClass = async (req, res) => {
  try {
    const { courseId, date } = req.query

    const course = await Course.findById(courseId).populate('students')
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const students = getEligibleStudents(course, date)
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const editAttendance = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const record = await Attendance.findById(id)
    if (!record) return res.status(404).json({ message: 'Attendance record not found' })

    const recordDate = new Date(record.date)
    const now = new Date()
    const diffHours = (now - recordDate) / (1000 * 60 * 60)

    if (diffHours > 24) {
      return res.status(400).json({ message: 'Attendance can only be edited within 24 hours' })
    }

    record.status = status
    record.isEdited = true
    record.editedAt = new Date()
    await record.save()

    res.status(200).json({ message: 'Attendance updated successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params

    const records = await Attendance.find({ course: courseId })
      .populate('student', 'name studentId section labGroup')
      .sort({ date: -1 })

    res.status(200).json(records)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}