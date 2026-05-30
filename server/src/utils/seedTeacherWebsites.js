import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Teacher from '../models/Teacher.js'

dotenv.config()

const teacherWebsites = [
  { name: 'Dr. Md. Kamal Hosain', url: 'https://www.ete.ruet.ac.bd/kamaleteruet' },
  { name: 'Dr Md Munjure Mowla', url: 'https://www.ete.ruet.ac.bd/munjuremowlaete' },
  { name: 'Dr. Mst. Fateha Samad', url: 'https://www.ete.ruet.ac.bd/fatehaeteruet' },
  { name: 'Dr. Shah Ariful Hoque Chowdhury', url: 'https://www.ete.ruet.ac.bd/ariful' },
  { name: 'Dr. Tushar Kanti Roy', url: 'https://www.ete.ruet.ac.bd/roykanti03' },
  { name: 'Jannatul Robaiat Mou', url: 'https://www.ete.ruet.ac.bd/jannatulruet' },
  { name: 'Sham Datto', url: 'https://www.ete.ruet.ac.bd/shamdatto' },
  { name: 'Md. Aslam Mollah', url: 'https://www.ete.ruet.ac.bd/Md.%20Aslam%20Mollah' },
  { name: 'A. S. M. Badrudduza', url: 'https://www.ete.ruet.ac.bd/asmbkanon' },
  { name: 'Md. Rakib Hossain', url: 'https://www.ete.ruet.ac.bd/rakibhossain' },
  { name: 'Shuvra Prokash Biswas', url: 'https://www.ete.ruet.ac.bd/shuvraprokash' },
  { name: 'Hasan Sarker', url: 'https://www.ete.ruet.ac.bd/hasansarker' },
  { name: 'Farzana Akter', url: 'https://www.ete.ruet.ac.bd/farzana' },
  { name: 'Md Abu Ismail Siddique', url: 'https://www.ete.ruet.ac.bd/ismail' },
  { name: 'Sharaf Tasnim', url: 'https://www.ete.ruet.ac.bd/sharaftasnim786' },
  { name: 'Md. Tarek Hassan', url: 'https://www.ete.ruet.ac.bd/tarekhassan' },
  { name: 'Mohammed Nazmul Islam Nahin', url: 'https://www.ete.ruet.ac.bd/nahin' },
  { name: 'Rubaeat Ahammed', url: 'https://www.ete.ruet.ac.bd/rubaeatahammed' },
  { name: 'Rifa Tabassum Mim', url: 'https://www.ete.ruet.ac.bd/rifamim' }
]

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .replace(/[.\s]/g, '') // remove spaces and dots
}

const seedWebsites = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance')
    console.log('MongoDB Connected for seeding teacher website URLs')

    const teachers = await Teacher.find()
    console.log(`Found ${teachers.length} teachers in the database.`)

    let updatedCount = 0

    for (const teacher of teachers) {
      const normalizedTeacherName = normalizeName(teacher.name)
      const match = teacherWebsites.find(tw => {
        const normalizedSeedName = normalizeName(tw.name)
        // Check if one contains the other or they are very similar
        return normalizedTeacherName.includes(normalizedSeedName) || normalizedSeedName.includes(normalizedTeacherName)
      })

      if (match) {
        teacher.website = match.url
        await teacher.save()
        console.log(`Updated website for: ${teacher.name} -> ${match.url}`)
        updatedCount++
      } else {
        console.log(`No website match found for teacher: ${teacher.name}`)
      }
    }

    console.log(`Successfully updated ${updatedCount} teachers.`)
    process.exit(0)
  } catch (error) {
    console.error('Error seeding websites:', error)
    process.exit(1)
  }
}

seedWebsites()
