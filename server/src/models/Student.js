import mongoose from 'mongoose'
import pkg from 'bcryptjs'
const { hash, compare, genSalt } = pkg

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

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, unique: true, trim: true },
  registration: { type: String, required: true, trim: true },
  session: { type: String, required: true },
  series: { type: String, required: true },
  currentSemester: { type: String, enum: semesters, default: '1st Year Odd Semester' },
  labGroup: { type: String, enum: ['first30', 'second30'], required: true },
  department: { type: String, default: 'ETE' },
  email: { type: String, trim: true },
  password: { type: String, required: true },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  isFirstLogin: { type: Boolean, default: true },
}, { timestamps: true })

studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await genSalt(10)
  this.password = await hash(this.password, salt)
})

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await compare(enteredPassword, this.password)
}

export default mongoose.model('Student', studentSchema)