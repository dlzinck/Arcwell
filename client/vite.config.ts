import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configure Vite for the Arcwell frontend.
export default defineConfig({
  // Enable React support and Tailwind CSS processing.
  plugins: [react(), tailwindcss()],

  // Configure the development server.
  server: {
    // Forward API requests to the Express backend.
    // This avoids hardcoding the backend URL in React components.
    proxy: {
      '/api': {
        // Express runs on port 3000 during local development.
        target: 'http://localhost:3000',

        // Use the backend's host when forwarding requests.
        changeOrigin: true,
      },
    },
  },
})
