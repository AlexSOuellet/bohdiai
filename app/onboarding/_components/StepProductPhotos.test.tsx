import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepProductPhotos from './StepProductPhotos';
import { INITIAL_DATA } from './types';

vi.mock('../product-photos-actions', () => ({
  uploadProductPhotos: vi.fn(async () => ({
    productPhotoUrls: ['https://example.com/uploaded.jpg'],
    visionPerPhoto: [],
    makerWork: '',
  })),
}));

describe('StepProductPhotos', () => {
  it('renders the heading and skip button', () => {
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/got a few product photos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('skip advances with empty arrays', () => {
    const onAdvance = vi.fn();
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={onAdvance}
        onBack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onAdvance).toHaveBeenCalledWith({
      productPhotoUrls: [],
      visionPerPhoto: [],
      makerWork: '',
    });
  });

  it('back triggers onBack', () => {
    const onBack = vi.fn();
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
