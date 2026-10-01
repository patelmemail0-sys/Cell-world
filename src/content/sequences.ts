// Scripted flights. The tour surveys the cell's parts; the story follows one insulin
// molecule from gene to bloodstream. Every stop names a world anchor and a codex entry.

export interface Stop {
  /** Kit anchor key to fly to. */
  anchor: string;
  /** Codex entry highlighted at this stop. */
  entity: string;
  title: string;
  caption: string;
  /** Seconds to linger before moving on. */
  hold: number;
  /** Real elapsed time in the life of the molecule (story only). */
  real?: string;
  /** Slice of the glucose-to-insulin loop (0..1) the cell plays while at this stop. */
  beat?: [number, number];
}

export const TOUR: Stop[] = [
  { anchor: 'plasma-membrane', entity: 'plasma-membrane', hold: 11, title: 'Plasma membrane', caption: 'You are inside a human pancreatic beta cell, looking at its outer boundary from within. The membrane is a fluid sheet of lipids two molecules thick, studded with the channels, pumps and receptors that let the cell sense blood glucose.' },
  { anchor: 'extracellular-matrix', entity: 'extracellular-matrix', hold: 10, title: 'Extracellular matrix', caption: 'Through the membrane you can see banded collagen fibres outside the cell. Integrins reach through the membrane to grip the matrix and tie it to the cytoskeleton inside.' },
  { anchor: 'actin-filament', entity: 'actin-filament', hold: 9, title: 'Actin cortex', caption: 'Just under the membrane lies a web of actin filaments, the thinnest part of the cytoskeleton. It gives the cell surface its shape and controls which insulin granules can reach the membrane.' },
  { anchor: 'nucleus', entity: 'nucleus', hold: 10, title: 'Nucleus', caption: 'The nucleus holds the genome: about two metres of DNA folded into a sphere roughly five micrometres across. Two membranes wrap it, pierced by hundreds of pores.' },
  { anchor: 'nuclear-pore', entity: 'nuclear-pore', hold: 11, title: 'Nuclear pore complex', caption: 'Each pore is an eight-fold ring of about a thousand protein molecules. Everything passing between nucleus and cytoplasm goes through here: proteins in, messenger RNA and ribosome subunits out.' },
  { anchor: 'chromatin', entity: 'chromatin', hold: 10, title: 'Chromatin', caption: 'Inside, DNA is wound around histone proteins to form chromatin. Each chromosome keeps to its own territory. Dense clumps at the edge are silent; the open fibres in the interior are being read.' },
  { anchor: 'nucleolus', entity: 'nucleolus', hold: 10, title: 'Nucleolus', caption: 'The nucleolus has no membrane. It is a dense factory where ribosomal RNA is made and assembled with proteins into ribosome subunits, which then leave through the pores.' },
  { anchor: 'rough-er', entity: 'rough-er', hold: 10, title: 'Rough endoplasmic reticulum', caption: 'Flattened membrane sacs wrap the nucleus, their surfaces dotted with ribosomes. Proteins destined for secretion are made here and threaded straight into the space inside.' },
  { anchor: 'large-subunit', entity: 'ribosome', hold: 12, title: 'Ribosome', caption: 'A ribosome reads messenger RNA three letters at a time. Transfer RNAs bring matching amino acids, and the chain grows by one link per cycle. Shown here far slower than life.' },
  { anchor: 'golgi', entity: 'golgi', hold: 11, title: 'Golgi apparatus', caption: 'A stack of curved sacs that receives new proteins from the ER, modifies them as they pass through, and sorts them to their destinations on the far side.' },
  { anchor: 'vesicle', entity: 'vesicle', hold: 9, title: 'Transport vesicles', caption: 'Small coated bubbles of membrane ferry cargo between compartments. The coat shapes the bud, then falls away so the vesicle can fuse with its target.' },
  { anchor: 'lysosome', entity: 'lysosome', hold: 10, title: 'Lysosome', caption: 'The cell\'s recycling centre. Proton pumps keep the inside at about pH 5, and dozens of digestive enzymes break worn-out material into reusable building blocks.' },
  { anchor: 'peroxisome', entity: 'peroxisome', hold: 9, title: 'Peroxisome', caption: 'Peroxisomes shorten very long fatty acids. The reaction makes hydrogen peroxide, which the enzyme catalase destroys on the spot, releasing water and oxygen.' },
  { anchor: 'centrosome', entity: 'centrosome', hold: 10, title: 'Centrosome', caption: 'A pair of centrioles at right angles, each a barrel of nine microtubule triplets, sits in a cloud of protein. This is where the cell\'s microtubules begin.' },
  { anchor: 'microtubule', entity: 'microtubule', hold: 9, title: 'Microtubule', caption: 'Microtubules are hollow tubes built from tubulin, thirteen strands around. They radiate from the centrosome to the cell edge and serve as tracks for transport.' },
  { anchor: 'intermediate-filament', entity: 'intermediate-filament', hold: 8, title: 'Intermediate filaments', caption: 'Tough, rope-like filaments form a cage around the nucleus and spread through the cell, giving it resistance to stretching.' },
  { anchor: 'mitochondrion', entity: 'mitochondrion', hold: 10, title: 'Mitochondrion', caption: 'Mitochondria burn the products of glucose to make ATP. The inner membrane is folded into cristae, greatly increasing the surface where that happens.' },
  { anchor: 'complex-i', entity: 'complex-i', hold: 13, title: 'Electron transport chain', caption: 'On the cristae, electrons from NADH pass through Complex I, ubiquinone, Complex III, cytochrome c and Complex IV to oxygen. At each step protons are pumped across the membrane.' },
  { anchor: 'atp-synthase', entity: 'atp-synthase', hold: 13, title: 'ATP synthase', caption: 'Protons flow back through this rotary motor. The spinning stalk forces the head to join ADP and phosphate into ATP: three per turn, over a hundred turns each second in life.' },
  { anchor: 'kinesin', entity: 'kinesin', hold: 12, title: 'Kinesin', caption: 'ATP made in the mitochondria is spent here. Kinesin walks hand over hand along a microtubule, one ATP per eight-nanometre step, hauling an insulin granule toward the cell edge.' },
  { anchor: 'insulin-granule', entity: 'insulin-granule', hold: 11, title: 'Insulin granule', caption: 'The beta cell holds about ten thousand of these, each packed with crystallized insulin. Press G to follow one insulin molecule from gene to release.' },
];

