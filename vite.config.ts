import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site base path
  base: '/course-1-preflop-midnight-rebuild/',
  // Serve markdown content from the repo-local artifacts directory at /course-md/*.md.
  // Keep this directory synced from Company OS source-of-truth before publishing.
  publicDir: path.resolve(__dirname, 'company/projects/course-1-preflop/artifacts'),
})
