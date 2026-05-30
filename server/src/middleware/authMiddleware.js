import jwt from 'jsonwebtoken'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Admin from '../models/Admin.js'

export const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')

      req.user = { id: decoded.id, role: decoded.role }

      let userExists = false
      if (decoded.role === 'student') {
        userExists = await Student.exists({ _id: decoded.id })
      } else if (decoded.role === 'teacher') {
        userExists = await Teacher.exists({ _id: decoded.id })
      } else if (decoded.role === 'admin') {
        userExists = await Admin.exists({ _id: decoded.id })
      }

      if (!userExists) {
        return res.status(401).json({ message: 'Not authorized, user not found' })
      }

      next()
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' })
  }
}
