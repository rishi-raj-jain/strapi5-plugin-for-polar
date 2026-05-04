import type { Core } from '@strapi/strapi'
import axios, { type AxiosRequestConfig, type Method } from 'axios'

export type PolarEnvironment = 'sandbox' | 'production'

const BASE_URLS: Record<PolarEnvironment, string> = {
  sandbox: 'https://sandbox-api.polar.sh/v1',
  production: 'https://api.polar.sh/v1',
}

function getAccessToken(env: PolarEnvironment): string {
  const key = env === 'production' ? process.env.STRAPI_POLAR_LIVE_OAT : process.env.STRAPI_POLAR_SANDBOX_OAT
  if (!key) throw new Error(`Missing Polar Organization Access Token for ${env} (set STRAPI_POLAR_${env === 'production' ? 'LIVE' : 'SANDBOX'}_OAT)`)
  return key
}

export default (_ctx: { strapi: Core.Strapi }) => ({
  getBaseUrl(env: PolarEnvironment): string {
    return BASE_URLS[env]
  },
  getAccessToken,
  async polarRequest<T = unknown>(env: PolarEnvironment, method: Method, path: string, config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'baseURL'>): Promise<T> {
    const token = getAccessToken(env)
    const baseURL = BASE_URLS[env]
    const res = await axios.request<T>({
      ...config,
      method,
      baseURL,
      url: path.startsWith('/') ? path : `/${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      validateStatus: () => true,
    })
    if (res.status >= 400) {
      const detail = (res.data as { detail?: unknown })?.detail ?? (res.data as { message?: string })?.message ?? res.statusText
      const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
      ;(err as Error & { status?: number; payload?: unknown }).status = res.status
      ;(err as Error & { payload?: unknown }).payload = res.data
      throw err
    }
    return res.data
  },
})
