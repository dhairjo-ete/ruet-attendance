import axiosInstance from './axiosInstance.js'

export const getEligibleStudentsForClass = async (courseId, date) => {
  const { data } = await axiosInstance.get(`/attendance/eligible?courseId=${courseId}&date=${date}`)
  return data
}

export const takeAttendance = async (courseId, date, records) => {
  const { data } = await axiosInstance.post('/attendance', { courseId, date, records })
  return data
}

export const getCourseAttendance = async (courseId) => {
  const { data } = await axiosInstance.get(`/attendance/course/${courseId}`)
  return data
}

export const editAttendance = async (recordId, status) => {
  const { data } = await axiosInstance.put(`/attendance/${recordId}`, { status })
  return data
}
