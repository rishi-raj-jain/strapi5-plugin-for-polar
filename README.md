# 🐻 Strapi 5 Plugin for Polar

A [Strapi 5](https://strapi.io/) plugin to manage **[Polar](https://polar.sh) products and subscriptions** from the admin panel, and to offer a **simple front-end checkout** using a small **JavaScript snippet** (content API).

## 📚 Table of Contents

- [🚀 Installation](#-installation)
- [💡 Environment variables (`.env`)](#-environment-variables-env)
- [🪝 Webhooks (signature verification)](#-webhooks-signature-verification)
  - [🧱 1) Enable raw body support in Strapi](#-1-enable-raw-body-support-in-strapi)
  - [🔗 2) Polar webhook endpoint URL](#-2-polar-webhook-endpoint-url)
  - [🔐 3) Create a webhook in Polar (get the signing secret)](#-3-create-a-webhook-in-polar-get-the-signing-secret)
  - [🧪 4) Local development (no public URL)](#-4-local-development-no-public-url)
- [⚙️ Configuration (admin)](#️-configuration-admin)
- [📦 Managing products](#-managing-products)
- [🧑‍💻 Embed checkout button (snippet)](#-embed-checkout-button-snippet)
- [📝 License](#-license)

## 🚀 Installation

1. Add the plugin to your Strapi project:

```bash
npm i strapi5-plugin-for-polar axios standardwebhooks
```

2. Restart Strapi:

```bash
npm run develop
```

## 💡 Environment variables (`.env`)

The plugin talks to **Polar’s REST API** with an **Organization Access Token (OAT)** and verifies **Standard Webhooks** using a shared secret.

### Required (per environment you use)

| Variable | Description |
| -------- | ----------- |
| `STRAPI_POLAR_SANDBOX_OAT` | Polar **sandbox** OAT. Used when the plugin environment is **Sandbox** (`https://sandbox-api.polar.sh`). |
| `STRAPI_POLAR_LIVE_OAT` | Polar **live** OAT. Used when the plugin environment is **Production** (`https://api.polar.sh`). |

You only need the token for the environment(s) you actually use. The admin **Settings** screen reflects which tokens are present.

### Webhooks (optional but recommended for event forwarding)

| Variable | Description |
| -------- | ----------- |
| `STRAPI_POLAR_WEBHOOK_SECRET` | Secret Polar uses to sign webhook deliveries (Standard Webhooks). **Required** for the plugin to verify incoming webhooks. |

### Example `.env` in your Strapi project

```env
# existing environment variables

# Polar API (use sandbox and/or live depending on your setup)
STRAPI_POLAR_SANDBOX_OAT="polar_oat_..."
STRAPI_POLAR_LIVE_OAT="polar_oat_..."

# Webhook verification (signing secret from Polar dashboard)
STRAPI_POLAR_WEBHOOK_SECRET="whsec_..."
```

## 🪝 Webhooks (signature verification)

The plugin can receive Polar webhook events, **verify the Standard Webhooks signature**, and optionally **forward the verified JSON payload** to your own URL (configured in admin as **Webhook forward URL**).

> The plugin does **not** implement your business logic for each event type. It **authenticates** the request and can **forward** the parsed event to your API.


### 🔗 1) Polar webhook endpoint URL

When you create the webhook in Polar, use a **public HTTPS** URL that hits this plugin’s **content API** route:

**Production-style URL:**

`https://your-deployed-strapi-instance.com/api/strapi5-plugin-for-polar/webhook`

- Method: **POST**
- Path segment **`strapi5-plugin-for-polar`** is the plugin name / API namespace.

### 🔐 2) Create a webhook in Polar (get the signing secret)

- Open the Polar dashboard (sandbox or production, matching your integration)
- Go to **Settings** > **Webhooks**
- **Add Endpoint** and paste your Strapi URL from the previous section
- Enter the URL obtained above, use the **Raw** format, and subscribe to the events you need (for example checkout or subscription events) and click **Create**
- Click **Copy Secret** and set `STRAPI_POLAR_WEBHOOK_SECRET` in your Strapi `.env`.
- Restart Strapi.

### 🧪 3) Local development (no public URL)

Polar cannot call `localhost` directly. Use a tunnel (for example **ngrok**, **Cloudflare Tunnel**, etc.) to expose your local Strapi:

```bash
# Example: expose local Strapi on port 1337
ngrok http 1337
```

Use the HTTPS URL ngrok gives you as the webhook base, for example:

`https://abcd.ngrok.io/api/strapi5-plugin-for-polar/webhook`

> Rotate tunnel URLs and signing secrets when you change tooling; keep `.env` in sync.

## ⚙️ Configuration (admin)

In the Strapi admin:

1. Open **Settings → Polar → Configuration** (or **Plugins → Strapi 5 Plugin for Polar**, depending on your menu layout).
2. Configure:
   - **Environment**: Sandbox vs Production is constrained by which OATs are set in `.env`.
   - **Checkout success URL** / **Checkout cancel / back URL**: optional defaults used when your checkout request does not pass URLs.
   - **Webhook forward URL** (optional): after signature verification, the plugin **POST**s the parsed event JSON to this URL.

Save when done.

## 📦 Managing products

From the plugin’s main admin page you can:

- Create and edit **Polar products** (via Polar’s API).
- **One-time** and **subscription** products.
- **Billing interval** for subscriptions.
- **Trial** settings for subscriptions (where applicable).
- **Currency** selection (Polar-supported currencies).
- Optional automated **benefits** such as **license keys** and **private notes** attached as Polar benefits.

This plugin is a **thin UI + API bridge** to Polar.

## 🧑‍💻 Embed checkout button (snippet)

The admin UI can show an **embed snippet** that posts to your Strapi **content API** checkout route:

`POST /api/strapi5-plugin-for-polar/checkout`

The snippet uses `data-*` attributes (product id, email, optional price id, optional success/return URLs, metadata). Adjust the example HTML/JS in the admin **Embed** dialog to match your site.

**Checkout URLs:** Success and return URLs can be set in **plugin settings** and/or passed per request from the snippet (`success_url`, `return_url` in the JSON body), depending on how you integrate.

## 📝 License

This package is licensed under the **MIT** license. See the `license` field in `package.json`.

© 2026 Rishi Raj Jain
