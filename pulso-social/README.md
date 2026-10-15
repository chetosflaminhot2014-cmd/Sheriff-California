# Asistente de Juan

Aplicación web conversacional para tareas, ideas, programación y organización. La interfaz y el backend son parte de este proyecto; las respuestas las genera un modelo de pesos abiertos servido por Hugging Face Inference Providers. No utiliza la API ni el SDK de Google Gemini.

## Modelo y proveedor

- Modelo predeterminado: `google/gemma-2-2b-it:fastest`.
- API: `https://router.huggingface.co/v1/chat/completions`.
- El sufijo `:fastest` solicita al enrutador el proveedor disponible más rápido para ese modelo.
- Puedes cambiar el modelo con la variable de entorno `HF_MODEL`, siempre que el modelo esté disponible en Inference Providers para tu cuenta.

La disponibilidad, velocidad y límites dependen del proveedor y de los créditos de tu cuenta. El nivel gratuito de Hugging Face tiene créditos limitados; no se promete uso ilimitado.

## Ejecutar localmente

Requiere Node.js 18 o superior.

1. Ejecuta `npm install`.
2. Configura `HF_TOKEN` en el entorno o en un archivo `.env` local.
3. Opcionalmente configura `HF_MODEL`; por defecto es `google/gemma-2-2b-it:fastest`.
4. Ejecuta `npm start`.
5. Abre `http://localhost:3000`.

Crea un token en https://huggingface.co/settings/tokens y concede el permiso para realizar llamadas a Inference Providers. Nunca guardes el token en el frontend, ni lo subas a GitHub.

## Desplegar en Render

Configura el servicio Node.js existente:

- **Root Directory:** `pulso-social`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Variable secreta obligatoria:** `HF_TOKEN` = tu token de Hugging Face con permiso de inferencia.
- **Opcional:** `HF_MODEL` = `google/gemma-2-2b-it:fastest`.

Después del despliegue, visita `/api/health`. Debe devolver `ok: true` y `configured: true`. Esto solo confirma que el token existe; para confirmar que el modelo responde hay que enviar un mensaje real desde el chat.

## Privacidad e historial

El historial se guarda en el almacenamiento local del navegador y el contexto reciente se envía al proveedor para generar cada respuesta. No escribas contraseñas ni datos personales sensibles. La IA puede equivocarse.
