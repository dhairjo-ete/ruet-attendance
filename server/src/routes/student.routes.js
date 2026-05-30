import express from 'express'
import {
  getStudentProfile,
  getStudentAttendance,
  getAllStudentAttendance,
  enrollInCourse,
  enrollInMultipleCourses,
  chooseSupervisor,
  getMySupervisions,
  unenrollFromCourse,
  deselectSupervisor,
} from '../controllers/studentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('student'))

router.get('/profile', getStudentProfile)
router.get('/attendance', getAllStudentAttendance)
router.get('/attendance/:courseId', getStudentAttendance)
router.post('/enroll/:courseId', enrollInCourse)
router.delete('/enroll/:courseId', unenrollFromCourse)
router.post('/enroll-all', enrollInMultipleCourses)
router.post('/supervisor', chooseSupervisor)
router.delete('/supervisor', deselectSupervisor)
router.get('/supervisions', getMySupervisions)

export default router