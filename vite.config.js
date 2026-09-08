import glsl from 'vite-plugin-glsl'
export default { root: 'src', publicDir: '../static', base: './', server: { host: '127.0.0.1', open: false }, build: { outDir: '../dist', emptyOutDir: true, sourcemap: false }, plugins: [glsl()] }
