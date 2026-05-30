import Teacher from '../models/Teacher.js'
import Course from '../models/Course.js'
import Supervision from '../models/Supervision.js'
import Student from '../models/Student.js'


export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id)
      .select('-password')
      .populate('assignedCourses')
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' })
    res.status(200).json(teacher)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      teachers: req.user.id,
      isEnded: false,
    }).populate('students', 'name studentId series labGroup').lean()

    const supervisions = await Supervision.find({ teacher: req.user.id })
      .populate('student', 'name studentId session series')
      .lean()

    const coursesWithSupervisions = courses.map(course => {
      const courseSupervisions = supervisions.filter(s => s.course.toString() === course._id.toString())
      return {
        ...course,
        projectSupervisors: courseSupervisions.map(s => ({
          teacher: s.teacher,
          student: s.student
        }))
      }
    })

    // Dynamically find semester for each series from the database
    const seriesList = ['20', '21', '22', '23', '24', '25']
    const seriesSemesterMap = {}
    for (const ser of seriesList) {
      const student = await Student.findOne({ series: ser })
      if (student) {
        seriesSemesterMap[ser] = student.currentSemester
      } else {
        // Fallback mapping based on RUET standard progression
        const fallbacks = {
          '20': '4th Year Even Semester',
          '21': '4th Year Odd Semester',
          '22': '3rd Year Odd Semester',
          '23': '2nd Year Odd Semester',
          '24': '1st Year Even Semester',
          '25': '1st Year Odd Semester',
        }
        seriesSemesterMap[ser] = fallbacks[ser]
      }
    }

    res.status(200).json({ courses: coursesWithSupervisions, seriesSemesterMap })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export const getMySupervisedStudents = async (req, res) => {
  try {
    const supervisions = await Supervision.find({ teacher: req.user.id })
      .populate('student', 'name studentId session series')
      .populate('course', 'courseCode courseTitle semester')
    res.status(200).json(supervisions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateTeacherProfile = async (req, res) => {
  try {
    const { website } = req.body
    const teacher = await Teacher.findById(req.user.id)
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' })

    teacher.website = website || ''
    await teacher.save()

    res.status(200).json({ message: 'Profile updated successfully', teacher })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}