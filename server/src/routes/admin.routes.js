import express from 'express'
import {
  addStudent, getAllStudents, deleteStudent, updateStudent, promoteAllStudents,
  addTeacher, getAllTeachers, deleteTeacher, updateTeacher,
  addCourse, getAllCourses, assignTeacherToCourse, updateCourse, deleteCourse,
} from '../controllers/adminController.js'
import { protect } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('admin'))

router.get('/students', getAllStudents)
router.post('/students', addStudent)
router.delete('/students/:id', deleteStudent)
router.put('/students/:id', updateStudent)
router.put('/students/promote/all', promoteAllStudents)

router.get('/teachers', getAllTeachers)
router.post('/teachers', addTeacher)
router.put('/teachers/:id', updateTeacher)
router.delete('/teachers/:id', deleteTeacher)

router.get('/courses', getAllCourses)
router.post('/courses', addCourse)
router.put('/courses/:id', updateCourse)
router.delete('/courses/:id', deleteCourse)
router.post('/courses/assign-teacher', assignTeacherToCourse)

export default router