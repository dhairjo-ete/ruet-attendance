import axiosInstance from './axiosInstance.js'

export const getStudentProfile = async () => {
  const { data } = await axiosInstance.get('/students/profile')
  return data
}

export const getAllStudentAttendance = async () => {
  const { data } = await axiosInstance.get('/students/attendance')
  return data
}

export const getStudentAttendance = async (courseId) => {
  const { data } = await axiosInstance.get(`/students/attendance/${courseId}`)
  return data
}

export const enrollInCourse = async (courseId) => {
  const { data } = await axiosInstance.post(`/students/enroll/${courseId}`)
  return data
}

export const enrollInMultipleCourses = async (courseIds) => {
  const { data } = await axiosInstance.post('/students/enroll-all', { courseIds })
  return data
}

export const chooseSupervisor = async (courseId, teacherId) => {
  const { data } = await axiosInstance.post('/students/supervisor', { courseId, teacherId })
  return data
}

export const getMySupervisions = async () => {
  const { data } = await axiosInstance.get('/students/supervisions')
  return data
}

export const unenrollFromCourse = async (courseId) => {
  const { data } = await axiosInstance.delete(`/students/enroll/${courseId}`)
  return data
}

export const deselectSupervisor = async (courseId) => {
  const { data } = await axiosInstance.delete('/students/supervisor', { data: { courseId } })
  return data
}