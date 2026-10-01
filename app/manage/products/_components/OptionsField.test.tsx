import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductFile: vi.fn() }));

import { OptionsField } from './OptionsField';
import type { OptionForm, VariantForm } from '@/lib/backend/catalog/product-form';

const size: OptionForm = { name: 'Size', choices: [{ value: 'Small', kind: 'physical', fileUploadId: null, fileName: null }] };
const variants: VariantForm[] = [{ choices: { Size: 'Small' }, price: '', stock: '', available: true }];

const setup = (over: Partial<Omit<React.ComponentProps<typeof OptionsField>, 'onOptions' | 'onVariants' | 'onChoiceFile' | 'onError'>> = {}) => {
  const props = { options: [size], variants, basePrice: '24', digital: false, onOptions: vi.fn(), onVariants: vi.fn(), onChoiceFile: vi.fn(), onError: vi.fn(), ...over };
  render(<OptionsField {...props} />);
  return props;
};

describe('OptionsField', () => {
  it('adds an option and a choice', () => {
    const p = setup({ options: [], variants: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    expect(p.onOptions).toHaveBeenCalledWith([{ name: '', choices: [] }]);
  });
  it('adds a typed choice on Enter and ignores a blank one', () => {
    const p = setup();
    const input = screen.getByLabelText('New choice for Size');
    fireEvent.change(input, { target: { value: 'Large' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onOptions).toHaveBeenCalledWith([{ name: 'Size', choices: [size.choices[0], { value: 'Large', kind: 'physical', fileUploadId: null, fileName: null }] }]);
    p.onOptions.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Add choice to Size' }));
    expect(p.onOptions).not.toHaveBeenCalled();
  });
  it('removes a choice and an option', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Small' }));
    expect(p.onOptions).toHaveBeenLastCalledWith([{ name: 'Size', choices: [] }]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove the Size option' }));
    expect(p.onOptions).toHaveBeenLastCalledWith([]);
  });
  it('edits each combination’s price, stock and availability', () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText('Price for Small'), { target: { value: '30' } });
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], price: '30' }]);
    fireEvent.change(screen.getByLabelText('Stock for Small'), { target: { value: '2' } });
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], stock: '2' }]);
    fireEvent.click(screen.getByLabelText('Small is available'));
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], available: false }]);
    expect(screen.getByLabelText('Price for Small')).toHaveAttribute('placeholder', '24');
  });
  it('offers download choices only when the site has them', () => {
    setup();
    expect(screen.queryByLabelText('Small is sold as')).toBeNull();
  });
  it('lets a choice be a download when the site has them', () => {
    const p = setup({ digital: true });
    fireEvent.change(screen.getByLabelText('Small is sold as'), { target: { value: 'digital' } });
    expect(p.onOptions).toHaveBeenLastCalledWith([{ name: 'Size', choices: [{ ...size.choices[0], kind: 'digital' }] }]);
  });
  it('stops at three options', () => {
    setup({ options: [size, { ...size, name: 'B' }, { ...size, name: 'C' }] });
    expect(screen.getByRole('button', { name: 'Add an option' })).toBeDisabled();
  });
});
