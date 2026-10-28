import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { SHOP_WORD_SPOTS } from '@/lib/storefront/words';

const act = vi.hoisted(() => ({
  signInBuyer: vi.fn(),
  signUpBuyer: vi.fn(),
  requestBuyerReset: vi.fn(),
  resetBuyerPassword: vi.fn(),
  reorderBuyerOrder: vi.fn(),
  signOutBuyer: vi.fn(),
}));
vi.mock('./actions', () => act);

const { SignInOrCreate, ForgotPassword, NewPassword } = await import('./AccountForms');
const { MyAccount, OrderPage } = await import('./AccountViews');

const W = keyWords(SHOP_WORD_SPOTS, 'shop').account;

afterEach(() => {
  cleanup();
  Object.values(act).forEach((f) => f.mockReset());
});

describe('sign in or make an account', () => {
  it('signs in with the email and password', async () => {
    act.signInBuyer.mockResolvedValue({ ok: false, error: 'nope' });
    render(<SignInOrCreate w={W} minPassword={10} />);
    expect(screen.getByRole('heading', { name: W.signIn.title })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(W.signIn.email), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText(W.signIn.password), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: W.signIn.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('nope'));
    expect(act.signInBuyer).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' });
    expect(screen.getByRole('link', { name: W.signIn.forgot }).getAttribute('href')).toBe('/account/forgot');
  });

  it('switches to making an account, with a name and the password hint', async () => {
    act.signUpBuyer.mockResolvedValue({ ok: false, error: '' });
    render(<SignInOrCreate w={W} minPassword={10} />);
    fireEvent.click(screen.getByRole('button', { name: W.signIn.toCreate }));
    expect(screen.getByRole('heading', { name: W.create.title })).toBeTruthy();
    expect(screen.getByText(W.create.passwordHint)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(W.create.name), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: W.create.submit }));
    // An empty error from the server shows the shop's failure words.
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(W.errors.failed));
    expect(act.signUpBuyer).toHaveBeenCalledWith({ name: 'Ada', email: '', password: '' });
    fireEvent.click(screen.getByRole('button', { name: W.create.toSignIn }));
    expect(screen.getByRole('heading', { name: W.signIn.title })).toBeTruthy();
  });

  it('shows and hides the password', () => {
    render(<SignInOrCreate w={W} minPassword={10} />);
    const box = screen.getByLabelText(W.signIn.password) as HTMLInputElement;
    expect(box.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: W.showPassword }));
    expect(box.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: W.hidePassword }));
    expect(box.type).toBe('password');
  });

  it('shows the failure words when the action throws', async () => {
    act.signInBuyer.mockRejectedValue(new Error('network'));
    render(<SignInOrCreate w={W} minPassword={10} />);
    fireEvent.click(screen.getByRole('button', { name: W.signIn.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(W.errors.failed));
  });
});

describe('forgot password', () => {
  it('sends the link and says so', async () => {
    act.requestBuyerReset.mockResolvedValue({ ok: true, message: 'on its way' });
    render(<ForgotPassword w={W} />);
    fireEvent.change(screen.getByLabelText(W.signIn.email), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: W.forgot.submit }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('on its way'));
  });

  it('shows the shop’s sent words when the server gives none, and errors otherwise', async () => {
    act.requestBuyerReset.mockResolvedValueOnce({ ok: false, error: 'bad email' }).mockResolvedValueOnce({ ok: true });
    render(<ForgotPassword w={W} />);
    fireEvent.click(screen.getByRole('button', { name: W.forgot.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('bad email'));
    fireEvent.click(screen.getByRole('button', { name: W.forgot.submit }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(W.forgot.sent));
  });
});

describe('a new password', () => {
  it('sends both passwords with the link’s token', async () => {
    act.resetBuyerPassword.mockResolvedValue({ ok: false, error: 'mismatch' });
    render(<NewPassword w={W} tokenHash="tok" minPassword={10} />);
    fireEvent.change(screen.getByLabelText(W.newPassword.password), { target: { value: 'aaaaaaaaaa' } });
    fireEvent.change(screen.getByLabelText(W.newPassword.confirm), { target: { value: 'bbbbbbbbbb' } });
    fireEvent.click(screen.getByRole('button', { name: W.newPassword.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('mismatch'));
    expect(act.resetBuyerPassword).toHaveBeenCalledWith({ tokenHash: 'tok', password: 'aaaaaaaaaa', confirm: 'bbbbbbbbbb' });
  });
});

describe('My account', () => {
  it('greets the buyer and lists their orders, each opening its page', () => {
    render(<MyAccount w={W} name="Ada" orders={[{ number: '1042', placedAt: '2026-10-20T15:00:00Z', status: 'partially_refunded', total: '$45' }]} timeZone="America/Toronto" />);
    expect(screen.getByText(W.mine.hello)).toBeTruthy();
    const row = screen.getByRole('link', { name: `${W.mine.number}, ${W.mine.view}` });
    expect(row.getAttribute('href')).toBe('/account/orders/1042');
    expect(screen.getByText(W.status.partiallyRefunded)).toBeTruthy();
    expect(screen.getByRole('button', { name: W.mine.signOut })).toBeTruthy();
  });

  it('says there are no orders yet, and greets someone with no name', () => {
    render(<MyAccount w={W} name="" orders={[]} timeZone="Not/AZone" />);
    expect(screen.getByText(W.mine.helloNoName)).toBeTruthy();
    expect(screen.getByText(W.mine.none)).toBeTruthy();
    expect(screen.getByRole('link', { name: W.mine.browse }).getAttribute('href')).toBe('/shop');
  });
});

describe('an order’s page', () => {
  const order = {
    number: '1042',
    placedAt: '2026-10-20T15:00:00Z',
    status: 'paid',
    total: '$53',
    subtotal: '$50',
    discount: { label: '', amount: '$5' },
    shipping: '$5',
    tax: '$3',
    paid: true,
    lines: [
      { name: 'Wreath', option: 'Large', quantity: 2, price: '$20', entry: 'x' },
      { name: 'Sign', option: '', quantity: 1, price: '$10', entry: null },
    ],
  };

  it('shows the pieces, the sums and Reorder on a paid order', async () => {
    act.reorderBuyerOrder.mockResolvedValue({ ok: false, error: W.order.reorderNone });
    render(<OrderPage w={W} order={order} timeZone="UTC" />);
    expect(screen.getByText('Large')).toBeTruthy();
    expect(screen.getByText('× 2')).toBeTruthy();
    expect(screen.getByText(W.order.discount)).toBeTruthy();
    expect(screen.getByText(W.order.shipping)).toBeTruthy();
    expect(screen.getByText(W.order.tax)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: W.order.reorder }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(W.order.reorderNone));
    expect(act.reorderBuyerOrder).toHaveBeenCalledWith({ number: '1042' });
  });

  it('has no Reorder before it’s paid, and names the discount when it has a name', () => {
    render(<OrderPage w={W} order={{ ...order, paid: false, discount: { label: 'Fall sale', amount: '$5' }, shipping: null, tax: null }} timeZone="UTC" />);
    expect(screen.queryByRole('button', { name: W.order.reorder })).toBeNull();
    expect(screen.getByText('Fall sale')).toBeTruthy();
  });
});
