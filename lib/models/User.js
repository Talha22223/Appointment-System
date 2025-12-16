import prisma from '../prisma'
import bcrypt from 'bcryptjs'

// User helper functions that replicate Mongoose model behavior
const User = {
  // Find one user by query
  async findOne(query) {
    const where = {}
    if (query.email) where.email = query.email.toLowerCase()
    if (query.id) where.id = query.id
    
    const user = await prisma.user.findFirst({ where })
    if (user) {
      user._id = user.id // Backward compatibility
      user.validatePassword = async (password) => {
        return await bcrypt.compare(password, user.password)
      }
    }
    return user
  },

  // Find user by ID
  async findById(id) {
    if (!id) return null
    const user = await prisma.user.findUnique({ where: { id } })
    if (user) {
      user._id = user.id // Backward compatibility
      user.validatePassword = async (password) => {
        return await bcrypt.compare(password, user.password)
      }
    }
    return user
  },

  // Find all users
  async find(query = {}) {
    const where = {}
    if (query.role) where.role = query.role
    
    const users = await prisma.user.findMany({ where })
    return users.map(user => ({ ...user, _id: user.id }))
  },

  // Count documents
  async countDocuments(query = {}) {
    const where = {}
    if (query.role) where.role = query.role
    
    return await prisma.user.count({ where })
  },

  // Create a new user (for backward compatibility with new User() pattern)
  create(data) {
    return {
      ...data,
      async save() {
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(data.password, salt)
        
        // Map role string to Prisma enum value
        const roleValue = data.role || 'patient'
        
        const user = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            password: hashedPassword,
            phone: data.phone || null,
            image: data.image || null,
            address: data.address || {},
            gender: data.gender ? data.gender : null,
            dob: data.dob || null,
            role: roleValue
          }
        })
        
        user._id = user.id
        return user
      }
    }
  },

  // Select helper - returns a modified findById that excludes fields
  select(fields) {
    const exclude = fields.startsWith('-')
    const fieldList = fields.replace('-', '').split(' ')
    
    return {
      async exec(user) {
        if (!user) return null
        if (exclude) {
          fieldList.forEach(field => {
            delete user[field]
          })
        }
        return user
      }
    }
  }
}

// Helper function to create a new User instance (for new User() pattern)
export function createUser(data) {
  return User.create(data)
}

// Export for backward compatibility
export default User

