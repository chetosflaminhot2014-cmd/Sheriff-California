# Pulso Social

Aplicación web adaptable con IA para preparar mensajes a partir de intereses observables. El proyecto Sheriff existente en la raíz del repositorio se conserva intacto. La generación usa la API oficial de Google Gemini desde el backend Node.js.

## Ejecutar localmente

Requiere Node.js 18 o superior y una clave de API de Google AI Studio.

1. Abre una terminal en esta carpeta.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env` y configura `GEMINI_API_KEY`.
4. Ejecuta `npm start`.
5. Abre http://localhost:3000.

La API puede tener límites según las condiciones de Google. Nunca publiques la clave en el frontend ni en GitHub.

## Desplegar en Render

Configura el servicio web Node.js:

- **Root Directory:** `pulso-social`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variable:** `GEMINI_API_KEY` con tu clave privada de Google AI Studio.
- **Opcional:** `GEMINI_MODEL` = `gemini-2.5-flash`

No uses Static Site para este servicio, porque la IA requiere el backend Node.js. Después del despliegue visita `/api/health`; debe responder JSON con `ok: true` y `configured: true`.

Obtén una clave en https://aistudio.google.com/app/apikey. Adjunta únicamente imágenes que tengas permiso para compartir. El análisis no garantiza una respuesta y no debe usarse para inferir atributos personales sensibles.
