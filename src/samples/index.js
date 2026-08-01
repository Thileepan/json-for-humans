/**
 * Bundled sample datasets. All data is fictional; no real personal or
 * sensitive information is included.
 */

const customerProfile = {
  customer_id: 48291,
  customer_name: 'Ravi Kumar',
  email: 'ravi.kumar@example.com',
  phone_number: '+91 98765 43210',
  is_verified: true,
  loyalty_tier: 'GOLD_MEMBER',
  account_balance: 12500.5,
  profile_url: 'https://example.com/users/ravi-kumar',
  favorite_color: '#2f8a5f',
  created_at: '2024-03-15T10:30:00Z',
  last_login_at: 1767258600,
  address: {
    street: '12 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'India',
  },
  preferences: {
    newsletter: false,
    language: 'en-IN',
    notifications: null,
  },
}

const ecommerceOrder = {
  order_id: 123,
  customer_name: 'Ravi Kumar',
  payment_status: 'PAYMENT_PENDING',
  is_deleted: false,
  created_at: '2026-08-01T09:30:00Z',
  total_amount: 4599,
  discount_rate: 0.15,
  shipping: {
    method: 'EXPRESS_DELIVERY',
    tracking_url: 'https://example.com/track/AB123456789',
    estimated_delivery: '2026-08-05',
  },
  items: [
    { sku: 'BK-1001', name: 'Wireless Mouse', quantity: 1, unit_price: 1299 },
    { sku: 'BK-2002', name: 'Mechanical Keyboard', quantity: 1, unit_price: 2800 },
    { sku: 'BK-3003', name: 'USB-C Cable', quantity: 2, unit_price: 250 },
  ],
  notes: '',
}

const apiError = {
  error_code: 'ACCOUNT_NOT_FOUND',
  http_status: 404,
  message: 'The requested account does not exist or has been deactivated.',
  request_id: '7f9c02e1-88a4-4c1e-9f30-6d2f5a1b9c44',
  documentation_url: 'https://example.com/docs/errors/account-not-found',
  timestamp: '2026-07-30T18:45:12Z',
  retryable: false,
  details: {
    account_id: 'acc_29381',
    suggestion: 'VERIFY_ACCOUNT_ID',
  },
}

const patientSummary = {
  patient_id: 'PT-2093',
  full_name: 'Asha Verma (fictional)',
  date_of_birth: '1988-11-02',
  blood_group: 'O_POSITIVE',
  is_insured: true,
  emergency_contact: {
    name: 'Rohan Verma (fictional)',
    relationship: 'SPOUSE',
    phone: '+91 91234 56789',
  },
  allergies: ['PENICILLIN', 'DUST_MITES'],
  visits: [
    {
      visit_date: '2026-05-12',
      department: 'GENERAL_MEDICINE',
      diagnosis: 'SEASONAL_FLU',
      follow_up_required: false,
    },
    {
      visit_date: '2026-07-01',
      department: 'ORTHOPEDICS',
      diagnosis: 'MINOR_SPRAIN',
      follow_up_required: true,
    },
  ],
}

const softwareConfig = {
  app_name: 'Aurora Sync',
  version: '2.14.0',
  debug_mode: false,
  max_retries: 5,
  timeout_ms: 30000,
  api_url: 'https://api.example.com/v2',
  allowed_origins: ['https://app.example.com', 'https://staging.example.com'],
  cache: {
    enabled: true,
    ttl_seconds: 3600,
    strategy: 'LEAST_RECENTLY_USED',
  },
  feature_flags: {
    new_dashboard: true,
    dark_mode: true,
    beta_exports: false,
  },
}

const userList = {
  total_count: 4,
  users: [
    {
      user_id: 1,
      name: 'Meera Nair',
      email: 'meera@example.com',
      role: 'ADMIN',
      is_active: true,
      signup_date: '2023-01-12',
    },
    {
      user_id: 2,
      name: 'Arjun Singh',
      email: 'arjun@example.com',
      role: 'EDITOR',
      is_active: true,
      signup_date: '2023-06-03',
    },
    {
      user_id: 3,
      name: 'Sara Thomas',
      email: 'sara@example.com',
      role: 'VIEWER',
      is_active: false,
      signup_date: '2024-02-18',
    },
    {
      user_id: 4,
      name: 'Vikram Rao',
      email: 'vikram@example.com',
      role: 'EDITOR',
      is_active: true,
      signup_date: '2024-09-27',
    },
  ],
}

const deeplyNested = {
  company: {
    name: 'Nested Industries',
    headquarters: {
      country: 'India',
      campus: {
        building: 'Block C',
        floor: {
          number: 4,
          wing: {
            name: 'Innovation Wing',
            rooms: [
              {
                room_id: 'C4-401',
                capacity: 12,
                equipment: {
                  projector: true,
                  whiteboard: true,
                  video_conferencing: {
                    provider: 'EXAMPLE_MEET',
                    is_configured: true,
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
}

const invalidJson = `{
  "order_id": 123,
  "customer_name": "Ravi Kumar",
  "items": [
    { "name": "Wireless Mouse", "price": 1299 },
    { "name": "USB-C Cable", "price": 250 },
  ],
  "is_paid": true,
}`

const largeArray = {
  report_name: 'Monthly Transactions',
  generated_at: '2026-08-01T00:00:00Z',
  transactions: Array.from({ length: 500 }, (_, i) => ({
    transaction_id: `TXN-${String(i + 1).padStart(5, '0')}`,
    amount: Math.round((((i * 7919) % 90000) + 500) / 5) * 5,
    status: ['COMPLETED', 'PENDING', 'FAILED'][i % 3],
    payment_method: ['CARD', 'UPI', 'NET_BANKING', 'WALLET'][i % 4],
    created_at: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
  })),
}

const comparisonBefore = {
  order_id: 555,
  payment_status: 'PENDING',
  total_amount: 3200,
  delivery_date: '2026-08-10',
  items: [{ name: 'Desk Lamp', quantity: 1 }],
}

const comparisonAfter = {
  order_id: 555,
  payment_status: 'COMPLETED',
  total_amount: 3200,
  customer_email: 'ravi.kumar@example.com',
  items: [
    { name: 'Desk Lamp', quantity: 1 },
    { name: 'Extension Cord', quantity: 1 },
  ],
}

const stringify = (value) => JSON.stringify(value, null, 2)

export const samples = [
  { id: 'customer-profile', name: 'Customer profile', text: stringify(customerProfile) },
  { id: 'ecommerce-order', name: 'E-commerce order', text: stringify(ecommerceOrder) },
  { id: 'api-error', name: 'API error response', text: stringify(apiError) },
  { id: 'patient-summary', name: 'Hospital patient summary', text: stringify(patientSummary) },
  { id: 'software-config', name: 'Software configuration', text: stringify(softwareConfig) },
  { id: 'user-list', name: 'Array of users', text: stringify(userList) },
  { id: 'deeply-nested', name: 'Deeply nested JSON', text: stringify(deeplyNested) },
  { id: 'invalid-json', name: 'Broken JSON (with repair)', text: invalidJson },
  { id: 'large-array', name: 'Large array (500 rows)', text: stringify(largeArray) },
]

export const comparisonSample = {
  left: stringify(comparisonBefore),
  right: stringify(comparisonAfter),
}
