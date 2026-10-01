// Fixed citation table. Codex entries may only cite these keys, so nothing gets invented.
// Textbook chapters are named by topic rather than number.

export interface Reference {
  key: string;
  citation: string;
}

const ALBERTS = 'Alberts B, Heald R, Johnson A, Morgan D, Raff M, Roberts K, Walter P. Molecular Biology of the Cell, 7th ed. W. W. Norton, 2022';
const LODISH = 'Lodish H, Berk A, Kaiser CA, et al. Molecular Cell Biology, 9th ed. Macmillan Learning, 2021';
const LEHNINGER = 'Nelson DL, Cox MM. Lehninger Principles of Biochemistry, 8th ed. Macmillan Learning, 2021';

const list: Reference[] = [
  { key: 'alberts-membranes', citation: `${ALBERTS}. Chapter on membrane structure.` },
  { key: 'alberts-transport', citation: `${ALBERTS}. Chapter on membrane transport of small molecules and the electrical properties of membranes.` },
  { key: 'alberts-genome', citation: `${ALBERTS}. Chapter on DNA, chromosomes and genomes.` },
  { key: 'alberts-dna-to-protein', citation: `${ALBERTS}. Chapter on how cells read the genome: from DNA to protein.` },
  { key: 'alberts-sorting', citation: `${ALBERTS}. Chapter on intracellular organization and protein sorting.` },
  { key: 'alberts-traffic', citation: `${ALBERTS}. Chapter on intracellular membrane traffic.` },
  { key: 'alberts-energy', citation: `${ALBERTS}. Chapter on energy conversion and metabolic compartmentation: mitochondria.` },
  { key: 'alberts-cytoskeleton', citation: `${ALBERTS}. Chapter on the cytoskeleton.` },
  { key: 'alberts-proteins', citation: `${ALBERTS}. Chapter on proteins (protein function, folding and degradation).` },
  { key: 'alberts-signaling', citation: `${ALBERTS}. Chapter on cell signaling.` },
  { key: 'lodish-traffic', citation: `${LODISH}. Chapter on vesicular traffic, secretion and endocytosis.` },
  { key: 'lodish-cytoskeleton', citation: `${LODISH}. Chapters on microfilaments and microtubules.` },
  { key: 'lodish-energy', citation: `${LODISH}. Chapter on cellular energetics.` },
  { key: 'lehninger-glycolysis', citation: `${LEHNINGER}. Chapter on glycolysis, gluconeogenesis and the pentose phosphate pathway.` },
  { key: 'lehninger-tca', citation: `${LEHNINGER}. Chapter on the citric acid cycle.` },
  { key: 'lehninger-oxphos', citation: `${LEHNINGER}. Chapter on oxidative phosphorylation.` },
  { key: 'lehninger-fatty-acids', citation: `${LEHNINGER}. Chapter on fatty acid catabolism.` },
  { key: 'lehninger-membranes', citation: `${LEHNINGER}. Chapter on biological membranes and transport.` },
  { key: 'lehninger-hormones', citation: `${LEHNINGER}. Chapter on hormonal regulation and integration of mammalian metabolism.` },
  {
    key: 'rorsman-2018',
    citation:
      'Rorsman P, Ashcroft FM. Pancreatic β-cell electrical activity and insulin secretion: of mice and men. Physiological Reviews 98:117-214 (2018). doi:10.1152/physrev.00008.2017',
  },
  {
    key: 'boyer-1997',
    citation:
      'Boyer PD. The ATP synthase: a splendid molecular machine. Annual Review of Biochemistry 66:717-749 (1997). doi:10.1146/annurev.biochem.66.1.717',
  },
];

export const REFERENCES: Record<string, Reference> = Object.fromEntries(list.map((r) => [r.key, r]));
