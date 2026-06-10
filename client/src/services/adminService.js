import axiosInstance from './axiosInstance.js'

export const getAllStudents = async () => {
  const { data } = await axiosInstance.get('/admin/students')
  return data
}

export const addStudent = async (studentData) => {
  const { data } = await axiosInstance.post('/admin/students', studentData)
  return data
}

export const deleteStudent = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/students/${id}`)
  return data
}

export const updateStudent = async (id, studentData) => {
  const { data } = await axiosInstance.put(`/admin/students/${id}`, studentData)
  return data
}

export const promoteAllStudents = async (session) => {
  const { data } = await axiosInstance.put('/admin/students/promote/all', { session })
  return data
}

export const bulkImportStudents = async (students) => {
  const { data } = await axiosInstance.post('/admin/students/bulk-import', { students })
  return data
}


export const getAllTeachers = async () => {
  const { data } = await axiosInstance.get('/admin/teachers')
  return data
}

export const addTeacher = async (teacherData) => {
  const { data } = await axiosInstance.post('/admin/teachers', teacherData)
  return data
}

export const updateTeacher = async (id, teacherData) => {
  const { data } = await axiosInstance.put(`/admin/teachers/${id}`, teacherData)
  return data
}

export const deleteTeacher = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/teachers/${id}`)
  return data
}

export const getAllCourses = async () => {
  const { data } = await axiosInstance.get('/admin/courses')
  return data
}

export const addCourse = async (courseData) => {
  const { data } = await axiosInstance.post('/admin/courses', courseData)
  return data
}

export const updateCourse = async (id, courseData) => {
  const { data } = await axiosInstance.put(`/admin/courses/${id}`, courseData)
  return data
}

export const deleteCourse = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/courses/${id}`)
  return data
}

export const assignTeacherToCourse = async (courseId, teacherId) => {
  const { data } = await axiosInstance.post('/admin/courses/assign-teacher', { courseId, teacherId })
  return data
}