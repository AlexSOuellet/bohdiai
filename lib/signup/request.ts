/**
 * Sign-up (Alex, Session 119), checked: the first step at bohdiai.com/start, before
 * anything about the site. The plan, then who they are and their account; then
 * straight to Stripe. Pure, shared by the page (instant messages) and the route
 * (which checks again). Problems are spots in the form's own words (errors.*).
 */
import { FREE_PLAN, isFreePlan, isSitePlan, type AccountPlan } from '@/lib/backend/plan/plan';
import { BILLINGS, EMAIL_SHAPE, INTAKE_LIMITS, PASSWORD_MAX, PASSWORD_MIN, type Billing, type IntakeProblem } from '@/lib/intake/request';

/** Field names the page posts and the route reads. */
export const SIGNUP_FIELD = {
  plan: 'plan',
  billing: 'billing',
  name: 'makerName',
  business: 'businessName',
  email: 'email',
  password: 'password',
  honeypot: 'company',
} as const;

export type SignupFields = {
  plan: AccountPlan;
  billing: Billing;
  makerName: string;
  businessName: string;
  email: string;
};

export type SignupDraft = Omit<SignupFields, 'plan'> & { plan: AccountPlan | null; password: string };

export type SignupParsed =
  | { kind: 'spam' }
  | { kind: 'invalid'; problem: IntakeProblem }
  | { kind: 'ok'; fields: SignupFields; password: string };

export function isAccountPlan(v: unknown): v is AccountPlan {
  return isFreePlan(v) || isSitePlan(v);
}

/** The first thing wrong, top of the form first; null when it's ready. */
export function checkSignup(d: SignupDraft): IntakeProblem | null {
  const p = (spot: IntakeProblem['spot'], values: Record<string, string | number> = {}): IntakeProblem => ({ spot, values });
  if (d.plan === null) return p('plan');
  if (d.makerName.trim() === '') return p('name');
  if (d.businessName.trim() === '') return p('business');
  if (!EMAIL_SHAPE.test(d.email.trim())) return p('email');
  if (d.password.length < PASSWORD_MIN || d.password.length > PASSWORD_MAX) return p('password', { min: PASSWORD_MIN, max: PASSWORD_MAX });
  const long = d.makerName.trim().length > INTAKE_LIMITS.name || d.businessName.trim().length > INTAKE_LIMITS.business || d.email.trim().length > INTAKE_LIMITS.email;
  return long ? p('tooLong') : null;
}

function text(body: Record<string, unknown>, name: string): string {
  const v = body[name];
  return typeof v === 'string' ? v : '';
}

/** The posted sign-up (JSON), checked. A filled honeypot is a bot. */
export function parseSignup(body: unknown): SignupParsed {
  const b = body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  if (text(b, SIGNUP_FIELD.honeypot).trim() !== '') return { kind: 'spam' };
  const planRaw = text(b, SIGNUP_FIELD.plan);
  const plan = isAccountPlan(planRaw) ? planRaw : null;
  const billingRaw = text(b, SIGNUP_FIELD.billing);
  const billing: Billing = plan === FREE_PLAN ? 'monthly' : (BILLINGS as readonly string[]).includes(billingRaw) ? (billingRaw as Billing) : 'monthly';
  const draft: SignupDraft = {
    plan,
    billing,
    makerName: text(b, SIGNUP_FIELD.name),
    businessName: text(b, SIGNUP_FIELD.business),
    email: text(b, SIGNUP_FIELD.email),
    password: text(b, SIGNUP_FIELD.password),
  };
  const problem = checkSignup(draft);
  if (problem !== null || draft.plan === null) return { kind: 'invalid', problem: problem ?? { spot: 'plan', values: {} } };
  return {
    kind: 'ok',
    fields: { plan: draft.plan, billing, makerName: draft.makerName.trim(), businessName: draft.businessName.trim(), email: draft.email.trim().toLowerCase() },
    password: draft.password,
  };
}
