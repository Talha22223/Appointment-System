// CORS helper for API routes
export function applyCors(req, res) {
  // Allow requests from frontend side
  const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ]
  
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }

  return false
}
