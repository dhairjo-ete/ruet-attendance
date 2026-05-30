import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { useEffect } from 'react'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'teacher') navigate('/teacher/dashboard')
      else if (user.role === 'admin') navigate('/admin/dashboard')
    } else {
      navigate('/login')
    }
  }, [user])

  return null
}

export default Home