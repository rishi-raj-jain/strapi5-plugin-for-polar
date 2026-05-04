export default () => ({
  type: 'content-api' as const,
  routes: [
    {
      method: 'POST',
      path: '/checkout',
      handler: 'polarController.checkout',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/webhook',
      handler: 'polarController.webhook',
      config: {
        auth: false,
      },
    },
  ],
})
