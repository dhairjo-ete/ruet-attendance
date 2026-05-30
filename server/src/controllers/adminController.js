import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Course from '../models/Course.js'

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

const designationOrder = {
  'Professor': 1,
  'Associate Professor': 2,
  'Assistant Professor': 3,
  'Lecturer': 4,
}

const getSeriesFromSession = (session) => {
  const year = session.split('-')[0]
  return year.slice(-2)
}

const getNextSemester = (current) => {
  const index = semesters.indexOf(current)
  if (index === -1 || index === semesters.length - 1) return null
  return semesters[index + 1]
}

const getSpecialCourseFlags = (type) => {
  if (type === 'project' || type === 'thesis') {
    return { requiresAttendance: false, requiresSupervisor: true, isTraining: false }
  }
  if (type === 'training') {
    return { requiresAttendance: false, requiresSupervisor: false, isTraining: true }
  }
  return { requiresAttendance: true, requiresSupervisor: false, isTraining: false }
}

export const addStudent = async (req, res) => {
  try {
    const { name, studentId, registration, session, currentSemester, labGroup, email } = req.body
    const series = getSeriesFromSession(session)
    const exists = await Student.findOne({ studentId })
    if (exists) return res.status(400).json({ message: 'Student ID already exists' })
    const student = await Student.create({
      name, studentId, registration, session, series, labGroup, email,
      password: registration,
      currentSemester: currentSemester || '1st Year Odd Semester',
    })
    res.status(201).json({ message: 'Student added successfully', student })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password')
      .sort({ studentId: 1 })
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Student deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateStudent = async (req, res) => {
  try {
    const { name, studentId, registration, session, currentSemester, labGroup, email } = req.body
    const series = getSeriesFromSession(session)
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, studentId, registration, session, series, currentSemester, labGroup, email },
      { new: true }
    ).select('-password')
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.status(200).json({ message: 'Student updated successfully', student })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const promoteAllStudents = async (req, res) => {
  try {
    const { session } = req.body
    const students = await Student.find({ session })
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this session' })
    }
    let promoted = 0
    let alreadyMax = 0
    for (const student of students) {
      const next = getNextSemester(student.currentSemester)
      if (next) {
        // Pull student ID from all Course student rosters to maintain data synchronization
        await Course.updateMany(
          { students: student._id },
          { $pull: { students: student._id } }
        )
        
        student.currentSemester = next
        student.enrolledCourses = []
        await student.save()
        promoted++
      } else {
        alreadyMax++
      }
    }
    res.status(200).json({
      message: `${promoted} students promoted successfully. ${alreadyMax} already in final semester.`
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addTeacher = async (req, res) => {
  try {
    const { name, email, password, designation, department } = req.body
    const exists = await Teacher.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Teacher already exists' })
    const teacher = await Teacher.create({ name, email, password, designation, department })
    res.status(201).json({ message: 'Teacher added successfully', teacher })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select('-password')
    const sorted = teachers.sort((a, b) => {
      const aOrder = designationOrder[a.designation] || 99
      const bOrder = designationOrder[b.designation] || 99
      return aOrder - bOrder
    })
    res.status(200).json(sorted)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateTeacher = async (req, res) => {
  try {
    const { name, email, designation, department } = req.body
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { name, email, designation, department },
      { new: true }
    ).select('-password')
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' })
    res.status(200).json({ message: 'Teacher updated successfully', teacher })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteTeacher = async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addCourse = async (req, res) => {
  try {
    const { courseCode, courseTitle, credit, type, labCredit, semester } = req.body
    const flags = getSpecialCourseFlags(type)
    const course = await Course.create({
      courseCode, courseTitle,
      credit: type === 'lab' ? Number(labCredit) : Number(credit),
      type,
      labCredit: type === 'lab' ? Number(labCredit) : null,
      semester,
      ...flags,
    })
    res.status(201).json({ message: 'Course added successfully', course })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teachers', 'name email designation department')
      .populate('students', 'name studentId series')
    const sorted = courses.sort((a, b) => {
      return semesters.indexOf(a.semester) - semesters.indexOf(b.semester)
    })
    res.status(200).json(sorted)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCourse = async (req, res) => {
  try {
    const { courseCode, courseTitle, credit, type, labCredit, semester, teachers } = req.body
    const flags = getSpecialCourseFlags(type)

    const oldCourse = await Course.findById(req.params.id)
    if (!oldCourse) return res.status(404).json({ message: 'Course not found' })

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        courseCode, courseTitle,
        credit: type === 'lab' ? Number(labCredit) : Number(credit),
        type,
        labCredit: type === 'lab' ? Number(labCredit) : null,
        semester,
        teachers: teachers || oldCourse.teachers,
        ...flags,
      },
      { new: true }
    )

    if (teachers) {
      const oldTeacherIds = oldCourse.teachers.map(t => t.toString())
      const newTeacherIds = teachers.map(t => t.toString())

      // Remove course from teachers no longer assigned
      const removedTeachers = oldTeacherIds.filter(id => !newTeacherIds.includes(id))
      for (const tId of removedTeachers) {
        await Teacher.findByIdAndUpdate(tId, {
          $pull: { assignedCourses: course._id }
        })
      }

      // Add course to newly assigned teachers
      const addedTeachers = newTeacherIds.filter(id => !oldTeacherIds.includes(id))
      for (const tId of addedTeachers) {
        await Teacher.findByIdAndUpdate(tId, {
          $addToSet: { assignedCourses: course._id }
        })
      }
    }

    res.status(200).json({ message: 'Course updated successfully', course })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const assignTeacherToCourse = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    if (course.isTraining) {
      return res.status(400).json({ message: 'Industrial Training does not require a teacher' })
    }
    if (!course.teachers.includes(teacherId)) {
      course.teachers.push(teacherId)
      await course.save()
    }
    const teacher = await Teacher.findById(teacherId)
    if (!teacher.assignedCourses.includes(courseId)) {
      teacher.assignedCourses.push(courseId)
      await teacher.save()
    }
    res.status(200).json({ message: 'Teacher assigned successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}