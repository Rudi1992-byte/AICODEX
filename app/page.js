'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  Download,
  ImagePlus,
  Info,
  Menu,
  MessageSquarePlus,
  Moon,
  PanelRight,
  Send,
  Sun,
  User,
  X
} from 'lucide-react'

const suggestions = [
  'Escribime una respuesta profesional para un cliente',
  'Creame una imagen de un robot futurista',
  'Crea ideas para un negocio con IA',
  'Explicame este tema como si fuera principiante'
]

const ACTIVE_USER_KEY = 'iacodex:active-user'
const HISTORY_PREFIX = 'iacodex:history:'
const THEME_KEY = 'iacodex:theme'
const ADSTERRA_BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY || ''
const ADSTERRA_BANNER_URL = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_URL || ''

function AdsterraAd() {
  const adRef = useRef(null)

  useEffect(() => {
    if (!ADSTERRA_BANNER_KEY || !adRef.current) return

    adRef.current.innerHTML = ''
    window.atOptions = {
      key: ADSTERRA_BANNER_KEY,
      format: 'iframe',
      height: 250,
      width: 300,
      params: {}
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `//www.highperformanceformat.com/${ADSTERRA_BANNER_KEY}/invoke.js`
    adRef.current.appendChild(script)
  }, [])

  return (
    <section className="adPanel" aria-label="Anuncio">
      <div className="adLabel">Anuncio</div>
      {ADSTERRA_BANNER_KEY ? (
        <div className="adSlot" ref={adRef} />
      ) : ADSTERRA_BANNER_URL ? (
        <iframe className="adFrame" src={ADSTERRA_BANNER_URL} title="Anuncio" loading="lazy" />
      ) : (
        <div className="adPlaceholder">
          <strong>Espacio publicitario</strong>
          <span>Configura Adsterra para activar este bloque.</span>
        </div>
      )}
    </section>
  )
}

function userKey(name) {
  return `${HISTORY_PREFIX}${name.trim().toLowerCase().replace(/\s+/g, '-')}`
}

function safeMessages(messages) {
  return messages.map(({ id, role, content, createdAt, details, imageName, generatedImage }) => ({
    id,
    role,
    content,
    createdAt,
    details,
    imageName,
    generatedImage
  }))
}

function readHistory(name) {
  try {
    const saved = localStorage.getItem(userKey(name))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function wantsImageGeneration(prompt) {
  const text = prompt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return (
    /\b(crea|crear|creame|crearme|genera|generar|dibujame|dibuja|haz|hacer|disena|disename)\b/.test(text) &&
    /\b(imagen|foto|ilustracion|logo|dibujo)\b/.test(text)
  )
}

function createMessage(role, content, extras = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    ...extras
  }
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [userName, setUserName] = useState('')
  const [pendingName, setPendingName] = useState('')
  const [profileReady, setProfileReady] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [input, setInput] = useState('')
  const [image, setImage] = useState(null)
  const [imageMode, setImageMode] = useState(false)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState({
    provider: 'AICODEX',
    model: 'Asistente inteligente',
    mode: 'router',
    tokens: null
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileRef = useRef(null)
  const messagesEndRef = useRef(null)

  const canSend = useMemo(() => {
    return !loading && (input.trim().length > 0 || image)
  }, [image, input, loading])

  useEffect(() => {
    const savedName = localStorage.getItem(ACTIVE_USER_KEY) || ''
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    }
    if (savedName) {
      setUserName(savedName)
      setPendingName(savedName)
      setMessages(readHistory(savedName))
    }
    setProfileReady(true)
  }, [])

  useEffect(() => {
    if (!profileReady) return
    localStorage.setItem(THEME_KEY, theme)
  }, [profileReady, theme])

  useEffect(() => {
    if (!profileReady || !userName) return
    localStorage.setItem(userKey(userName), JSON.stringify(safeMessages(messages)))
  }, [messages, profileReady, userName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function startProfile(event) {
    event.preventDefault()
    const cleanName = pendingName.trim()
    if (!cleanName) {
      setError('Escribe tu nombre para entrar a AICODEX.')
      return
    }

    localStorage.setItem(ACTIVE_USER_KEY, cleanName)
    setUserName(cleanName)
    setMessages(readHistory(cleanName))
    setError('')
  }

  function switchProfile() {
    localStorage.removeItem(ACTIVE_USER_KEY)
    setUserName('')
    setPendingName('')
    setMessages([])
    setInput('')
    setError('')
    setImageMode(false)
    setSidebarOpen(false)
    removeImage()
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  function pickImage(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Solo puedes subir archivos de imagen.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setImageMode(false)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function removeImage() {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function sendMessage(text = input) {
    const cleanText = text.trim()
    if (!cleanText && !image) return

    const userMessage = createMessage('user', cleanText || 'Analiza esta imagen', {
      image: preview,
      imageName: image?.name || ''
    })

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('message', cleanText)
    const shouldGenerateImage = !image && (imageMode || wantsImageGeneration(cleanText))
    if (shouldGenerateImage) {
      formData.append('intent', 'generate-image')
    }
    formData.append(
      'history',
      JSON.stringify(
        messages.map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content
        }))
      )
    )
    if (image) formData.append('image', image)

    setImage(null)
    setPreview('')
    setImageMode(false)
    if (fileRef.current) fileRef.current.value = ''

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'No se pudo obtener respuesta.')
      }

      setMessages((current) => [
        ...current,
        createMessage('assistant', data.answer, {
          details: data.details,
          generatedImage: data.generatedImage || ''
        })
      ])
      setDetails(data.details)
    } catch (err) {
      setError(err.message)
      setMessages(nextMessages)
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setMessages([])
    setError('')
    setInput('')
    setImageMode(false)
    setSidebarOpen(false)
    removeImage()
    setDetails({
      provider: 'AICODEX',
      model: 'Asistente inteligente',
      mode: 'router',
      tokens: null
    })
  }

  function downloadGeneratedImage(imageUrl, id) {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `iacodex-imagen-${id}.png`
    link.click()
  }

  if (!profileReady) {
    return null
  }

  if (!userName) {
    return (
      <main className="loginShell">
        <form className="loginPanel" onSubmit={startProfile}>
          <img className="loginLogo" src="/iacodex-logo.jpeg" alt="AICODEX" />
          <h1>Entrar a AICODEX</h1>
          <p>Escribe un nombre para guardar tu historial en este dispositivo.</p>
          <input
            value={pendingName}
            onChange={(event) => setPendingName(event.target.value)}
            placeholder="Tu nombre"
            autoFocus
          />
          {error && <span className="loginError">{error}</span>}
          <button type="submit">Entrar</button>
        </form>
      </main>
    )
  }

  return (
    <main className="appShell" data-theme={theme}>
      <button className="mobileMenuToggle mobileOnly" onClick={() => setSidebarOpen((open) => !open)}>
        {sidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
      </button>
      {sidebarOpen && <button className="mobileScrim mobileOnly" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'isOpen' : ''}`}>
        <div className="brand">
          <img className="brandLogo" src="/iacodex-logo.jpeg" alt="AICODEX" />
          <div>
            <strong>IACODEX</strong>
            <span>{userName || 'Asistente IA'}</span>
          </div>
        </div>

        <button className="newChat" onClick={newChat}>
          <MessageSquarePlus size={18} />
          Nuevo chat
        </button>

        <button className="profileButton" onClick={switchProfile}>
          <User size={18} />
          Cambiar usuario
        </button>

        <button className="profileButton" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Fondo blanco' : 'Fondo negro'}
        </button>

        <nav className="chatList" aria-label="Chats">
          <button className="chatItem isActive">
            <Bot size={16} />
            Conversacion actual
          </button>
          <button className="chatItem">
            <Camera size={16} />
            Analisis de fotos
          </button>
          <button className="chatItem">
            <Info size={16} />
            Detalles de AICODEX
          </button>
        </nav>

        <div className="sidebarFooter">
          <div className="statusDot" />
          <span>Historial local activo para {userName}</span>
        </div>
      </aside>

      <section className="chatPanel">
        <header className="topbar">
          <div>
            <p>IACODEX</p>
            <span>Chat inteligente de AICODEX para {userName}</span>
          </div>
          <div className="topbarPill">
            <CheckCircle2 size={16} />
            AICODEX activo
          </div>
        </header>

        <div className="messages">
          {messages.length === 0 && (
            <section className="emptyState">
              <img className="heroLogo" src="/iacodex-logo.jpeg" alt="AICODEX" />
              <h1>Que hacemos hoy con IACODEX?</h1>
              <p>
                Escribe o sube una foto para que AICODEX te ayude con contexto.
              </p>
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => sendMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}</div>
              <div className="messageBody">
                <div className="messageMeta">
                  <strong>{message.role === 'assistant' ? 'IACODEX' : 'Tu'}</strong>
                  <span>{message.createdAt}</span>
                  {message.details?.provider && <em>{message.details.provider}</em>}
                </div>
                {message.image && (
                  <img className="messageImage" src={message.image} alt={message.imageName || 'Imagen subida'} />
                )}
                {message.generatedImage && (
                  <figure className="generatedFigure">
                    <img className="generatedImage" src={message.generatedImage} alt="Imagen generada por AICODEX" />
                    <button
                      className="downloadImage"
                      type="button"
                      onClick={() => downloadGeneratedImage(message.generatedImage, message.id)}
                    >
                      <Download size={16} />
                      Descargar
                    </button>
                  </figure>
                )}
                <p>{message.content}</p>
              </div>
            </article>
          ))}

          {loading && (
            <article className="message assistant">
              <div className="avatar">
                <Bot size={18} />
              </div>
              <div className="messageBody">
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="composerWrap"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSend) sendMessage()
          }}
        >
          {error && (
            <div className="errorBox">
              <Info size={16} />
              {error}
            </div>
          )}

          {preview && (
            <div className="imagePreview">
              <img src={preview} alt="Vista previa" />
              <div>
                <strong>{image?.name}</strong>
                <span>AICODEX analizara esta foto</span>
              </div>
              <button type="button" className="iconButton" onClick={removeImage}>
                <X size={18} />
              </button>
            </div>
          )}

          <div className="composer">
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} hidden />
            <button type="button" className="iconButton" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={21} />
            </button>
            <button
              type="button"
              className={`imageModeButton ${imageMode ? 'isActive' : ''}`}
              onClick={() => {
                setImageMode((active) => !active)
                setImage(null)
                setPreview('')
                if (fileRef.current) fileRef.current.value = ''
              }}
            >
              <ImagePlus size={18} />
              Crear imagen
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  if (canSend) sendMessage()
                }
              }}
              placeholder={
                imageMode
                  ? 'Describe la imagen que queres crear...'
                  : image
                    ? 'Pregunta algo sobre la imagen...'
                    : 'Escribe un mensaje para IACODEX...'
              }
              rows={1}
            />
            <button className="sendButton" type="submit" disabled={!canSend}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </section>

      <aside className="detailsPanel">
        <AdsterraAd />

        <div className="detailsHeader">
          <PanelRight size={18} />
          <strong>Detalles</strong>
        </div>
        <dl>
          <div>
            <dt>Plataforma</dt>
            <dd>{details.provider}</dd>
          </div>
          <div>
            <dt>Sistema</dt>
            <dd>{details.model}</dd>
          </div>
          <div>
            <dt>Modo</dt>
            <dd>{details.mode}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{details.tokens || 'Segun respuesta'}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{userName}</dd>
          </div>
        </dl>
      </aside>
    </main>
  )
}
