import express from 'express'
import { getTeacherProfile, getTeacherCourses, getMySupervisedStudents, updateTeacherProfile } from '../controllers/teacherController.js'
import { protect } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('teacher'))

router.get('/profile', getTeacherProfile)
router.get('/courses', getTeacherCourses)
router.get('/supervisions', getMySupervisedStudents)
router.put('/profile', updateTeacherProfile)


export default router