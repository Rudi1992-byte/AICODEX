import Groq from 'groq-sdk'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

function missingKeys(hasImage) {
  const missing = []
  if (!process.env.GROQ_API_KEY && !hasImage) missing.push('GROQ_API_KEY')
  if (!process.env.GEMINI_API_KEY && hasImage) missing.push('GEMINI_API_KEY')
  return missing
}

function toGroqMessages(history, prompt) {
  const system = {
    role: 'system',
    content:
      'Eres IACODEX, un asistente claro, util y creativo. Responde siempre en espanol salvo que el usuario pida otro idioma.'
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item?.role && item?.content)
        .slice(-10)
        .map((item) => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: String(item.content).slice(0, 6000)
        }))
    : []

  return [
    system,
    ...safeHistory,
    {
      role: 'user',
      content: prompt || 'Hola'
    }
  ]
}

async function fileToBase64(file) {
  const bytes = await file.arrayBuffer()
  return Buffer.from(bytes).toString('base64')
}

export async function POST(req) {
  try {
    const formData = await req.formData()
    const prompt = String(formData.get('message') || '').trim()
    const rawHistory = String(formData.get('history') || '[]')
    const image = formData.get('image')
    const hasImage = image && typeof image === 'object' && image.size > 0
    const missing = missingKeys(hasImage)

    if (!prompt && !hasImage) {
      return Response.json({ error: 'Escribe un mensaje o sube una foto.' }, { status: 400 })
    }

    if (missing.length) {
      return Response.json(
        {
          error: `Falta configurar ${missing.join(', ')} en tus variables de entorno.`
        },
        { status: 500 }
      )
    }

    let history = []
    try {
      history = JSON.parse(rawHistory)
    } catch {
      history = []
    }

    if (hasImage) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const base64 = await fileToBase64(image)
      const result = await ai.interactions.create({
        model: GEMINI_MODEL,
        input: [
          {
            type: 'text',
            text:
              prompt ||
              'Analiza esta imagen en espanol. Describe lo importante, interpreta detalles y responde con claridad.'
          },
          {
            type: 'image',
            data: base64,
            mime_type: image.type || 'image/jpeg'
          }
        ]
      })

      return Response.json({
        answer: result.output_text || 'No pude generar una respuesta para esta imagen.',
        details: {
          provider: 'AICODEX',
          model: 'AICODEX Vision',
          mode: 'vision',
          imageName: image.name || 'imagen',
          imageType: image.type || 'desconocido'
        }
      })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: toGroqMessages(history, prompt),
      temperature: 0.7,
      max_tokens: 1200
    })

    return Response.json({
      answer: completion.choices?.[0]?.message?.content || 'No pude generar una respuesta.',
      details: {
        provider: 'AICODEX',
        model: 'AICODEX Texto',
        mode: 'text',
        tokens: completion.usage?.total_tokens || null
      }
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      {
        error: 'No pude procesar el mensaje. Revisa tus claves API y vuelve a intentar.'
      },
      { status: 500 }
    )
  }
}
