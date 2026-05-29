const crypto = require('crypto')

/**
 * Hash a password using pbkdf2 with a random salt
 * @param {string} password 
 * @returns {string} salt:hash
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored salt:hash string
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) {
    return false
  }
  const [salt, originalHash] = storedPassword.split(':')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === originalHash
}

/**
 * Generate a beautiful default avatar URL using Dicebear
 * @param {string} name 
 * @returns {string} Avatar URL
 */
function generateAvatar(name) {
  const seed = encodeURIComponent(name.trim())
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=00d4ff,7c3aed,06ffd4&fontFamily=Arial,sans-serif`
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAvatar
}
