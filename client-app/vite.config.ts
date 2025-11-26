import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		css: true,
	},
	build: {
		rollupOptions: {
			output: {
				advancedChunks: {
					groups: [
						{
							name: 'vendor',
							test: /node_modules\/(react|react-dom)/,
						},
						{
							name: 'mui',
							test: /node_modules\/@mui/,
						},
					],
				},
			},
		},
	},
})
