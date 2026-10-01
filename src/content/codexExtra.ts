// Entries added after the main codex: the extracellular matrix and its membrane link.

import type { CodexEntry } from './types';

export const CODEX_EXTRA: CodexEntry[] = [
  {
    id: 'extracellular-matrix',
    parent: null,
    name: 'Extracellular matrix',
    category: 'complex',
    summary:
      'The extracellular matrix is the network of secreted proteins and polysaccharides that surrounds animal cells and fills the space between them.',
    function:
      'It gives tissue its mechanical strength, holds cells in place and tells them where they are. Cells grip it through integrins, and that grip sends signals inward that support survival and normal function. Beta cells in a pancreatic islet rest against a basement membrane rich in laminin and collagen IV laid down around the islet capillaries, and contact with it improves insulin gene expression and secretion.',
    structure: [
      'Fibrillar collagens (types I and III) forming banded fibrils',
      'Basement membrane sheet of laminin and collagen IV',
      'Fibronectin and other adhesive glycoproteins',
      'Proteoglycans and hyaluronan forming a hydrated gel',
    ],
    processes: [
      {
        id: 'matrix-adhesion-signalling',
        name: 'Adhesion and outside-in signalling',
        steps: [
          'Matrix proteins outside the cell present binding sites, such as the RGD sequence in fibronectin and specific sites on laminin and collagen.',
          'An integrin in the plasma membrane binds one of these sites with its extracellular head.',
          'Binding stabilizes the extended, high-affinity shape of the integrin and separates its two cytoplasmic tails.',
          'Talin binds the beta-subunit tail and links it to actin filaments; vinculin reinforces the link as tension rises.',
          'Many integrins cluster into an adhesion, where kinases such as focal adhesion kinase are activated.',
          'These signals pass into the cell, supporting survival and, in beta cells, glucose-stimulated insulin secretion.',
        ],
      },
    ],
    facts: [
      { label: 'Most abundant protein', value: 'collagen, about a quarter to a third of total body protein' },
      { label: 'Basement membrane thickness', value: 'about 40-120 nm' },
      { label: 'Collagen fibril diameter', value: 'about 10-300 nm depending on tissue' },
    ],
    sizeNm: [40, 300],
    realRate: 'Adhesions assemble and mature over seconds to minutes',
    accuracy:
      'The matrix is drawn as a sparse set of fibrillar collagen fibres just outside the cell so you can see through it; a real islet basement membrane is a continuous sheet of laminin and collagen IV, and the gel of proteoglycans between fibres is not drawn. You view it through the plasma membrane because the player stays inside the cell.',
    references: ['alberts-cytoskeleton', 'alberts-signaling'],
  },
  {
    id: 'collagen-fibril',
    parent: 'extracellular-matrix',
    name: 'Collagen fibril',
    category: 'structural protein',
    summary:
      'A collagen fibril is a rope-like bundle of collagen molecules, each a triple helix of three polypeptide chains, packed side by side in a staggered array.',
    function:
      'Fibrils resist stretching and give tissues tensile strength. The staggered packing leaves regular gaps, which produces the light and dark banding seen in the electron microscope. Cells do not bind bare fibrils loosely; integrins and other receptors recognise specific sequences on them.',
    structure: [
      'Triple helix of three alpha chains with a repeating Gly-X-Y sequence',
      'Each molecule about 300 nm long and 1.5 nm wide',
      'Molecules staggered by about 67 nm (the D-period)',
      'Covalent cross-links between neighbouring molecules',
    ],
    facts: [
      { label: 'Banding period (D-period)', value: 'about 67 nm' },
      { label: 'Collagen molecule', value: 'about 300 nm long, 1.5 nm wide' },
      { label: 'Every third residue', value: 'glycine' },
      { label: 'Fibril diameter', value: 'about 10-300 nm' },
    ],
    sizeNm: [10, 300],
    accuracy:
      'Fibrils are drawn at about true thickness with their 67 nm banding, but far fewer of them than in real tissue. Fibrillar collagen is shown for clarity; the basement membrane that beta cells actually touch is built mainly from sheet-forming collagen IV and laminin.',
  },
  {
    id: 'integrin',
    parent: 'extracellular-matrix',
    name: 'Integrin',
    category: 'membrane protein',
    summary:
      'An integrin is a transmembrane receptor made of one alpha and one beta subunit that links the extracellular matrix to the cytoskeleton.',
    function:
      'Integrins are the main way animal cells hold on to the matrix. They carry force in both directions and also act as signalling receptors: binding outside changes what happens inside (outside-in), and signals inside can switch the receptor between low and high affinity (inside-out). In beta cells, beta-1 integrins binding laminin and collagen IV support survival and insulin secretion.',
    structure: [
      'Alpha and beta subunits, each crossing the membrane once',
      'Extracellular head that binds matrix proteins',
      'Two long legs that fold (inactive) or extend (active)',
      'Short cytoplasmic tails bound by talin and kindlin',
    ],
    processes: [
      {
        id: 'integrin-activation',
        name: 'Integrin activation and signalling',
        steps: [
          'At rest the integrin is bent over, with its head near the membrane and low affinity for the matrix.',
          'Talin binds the cytoplasmic tail of the beta subunit and pushes the two tails apart.',
          'The legs straighten and the head swings out into its extended, high-affinity shape.',
          'The head binds a matrix protein, and pulling force from actin strengthens the bond.',
          'Clustered integrins recruit signalling proteins such as focal adhesion kinase, relaying the signal into the cell.',
        ],
      },
    ],
    facts: [
      { label: 'Subunits in humans', value: '18 alpha and 8 beta, forming 24 different integrins' },
      { label: 'Extended height above membrane', value: 'about 20 nm' },
      { label: 'Requires', value: 'divalent cations (Mg2+, Ca2+) to bind ligand' },
    ],
    sizeNm: [10, 25],
    realRate: 'Shape change takes less than a second; adhesions mature over minutes',
    enlargement: 6,
    accuracy:
      'Integrins are drawn about 6 times larger than life, always in the extended shape, and their bending and clustering are not animated. Talin is shown as a single small lobe on the cytoplasmic tails.',
  },
];
