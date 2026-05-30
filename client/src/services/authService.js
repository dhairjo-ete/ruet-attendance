import axiosInstance from './axiosInstance.js'

export const studentLogin = async (studentId, password) => {
  const { data } = await axiosInstance.post('/auth/student/login', { studentId, password })
  return data
}

export const teacherLogin = async (email, password) => {
  const { data } = await axiosInstance.post('/auth/teacher/login', { email, password })
  return data
}

export const adminLogin = async (email, password) => {
  const { data } = await axiosInstance.post('/auth/admin/login', { email, password })
  return data
}

export const changePassword = async (newPassword) => {
  const { data } = await axiosInstance.put('/auth/change-password', { newPassword })
  return data
}

export const getMe = async () => {
  const { data } = await axiosInstance.get('/auth/me')
  return data
}