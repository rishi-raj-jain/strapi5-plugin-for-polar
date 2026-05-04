import {
  Alert,
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  IconButtonGroup,
  NumberInput,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  Textarea,
  TextInput,
  Th,
  Thead,
  Tr,
  Typography,
} from '@strapi/design-system'
import { CodeBlock, Cross, Pencil, Trash } from '@strapi/icons'
import { useFetchClient } from '@strapi/strapi/admin'
import { useEffect, useMemo, useState } from 'react'

import { POLAR_CURRENCIES, POLAR_MINIMUMS, shimmerCss, styles, ui } from '../styles'
import { firstCatalogPrice, formatPrice, intervalToSelect, subscriptionFrequencyLabel, type PolarProduct } from '../utils/polarProductFormat'

type ListResponse = { items: PolarProduct[] }

const Shimmer = ({ width = '100%', height = 14 }: { width?: string; height?: number }) => <Box className="polarShimmer" width={width} height={`${height}px`} borderRadius="4px" />

const HomePage = () => {
  const { get, post, put, del } = useFetchClient()

  const [list, setList] = useState<PolarProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [settings, setSettings] = useState<{
    defaultCurrency?: string
  }>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingProduct, setEditingProduct] = useState<PolarProduct | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const [isEmbedOpen, setIsEmbedOpen] = useState(false)
  const [embedProduct, setEmbedProduct] = useState<PolarProduct | null>(null)
  const [embedPriceId, setEmbedPriceId] = useState<string>('')

  const [paymentType, setPaymentType] = useState<'oneTime' | 'subscription'>('oneTime')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [currency, setCurrency] = useState('usd')
  const [paymentInterval, setPaymentInterval] = useState('month')
  const [trialEnabled, setTrialEnabled] = useState(false)
  const [trialInterval, setTrialInterval] = useState('week')
  const [trialIntervalCount, setTrialIntervalCount] = useState(1)

  const [includePrivateNote, setIncludePrivateNote] = useState(false)
  const [privateNote, setPrivateNote] = useState('')
  const [includeLicenseKeys, setIncludeLicenseKeys] = useState(false)
  const [licenseKeyPrefix, setLicenseKeyPrefix] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isSubscription = paymentType === 'subscription'

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await get('/strapi5-plugin-for-polar/products')
      const data = res.data as ListResponse
      setList(data.items ?? [])
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadSettings = async () => {
    const res = await get('/strapi5-plugin-for-polar/settings')
    setSettings(res.data || {})
    if (res.data?.defaultCurrency) {
      setCurrency(String(res.data.defaultCurrency).toLowerCase())
    }
  }

  useEffect(() => {
    loadProducts()
    loadSettings()
  }, [])

  const resetForm = () => {
    setPaymentType('oneTime')
    setName('')
    setDescription('')
    setPrice(0)
    setCurrency((settings.defaultCurrency || 'usd').toLowerCase())
    setPaymentInterval('month')
    setTrialEnabled(false)
    setTrialInterval('week')
    setTrialIntervalCount(1)
    setIncludePrivateNote(false)
    setPrivateNote('')
    setIncludeLicenseKeys(false)
    setLicenseKeyPrefix('')
    setHasChanges(false)
    setEditingProduct(null)
  }

  const openCreate = () => {
    setMode('create')
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (product: PolarProduct) => {
    setMode('edit')
    setEditingProduct(product)
    setName(product.name)
    setDescription(product.description || '')
    const pt = product.is_recurring ? 'subscription' : 'oneTime'
    setPaymentType(pt)
    setPaymentInterval(intervalToSelect(product))
    const fp = firstCatalogPrice(product)
    if (fp?.price_amount != null) setPrice(fp.price_amount / 100)
    if (fp?.price_currency) setCurrency(fp.price_currency)
    const hasTrial = Boolean(product.trial_interval) && Boolean(product.trial_interval_count)
    setTrialEnabled(hasTrial)
    if (product.trial_interval) setTrialInterval(product.trial_interval)
    if (product.trial_interval_count != null) {
      setTrialIntervalCount(product.trial_interval_count)
    }
    setHasChanges(false)
    setIsModalOpen(true)
  }

  const submitCreate = async () => {
    setError('')
    setSuccess('')
    try {
      await post('/strapi5-plugin-for-polar/products', {
        name,
        description: description || undefined,
        paymentType,
        price,
        currency,
        recurringInterval: paymentInterval,
        trialEnabled: isSubscription ? trialEnabled : false,
        trial_interval: isSubscription && trialEnabled ? trialInterval : null,
        trial_interval_count: isSubscription && trialEnabled ? trialIntervalCount : null,
        include_private_note: mode === 'create' ? includePrivateNote : false,
        private_note: includePrivateNote ? privateNote : undefined,
        include_license_keys: mode === 'create' ? includeLicenseKeys : false,
        license_key_prefix: includeLicenseKeys ? licenseKeyPrefix : undefined,
      })
      setSuccess('Product created.')
      setIsModalOpen(false)
      resetForm()
      loadProducts()
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: { message?: string }; message?: string } }
        message?: string
      }
      setError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Request failed.')
    }
  }

  const submitEdit = async () => {
    if (!editingProduct) return
    setError('')
    setSuccess('')
    try {
      const patch: Record<string, unknown> = {
        name,
        description: description || null,
      }
      if (editingProduct.is_recurring) {
        patch.trial_interval = trialEnabled ? trialInterval : null
        patch.trial_interval_count = trialEnabled ? trialIntervalCount : null
      }
      await put(`/strapi5-plugin-for-polar/products/${editingProduct.id}`, patch)
      setSuccess('Product updated.')
      setTimeout(() => {
        setSuccess('')
      }, 2000)
      setIsModalOpen(false)
      resetForm()
      loadProducts()
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: { message?: string }; message?: string } }
        message?: string
      }
      setError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Request failed.')
    }
  }

  const archiveProduct = async (id: string) => {
    setError('')
    setSuccess('')
    try {
      await del(`/strapi5-plugin-for-polar/products/${id}`)
      setSuccess('Product archived.')
      loadProducts()
      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: { message?: string }; message?: string } }
        message?: string
      }
      setError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Request failed.')
    }
  }

  const openEmbed = (product: PolarProduct) => {
    const fp = firstCatalogPrice(product)
    setEmbedProduct(product)
    setEmbedPriceId(fp?.id ?? '')
    setIsEmbedOpen(true)
  }

  const embedSnippet = useMemo(() => {
    if (!embedProduct) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const priceAttr = embedPriceId ? `\n  data-product-price-id="${embedPriceId}"` : ''
    return `<button
  data-polar-checkout
  data-api-url="${origin}"
  data-product-id="${embedProduct.id}"${priceAttr}
  data-email="customer@email.com"
  data-success-url="https://your-site.com/success"
  data-return-url="https://your-site.com/cancel"
  data-metadata-order-id="ORDER_123"
>
  Buy now
</button>`
  }, [embedProduct, embedPriceId])

  const embedScript = useMemo(
    () => `window.addEventListener('load', () => {
  document.querySelectorAll('[data-polar-checkout]').forEach((btn) => {
    btn.addEventListener('click', () => checkout(btn));
  });
  const params = new URLSearchParams(location.search);
  const checkoutId = params.get('checkout_id');
  if (checkoutId) console.log('Polar checkout_id', checkoutId);
});

function checkout(btn) {
  const apiUrl = btn.dataset.apiUrl;
  const productId = btn.dataset.productId;
  const productPriceId = btn.dataset.productPriceId;
  const email = btn.dataset.email;
  const success_url = btn.dataset.successUrl;
  const return_url = btn.dataset.returnUrl;
  if (!apiUrl || !productId || !email) return;
  const metadata = {};
  Object.keys(btn.dataset).forEach((k) => {
    if (k.startsWith('metadata')) {
      metadata[k.replace(/^metadata/, '').toLowerCase()] = btn.dataset[k];
    }
  });
  fetch(apiUrl + '/api/strapi5-plugin-for-polar/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metadata,
      productId,
      return_url,
      success_url,
      customer_email: email,
      product_price_id: productPriceId || undefined,
    }),
  })
    .then((r) => r.json())
    .then((r) => r.url && (location.href = r.url));
}`,
    [],
  )

  return (
    <Box padding={8}>
      <style>{shimmerCss}</style>
      <Flex {...ui.justifyBetween} alignItems="center" {...ui.pb6}>
        <Typography {...ui.headingBetaBold}>Products</Typography>
        <Button onClick={openCreate}>+ New Product</Button>
      </Flex>

      <Table colCount={7} rowCount={loadingProducts ? 6 : Math.max(list.length, 1)}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">ID</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Price</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Type</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Trial</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Benefits</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Actions</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {loadingProducts &&
            Array.from({ length: 6 }).map((_, i) => (
              <Tr key={`loading-${i}`}>
                <Td>
                  <Shimmer width="90%" />
                </Td>
                <Td>
                  <Shimmer width="70%" />
                </Td>
                <Td>
                  <Shimmer width="50%" />
                </Td>
                <Td>
                  <Shimmer width="60%" />
                </Td>
                <Td>
                  <Shimmer width="40%" />
                </Td>
                <Td>
                  <Shimmer width="25%" />
                </Td>
                <Td>
                  <Flex {...ui.rowGap2Wrap}>
                    <Shimmer width="28px" height={28} />
                    <Shimmer width="28px" height={28} />
                    <Shimmer width="28px" height={28} />
                  </Flex>
                </Td>
              </Tr>
            ))}
          {!loadingProducts && list.length === 0 && (
            <Tr>
              <Td>
                <Box height="40px" style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography textColor="neutral600">No products found.</Typography>
                </Box>
              </Td>
            </Tr>
          )}
          {!loadingProducts &&
            list.map((product) => {
              const fp = firstCatalogPrice(product)
              return (
                <Tr key={product.id}>
                  <Td>
                    <Typography padding="4px 8px" borderRadius="4px" display="inline-block">
                      {product.id}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography>{product.name}</Typography>
                  </Td>
                  <Td>
                    <Typography>{formatPrice(fp)}</Typography>
                  </Td>
                  <Td>
                    <Typography>{product.is_recurring ? `Subscription (${subscriptionFrequencyLabel(product) || '—'})` : 'One-time'}</Typography>
                  </Td>
                  <Td>
                    <Typography>
                      {product.is_recurring && product.trial_interval && product.trial_interval_count ? `${product.trial_interval_count} ${product.trial_interval}(s)` : '—'}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography>{product.benefits?.length ?? 0}</Typography>
                  </Td>
                  <Td>
                    <IconButtonGroup>
                      <IconButton label="Embed snippet" onClick={() => openEmbed(product)}>
                        <CodeBlock />
                      </IconButton>
                      <IconButton label="Edit" variant="secondary" onClick={() => openEdit(product)}>
                        <Pencil />
                      </IconButton>
                      <IconButton label="Archive" variant="danger" onClick={() => archiveProduct(product.id)}>
                        <Trash />
                      </IconButton>
                    </IconButtonGroup>
                  </Td>
                </Tr>
              )
            })}
        </Tbody>
      </Table>

      {success && (
        <Box {...ui.pt4}>
          <Alert title="Done" variant="success">
            {success}
          </Alert>
        </Box>
      )}

      {isModalOpen && (
        <>
          <Box {...ui.modalOverlay} />
          <Box {...ui.modalWrapper}>
            <Box {...ui.modalCard}>
              <Box {...ui.modalHeader}>
                <Flex {...ui.justifyBetween} alignItems="center">
                  <Typography {...ui.headingBetaBold}>{mode === 'create' ? 'Create product' : 'Edit product'}</Typography>
                  <IconButton
                    label="Close"
                    variant="tertiary"
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                  >
                    <Cross />
                  </IconButton>
                </Flex>
              </Box>

              <Box {...ui.modalBody}>
                <Flex {...ui.stackGap6}>
                  {mode === 'create' ? (
                    <Flex {...ui.formStack}>
                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          Name
                        </Typography>
                        <Box {...ui.mt2}>
                          <TextInput
                            style={styles.inputFullWidth}
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setName(e.target.value)
                              setHasChanges(true)
                            }}
                          />
                        </Box>
                      </Box>

                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel}>Payment type</Typography>
                        <Flex {...ui.buttonRow} {...ui.mt2}>
                          <Button
                            variant={paymentType === 'oneTime' ? 'default' : 'secondary'}
                            onClick={() => {
                              setPaymentType('oneTime')
                              setHasChanges(true)
                            }}
                          >
                            One-time
                          </Button>
                          <Button
                            variant={paymentType === 'subscription' ? 'default' : 'secondary'}
                            onClick={() => {
                              setPaymentType('subscription')
                              setHasChanges(true)
                            }}
                          >
                            Subscription
                          </Button>
                        </Flex>

                        {isSubscription && (
                          <Box {...ui.mt4}>
                            <Typography {...ui.fieldLabel}>Billing interval</Typography>
                            <Flex {...ui.buttonRow} {...ui.mt2}>
                              <Button
                                style={{ flex: '1', minWidth: 96 }}
                                variant={paymentInterval === 'week' ? 'default' : 'secondary'}
                                onClick={() => {
                                  setPaymentInterval('week')
                                  setHasChanges(true)
                                }}
                              >
                                Week
                              </Button>
                              <Button
                                style={{ flex: '1', minWidth: 96 }}
                                variant={paymentInterval === '2weeks' ? 'default' : 'secondary'}
                                onClick={() => {
                                  setPaymentInterval('2weeks')
                                  setHasChanges(true)
                                }}
                              >
                                2 weeks
                              </Button>
                              <Button
                                style={{ flex: '1', minWidth: 96 }}
                                variant={paymentInterval === 'month' ? 'default' : 'secondary'}
                                onClick={() => {
                                  setPaymentInterval('month')
                                  setHasChanges(true)
                                }}
                              >
                                Month
                              </Button>
                              <Button
                                style={{ flex: '1', minWidth: 96 }}
                                variant={paymentInterval === '6months' ? 'default' : 'secondary'}
                                onClick={() => {
                                  setPaymentInterval('6months')
                                  setHasChanges(true)
                                }}
                              >
                                6 months
                              </Button>
                              <Button
                                style={{ flex: '1', minWidth: 96 }}
                                variant={paymentInterval === 'year' ? 'default' : 'secondary'}
                                onClick={() => {
                                  setPaymentInterval('year')
                                  setHasChanges(true)
                                }}
                              >
                                Year
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>

                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          Description
                        </Typography>
                        <Box {...ui.mt2}>
                          <Textarea
                            style={styles.descriptionTextarea}
                            name="description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setDescription(e.target.value)
                              setHasChanges(true)
                            }}
                          />
                        </Box>
                      </Box>

                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          {`Price (more than ${POLAR_MINIMUMS[currency] ?? currency.toUpperCase()})`}
                        </Typography>
                        <Box {...ui.mt2}>
                          <NumberInput
                            style={styles.inputFullWidth}
                            value={price}
                            onValueChange={(v: number) => {
                              setPrice(v)
                              setHasChanges(true)
                            }}
                          />
                        </Box>
                      </Box>

                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          Currency
                        </Typography>
                        <Box {...ui.mt2}>
                          <SingleSelect
                            value={currency}
                            onChange={(v: string | number) => {
                              setCurrency(String(v).toLowerCase())
                              setHasChanges(true)
                            }}
                          >
                            {POLAR_CURRENCIES.map((c) => (
                              <SingleSelectOption key={c} value={c}>
                                {c.toUpperCase()}
                              </SingleSelectOption>
                            ))}
                          </SingleSelect>
                        </Box>
                      </Box>

                      {isSubscription && (
                        <Box {...ui.field}>
                          <Typography {...ui.fieldLabel}>Trial</Typography>
                          <Box {...ui.mt2} />
                          <Checkbox
                            checked={trialEnabled}
                            onCheckedChange={(v: boolean) => {
                              setTrialEnabled(v)
                              setHasChanges(true)
                            }}
                          >
                            Trial period
                          </Checkbox>

                          {trialEnabled && (
                            <Box {...ui.mt3} {...ui.trialGridBox}>
                              <Box>
                                <Typography {...ui.fieldLabel} {...ui.pb2}>
                                  Trial interval
                                </Typography>
                                <Box {...ui.mt2}>
                                  <SingleSelect
                                    value={trialInterval}
                                    onChange={(v: string | number) => {
                                      setTrialInterval(String(v))
                                      setHasChanges(true)
                                    }}
                                  >
                                    <SingleSelectOption value="day">Day</SingleSelectOption>
                                    <SingleSelectOption value="week">Week</SingleSelectOption>
                                    <SingleSelectOption value="month">Month</SingleSelectOption>
                                    <SingleSelectOption value="year">Year</SingleSelectOption>
                                  </SingleSelect>
                                </Box>
                              </Box>

                              <Box>
                                <Typography {...ui.fieldLabel} {...ui.pb2}>
                                  Count
                                </Typography>
                                <Box {...ui.mt2}>
                                  <NumberInput
                                    style={styles.inputFullWidth}
                                    value={trialIntervalCount}
                                    onValueChange={(v: number) => {
                                      setTrialIntervalCount(v ?? 1)
                                      setHasChanges(true)
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}

                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel}>Post-purchase benefits (Polar)</Typography>
                        <Box {...ui.benefitGridBox}>
                          <Box>
                            <Checkbox
                              checked={includePrivateNote}
                              onCheckedChange={(v: boolean) => {
                                setIncludePrivateNote(v)
                                setHasChanges(true)
                              }}
                            >
                              Private note for buyers
                            </Checkbox>
                          </Box>
                          <Box>
                            <Checkbox
                              checked={includeLicenseKeys}
                              onCheckedChange={(v: boolean) => {
                                setIncludeLicenseKeys(v)
                                setHasChanges(true)
                              }}
                            >
                              License keys
                            </Checkbox>
                          </Box>

                          <Box>
                            {includePrivateNote ? (
                              <Box {...ui.mt2}>
                                <Textarea
                                  style={styles.privateNoteTextarea}
                                  placeholder="Shown to the customer when the benefit is granted"
                                  name="privateNote"
                                  value={privateNote}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setPrivateNote(e.target.value)
                                    setHasChanges(true)
                                  }}
                                />
                              </Box>
                            ) : (
                              <Box height="40px" />
                            )}
                          </Box>
                          <Box>
                            {includeLicenseKeys ? (
                              <Box {...ui.mt2}>
                                <TextInput
                                  style={styles.inputFullWidth}
                                  placeholder="Optional key prefix"
                                  value={licenseKeyPrefix}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setLicenseKeyPrefix(e.target.value)
                                    setHasChanges(true)
                                  }}
                                />
                              </Box>
                            ) : (
                              <Box height="40px" />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Flex>
                  ) : (
                    <Flex {...ui.stackGap6} style={styles.inputFullWidth}>
                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          Name
                        </Typography>
                        <Box {...ui.mt2}>
                          <TextInput
                            style={styles.inputFullWidth}
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setName(e.target.value)
                              setHasChanges(true)
                            }}
                          />
                        </Box>
                      </Box>
                      <Box {...ui.field}>
                        <Typography {...ui.fieldLabel} {...ui.pb2}>
                          Description
                        </Typography>
                        <Box {...ui.mt2}>
                          <Textarea
                            style={styles.descriptionTextarea}
                            name="description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setDescription(e.target.value)
                              setHasChanges(true)
                            }}
                          />
                        </Box>
                      </Box>
                    </Flex>
                  )}

                  {mode === 'edit' && editingProduct?.is_recurring && (
                    <Box {...ui.field}>
                      <Typography {...ui.fieldLabel}>Trial</Typography>
                      <Box {...ui.mt2} />
                      <Checkbox
                        checked={trialEnabled}
                        onCheckedChange={(v: boolean) => {
                          setTrialEnabled(v)
                          setHasChanges(true)
                        }}
                      >
                        Trial period
                      </Checkbox>

                      {trialEnabled && (
                        <Box {...ui.mt3} {...ui.trialGridBox}>
                          <Box>
                            <Typography {...ui.fieldLabel} {...ui.pb2}>
                              Trial interval
                            </Typography>
                            <Box {...ui.mt2}>
                              <SingleSelect
                                value={trialInterval}
                                onChange={(v: string | number) => {
                                  setTrialInterval(String(v))
                                  setHasChanges(true)
                                }}
                              >
                                <SingleSelectOption value="day">Day</SingleSelectOption>
                                <SingleSelectOption value="week">Week</SingleSelectOption>
                                <SingleSelectOption value="month">Month</SingleSelectOption>
                                <SingleSelectOption value="year">Year</SingleSelectOption>
                              </SingleSelect>
                            </Box>
                          </Box>

                          <Box>
                            <Typography {...ui.fieldLabel} {...ui.pb2}>
                              Count
                            </Typography>
                            <Box {...ui.mt2}>
                              <NumberInput
                                style={styles.inputFullWidth}
                                value={trialIntervalCount}
                                onValueChange={(v: number) => {
                                  setTrialIntervalCount(v ?? 1)
                                  setHasChanges(true)
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Flex>
              </Box>

              {error && (
                <Box paddingLeft={6} paddingRight={6}>
                  <Alert variant="danger" title="Error">
                    {error}
                  </Alert>
                </Box>
              )}

              <Box {...ui.modalFooter}>
                <Flex {...ui.justifyEnd}>
                  <Button disabled={mode === 'create' ? !name.trim() : !hasChanges} onClick={() => (mode === 'create' ? submitCreate() : submitEdit())}>
                    {mode === 'create' ? 'Create' : 'Save'}
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {isEmbedOpen && embedProduct && (
        <>
          <Box {...ui.embedOverlay} onClick={() => setIsEmbedOpen(false)} />
          <Box {...ui.embedCard}>
            <Box {...ui.modalHeader}>
              <Typography {...ui.headingBetaBold}>Checkout integration</Typography>
              <Box marginTop={4}>
                <Typography {...ui.fieldLabel}>1. Add the client-side script to your website</Typography>
                <Box marginTop={2} padding={3} background="neutral100" borderRadius="4px">
                  <pre style={{ overflow: 'auto', fontSize: 12, height: '100px' }}>{`<script>\n${embedScript}\n</script>`}</pre>
                </Box>
              </Box>
              <Box marginTop={4}>
                <Typography {...ui.fieldLabel}>2. Add a checkout button to your website</Typography>
                <Box marginTop={2} padding={3} background="neutral100" borderRadius="4px">
                  <pre style={{ overflow: 'auto', fontSize: 12 }}>{embedSnippet}</pre>
                </Box>
              </Box>
            </Box>
            <Box padding={6}>
              <Flex {...ui.justifyEnd}>
                <Button onClick={() => setIsEmbedOpen(false)}>Close</Button>
              </Flex>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}

export { HomePage }
