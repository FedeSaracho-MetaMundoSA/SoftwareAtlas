# ATLAS — Sistema Clínico Quiropráctico

Prototipo de interfaz para gestión de pacientes, consultas, seguimiento y reportes clínicos.

## Ejecutar en desarrollo

Requisitos: Node.js y npm.

```powershell
npm install --legacy-peer-deps
npm run dev
```

Abrir `http://localhost:3000`. El modo `--legacy-peer-deps` resuelve el conflicto actual entre las versiones declaradas de Vite y esbuild; no modifica `package.json`.

Para generar una compilación estática: `npm run build`. Para borrar artefactos de compilación en Windows o macOS/Linux: `npm run clean`. Para eliminar también las dependencias instaladas: `npm run clean:deps` (se reinstalan con npm).

## Estado y límites importantes

Este repositorio sigue siendo un **prototipo**, no un sistema clínico listo para producción. No cargues información real de pacientes: parte de los registros de ejemplo se guarda en `localStorage` sin cifrado y el servidor local puede guardar datos en `data/`. Esa carpeta está excluida de Git.

La pantalla de acceso y la configuración de perfil son demostrativas; no implementan autenticación ni autorización. Recuperación de contraseña, 2FA, envío de email y enlaces compartidos requieren servicios de backend y están deshabilitados o identificados como no configurados. El reporte se puede imprimir y guardar como PDF desde el diálogo del navegador.

Las sugerencias de transcripción/IA son borradores. Verifica manualmente identidad, antecedentes, hallazgos, diagnóstico y tratamiento antes de conservarlos. El contenido clínico no debe considerarse consejo médico ni reemplazar la evaluación de un profesional.

## Configuración de IA

Para las funciones del servidor que usan Gemini, define `GEMINI_API_KEY` en un archivo `.env` local basado en `.env.example`. No publiques claves ni archivos `.env`.
