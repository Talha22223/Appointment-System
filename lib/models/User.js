import prisma from '../prisma'
import bcrypt from 'bcryptjs'

// ===== Internal helpers =====
const attachCompatFields = (user) => {
  if (!user) return null

  user._id = user.id // backward compatibility
  user.validatePassword = async (password) =>
    bcrypt.compare(password, user.password)

  return user
}

const buildWhere = (query = {}) => {
  const where = {}

  if (query.email) where.email = query.email.toLowerCase()
  if (query.id) where.id = query.id
  if (query.role) where.role = query.role

  return where
}

// ===== User helper (Mongoose-like) =====
const User = {
  // Find one user
  async findOne(query) {
    const user = await prisma.user.findFirst({
      where: buildWhere(query)
    })

    return attachCompatFields(user)
  },

  // Find by ID
  async findById(id) {
    if (!id) return null

    const user = await prisma.user.findUnique({
      where: { id }
    })

    return attachCompatFields(user)
  },

  // Find all
  async find(query = {}) {
    const users = await prisma.user.findMany({
      where: buildWhere(query)
    })

    return users.map(u => ({ ...u, _id: u.id }))
  },

  // Count documents
  async countDocuments(query = {}) {
    return prisma.user.count({
      where: buildWhere(query)
    })
  },

  // new User() compatibility
  create(data) {
    return {
      ...data,
      async save() {
        const hashedPassword = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(12)
        )

        const user = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            password: hashedPassword,
            phone: data.phone ?? null,
            image: data.image ?? null,
            address: data.address ?? {},
            gender: data.gender ?? null,
            dob: data.dob ?? null,
            role: data.role || 'patient'
          }
        })

        user._id = user.id
        return user
      }
    }
  },

  // select() helper
  select(fields) {
    const exclude = fields.startsWith('-')
    const fieldList = fields.replace('-', '').split(' ')

    return {
      async exec(user) {
        if (!user) return null

        if (exclude) {
          fieldList.forEach(field => delete user[field])
        }

        return user
      }
    }
  }
}

// ===== Helpers =====
export const createUser = (data) => User.create(data)

// ===== Export =====
export default User
