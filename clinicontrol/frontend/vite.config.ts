import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/(auth|pacientes|medicos|especialidades|turnos|citas|helpers|consultas|recetas|notificaciones|roles|sucursales|generos|grupos-sanguineos|estados-cita|usuarios|camas|hospitalizacion|hospitalizaciones|triage|triajes|reports|interacciones|diagnosticos|alergias|vacunas|audit|reportes|impresion|agenda|health|adjuntos|tipos-atencion|cuentas|clientes|planes|logs|caja|arqueo)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
