'use client'
import { useState, useEffect, useRef } from 'react'
import './globals.css'

export default function Home() {
  const [mensajes, setMensajes] = useState([])
  const [input, setInput] = useState('')
  const [imagen, setImagen] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [creditos, setCreditos] = useState(2)
  const [userId, setUserId] = useState('')
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
    }
    setUserId(id)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagen(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const enviar = async () => {
    if ((!input.trim() &&!imagen) || cargando) return

    const nuevoMensaje = {
      rol: 'user',
      texto: input,
      imagen: preview
    }
    setMensajes([...mensajes, nuevoMensaje])

    const textoTemp = input
    const imagenTemp = imagen
    setInput('')
    setImagen(null)
    setPreview(null)
    setCargando(true)

    try {
      const formData = new FormData()
      formData.append('mensaje', textoTemp)
      formData.append('userId', userId)
      if (imagenTemp) formData.append('imagen', imagenTemp)

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.error) {
        alert(data.error)
        setMensajes(mensajes)
        setCargando(false)
        return
      }

      setMensajes(prev => [...prev, { rol: 'ai', texto: data.respuesta }])
      setCreditos(data.creditos_restantes)

    } catch (error) {
      alert('Error de conexión')
      setMensajes(mensajes)
    }

    setCargando(false)
  }

  const nuevoChat = () => {
    setMensajes([])
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div style={{ fontSize: '22px', fontWeight: 'bold', padding: '16px', textAlign: 'center', color: '#fff', borderBottom: '1px solid #2a2a2a', marginBottom: '10px' }}>
          AICODEX
        </div>
        <button className="new-chat-btn" onClick={nuevoChat}>
          + Nuevo chat
        </button>

        <div className="credits-badge">
          Preguntas gratis: {creditos}/2<br/>
          Foto = 3 créditos
        </div>

        <div style={{ marginTop: 'auto', fontSize: '12px', color: '#6e6e6e' }}>
          Groq para texto ilimitado<br/>
          Gemini para fotos
        </div>
      </div>

      <div className="chat-main">
        <div className="messages">
          {mensajes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#6e6e6e' }}>
              <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>¿En qué te ayudo?</h1>
              <p>Texto = gratis ilimitado. Fotos = 3 créditos cada una</p>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div key={i} className={'message ${msg.rol}'}>
              <div className="avatar">{msg.rol === 'user'? '👤' : '🤖'}</div>
              <div className="bubble">
                {msg.imagen && <img src={msg.imagen} className="preview-img" />}
                {msg.texto}
              </div>
            </div>
          ))}

          {cargando && (
            <div className="message ai">
              <div className="avatar">🤖</div>
              <div className="bubble loading">Escribiendo...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {preview && (
            <div style={{ maxWidth: '800px', margin: '0 auto 10px' }}>
              <img src={preview} className="preview-img" />
              <button onClick={() => {setImagen(null); setPreview(null)}} style={{ marginLeft: '10px' }}>Quitar</button>
            </div>
          )}

          <div className="input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button
              className="file-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={cargando}
            >
              📎
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' &&!e.shiftKey) {
                  e.preventDefault()
                  enviar()
                }
              }}
              placeholder={imagen? "Describe la imagen..." : "Escribí tu mensaje..."}
              rows={1}
              disabled={cargando || creditos === 0}
            />

            <button
              className="send-btn"
              onClick={enviar}
              disabled={cargando || (!input.trim() &&!imagen) || creditos === 0}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}