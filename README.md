# IACODEX

Chat web estilo ChatGPT preparado para Vercel.

- Interfaz con registro local por nombre.
- Historial guardado en el navegador sin base de datos.
- Subida de imagen.
- Panel de detalles de AICODEX.
- Logo en `public/iacodex-logo.jpeg`.
- Tema con fondo blanco o fondo negro.
- Panel derecho preparado para anuncios de Adsterra.

## Ejecutar local

```bash
npm install
npm run dev
```

Crea `.env.local` en la raiz del proyecto:

```bash
GROQ_API_KEY=tu_api_key_de_groq
GEMINI_API_KEY=tu_api_key_de_gemini
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-3.5-flash
IMAGEN_MODEL=imagen-4.0-generate-001
NEXT_PUBLIC_ADSTERRA_BANNER_KEY=tu_key_de_banner_adsterra
```

Para generar imagenes, el usuario puede escribir algo como:

```text
creame una imagen de un robot futurista en una ciudad neon
```

## Anuncios Adsterra

En Adsterra crea un bloque de anuncio tipo banner/display de `300x250`.

Adsterra te va a dar un codigo parecido a este:

```html
<script type="text/javascript">
  atOptions = {
    key: "TU_KEY",
    format: "iframe",
    height: 250,
    width: 300,
    params: {}
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/TU_KEY/invoke.js"></script>
```

Copia solamente el valor de `key` y cargalo en `.env.local`:

```bash
NEXT_PUBLIC_ADSTERRA_BANNER_KEY=TU_KEY
```

Si cambias esta variable, reinicia el servidor con `npm run dev`.

## Subir a Vercel

1. Importa este repositorio en Vercel.
2. Deja `Root Directory` en la raiz del repositorio.
3. Agrega las variables `GROQ_API_KEY`, `GEMINI_API_KEY`, `IMAGEN_MODEL` y `NEXT_PUBLIC_ADSTERRA_BANNER_KEY`.
4. Deploy.
