# Pulso Social

Aplicación web adaptable con IA para preparar mensajes a partir de intereses observables. El proyecto Sheriff existente en la raíz del repositorio se conserva intacto.

## Ejecutar localmente

Requiere Node.js 18 o superior y una clave de API del proveedor.

1. Abre una terminal en esta carpeta.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env` y configura `OPENAI_API_KEY`.
4. Ejecuta `npm start`.
5. Abre http://localhost:3000.

La API puede generar cargos separados de una suscripción de ChatGPT. Nunca publiques la clave en el frontend o en GitHub.

## Desplegar

Crea un servicio web Node.js desde este repositorio, configura Root Directory como `pulso-social`, Build Command `npm install`, Start Command `npm start`, y agrega `OPENAI_API_KEY` como variable de entorno privada. No uses Static Site porque la IA necesita el backend Node.js.

Adjunta únicamente imágenes que tengas permiso para compartir. El análisis no garantiza una respuesta y no debe usarse para inferir atributos personales sensibles.
