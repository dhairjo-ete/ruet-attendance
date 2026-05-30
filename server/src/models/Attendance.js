import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
  },
  labGroup: {
    type: String,
    enum: ['first30', 'second30', null],
    default: null,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true })

attendanceSchema.index(
  { course: 1, student: 1, date: 1 },
  { unique: true }
)

const Attendance = mongoose.model('Attendance', attendanceSchema)
export default Attendance