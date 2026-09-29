import { describe, expect, it } from 'vitest';
import { contactSchema } from './validation';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

describe('contactSchema', () => {
  it('accepts a complete message and normalises the email', () => {
    const result = contactSchema.safeParse({ tenantId: TENANT, name: ' Pat ', email: ' Pat@Example.COM ', message: 'Hi' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('pat@example.com');
      expect(result.data.name).toBe('Pat');
    }
  });

  it('rejects a missing name, a bad email, an empty message, or a non-uuid shop', () => {
    expect(contactSchema.safeParse({ tenantId: TENANT, name: '', email: 'a@b.co', message: 'Hi' }).success).toBe(false);
    expect(contactSchema.safeParse({ tenantId: TENANT, name: 'Pat', email: 'nope', message: 'Hi' }).success).toBe(false);
    expect(contactSchema.safeParse({ tenantId: TENANT, name: 'Pat', email: 'a@b.co', message: ' ' }).success).toBe(false);
    expect(contactSchema.safeParse({ tenantId: 'shop', name: 'Pat', email: 'a@b.co', message: 'Hi' }).success).toBe(false);
  });
});
