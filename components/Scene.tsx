import { Embers } from './Embers';

/**
 * Atmospheric backdrop shell. Wraps the page in a single .scene container,
 * stacks the breathing glow / vignette / prism beams / grain / embers
 * decorative layers, and provides .scene-content as the slot for actual
 * content above all that.
 *
 * Decorative layers are aria-hidden — they exist only for atmosphere.
 */
export function Scene({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="scene">
      <div className="scene-glow" aria-hidden="true" />
      <div className="scene-glow-deep" aria-hidden="true" />
      <div className="scene-prism" aria-hidden="true">
        <div className="beam beam-1" />
        <div className="beam beam-2" />
        <div className="beam beam-3" />
      </div>
      <div className="scene-vignette" aria-hidden="true" />
      <div className="scene-grain" aria-hidden="true" />
      <Embers />
      <div className="scene-content">{children}</div>
    </div>
  );
}
