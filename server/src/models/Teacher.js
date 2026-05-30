import mongoose from 'mongoose'
import pkg from 'bcryptjs'
const { hash, compare, genSalt } = pkg

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true, trim: true },
  website: { type: String, trim: true, default: '' },
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
}, { timestamps: true })

teacherSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await genSalt(10)
  this.password = await hash(this.password, salt)
})

teacherSchema.methods.matchPassword = async function (enteredPassword) {
  return await compare(enteredPassword, this.password)
}

export default mongoose.model('Teacher', teacherSchema)