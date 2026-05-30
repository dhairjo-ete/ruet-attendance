import axiosInstance from './axiosInstance.js'

export const getTeacherProfile = async () => {
  const { data } = await axiosInstance.get('/teachers/profile')
  return data
}

export const getTeacherCourses = async () => {
  const { data } = await axiosInstance.get('/teachers/courses')
  return data
}

export const getMySupervisedStudents = async () => {
  const { data } = await axiosInstance.get('/teachers/supervisions')
  return data
}

export const updateTeacherProfile = async (website) => {
  const { data } = await axiosInstance.put('/teachers/profile', { website })
  return data
}