import mongoose from 'mongoose'

const semesterSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true })

const Semester = mongoose.model('Semester', semesterSchema)
export default Semester