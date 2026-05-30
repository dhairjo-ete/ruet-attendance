import express from 'express'
import {
  studentLogin,
  teacherLogin,
  adminLogin,
  changePassword,
  getMe,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/student/login', loginLimiter, studentLogin)
router.post('/teacher/login', loginLimiter, teacherLogin)
router.post('/admin/login', loginLimiter, adminLogin)
router.put('/change-password', protect, changePassword)
router.get('/me', protect, getMe)

export default router