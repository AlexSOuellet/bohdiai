import { describe, it, expect } from 'vitest';
import { previewPropsFrom } from './preview-params';

describe('previewPropsFrom', () => {
  it('passes the draft token through so a sub-page renders the draft, not live', () => {
    // The bug this fixes: sub-page routes ignored the token and showed the live store.
    expect(previewPropsFrom({ previewToken: 'tok.sig' }).previewToken).toBe('tok.sig');
  });

  it('parses previewStill "1" to true, anything else to false', () => {
    expect(previewPropsFrom({ previewStill: '1' }).previewStill).toBe(true);
    expect(previewPropsFrom({ previewStill: '0' }).previewStill).toBe(false);
    expect(previewPropsFrom({}).previewStill).toBe(false);
  });

  it('parses opacity to a number and leaves it undefined when absent', () => {
    expect(previewPropsFrom({ previewTextureOpacity: '0.4' }).previewTextureOpacity).toBe(0.4);
    expect(previewPropsFrom({}).previewTextureOpacity).toBeUndefined();
  });

  it('carries the look params (look/mood/texture) through', () => {
    const props = previewPropsFrom({ previewLook: 'ember', previewMood: 'cozy', previewTexture: 'linen' });
    expect(props.previewLook).toBe('ember');
    expect(props.previewMood).toBe('cozy');
    expect(props.previewTexture).toBe('linen');
  });

  it('an empty query string yields no token (renders the live store)', () => {
    expect(previewPropsFrom({}).previewToken).toBeUndefined();
  });
});
