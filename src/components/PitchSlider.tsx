import React from "react";

type PitchSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  rangeLabel?: string;
};

const PitchSlider = ({ value, onChange, min = -10, max = 10, rangeLabel }: PitchSliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-slate-400">
        <span>Pitch{rangeLabel ? ` ${rangeLabel}` : ""}</span>
        <span className="text-neon-400">{value.toFixed(2)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step="any"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onDoubleClick={() => onChange(0)}
        className="w-full accent-neon-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
};

export default PitchSlider;
