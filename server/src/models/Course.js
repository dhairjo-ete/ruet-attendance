import mongoose from 'mongoose'

const semesters = [
  '1st Year Odd Semester',
  '1st Year Even Semester',
  '2nd Year Odd Semester',
  '2nd Year Even Semester',
  '3rd Year Odd Semester',
  '3rd Year Even Semester',
  '4th Year Odd Semester',
  '4th Year Even Semester',
]

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, trim: true },
  courseTitle: { type: String, required: true, trim: true },
  credit: { type: Number, required: true },
  type: {
    type: String,
    enum: ['theory', 'lab', 'project', 'thesis', 'training'],
    required: true,
  },
  labCredit: { type: Number, enum: [0.75, 1.5], default: null },
  semester: { type: String, enum: semesters, required: true },
  requiresAttendance: { type: Boolean, default: true },
  requiresSupervisor: { type: Boolean, default: false },
  isTraining: { type: Boolean, default: false },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isEnded: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Course', courseSchema)