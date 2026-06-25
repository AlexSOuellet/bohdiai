import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetContactForm } from './MainStreetContactForm';

afterEach(cleanup);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

describe('MainStreetContactForm', () => {
  it('renders name, email, and message fields and a submit', () => {
    const { getByLabelText, getByRole } = render(
      <MainStreetContactForm tenantId={TENANT_ID} />,
    );
    expect(getByLabelText(/name/i)).toBeTruthy();
    expect(getByLabelText(/email/i)).toBeTruthy();
    expect(getByLabelText(/message/i)).toBeTruthy();
    expect(getByRole('button', { name: /send/i })).toBeTruthy();
  });
});
