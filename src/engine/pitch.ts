export const bpmAfterPitch = (originalBpm: number, pitchPercent: number): number => {
  return originalBpm * (1 + pitchPercent / 100);
};

export const pitchToMatchBpm = (originalBpm: number, targetBpm: number): number => {
  return (targetBpm / originalBpm - 1) * 100;
};

export const semitoneShiftFromPitch = (pitchPercent: number): number => {
  const ratio = 1 + pitchPercent / 100;
  return 12 * Math.log2(ratio);
};

export const roundedSemitoneShift = (pitchPercent: number): number => {
  return Math.round(semitoneShiftFromPitch(pitchPercent));
};
