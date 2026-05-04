import type { Core } from '@strapi/strapi'
import type { Method } from 'axios'
import axios from 'axios'
import { Webhook, WebhookVerificationError } from 'standardwebhooks'
import type { PolarEnvironment } from '../services/polar-service'

const PLUGIN_ID = 'strapi5-plugin-for-polar'

export type PluginSettings = {
  environment: PolarEnvironment
  /** Default presentment currency for new products (ISO code, e.g. eur, usd). */
  defaultCurrency?: string
  checkout: {
    successUrl?: string
    cancelUrl?: string
  }
  webhook?: {
    forwardUrl?: string
  }
}

type ProductListResponse = {
  items: unknown[]
  pagination?: { total_count: number; max_page: number }
}

type ProductResponse = { id: string; [key: string]: unknown }

type BenefitResponse = { id: string; [key: string]: unknown }

type PolarService = {
  polarRequest: <T>(env: PolarEnvironment, method: Method, path: string, config?: import('axios').AxiosRequestConfig) => Promise<T>
}

function getPolarService(strapi: Core.Strapi): PolarService {
  return strapi.plugin(PLUGIN_ID).service('polarService') as PolarService
}

function getEnvironmentAvailability(): { sandbox: boolean; production: boolean } {
  return {
    sandbox: Boolean(process.env.STRAPI_POLAR_SANDBOX_OAT),
    production: Boolean(process.env.STRAPI_POLAR_LIVE_OAT),
  }
}

