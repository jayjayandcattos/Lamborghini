import { Grid } from '@react-three/drei';

/**
 * The ground plane: an infinite measurement grid, faded at the horizon.
 * This is the single most recognisable cue from a three.js example scene.
 */
export function StageDecor({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Grid
      position={[0, -0.014, 0]}
      args={[24, 24]}
      cellSize={0.4}
      cellThickness={0.55}
      cellColor="#cdcbbf"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#aeaca0"
      fadeDistance={24}
      fadeStrength={1.6}
      infiniteGrid
    />
  );
}
