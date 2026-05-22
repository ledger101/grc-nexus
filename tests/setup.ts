import '@testing-library/jest-dom'
import { afterAll, beforeAll } from 'vitest'

// Suppress Next.js server-only module warnings in test env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.DEVICE_TRUST_SECRET = 'a'.repeat(64)
process.env.RESEND_API_KEY = 're_test'

beforeAll(() => {
  // Global test setup
})

afterAll(() => {
  // Global teardown
})
