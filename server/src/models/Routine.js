import mongoose from 'mongoose'

const routineSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  day: {
    type: String,
    enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
  },
  labGroup: {
    type: String,
    enum: ['first30', 'second30', 'both', null],
    default: null,
  },
}, { timestamps: true })

const Routine = mongoose.model('Routine', routineSchema)
export default Routine