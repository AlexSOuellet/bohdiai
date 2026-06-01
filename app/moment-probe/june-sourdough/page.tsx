/** THROWAWAY PROBE — the story intro proving it generalizes past candles:
 * June's Sourdough, steaming-bread video, a bread story. Delete with the folder. */
import CandleStoryDemo from '../CandleStoryDemo';

export default function JuneSourdoughPage() {
  return (
    <CandleStoryDemo
      video="/bread-kling.mp4"
      eyebrow="Baked fresh every morning"
      brand="June's Sourdough"
      cta="See the loaves"
      story={[
        'It starts the night before',
        'Just flour, water, salt, and time',
        'Folded by hand, left to rise slow',
        'Pulled from the oven at first light',
      ]}
    />
  );
}
