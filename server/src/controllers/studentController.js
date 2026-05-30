import Student from '../models/Student.js'
import Course from '../models/Course.js'
import Attendance from '../models/Attendance.js'
import Supervision from '../models/Supervision.js'
import { calculatePercentage } from '../utils/calculatePercentage.js'
import { calculateMarks } from '../utils/attendanceMarks.js'

export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select('-password')
      .populate('enrolledCourses')
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.status(200).json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    if (course.isEnded) return res.status(400).json({ message: 'Course has ended' })
    const student = await Student.findById(studentId)
    if (student.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }
    student.enrolledCourses.push(courseId)
    await student.save()
    if (!course.students.includes(studentId)) {
      course.students.push(studentId)
      await course.save()
    }
    res.status(200).json({ message: 'Enrolled successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const chooseSupervisor = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body
    const studentId = req.user.id
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    if (!course.requiresSupervisor) {
      return res.status(400).json({ message: 'This course does not require a supervisor' })
    }
    const existing = await Supervision.findOne({ student: studentId, course: courseId })
    if (existing) {
      existing.teacher = teacherId
      await existing.save()
      return res.status(200).json({ message: 'Supervisor updated successfully' })
    }
    await Supervision.create({ student: studentId, teacher: teacherId, course: courseId })
    res.status(201).json({ message: 'Supervisor chosen successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const enrollInMultipleCourses = async (req, res) => {
  try {
    const { courseIds } = req.body
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: 'No course IDs provided' })
    }
    const studentId = req.user.id
    const student = await Student.findById(studentId)
    let enrolledCount = 0
    let skippedCount = 0
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId)
      if (!course || course.isEnded) { skippedCount++; continue }
      if (student.enrolledCourses.includes(courseId)) { skippedCount++; continue }
      student.enrolledCourses.push(courseId)
      if (!course.students.includes(studentId)) {
        course.students.push(studentId)
        await course.save()
      }
      enrolledCount++
    }
    await student.save()
    res.status(200).json({ message: `Enrolled in ${enrolledCount} course(s). ${skippedCount} skipped.`, enrolledCount, skippedCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMySupervisions = async (req, res) => {
  try {
    const supervisions = await Supervision.find({ student: req.user.id })
      .populate('teacher', 'name designation department')
      .populate('course', 'courseCode courseTitle semester')
    res.status(200).json(supervisions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getStudentAttendance = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id
    const records = await Attendance.find({ student: studentId, course: courseId }).sort({ date: -1 })
    const total = records.length
    const present = records.filter(r => r.status === 'present').length
    const absent = total - present
    const percentage = calculatePercentage(present, total)
    const marks = calculateMarks(parseFloat(percentage))
    res.status(200).json({ records, summary: { total, present, absent, percentage, marks } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id
    const student = await Student.findById(studentId).populate({
      path: 'enrolledCourses',
      populate: { path: 'teachers', select: 'name designation department website' }
    })
    const result = []
    for (const course of student.enrolledCourses) {
      if (course.requiresAttendance) {
        const records = await Attendance.find({ student: studentId, course: course._id })
        const total = records.length
        const present = records.filter(r => r.status === 'present').length
        const absent = total - present
        const percentage = calculatePercentage(present, total)
        const marks = calculateMarks(parseFloat(percentage))
        result.push({
          course: {
            _id: course._id,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            credit: course.credit,
            type: course.type,
            semester: course.semester,
          },
          total, present, absent, percentage, marks,
          isProject: false,
          warning: percentage < 50 ? 'Cannot sit in final exam' :
                   percentage < 75 ? 'Not eligible for scholarship' : null,
        })
      } else if (course.requiresSupervisor) {
        const supervision = await Supervision.findOne({ student: studentId, course: course._id })
          .populate('teacher', 'name designation department website')
        
        result.push({
          course: {
            _id: course._id,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            credit: course.credit,
            type: course.type,
            semester: course.semester,
            teachers: course.teachers || []
          },
          isProject: true,
          supervisor: supervision ? supervision.teacher : null
        })
      } else if (course.type === 'training') {
        const supervision = await Supervision.findOne({ student: studentId, course: course._id })
          .populate('teacher', 'name designation department website')
        
        result.push({
          course: {
            _id: course._id,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            credit: course.credit,
            type: course.type,
            semester: course.semester,
            teachers: course.teachers || []
          },
          isProject: true,
          supervisor: supervision ? supervision.teacher : null
        })
      }
    }
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: 'Student not found' })
    
    student.enrolledCourses = student.enrolledCourses.filter(c => c.toString() !== courseId)
    await student.save()
    
    course.students = course.students.filter(s => s.toString() !== studentId)
    await course.save()
    
    await Supervision.findOneAndDelete({ student: studentId, course: courseId })
    
    res.status(200).json({ message: 'Unenrolled successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deselectSupervisor = async (req, res) => {
  try {
    const { courseId } = req.body
    const studentId = req.user.id
    
    const existing = await Supervision.findOneAndDelete({ student: studentId, course: courseId })
    if (!existing) {
      return res.status(404).json({ message: 'No supervisor selected for this course' })
    }
    res.status(200).json({ message: 'Supervisor deselected successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}