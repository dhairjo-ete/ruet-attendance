import mongoose from 'mongoose'

const supervisionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
}, { timestamps: true })

supervisionSchema.index({ student: 1, course: 1 }, { unique: true })

export default mongoose.model('Supervision', supervisionSchema)