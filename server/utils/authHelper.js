const crypto = require('crypto')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) {
    return false
  }
  const [salt, originalHash] = storedPassword.split(':')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === originalHash
}

function generateAvatar(name) {
  const seed = encodeURIComponent(name.trim())
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=00d4ff,7c3aed,06ffd4&fontFamily=Arial,sans-serif`
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAvatar
}
