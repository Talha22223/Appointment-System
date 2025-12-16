import { applyCors } from '../../../lib/cors'

// Chatbot API endpoint that integrates with OpenAI GPT
export default async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { message, conversationHistory = [] } = req.body
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' })
    }

    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        message: 'OpenAI API key not configured',
        reply: "I'm sorry, the AI service is not configured yet. Please contact the administrator."
      })
    }

    // Build the messages array for GPT
    const systemMessage = {
      role: 'system',
      content: `You are a helpful medical appointment assistant for a healthcare platform. 
You can help users with:
- Information about booking doctor appointments
- Information about lab tests and lab techniques
- General health-related questions
- Navigation help for the website
- Appointment scheduling guidance

Be friendly, professional, and concise. If users have urgent medical concerns, 
always advise them to contact emergency services or visit a hospital.
Do not provide specific medical diagnoses or treatment recommendations.`
    }

    const messages = [
      systemMessage,
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Configurable: gpt-4 or gpt-3.5-turbo
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return res.status(500).json({ 
        message: 'Error communicating with AI service',
        reply: "I'm having trouble connecting right now. Please try again in a moment."
      })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again."

    res.status(200).json({ 
      reply,
      usage: data.usage
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    res.status(500).json({ 
      message: 'Server error',
      reply: "I'm sorry, something went wrong. Please try again later."
    })
  }
}
