const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

const ALLOWED_ORIGIN = 'https://tools.daytradinguni.com'

app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json({ limit: '200kb' }))

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const DEFAULT_LOCATION_ID = 'OiIKORhJ82flAVisHu3d'

const requiredFields = [
  'full_name',
  'email',
  'profit_target',
  'max_loss_limit',
  'max_contract_size',
  'daily_loss_limit',
  'trades_until_lost',
  'consistency_enabled',
  'consistency_rule',
  'product',
  'stop_loss_ticks',
  'suggested_contracts',
  'risk_per_trade',
  'max_sl_hits_per_day',
  'daily_profit_target',
  'max_daily_profit',
]

const toStringMap = (payload) => {
  const entries = Object.entries(payload).map(([key, value]) => [key, String(value ?? '')])
  return Object.fromEntries(entries)
}

app.post('/email-plan', async (req, res) => {
  const apiKey = process.env.GHL_API_KEY
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'Missing GHL API key.' })
  }

  const payload = req.body || {}
  const missing = requiredFields.filter((field) => !Object.prototype.hasOwnProperty.call(payload, field))
  if (missing.length > 0) {
    return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` })
  }

  const email = String(payload.email || '').trim()
  const fullName = String(payload.full_name || '').trim()
  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required.' })
  }
  if (!fullName) {
    return res.status(400).json({ ok: false, error: 'Name is required.' })
  }

  const locationId = process.env.GHL_LOCATION_ID || DEFAULT_LOCATION_ID

  try {
    const contactResponse = await fetch(`${GHL_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
   
    if (!contactResponse.ok) {
      const errorText = await contactResponse.text()
      if (contactResponse.status === 401 || contactResponse.status === 403) {
        return res.status(500).json({ ok: false, error: 'Invalid GHL API key.' })
      }
      return res.status(502).json({ ok: false, error: 'Failed to create/update contact.', details: errorText })
    }

    const contactData = await contactResponse.json()
    const contactId = contactData?.contact?.id || contactData?.contactId || contactData?.id

    if (!contactId) {
      return res.status(502).json({ ok: false, error: 'Contact ID not returned from GHL.' })
    }

    const tagResponse = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags: ['risk_calculator_plan'] }),
    })

    if (!tagResponse.ok) {
      const errorText = await tagResponse.text()
      if (tagResponse.status === 401 || tagResponse.status === 403) {
        return res.status(500).json({ ok: false, error: 'Invalid GHL API key.' })
      }
      return res.status(502).json({ ok: false, error: 'Failed to tag contact.', details: errorText })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Unexpected server error.' })
  }
})

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`DTU Risk Calculator API listening on ${PORT}`)
})
