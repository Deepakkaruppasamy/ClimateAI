const mongoose = require('mongoose')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const User = require('../models/User')

let localEmailsSent = 0

/**
 * Broadcasts an alert email to all registered users.
 * Supports two delivery methods:
 * 1. 'resend' -> Direct HTTP Resend API delivery (requires RESEND_API_KEY)
 * 2. 'file'   -> Writes local HTML preview files to server/mail-outbox/ (No server needed, perfect for local dev!)
 */
const sendAlertEmailToAllUsers = async (app, alert) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1
    let users = []
    
    if (isDBConnected) {
      users = await User.find({}, 'email name')
    } else {
      users = app ? app.locals.mockUsers : []
    }

    const emailSubject = `⚠️ ClimateAI ALERT: ${alert.title || alert.type?.toUpperCase() || 'Emergency advisory'}`
    const emailBody = alert.message || alert.text || 'Active climate hazard anomaly detected.'
    
    // Choose delivery method based on .env config
    const configMethod = (process.env.MAIL_METHOD || '').toLowerCase()
    
    let method = 'file' // Default developer fallback
    if (configMethod === 'resend' || (process.env.RESEND_API_KEY && !configMethod)) {
      method = 'resend'
    } else {
      method = 'file'
    }

    // HTML Template
    const getHtmlBody = (userName, userEmail) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 2px solid #ff0055; border-radius: 16px; padding: 25px; background-color: #02050a; color: #ffffff; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">🚨</span>
          <h2 style="color: #ff0055; margin: 0; font-size: 22px; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">CLIMATEAI METEOROLOGICAL ALERT</h2>
        </div>
        <h3 style="color: #ffffff; margin-top: 0; font-size: 18px; border-left: 3px solid #ff0055; padding-left: 10px;">${alert.title || 'Emergency Advisory'}</h3>
        <p style="color: #d1d5db; line-height: 1.6; font-size: 14px; background-color: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">${emailBody}</p>
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #6b7280; font-family: monospace;">
          [SECURITY_TAG: SECURE_DELIVERY] // RECIP: ${userName || 'User'} (${userEmail})
        </div>
      </div>
    `

    if (method === 'resend') {
      console.log(`\n✉️ [EMAIL SERVICE] Resend API selected! Broadcasting to ${users.length} users...`)
      
      const emailPromises = users.map(async (u) => {
        if (!u.email) return
        try {
          await axios.post(
            'https://api.resend.com/emails',
            {
              from: process.env.RESEND_FROM || 'ClimateAI Alerts <onboarding@resend.dev>',
              to: [u.email],
              subject: emailSubject,
              html: getHtmlBody(u.name, u.email),
              text: `${emailBody}\n\n---\nThis is an automated ecological alert warning sent by ClimateAI.`
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          )

          localEmailsSent++
          if (app) {
            if (app.locals.emailsSentCount === undefined) app.locals.emailsSentCount = 0
            app.locals.emailsSentCount++
          }
          console.log(`   ✅ Resend API delivered mail to: ${u.email}`)
        } catch (e) {
          const apiError = e.response && e.response.data ? JSON.stringify(e.response.data) : e.message
          console.error(`   ❌ Resend failed to deliver to: ${u.email} | Error: ${apiError}`)
        }
      })

      await Promise.allSettled(emailPromises)
      console.log(`✉️ [EMAIL SERVICE] Resend API Broadcast Complete.\n`)

    } else {
      // Local File Outbox Mode (Perfect for zero-setup developer visualization)
      console.log(`\n✉️ [EMAIL SERVICE] File Outbox Mode active! Creating HTML preview files...`)
      
      const outboxDir = path.join('c:', 'ClimateAI', 'server', 'mail-outbox')
      if (!fs.existsSync(outboxDir)) {
        fs.mkdirSync(outboxDir, { recursive: true })
      }

      for (const u of users) {
        if (!u.email) continue
        
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = `${timestamp}_${u.email.replace(/[@.]/g, '_')}.html`
          const filePath = path.join(outboxDir, fileName)
          
          const htmlContent = `
            <!-- Subject: ${emailSubject} -->
            <!-- To: ${u.name || 'User'} (${u.email}) -->
            ${getHtmlBody(u.name, u.email)}
          `

          fs.writeFileSync(filePath, htmlContent)
          
          localEmailsSent++
          if (app) {
            if (app.locals.emailsSentCount === undefined) app.locals.emailsSentCount = 0
            app.locals.emailsSentCount++
          }
          console.log(`   📁 Created HTML preview: server/mail-outbox/${fileName}`)
        } catch (e) {
          console.error(`   ❌ Failed to create preview for: ${u.email} | Error: ${e.message}`)
        }
      }
      
      console.log(`✉️ [EMAIL SERVICE] Local File Outbox Broadcast Complete. Files located in server/mail-outbox/\n`)
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
