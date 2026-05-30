import axiosInstance from './axiosInstance.js'

export const getAllAvailableCourses = async () => {
  const { data } = await axiosInstance.get('/courses')
  return data
}

export const getCourseById = async (id) => {
  const { data } = await axiosInstance.get(`/courses/${id}`)
  return data
}

export const endCourse = async (id) => {
  const { data } = await axiosInstance.put(`/courses/${id}/end`)
  return data
}