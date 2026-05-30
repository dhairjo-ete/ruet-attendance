import Course from '../models/Course.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Supervision from '../models/Supervision.js'

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

export const getAllAvailableCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const courses = await Course.find({
      isEnded: false,
      semester: student.currentSemester,
    }).populate('teachers', 'name designation department')
      .select('-students')

    courses.sort((a, b) => {
      const indexA = semesters.indexOf(a.semester)
      const indexB = semesters.indexOf(b.semester)
      if (indexA !== indexB) {
        return indexA - indexB
      }
      return a.courseCode.localeCompare(b.courseCode)
    })

    res.status(200).json(courses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teachers', 'name email designation')
      .populate('students', 'name studentId series labGroup')
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const isProjectOrSupervised = course.type === 'project' || course.type === 'thesis' || course.type === 'training'
    if (isProjectOrSupervised && req.user.role === 'teacher') {
      const supervisions = await Supervision.find({ course: course._id, teacher: req.user.id })
      const supervisedStudentIds = supervisions.map(s => s.student.toString())
      const courseObj = course.toObject()
      courseObj.students = courseObj.students.filter(student => supervisedStudentIds.includes(student._id.toString()))
      return res.status(200).json(courseObj)
    }

    res.status(200).json(course)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const endCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    // Mark course as ended — hides it from the teacher's dashboard
    course.isEnded = true

    // Remove this course from each assigned teacher's assignedCourses list
    if (course.teachers && course.teachers.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: course.teachers } },
        { $pull: { assignedCourses: course._id } }
      )
    }

    // Clear teacher assignments so student/admin portals show "No teacher assigned"
    // Students remain enrolled; only the teacher link is removed
    course.teachers = []

    // Delete supervision records since the supervising teacher is no longer assigned
    await Supervision.deleteMany({ course: course._id })

    await course.save()
    res.status(200).json({ message: 'Course ended successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}