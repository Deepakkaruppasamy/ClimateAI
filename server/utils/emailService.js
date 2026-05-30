const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const User = require('../models/User')

let localEmailsSent = 0

/**
 * Broadcasts an alert email to all registered users.
 * Supports actual SMTP delivery if SMTP variables are set in .env.
 * Otherwise, falls back to a clean mock simulation console delivery.
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
    
    const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    
    if (isSmtpConfigured) {
      console.log(`\n✉️ [EMAIL SERVICE] SMTP Configured! Initializing actual mail delivery transport to ${users.length} users...`)
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        timeout: 8000 // 8 second timeout per connection
      })

      // Send to all users
      const emailPromises = users.map(async (u) => {
        if (!u.email) return
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"ClimateAI System" <${process.env.SMTP_USER}>`,
            to: u.email,
            subject: emailSubject,
            text: `${emailBody}\n\n---\nThis is an automated ecological alert warning sent by ClimateAI.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ff4444; border-radius: 12px; padding: 20px; background-color: #030812; color: #ffffff; margin: 0 auto;">
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                  <h2 style="color: #ff4444; margin: 0; font-size: 20px;">⚠️ CLIMATEAI METEOROLOGICAL ALERT</h2>
                </div>
                <h3 style="color: #ffffff; margin-top: 0;">${alert.title || 'Emergency Advisory'}</h3>
                <p style="color: #d1d5db; line-height: 1.6; font-size: 14px;">${emailBody}</p>
                <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #6b7280;">
                  This is an automated real-time atmospheric alert warning sent to: ${u.name || 'User'} (${u.email}).
                </div>
              </div>
            `
          })
          
          localEmailsSent++
          if (app) {
            if (app.locals.emailsSentCount === undefined) {
              app.locals.emailsSentCount = 0
            }
            app.locals.emailsSentCount++
          }
          console.log(`   ✅ Mail sent successfully to: ${u.email}`)
        } catch (e) {
          console.error(`   ❌ Failed to deliver email to: ${u.email} | Error: ${e.message}`)
        }
      })

      await Promise.allSettled(emailPromises)
      console.log(`✉️ [EMAIL SERVICE] SMTP Broadcast Complete.\n`)

    } else {
      // Fallback simulation mode
      console.log(`\n✉️ [EMAIL SERVICE] SMTP Not Configured. Simulating mail delivery:`)
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
      console.log(`✉️ [EMAIL SERVICE] Simulation Complete. Total simulated: ${users.length}\n`)
    }

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
