import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SocialIcons } from './SocialIcons';

const labels = { facebook: 'words.facebook', instagram: 'words.instagram' };

afterEach(cleanup);

describe('SocialIcons', () => {
  it('shows nothing when no account is set', () => {
    const { container } = render(<SocialIcons facebookUrl="" instagramUrl="" className="x" labels={labels} />);
    expect(container.innerHTML).toBe('');
  });

  it('names each icon for screen readers only by default', () => {
    render(<SocialIcons facebookUrl="https://facebook.com/a" instagramUrl="https://instagram.com/a" className="x" labels={labels} />);
    expect(screen.getByRole('link', { name: 'words.facebook' })).toHaveAttribute('aria-label', 'words.facebook');
    expect(screen.queryByText('words.facebook')).toBeNull();
  });

  it('writes each name out beside its icon with showNames, from the site words', () => {
    render(<SocialIcons facebookUrl="https://facebook.com/a" instagramUrl="https://instagram.com/a" className="x" labels={labels} showNames />);
    const fb = screen.getByRole('link', { name: 'words.facebook' });
    const ig = screen.getByRole('link', { name: 'words.instagram' });
    expect(fb).toHaveClass('is-facebook');
    expect(ig).toHaveClass('is-instagram');
    expect(fb).not.toHaveAttribute('aria-label');
    expect(fb).toHaveTextContent('words.facebook');
    expect(ig).toHaveAttribute('href', 'https://instagram.com/a');
  });

  it('letters the written names in the type role it is given', () => {
    render(<SocialIcons facebookUrl="https://facebook.com/a" instagramUrl="" className="x" labels={labels} showNames nameType="navLabel" />);
    expect(screen.getByText('words.facebook')).toHaveAttribute('data-type', 'navLabel');
  });

  it('shows only the accounts that are set', () => {
    render(<SocialIcons facebookUrl="" instagramUrl="https://instagram.com/a" className="x" labels={labels} showNames />);
    expect(screen.queryByRole('link', { name: 'words.facebook' })).toBeNull();
    expect(screen.getByRole('link', { name: 'words.instagram' })).toBeInTheDocument();
  });
});
