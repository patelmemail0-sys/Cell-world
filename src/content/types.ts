// Codex data model. Every pickable thing in the world maps to exactly one entry.

export type Category =
  | 'organelle'
  | 'membrane'
  | 'membrane protein'
  | 'molecular machine'
  | 'enzyme'
  | 'structural protein'
  | 'motor protein'
  | 'nucleic acid'
  | 'lipid'
  | 'compartment'
  | 'vesicle'
  | 'complex';

export interface CodexProcess {
  id: string;
  name: string;
  /** Ordered, mechanistic steps. Each step is one or two sentences. */
  steps: string[];
}

export interface CodexFact {
  label: string;
  value: string;
}

export interface CodexEntry {
  id: string;
  /** null for organelle-level entries. */
  parent: string | null;
  name: string;
  category: Category;
  /** One-sentence definition: what it is. */
  summary: string;
  /** What it does for the cell (2-4 sentences). */
  function: string;
  /** Named structural parts, short phrases. */
  structure?: string[];
  /** Live processes this entity performs in the world. */
  processes?: CodexProcess[];
  /** Real numbers: sizes, counts, rates, stoichiometry. */
  facts: CodexFact[];
  /** True physical size range in nanometres. */
  sizeNm: [number, number];
  /** Real-world speed of the main process, for the "shown slowed" badge. */
  realRate?: string;
  /** How much larger than true scale the model is drawn (molecules only). */
  enlargement?: number;
  /** What the model exaggerates or simplifies. */
  accuracy: string;
  /** Keys into REFERENCES. Required for organelle-level entries. */
  references?: string[];
}
