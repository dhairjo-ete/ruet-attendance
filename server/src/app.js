import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import corsOptions from './config/cors.js'

import authRoutes from './routes/auth.routes.js'
import studentRoutes from './routes/student.routes.js'
import teacherRoutes from './routes/teacher.routes.js'
import adminRoutes from './routes/admin.routes.js'
import attendanceRoutes from './routes/attendance.routes.js'
import courseRoutes from './routes/course.routes.js'
import reportRoutes from './routes/report.routes.js'

import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/reports', reportRoutes)

app.use(notFound)
app.use(errorHandler)

export default app