export const STORY: Stop[] = [
  { anchor: 'rna-pol-ii', entity: 'rna-pol-ii', beat: [0.02, 0.1], hold: 13, real: '0 min', title: '1. Reading the insulin gene', caption: 'RNA polymerase II moves along the insulin gene on chromosome 11, building a messenger RNA copy. Only beta cells read this gene at a high rate.' },
  { anchor: 'nuclear-pore', entity: 'nuclear-pore', beat: [0.02, 0.1], hold: 11, real: 'a few minutes', title: '2. Export', caption: 'The transcript is capped, spliced and given a poly-A tail, then carried out to the cytoplasm through a nuclear pore.' },
  { anchor: 'srp', entity: 'srp', beat: [0.02, 0.1], hold: 12, real: 'minutes', title: '3. Targeting to the ER', caption: 'A ribosome starts translating. The first stretch of the new chain is a signal peptide; the signal recognition particle grabs it, pauses translation and delivers the ribosome to the ER membrane.' },
  { anchor: 'sec61', entity: 'sec61', beat: [0.02, 0.1], hold: 13, real: 'under a minute to translate', title: '4. Into the ER', caption: 'The chain is threaded through the Sec61 channel as it is made. Signal peptidase clips off the signal peptide, turning preproinsulin (110 amino acids) into proinsulin (86).' },
  { anchor: 'pdi', entity: 'pdi', beat: [0.02, 0.1], hold: 11, real: 'minutes', title: '5. Folding', caption: 'In the ER lumen, proinsulin folds and protein disulfide isomerase forms its three disulfide bonds. Proinsulin is not glycosylated.' },
  { anchor: 'er-exit-site', entity: 'copii-vesicle', beat: [0.02, 0.1], hold: 11, real: 'about 10-20 min', title: '6. Leaving the ER', caption: 'Correctly folded proinsulin is packed into COPII-coated vesicles at ER exit sites and carried to the Golgi.' },
  { anchor: 'cis-golgi', entity: 'golgi', beat: [0.02, 0.1], hold: 10, real: 'about 20-30 min', title: '7. Through the Golgi', caption: 'Proinsulin enters at the cis face and moves through the stack toward the trans side.' },
  { anchor: 'tgn', entity: 'tgn', beat: [0.02, 0.1], hold: 11, real: 'about 30 min', title: '8. Packaging', caption: 'At the trans-Golgi network, proinsulin is concentrated with zinc and its processing enzymes into immature secretory granules that bud off.' },
  { anchor: 'prohormone-convertase', entity: 'prohormone-convertase', beat: [0.02, 0.1], hold: 13, real: 'about 1-2 hours', title: '9. Becoming insulin', caption: 'The granule acidifies. Prohormone convertases PC1/3 and PC2 cut proinsulin, carboxypeptidase E trims the ends, and C-peptide is released. Insulin and zinc crystallize into the dense core.' },
  { anchor: 'kinesin', entity: 'kinesin', beat: [0.02, 0.1], hold: 11, real: 'hours to days in storage', title: '10. Delivery', caption: 'Kinesin carries the mature granule along microtubules to the cell edge, where it waits, sometimes for days.' },
  { anchor: 'glut', entity: 'glut', hold: 11, beat: [0.1, 0.22], real: 'after a meal', title: '11. Glucose arrives', caption: 'Blood glucose rises. Glucose enters through GLUT1 transporters by facilitated diffusion, so the level inside tracks the level in the blood.' },
  { anchor: 'glucokinase', entity: 'glucokinase', hold: 11, beat: [0.18, 0.26], real: 'seconds', title: '12. The glucose sensor', caption: 'Glucokinase phosphorylates glucose. Its rate rises steeply across the normal blood glucose range, which is what makes it the cell\'s glucose sensor.' },
  { anchor: 'atp-synthase', entity: 'atp-synthase', hold: 12, beat: [0.22, 0.33], real: 'tens of seconds', title: '13. ATP rises', caption: 'Glycolysis and the mitochondria turn that glucose into ATP. The ratio of ATP to ADP in the cytosol climbs.' },
  { anchor: 'katp-channel', entity: 'katp-channel', hold: 13, beat: [0.28, 0.44], real: 'about a minute', title: '14. K_ATP channels close', caption: 'ATP binds the K_ATP channel and shuts it. With potassium no longer leaking out, the membrane voltage rises from about -70 mV. Sulfonylurea drugs for type 2 diabetes close this same channel.' },
  { anchor: 'cav-channel', entity: 'cav-channel', hold: 12, beat: [0.45, 0.56], real: 'milliseconds per spike', title: '15. Calcium enters', caption: 'Depolarization opens voltage-gated calcium channels. The membrane fires bursts of action potentials and calcium floods in with each one.' },
  { anchor: 'snare-complex', entity: 'snare-complex', hold: 14, beat: [0.56, 0.8], real: 'milliseconds', title: '16. Release', caption: 'Calcium triggers SNARE proteins to zipper the docked granule onto the membrane. A fusion pore opens, the crystal dissolves, and insulin leaves the cell for the bloodstream.' },
];
