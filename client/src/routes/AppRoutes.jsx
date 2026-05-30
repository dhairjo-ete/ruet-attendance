import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute.jsx'
import StudentRoute from './StudentRoute.jsx'
import TeacherRoute from './TeacherRoute.jsx'
import AdminRoute from './AdminRoute.jsx'

import Login from '../pages/auth/Login.jsx'
import Home from '../pages/Home.jsx'
import Unauthorized from '../pages/common/Unauthorized.jsx'
import NotFound from '../pages/common/NotFound.jsx'

import StudentDashboard from '../pages/student/StudentDashboard.jsx'
import AttendanceHistory from '../pages/student/AttendanceHistory.jsx'
import StudentCourses from '../pages/student/StudentCourses.jsx'
import StudentProfile from '../pages/student/StudentProfile.jsx'

import TeacherDashboard from '../pages/teacher/TeacherDashboard.jsx'
import TakeAttendance from '../pages/teacher/TakeAttendance.jsx'
import EditAttendance from '../pages/teacher/EditAttendance.jsx'
import CourseStudents from '../pages/teacher/CourseStudents.jsx'
import TeacherProfile from '../pages/teacher/TeacherProfile.jsx'


import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import ManageStudents from '../pages/admin/ManageStudents.jsx'
import ManageTeachers from '../pages/admin/ManageTeachers.jsx'
import ManageCourses from '../pages/admin/ManageCourses.jsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/unauthorized' element={<Unauthorized />} />

      <Route path='/student/dashboard' element={<StudentRoute><StudentDashboard /></StudentRoute>} />
      <Route path='/student/attendance' element={<StudentRoute><AttendanceHistory /></StudentRoute>} />
      <Route path='/student/courses' element={<StudentRoute><StudentCourses /></StudentRoute>} />
      <Route path='/student/profile' element={<StudentRoute><StudentProfile /></StudentRoute>} />

      <Route path='/teacher/dashboard' element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
      <Route path='/teacher/attendance/:courseId' element={<TeacherRoute><TakeAttendance /></TeacherRoute>} />
      <Route path='/teacher/attendance/edit/:courseId' element={<TeacherRoute><EditAttendance /></TeacherRoute>} />
      <Route path='/teacher/course/:courseId/students' element={<TeacherRoute><CourseStudents /></TeacherRoute>} />
      <Route path='/teacher/profile' element={<TeacherRoute><TeacherProfile /></TeacherRoute>} />


      <Route path='/admin/dashboard' element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path='/admin/students' element={<AdminRoute><ManageStudents /></AdminRoute>} />
      <Route path='/admin/teachers' element={<AdminRoute><ManageTeachers /></AdminRoute>} />
      <Route path='/admin/courses' element={<AdminRoute><ManageCourses /></AdminRoute>} />

      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes