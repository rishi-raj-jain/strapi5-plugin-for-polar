export default () => ({
  type: 'admin' as const,
  routes: [
    {
      method: 'GET',
      path: '/settings',
      handler: 'polarController.getSettings',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'PUT',
      path: '/settings',
      handler: 'polarController.updateSettings',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'GET',
      path: '/products',
      handler: 'polarController.listProducts',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'GET',
      path: '/products/:id',
      handler: 'polarController.getProduct',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'POST',
      path: '/products',
      handler: 'polarController.createProduct',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'PATCH',
      path: '/products/:id',
      handler: 'polarController.updateProduct',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'PUT',
      path: '/products/:id',
      handler: 'polarController.updateProduct',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'DELETE',
      path: '/products/:id',
      handler: 'polarController.archiveProduct',
      config: {
        auth: {
          admin: true,
        },
      },
    },
    {
      method: 'POST',
      path: '/products/:id/benefits',
      handler: 'polarController.updateProductBenefits',
      config: {
        auth: {
          admin: true,
        },
      },
    },
  ],
})
