import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function POST(req) {
  try {
    const formData = await req.formData()
    const mensaje = formData.get('mensaje')
    const imagen = formData.get('imagen')
    const userId = formData.get('userId')

    if (!userId) return Response.json({ error: 'Usuario no identificado' })

    // 1. Verificar créditos
    let { data: usuario } = await supabase
     .from('usuarios')
     .select('*')
     .eq('id', userId)
     .single()

    if (!usuario) {
      await supabase.from('usuarios').insert({ id: userId, creditos: 2 })
      usuario = { creditos: 2, es_premium: false }
    }

    const costoCredito = imagen && imagen.size > 0? 3 : 1

    if (usuario.creditos < costoCredito &&!usuario.es_premium) {
      return Response.json({
        error: 'Necesitás ${costoCredito} créditos. Te quedan ${usuario.creditos}. Actualizá a Premium $3/mes'
      })
    }

    // 2. ELEGIR MOTOR SEGÚN SI HAY IMAGEN
    let respuesta = ''

    if (!imagen || imagen.size === 0) {
      // === SIN FOTO = GROQ ILIMITADO ===
      const chat = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: mensaje || "Hola" }],
        temperature: 0.7,
        max_tokens: 1000
      })
      respuesta = chat.choices[0].message.content
    }
    else {
      // === CON FOTO = GEMINI 15/min ===
      try {
        const modelo = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
        const bytes = await imagen.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')

        const prompt = mensaje || "Describe esta imagen en español detalladamente"

        const resultado = await modelo.generateContent([
          prompt,
          { inlineData: { data: base64, mimeType: imagen.type } }
        ])
        respuesta = resultado.response.text()
      } catch (err) {
        if (err.message.includes('429')) {
          return Response.json({
            error: 'Límite de fotos por minuto alcanzado. Probá en 1 minuto o mandá solo texto gratis con Groq'
          })
        }
        throw err
      }
    }

    // 3. Restar créditos
    if (!usuario.es_premium) {
      await supabase
       .from('usuarios')
       .update({ creditos: usuario.creditos - costoCredito })
       .eq('id', userId)
    }

    return Response.json({
      respuesta,
      creditos_restantes: usuario.es_premium? '∞' : usuario.creditos - costoCredito
    })

  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error procesando tu mensaje' })
  }
}