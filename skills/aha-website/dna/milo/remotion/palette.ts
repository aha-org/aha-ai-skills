/**
 * Milo's colour = his emotional state. Identity never changes, only the colour.
 * body = front face, side = the darker thickness band.
 * Sampled from the references where they exist; the rest are PROPOSED.
 */
export type MiloColor = "green" | "blue" | "pink" | "yellow" | "orange" | "red";

export const miloPalette: Record<MiloColor, { body: string; side: string; note: string }> = {
  green: { body: "#9AB327", side: "#8AA31D", note: "Natural / default (refs 01, 08, 11)" },
  blue: { body: "#7BA6DE", side: "#6390CF", note: "Sad, vulnerable, low, or calm (refs 10, 11)" },
  pink: { body: "#F4668E", side: "#E4527D", note: "Love, affection (ref 04)" },
  yellow: { body: "#F1C93F", side: "#DFB22C", note: "PROPOSED. Confused or uncertain (no reference yet)" },
  orange: { body: "#F59A3D", side: "#E3822B", note: "PROPOSED. Alert, activated (no reference yet)" },
  red: { body: "#E8584B", side: "#D2443A", note: "PROPOSED. Angry, intense (no reference yet)" },
};

export const miloInk = {
  /** Eyes: soft black, never pure black. */
  eye: "#262525",
  /** Heart eyes (love). */
  heart: "#C11D4A",
  /** Love blush under the eyes. */
  blush: "#E94F7E",
  /** Contact shadow, as a multiply-style tint so it works on white and on cream. */
  shadow: "rgba(70, 62, 44, 0.15)",
};