function mapIntervalSelect(value: string): { recurring_interval: string; recurring_interval_count: number } {
  switch (value) {
    case '2weeks':
      return { recurring_interval: 'week', recurring_interval_count: 2 }
    case '6months':
      return { recurring_interval: 'month', recurring_interval_count: 6 }
    case 'week':
    case 'month':
    case 'year':
    case 'day':
      return { recurring_interval: value, recurring_interval_count: 1 }
    default:
      return { recurring_interval: 'month', recurring_interval_count: 1 }
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const getSettingsInternal = async (): Promise<PluginSettings | null> => {
    return (await strapi.store({ type: 'plugin', name: PLUGIN_ID }).get({ key: 'settings' })) as PluginSettings | null
  }

  const polar = () => getPolarService(strapi)

  return {
    async getSettings(ctx) {
      const s = await getSettingsInternal()
      ctx.body = { ...(s || {}), availableEnvironments: getEnvironmentAvailability() }
    },

    async updateSettings(ctx) {
      const data = ctx.request.body as PluginSettings
      const avail = getEnvironmentAvailability()
      if (data.environment === 'sandbox' && !avail.sandbox) {
        ctx.throw(400, 'Sandbox token is not configured (set STRAPI_POLAR_SANDBOX_OAT)')
      }
      if (data.environment === 'production' && !avail.production) {
        ctx.throw(400, 'Production token is not configured (set STRAPI_POLAR_LIVE_OAT)')
      }
      if (data.checkout?.successUrl) {
        const u = new URL(data.checkout.successUrl)
        if (data.environment === 'production' && u.protocol !== 'https:') {
          ctx.throw(400, 'successUrl must be HTTPS in production')
        }
      }
      if (data.checkout?.cancelUrl) {
        const u = new URL(data.checkout.cancelUrl)
        if (data.environment === 'production' && u.protocol !== 'https:') {
          ctx.throw(400, 'cancelUrl must be HTTPS in production')
        }
      }
      await strapi.store({ type: 'plugin', name: PLUGIN_ID }).set({ key: 'settings', value: data })
      ctx.body = { ok: true }
    },

    async listProducts(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      const limit = Number(ctx.query.limit) || 100
      const page = Number(ctx.query.page) || 1
      const res = await polar().polarRequest<ProductListResponse>(env, 'GET', '/products/', { params: { page, limit, is_archived: false } })
      ctx.body = res
    },

    async getProduct(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      ctx.body = await polar().polarRequest(env, 'GET', `/products/${ctx.params.id}`)
    },

    async createProduct(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      const body = ctx.request.body as Record<string, unknown>

      const benefitIds: string[] = []

      if (body.include_license_keys) {
        const lic = await polar().polarRequest<BenefitResponse>(env, 'POST', '/benefits/', {
          data: {
            type: 'license_keys',
            description: (body.license_benefit_description as string) || `${String(body.name)} — License key`,
            properties: {
              prefix: (body.license_key_prefix as string) || null,
              expires: null,
              activations: null,
              limit_usage: null,
            },
          },
        })
        benefitIds.push(lic.id)
      }

      if (body.include_private_note) {
        const note = (body.private_note as string) || ''
        const custom = await polar().polarRequest<BenefitResponse>(env, 'POST', '/benefits/', {
          data: {
            type: 'custom',
            description: (body.custom_note_benefit_description as string) || `${String(body.name)} — Private note`,
            properties: { note },
          },
        })
        benefitIds.push(custom.id)
      }

      const currency = String(body.currency || settings.defaultCurrency || 'usd').toLowerCase()
      const priceAmount = Math.max(10, Math.round(Number(body.price) * 100))
      const fixedPrice = {
        amount_type: 'fixed',
        price_currency: currency,
        price_amount: priceAmount,
      }

      const isSub = body.paymentType === 'subscription'
      let productPayload: Record<string, unknown>

      if (!isSub) {
        productPayload = {
          name: body.name,
          description: (body.description as string) ?? null,
          visibility: 'public',
          prices: [fixedPrice],
          recurring_interval: null,
          recurring_interval_count: null,
        }
      } else {
        const { recurring_interval, recurring_interval_count } = mapIntervalSelect(String(body.recurringInterval || 'month'))
        const trialEnabled = Boolean(body.trialEnabled)
        const trialPayload =
          trialEnabled && body.trial_interval && body.trial_interval_count
            ? {
                trial_interval: body.trial_interval,
                trial_interval_count: Number(body.trial_interval_count),
              }
            : { trial_interval: null, trial_interval_count: null }

        productPayload = {
          name: body.name,
          description: (body.description as string) ?? null,
          visibility: 'public',
          prices: [fixedPrice],
          recurring_interval,
          recurring_interval_count,
          ...trialPayload,
        }
      }

      const product = await polar().polarRequest<ProductResponse>(env, 'POST', '/products/', { data: productPayload })

      if (benefitIds.length > 0) {
        await polar().polarRequest(env, 'POST', `/products/${product.id}/benefits`, {
          data: { benefits: benefitIds },
        })
      }

      ctx.body = product
    },

    async updateProduct(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      const patch = ctx.request.body as Record<string, unknown>
      ctx.body = await polar().polarRequest(env, 'PATCH', `/products/${ctx.params.id}`, { data: patch })
    },

    async archiveProduct(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      ctx.body = await polar().polarRequest(env, 'PATCH', `/products/${ctx.params.id}`, { data: { is_archived: true } })
    },

    async updateProductBenefits(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      const { benefits } = ctx.request.body as { benefits: string[] }
      ctx.body = await polar().polarRequest(env, 'POST', `/products/${ctx.params.id}/benefits`, { data: { benefits } })
    },

    async checkout(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const env = settings?.environment ?? 'sandbox'
      const body = ctx.request.body as {
        productId?: string
        product_price_id?: string
        customer_email?: string
        success_url?: string
        return_url?: string
        metadata?: Record<string, string | number | boolean>
      }
      if (!body.productId || !body.customer_email) ctx.throw(400, 'Missing productId or customer_email')
      const configuredSuccess = settings?.checkout?.successUrl
      const configuredReturn = settings?.checkout?.cancelUrl
      const successBase = configuredSuccess || body.success_url
      const return_url = configuredReturn || body.return_url
      if (settings?.environment === 'production') {
        if (successBase) {
          const u1 = new URL(successBase)
          if (u1.protocol !== 'https:') ctx.throw(400, 'success_url must be HTTPS in production')
        }
        if (return_url) {
          const u2 = new URL(return_url)
          if (u2.protocol !== 'https:') ctx.throw(400, 'return_url must be HTTPS in production')
        }
      }
      const payload: Record<string, unknown> = {
        products: [body.productId],
        customer_email: body.customer_email,
        metadata: body.metadata || {},
      }
      if (successBase) {
        const sep = successBase.includes('?') ? '&' : '?'
        payload.success_url = `${successBase}${sep}checkout_id={CHECKOUT_ID}`
      }
      if (return_url) payload.return_url = return_url
      if (body.product_price_id) payload.product_price_id = body.product_price_id
      const session = await polar().polarRequest<{ url?: string } | { checkout?: { url?: string } }>(env, 'POST', '/checkouts/', { data: payload })
      const url = (session as { url?: string }).url ?? (session as { checkout?: { url?: string } }).checkout?.url
      if (!url) ctx.throw(502, 'Polar checkout session did not return a URL')
      ctx.body = { url }
    },
    async webhook(ctx) {
      const settings = (await getSettingsInternal()) as PluginSettings
      const secret = process.env.STRAPI_POLAR_WEBHOOK_SECRET
      if (!secret) ctx.throw(400, 'STRAPI_POLAR_WEBHOOK_SECRET is not set')
      const jsonBody = ctx.request.body
      const raw = Buffer.from(JSON.stringify(jsonBody), 'utf-8')
      let event: unknown
      try {
        const base64Secret = Buffer.from(secret, 'utf-8').toString('base64')
        const wh = new Webhook(base64Secret)
        event = wh.verify(raw, {
          'webhook-id': ctx.request.headers['webhook-id'] as string,
          'webhook-signature': ctx.request.headers['webhook-signature'] as string,
          'webhook-timestamp': ctx.request.headers['webhook-timestamp'] as string,
        })
      } catch (e) {
        if (e instanceof WebhookVerificationError) ctx.throw(403, 'Invalid Polar webhook signature')
        throw e
      }
      const forwardUrl = settings?.webhook?.forwardUrl
      if (forwardUrl)
        await axios.post(forwardUrl, event, {
          headers: {
            'Content-Type': 'application/json',
            'Polar-Webhook-Id': String(ctx.request.headers['webhook-id'] ?? ''),
          },
          timeout: 10000,
        })
      ctx.status = 202
      ctx.body = ''
    },
  }
}
