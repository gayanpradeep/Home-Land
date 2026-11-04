// Validated palette (light mode) from the dataviz skill's reference instance.
// Categorical order is fixed — never cycle or reassign by rank.
export const CATEGORICAL = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#6250d6", // 7 violet
  "#e34948", // 8 red
];

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  200: "#9ec5f4",
  300: "#6da7ec",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
  700: "#0d366b",
};

// Diverging pair for the 1-5 sentiment scale: red (negative) -> gray (neutral) -> blue (positive).
export const DIVERGING = {
  veryNegative: "#e34948",
  negative: "#eb6834",
  neutral: "#898781",
  positive: "#6da7ec",
  veryPositive: "#2a78d6",
};

export const RATING_SCORE_COLOR: Record<number, string> = {
  1: DIVERGING.veryNegative,
  2: DIVERGING.negative,
  3: DIVERGING.neutral,
  4: DIVERGING.positive,
  5: DIVERGING.veryPositive,
};

export const CHART_INK = {
  surface: "#fcfcfb",
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};
