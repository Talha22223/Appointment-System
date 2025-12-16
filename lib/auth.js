import jwt from 'jsonwebtoken'

export function withAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' })
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET)
      req.user = verified
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ message: 'Token verification failed' })
    }
  }
}

export function withDoctor(handler) {
  return withAuth(async (req, res) => {
    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      return handler(req, res)
    }
    return res.status(403).json({ message: 'Access denied. Doctors only.' })
  })
}

export function withAdmin(handler) {
  return withAuth(async (req, res) => {
    if (req.user.role === 'admin') {
      return handler(req, res)
    }
    return res.status(403).json({ message: 'Access denied. Admin only.' })
  })
}
