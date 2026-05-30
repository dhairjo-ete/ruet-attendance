import express from 'express'
import {
  takeAttendance,
  getEligibleStudentsForClass,
  editAttendance,
  getCourseAttendance,
} from '../controllers/attendanceController.js'
import { protect } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('teacher'))

router.post('/', takeAttendance)
router.get('/eligible', getEligibleStudentsForClass)
router.put('/:id', editAttendance)
router.get('/course/:courseId', getCourseAttendance)

export default router