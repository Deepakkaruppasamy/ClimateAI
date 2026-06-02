
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname)
const clientDir = path.join(root, 'client')
const serverDir = path.join(root, 'server')

console.log('\n🌍 ClimateAI — Bootstrap Script\n')

function run(cmd, cwd) {
  console.log(`\n📦 Running: ${cmd} in ${cwd}`)
  execSync(cmd, { cwd, stdio: 'inherit', shell: true })
}

console.log('━'.repeat(50))
console.log('[1/2] Installing client dependencies...')
run('npm install', clientDir)

console.log('━'.repeat(50))
console.log('[2/2] Installing server dependencies...')
run('npm install', serverDir)

console.log('\n' + '━'.repeat(50))
console.log('✅ All dependencies installed!\n')
console.log('Starting development servers...\n')
console.log('  🌐 Frontend: http://localhost:3000')
console.log('  ⚙️  Backend:  http://localhost:5000')
console.log('\nPress Ctrl+C to stop\n')
console.log('━'.repeat(50))

const server = spawn('npm', ['run', 'dev'], {
  cwd: serverDir, shell: true, stdio: 'inherit',
})

setTimeout(() => {
  const client = spawn('npm', ['run', 'dev'], {
    cwd: clientDir, shell: true, stdio: 'inherit',
  })
  client.on('error', e => console.error('Client error:', e))
  process.on('SIGINT', () => { client.kill(); server.kill(); process.exit() })
}, 3000)

server.on('error', e => console.error('Server error:', e))
