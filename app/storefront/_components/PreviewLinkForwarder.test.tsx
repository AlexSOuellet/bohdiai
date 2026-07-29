import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { PreviewLinkForwarder } from './PreviewLinkForwarder';

// The forwarder keeps the editor's preview context alive across in-store clicks:
// a capture-phase listener re-attaches the current page's preview params onto the
// destination and navigates there. We inject `navigate` so the assertion is the
// computed URL, without fighting jsdom's read-only window.location.

const navigate = vi.fn();

/** Point the page URL (and its query string) at `url` so the handler reads the
 *  current preview context from window.location.search, the way it does live. */
function setPageUrl(url: string) {
  window.history.pushState({}, '', url);
}

// jsdom can't actually navigate; a click on a cross-document <a> whose default
// isn't prevented logs an "Not implemented: navigation" warning. Our forwarder
// only preventDefaults the links it intercepts, so the deliberately-ignored links
// (external, _blank, modified) would let jsdom try. This bubble-phase guard runs
// after our capture handler and after the assertions are computed, swallowing the
// default so test output stays pristine — it changes nothing the tests assert.
const swallowNav = (event: Event) => event.preventDefault();

beforeEach(() => {
  cleanup();
  navigate.mockReset();
  setPageUrl('/');
  document.addEventListener('click', swallowNav);
});

afterEach(() => {
  document.removeEventListener('click', swallowNav);
  cleanup();
});

describe('PreviewLinkForwarder', () => {
  it('forwards the current preview params onto an internal link and navigates', () => {
    setPageUrl('/?previewToken=T&previewStill=1');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/shop">shop</a>
      </>,
    );

    fireEvent.click(screen.getByText('shop'));

    expect(navigate).toHaveBeenCalledTimes(1);
    const dest = new URL(navigate.mock.calls[0]![0] as string, 'http://localhost');
    expect(dest.pathname).toBe('/shop');
    expect(dest.searchParams.get('previewToken')).toBe('T');
    expect(dest.searchParams.get('previewStill')).toBe('1');
  });

  it('forwards every present preview param and omits absent ones', () => {
    setPageUrl('/?previewToken=T&previewLook=ember&previewMood=cozy&previewTexture=tx&previewTextureOpacity=0.4');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/about">about</a>
      </>,
    );

    fireEvent.click(screen.getByText('about'));

    const dest = new URL(navigate.mock.calls[0]![0] as string, 'http://localhost');
    expect(dest.searchParams.get('previewToken')).toBe('T');
    expect(dest.searchParams.get('previewLook')).toBe('ember');
    expect(dest.searchParams.get('previewMood')).toBe('cozy');
    expect(dest.searchParams.get('previewTexture')).toBe('tx');
    expect(dest.searchParams.get('previewTextureOpacity')).toBe('0.4');
    expect(dest.searchParams.get('previewStill')).toBeNull();
  });

  it('preserves the destination’s own query (the Intro case) while merging preview params', () => {
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/?intro=1">intro</a>
      </>,
    );

    fireEvent.click(screen.getByText('intro'));

    const dest = new URL(navigate.mock.calls[0]![0] as string, 'http://localhost');
    expect(dest.pathname).toBe('/');
    expect(dest.searchParams.get('intro')).toBe('1');
    expect(dest.searchParams.get('previewToken')).toBe('T');
  });

  it('ignores an external link', () => {
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="https://other.example/x" onClick={(e) => e.preventDefault()}>
          external
        </a>
      </>,
    );

    fireEvent.click(screen.getByText('external'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a modified click (open-in-new-tab intent)', () => {
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/shop" onClick={(e) => e.preventDefault()}>
          shop
        </a>
      </>,
    );

    fireEvent.click(screen.getByText('shop'), { metaKey: true });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a target=_blank link', () => {
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/shop" target="_blank" rel="noreferrer" onClick={(e) => e.preventDefault()}>
          shop
        </a>
      </>,
    );

    fireEvent.click(screen.getByText('shop'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a same-page hash link so it can scroll', () => {
    setPageUrl('/about?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="#reviews">reviews</a>
      </>,
    );

    fireEvent.click(screen.getByText('reviews'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a click that is not on a link', () => {
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <button type="button">not a link</button>
      </>,
    );

    fireEvent.click(screen.getByText('not a link'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('reads params fresh at click time so multi-hop stays correct', () => {
    // First page carries token T; a later hop carries T2. The forwarder must use
    // whatever the CURRENT page URL holds, not a value captured at mount.
    setPageUrl('/?previewToken=T');
    render(
      <>
        <PreviewLinkForwarder navigate={navigate} />
        <a href="/shop">shop</a>
      </>,
    );

    setPageUrl('/about?previewToken=T2');
    fireEvent.click(screen.getByText('shop'));

    const dest = new URL(navigate.mock.calls[0]![0] as string, 'http://localhost');
    expect(dest.searchParams.get('previewToken')).toBe('T2');
  });
});
