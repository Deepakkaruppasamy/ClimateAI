const mongoose = require('mongoose')
const User = require('../models/User')

let localEmailsSent = 0

/**
 * Broadcasts an alert email to all registered users (simulated & logged in console).
 * Increments the global sent email counter.
 */
const sendAlertEmailToAllUsers = async (app, alert) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1
    let users = []
    
    if (isDBConnected) {
      users = await User.find({}, 'email name')
    } else {
      // Database offline: Use mock users
      users = app ? app.locals.mockUsers : []
    }

    const emailSubject = `⚠️ ClimateAI ALERT: ${alert.title || alert.type?.toUpperCase() || 'Emergency advisory'}`
    const emailBody = alert.message || alert.text || 'Active climate hazard anomaly detected.'
    
    console.log(`\n✉️ [EMAIL SERVICE] Broadcasting alert email to all users:`)
    console.log(`Subject: ${emailSubject}`)
    console.log(`Content: ${emailBody}`)

    for (const u of users) {
      if (u.email) {
        console.log(`   -> Simulating mail delivery to: ${u.name || 'User'} (${u.email})`)
        localEmailsSent++
        if (app) {
          if (app.locals.emailsSentCount === undefined) {
            app.locals.emailsSentCount = 0
          }
          app.locals.emailsSentCount++
        }
      }
    }
    console.log(`✉️ [EMAIL SERVICE] Broadcast complete. Total mails simulated this run: ${users.length}\n`)
    return users.length
  } catch (err) {
    console.error('❌ Email broadcast service error:', err.message)
    return 0
  }
}

const getEmailsSentCount = (app) => {
  if (app && app.locals.emailsSentCount !== undefined) {
    return app.locals.emailsSentCount
  }
  return localEmailsSent
}

module.exports = {
  sendAlertEmailToAllUsers,
  getEmailsSentCount
}
