import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNotice } from './Notice';

function Harness(): React.ReactElement {
  const n = useNotice();
  return (
    <>
      {n.area}
      <button type="button" onClick={() => n.showError('Nope.')}>error</button>
      <button type="button" onClick={() => n.showSaved('Saved.')}>saved</button>
      <button type="button" onClick={n.clear}>clear</button>
    </>
  );
}

const scrollIntoView = vi.fn();
beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView; // jsdom has no layout
});

describe('useNotice', () => {
  it('keeps both live regions in the page, empty until there is something to say', () => {
    render(<Harness />);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it('focuses and scrolls to an error, and a saved message replaces it', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Nope.');
    expect(screen.getByRole('alert').parentElement).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'saved' }));
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toHaveTextContent('Saved.');
    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it('shows the same error again as a fresh node, so it is announced again', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    const first = screen.getByText('Nope.');
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByText('Nope.')).not.toBe(first);
  });
});
