import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Admin from '../models/Admin.js'
import generateToken from '../utils/generateToken.js'

export const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body
    if (!studentId || !password) {
      return res.status(400).json({ message: 'Please provide student ID and password' })
    }
    const student = await Student.findOne({ studentId })
    if (!student) {
      return res.status(401).json({ message: 'Invalid student ID or password' })
    }
    const isMatch = await student.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid student ID or password' })
    }
    res.status(200).json({
      _id: student._id,
      name: student.name,
      studentId: student.studentId,
      registration: student.registration,
      session: student.session,
      series: student.series,
      currentSemester: student.currentSemester,
      labGroup: student.labGroup,
      department: student.department,
      role: 'student',
      isFirstLogin: student.isFirstLogin,
      token: generateToken(student._id, 'student'),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }
    const teacher = await Teacher.findOne({ email })
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    const isMatch = await teacher.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.status(200).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      designation: teacher.designation,
      department: teacher.department,
      website: teacher.website || '',
      role: 'teacher',
      token: generateToken(teacher._id, 'teacher'),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    const isMatch = await admin.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.status(200).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      token: generateToken(admin._id, 'admin'),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    const { id, role } = req.user
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    if (role === 'student') {
      const student = await Student.findById(id)
      student.password = newPassword
      student.isFirstLogin = false
      await student.save()
    } else if (role === 'teacher') {
      const teacher = await Teacher.findById(id)
      teacher.password = newPassword
      await teacher.save()
    }
    res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req, res) => {
  try {
    const { id, role } = req.user
    let user
    if (role === 'student') {
      user = await Student.findById(id).select('-password')
    } else if (role === 'teacher') {
      user = await Teacher.findById(id).select('-password')
    } else if (role === 'admin') {
      user = await Admin.findById(id).select('-password')
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ ...user._doc, role })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}