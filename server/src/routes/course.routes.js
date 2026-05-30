import express from 'express'
import { getAllAvailableCourses, getCourseById, endCourse } from '../controllers/courseController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getAllAvailableCourses)
router.get('/:id', protect, getCourseById)
router.put('/:id/end', protect, endCourse)

export default router