// Codex: the scientific content for every pickable structure in the beta cell.
// Written at strong-undergraduate level (Alberts, Lodish, Lehninger). Numbers are
// stated only where they are textbook-standard; ranges are given where the literature varies.

import type { CodexEntry } from './types';

export const CODEX: CodexEntry[] = [
  // ---------- Organelle-level entries ----------
  {
    id: 'plasma-membrane',
    parent: null,
    name: 'Plasma membrane',
    category: 'membrane',
    summary:
      'The plasma membrane is the lipid bilayer, with its embedded proteins, that encloses the beta cell and separates the cytosol from the extracellular fluid.',
    function:
      'It controls what enters and leaves the cell and carries the transporters, channels and receptors that let the beta cell sense blood glucose and hormones. Its resting potential, set mainly by K+ channels, changes when glucose rises, and that change is what triggers insulin release. Insulin granules fuse with it to release their contents into the blood, and endocytosis retrieves the granule membrane afterwards.',
    structure: [
      'Phospholipid bilayer (two leaflets with different lipid compositions)',
      'Cholesterol',
      'Integral membrane proteins (channels, pumps, transporters, receptors)',
      'Peripheral proteins and cortical actin on the cytosolic face',
      'Glycocalyx on the outer face',
    ],
    processes: [
      {
        id: 'na-k-pump-cycle',
        name: 'Na+/K+ pump cycle',
        steps: [
          'Facing the cytosol (the E1 state), the pump binds 3 Na+ ions and ATP.',
          'ATP transfers its terminal phosphate to a conserved aspartate on the pump, and the 3 Na+ ions become trapped (occluded) inside the protein.',
          'Phosphorylation drives a switch to the E2 state, which opens to the outside and releases the 3 Na+ ions.',
          'Two K+ ions from the extracellular fluid bind, which triggers removal of the phosphate from the aspartate.',
          'The pump returns to the E1 state and releases the 2 K+ ions into the cytosol.',
          'Each cycle moves one net positive charge out of the cell, so the pump is electrogenic as well as maintaining the Na+ and K+ gradients.',
        ],
      },
      {
        id: 'gsis-membrane',
        name: 'Glucose-stimulated insulin secretion',
        steps: [
          'Blood glucose rises after a meal, and glucose enters the beta cell by facilitated diffusion through glucose transporters (mainly GLUT1 in humans).',
          'Glucokinase phosphorylates the glucose, and glycolysis plus mitochondrial oxidation raise the cytosolic ATP/ADP ratio.',
          'ATP binds the Kir6.2 subunits of K_ATP channels while stimulation by MgADP falls, so the channels close.',
          'With less K+ leaving the cell, the membrane depolarizes from its resting level of about -70 mV and begins firing action potentials.',
          'Voltage-gated Ca2+ channels open and Ca2+ flows in, creating high local Ca2+ next to the channels.',
          'Ca2+ binds synaptotagmin on docked, primed insulin granules, the SNARE complex finishes zippering, and the granule fuses with the plasma membrane, releasing insulin, C-peptide and Zn2+.',
        ],
      },
      {
        id: 'clathrin-endocytosis',
        name: 'Receptor-mediated endocytosis',
        steps: [
          'The adaptor complex AP2 binds the lipid PI(4,5)P2 and the sorting signals on the cytosolic tails of cargo receptors.',
          'AP2 recruits clathrin triskelions, which assemble into a curved lattice and bend the membrane inward into a coated pit.',
          'The pit deepens into a coated bud attached to the membrane by a narrow neck.',
          'The GTPase dynamin assembles as a collar around the neck and, as it hydrolyses GTP, constricts and cuts it.',
          'Hsc70, recruited by auxilin, uses ATP to strip off the clathrin coat.',
          'The uncoated vesicle fuses with an early endosome, delivering its receptors and their cargo.',
        ],
      },
    ],
    facts: [
      { label: 'Bilayer thickness', value: 'about 4-5 nm' },
      { label: 'Resting potential (low glucose)', value: 'about -70 mV in human beta cells' },
      { label: 'Protein content', value: 'roughly half of membrane mass is protein' },
      { label: 'Beta-cell diameter', value: 'about 10-15 µm' },
    ],
    sizeNm: [10000, 15000],
    realRate:
      'A Na+/K+ pump completes up to about 100 cycles per second; insulin granule fusion follows Ca2+ entry within milliseconds',
    accuracy:
      'The membrane is drawn as a thin, smooth shell carrying far fewer proteins than a real one, which is about half protein by mass and densely crowded. The proteins shown in it are enlarged and their motions slowed.',
    references: ['alberts-membranes', 'alberts-transport', 'rorsman-2018'],
  },
  {
    id: 'cytosol',
    parent: null,
    name: 'Cytosol',
    category: 'compartment',
    summary: 'The cytosol is the concentrated, protein-rich aqueous phase that fills the cell outside the organelles.',
    function:
      'It is where glycolysis, protein synthesis on free ribosomes and many signalling reactions take place. In the beta cell, glucose is phosphorylated and broken down to pyruvate here, and the rate of this flux, set by glucokinase, tracks blood glucose. The cytosol also carries the ATP and Ca2+ signals that link metabolism to insulin release.',
    structure: [
      'Water with dissolved ions and metabolites',
      'Soluble enzymes, including those of glycolysis',
      'Free ribosomes',
      'Cytoskeletal filaments',
      'Lipid droplets',
    ],
    processes: [
      {
        id: 'glycolysis',
        name: 'Glycolysis',
        steps: [
          'Glucose enters through GLUT transporters, and glucokinase phosphorylates it to glucose 6-phosphate, using 1 ATP and trapping it in the cell.',
          'Glucose 6-phosphate is isomerized to fructose 6-phosphate, and phosphofructokinase-1 adds a second phosphate from another ATP, forming fructose 1,6-bisphosphate.',
          'Aldolase splits fructose 1,6-bisphosphate into two three-carbon sugars, which are interconverted so both continue as glyceraldehyde 3-phosphate.',
          'Glyceraldehyde 3-phosphate dehydrogenase oxidizes each three-carbon sugar and adds inorganic phosphate, reducing NAD+ to NADH (2 NADH per glucose).',
          'Two substrate-level phosphorylation steps, by phosphoglycerate kinase and pyruvate kinase, make 4 ATP per glucose in total.',
          'Net yield per glucose: 2 pyruvate, 2 ATP and 2 NADH. In beta cells nearly all of this pyruvate enters mitochondria, because lactate dehydrogenase is kept at very low levels.',
        ],
      },
      {
        id: 'glucokinase-sensor',
        name: 'Glucokinase as the glucose sensor',
        steps: [
          'Glucokinase (hexokinase IV) has a low affinity for glucose, with half-maximal activity at about 7-8 mM, inside the normal range of blood glucose.',
          'It binds glucose cooperatively and, unlike other hexokinases, is not inhibited by its product, glucose 6-phosphate.',
          'Its activity therefore rises steeply as blood glucose rises from about 4 to 10 mM.',
          'Because glucose phosphorylation controls the rate of glycolysis in the beta cell, glucokinase sets how fast ATP is produced.',
          'The resulting ATP/ADP ratio controls K_ATP channels, linking blood glucose to insulin secretion.',
        ],
      },
    ],
    facts: [
      { label: 'Macromolecule concentration', value: 'about 200-300 mg per mL (very crowded)' },
      { label: 'pH', value: 'about 7.2' },
      { label: 'Free Ca2+ at rest', value: 'about 100 nM' },
      { label: 'Glycolysis net yield', value: '2 pyruvate, 2 ATP and 2 NADH per glucose' },
    ],
    sizeNm: [10000, 15000],
    realRate:
      'Individual glycolytic enzymes each complete tens to thousands of reactions per second; the 10-step pathway is shown greatly slowed',
    accuracy:
      'The cytosol is shown as clear, open space so you can fly through it. In reality it is packed with proteins, ribosomes and filaments, with only a few nanometres between neighbouring macromolecules.',
    references: ['lehninger-glycolysis', 'alberts-sorting', 'rorsman-2018'],
  },
  {
    id: 'cytoskeleton',
    parent: null,
    name: 'Cytoskeleton',
    category: 'structural protein',
    summary:
      'The cytoskeleton is the network of protein filaments (microtubules, actin filaments and intermediate filaments) that shapes the cell and organizes its interior.',
    function:
      'Microtubules form tracks for kinesin and dynein motors that carry insulin granules and other cargo, actin filaments form a dense cortex under the plasma membrane that controls granule access to release sites, and intermediate filaments resist mechanical stress. The network is constantly remodelled, and glucose stimulation reorganizes both cortical actin and microtubules in ways that support insulin secretion.',
    structure: [
      'Microtubules (about 25 nm wide)',
      'Actin filaments (about 7 nm wide)',
      'Intermediate filaments (about 10 nm wide)',
      'Motor proteins (kinesins, dyneins, myosins)',
      'Accessory, crosslinking and capping proteins',
    ],
    processes: [
      {
        id: 'motor-transport',
        name: 'Motor-driven transport',
        steps: [
          'A cargo such as an insulin granule is linked to motor proteins by adaptor proteins on its membrane.',
          'Kinesin-1 walks toward the plus ends of microtubules, generally toward the cell periphery, taking 8 nm steps and using 1 ATP per step.',
          'Cytoplasmic dynein, with its partner dynactin, walks toward the minus ends, carrying cargo back toward the cell interior.',
          'Cargo often switches between motors and tracks, so its path is a series of runs, pauses and reversals rather than a straight line.',
          'Near the plasma membrane, cargo is handed to the actin cortex, where myosin motors such as myosin Va carry granules the last short distance.',
        ],
      },
    ],
    facts: [
      { label: 'Microtubule diameter', value: 'about 25 nm' },
      { label: 'Actin filament diameter', value: 'about 7 nm (5-9 nm)' },
      { label: 'Intermediate filament diameter', value: 'about 10 nm' },
      { label: 'Kinesin-1 step', value: '8 nm per ATP' },
    ],
    sizeNm: [10000, 15000],
    realRate: 'Kinesin-1 carries cargo at about 800 nm per second (about 100 steps per second)',
    accuracy:
      'Only a small fraction of the filaments are drawn, and they are thickened so they are visible; the real network is far denser. In beta cells the microtubules form a tangled, non-radial mesh, which the model simplifies.',
    references: ['alberts-cytoskeleton', 'lodish-cytoskeleton'],
  },
  {
    id: 'centrosome',
    parent: null,
    name: 'Centrosome',
    category: 'organelle',
    summary:
      'The centrosome is the main microtubule-organizing center of an animal cell: a pair of centrioles surrounded by pericentriolar material, lying next to the nucleus.',
    function:
      'It nucleates and anchors microtubules through gamma-tubulin ring complexes, organizing the microtubule network and keeping the Golgi apparatus nearby. It duplicates once per cell cycle and forms the spindle poles in dividing cells. In mature beta cells, which rarely divide, the Golgi also nucleates many microtubules, and the older centriole acts as the basal body of the primary cilium, a sensory antenna on the cell surface.',
    structure: [
      'Mother centriole (with distal and subdistal appendages)',
      'Daughter centriole',
      'Pericentriolar material',
      'Gamma-tubulin ring complexes',
    ],
    processes: [
      {
        id: 'mt-nucleation',
        name: 'Microtubule nucleation',
        steps: [
          'Gamma-tubulin ring complexes (gamma-TuRCs) are recruited to and activated in the pericentriolar material.',
          'Each gamma-TuRC presents a ring of gamma-tubulin whose geometry matches the 13 protofilaments of a microtubule.',
          'Alpha/beta-tubulin dimers carrying GTP bind the ring with their alpha-tubulin facing the gamma-tubulin, so the minus end stays capped at the centrosome.',
          'More GTP-tubulin adds to the free plus end, which grows outward into the cytoplasm.',
          'The minus end stays anchored while the plus end switches between growth and shrinkage (dynamic instability), exploring the cytoplasm.',
        ],
      },
    ],
    facts: [
      { label: 'Centrioles per centrosome', value: '2 in G1, 4 after duplication' },
      { label: 'Centriole size', value: 'about 0.25 µm wide and 0.5 µm long' },
      { label: 'Centriole wall', value: '9 triplet microtubules' },
      { label: 'Duplication', value: 'once per cell cycle' },
    ],
    sizeNm: [500, 1500],
    realRate: 'Microtubule plus ends typically grow at a few tenths of a micrometre per second in living cells',
    accuracy:
      'The centrosome is drawn with a sharper edge than it has; the pericentriolar material is really a fuzzy, porous protein matrix. Only a few of the microtubules it nucleates are shown.',
    references: ['alberts-cytoskeleton', 'lodish-cytoskeleton'],
  },
  {
    id: 'nucleus',
    parent: null,
    name: 'Nucleus',
    category: 'organelle',
    summary:
      'The nucleus is the compartment, bounded by a double membrane, that holds the cell’s chromosomes and is where DNA is transcribed into RNA.',
    function:
      'It stores and protects the genome, controls which genes are transcribed, and processes RNA before export. In beta cells, transcription factors such as PDX1, MAFA and NEUROD1 drive very high expression of the insulin gene, so insulin mRNA is one of the most abundant mRNAs in the cell. The nucleolus inside builds ribosomal subunits for export to the cytoplasm.',
    structure: [
      'Nuclear envelope (two membranes)',
      'Nuclear pore complexes',
      'Nuclear lamina',
      'Chromatin',
      'Nucleolus',
      'Nucleoplasm',
    ],
    processes: [
      {
        id: 'ins-transcription',
        name: 'Transcription and export of insulin mRNA',
        steps: [
          'Transcription factors including PDX1, MAFA and NEUROD1 bind enhancer elements upstream of the INS gene on chromosome 11, and raised glucose increases their activity.',
          'They recruit coactivators and the Mediator complex, which help assemble the general transcription factors and RNA polymerase II at the promoter.',
          'RNA polymerase II opens the DNA and synthesizes pre-mRNA in the 5′ to 3′ direction, and a 5′ cap is added soon after transcription begins.',
          'The spliceosome removes the two introns of INS and joins its three exons.',
          'The 3′ end is cleaved and a poly(A) tail of about 200 adenines is added.',
          'The finished mRNA, bound by export proteins, leaves through a nuclear pore to be translated on the rough ER.',
        ],
      },
      {
        id: 'subunit-export',
        name: 'Ribosomal subunit export',
        steps: [
          'In the nucleolus, ribosomal RNA precursors are transcribed, processed and assembled with ribosomal proteins imported from the cytoplasm.',
          'Partly assembled small (40S) and large (60S) subunits move out of the nucleolus into the nucleoplasm.',
          'Export adaptors, such as NMD3 on the large subunit, bind the exportin CRM1 together with Ran-GTP.',
          'The large complexes pass through nuclear pores, helped by additional export factors.',
          'In the cytoplasm, Ran hydrolyses its GTP, the export factors are released and recycled, and the subunits undergo final maturation before they can translate.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 5-10 µm (typical mammalian cell)' },
      { label: 'Genome', value: 'about 6.4 billion base pairs in 46 chromosomes (diploid)' },
      { label: 'Total DNA length', value: 'about 2 m per cell' },
      { label: 'Nuclear pores', value: 'a few thousand per nucleus' },
    ],
    sizeNm: [5000, 10000],
    realRate: 'RNA polymerase II transcribes about 1-4 kilobases per minute',
    accuracy:
      'Chromatin is shown as loose strands so you can see it; real chromatin fills the nucleus at high density. Only a token number of nuclear pores is drawn, and transcription is greatly slowed.',
    references: ['alberts-genome', 'alberts-dna-to-protein', 'alberts-sorting'],
  },
  {
    id: 'rough-er',
    parent: null,
    name: 'Rough endoplasmic reticulum',
    category: 'organelle',
    summary:
      'The rough endoplasmic reticulum is a network of flattened membrane sacs (cisternae) studded with ribosomes and continuous with the outer nuclear membrane.',
    function:
      'It is where secretory and membrane proteins are made, inserted into or across the membrane, folded and quality-checked. In the beta cell it carries an enormous load: when glucose is high, proinsulin can account for roughly 30-50% of all protein the cell makes. If misfolded proinsulin builds up, it triggers ER stress and the unfolded protein response.',
    structure: [
      'Cisternae (flattened sacs)',
      'Lumen',
      'Membrane-bound ribosomes',
      'Sec61 translocons',
      'Chaperones and folding enzymes (BiP, PDI)',
      'ER exit sites',
    ],
    processes: [
      {
        id: 'preproinsulin-translocation',
        name: 'Making proinsulin',
        steps: [
          'Translation of insulin mRNA begins on a free ribosome, and the N-terminal signal peptide of preproinsulin emerges from the ribosome exit tunnel.',
          'The signal recognition particle (SRP) binds the signal peptide and slows elongation.',
          'SRP docks on its receptor in the ER membrane, and the ribosome is handed to the Sec61 translocon as SRP and its receptor hydrolyse GTP.',
          'Translation resumes and the growing chain threads through Sec61 into the ER lumen.',
          'Signal peptidase removes the 24-amino-acid signal peptide, converting preproinsulin (110 amino acids) into proinsulin (86 amino acids).',
          'In the lumen, BiP binds unfolded stretches while PDI and related enzymes help form proinsulin’s three disulfide bonds.',
          'Correctly folded proinsulin is packaged at ER exit sites into COPII vesicles for transport to the Golgi.',
        ],
      },
    ],
    facts: [
      { label: 'Preproinsulin', value: '110 amino acids' },
      { label: 'Signal peptide', value: '24 amino acids' },
      { label: 'Proinsulin', value: '86 amino acids, 3 disulfide bonds' },
      { label: 'Share of protein synthesis', value: 'proinsulin, roughly 30-50% at high glucose' },
    ],
    sizeNm: [5000, 15000],
    realRate:
      'Translocation keeps pace with translation, about 5-6 amino acids per second, so a preproinsulin chain takes roughly 20 seconds to make',
    accuracy:
      'The ER is drawn as a few stacked sheets near the nucleus. In real beta cells it is a much larger, interconnected network of sheets and tubules filling much of the cytoplasm, and the ribosomes on it are enlarged here.',
    references: ['alberts-sorting', 'alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'smooth-er',
    parent: null,
    name: 'Smooth endoplasmic reticulum',
    category: 'organelle',
    summary: 'The smooth endoplasmic reticulum is the ribosome-free part of the ER, made mostly of branching tubules.',
    function:
      'It makes lipids such as phospholipids and cholesterol, stores Ca2+ and releases it on signal, and in some cells detoxifies drugs. In the beta cell, Ca2+ uptake by SERCA pumps and release through IP3 receptors shape the cytosolic Ca2+ signals that drive insulin secretion. Beta cells have relatively little smooth ER compared with liver cells or steroid-producing cells.',
    structure: [
      'Branching tubules',
      'Lumen (Ca2+ store)',
      'SERCA Ca2+ pumps',
      'IP3 receptors and ryanodine receptors',
      'Lipid-synthesizing enzymes',
    ],
    processes: [
      {
        id: 'ca-store-release',
        name: 'Ca2+ storage and release',
        steps: [
          'SERCA pumps use ATP to move Ca2+ from the cytosol into the ER lumen, 2 Ca2+ per ATP.',
          'Ca2+-binding proteins in the lumen, such as calreticulin, buffer the stored Ca2+, while free lumenal Ca2+ stays in the hundreds of micromolar range.',
          'A signal such as acetylcholine acting on M3 muscarinic receptors activates phospholipase C, which cuts the lipid PIP2 into IP3 and diacylglycerol.',
          'IP3 diffuses to IP3 receptors in the ER membrane; with cytosolic Ca2+ as a co-activator, the channels open and Ca2+ floods into the cytosol.',
          'SERCA pumps the Ca2+ back into the lumen, ending the signal and refilling the store.',
        ],
      },
      {
        id: 'lipid-synthesis',
        name: 'Membrane lipid synthesis',
        steps: [
          'Fatty acids are activated to fatty acyl-CoA in the cytosol.',
          'Enzymes on the cytosolic face of the ER membrane attach two acyl chains to glycerol 3-phosphate, making phosphatidic acid.',
          'Phosphatidic acid is converted to diacylglycerol, which receives a head group (for example phosphocholine from CDP-choline) to form phosphatidylcholine.',
          'New lipids enter the cytosolic leaflet, and scramblases move some to the lumenal leaflet so both halves of the bilayer grow.',
          'Cholesterol is made from acetyl-CoA by a pathway whose rate-limiting enzyme, HMG-CoA reductase, sits in the ER membrane.',
        ],
      },
    ],
    facts: [
      { label: 'Free Ca2+ in the ER lumen', value: 'about 100-800 µM' },
      { label: 'Free Ca2+ in the cytosol', value: 'about 0.1 µM at rest' },
      { label: 'SERCA stoichiometry', value: '2 Ca2+ per ATP' },
      { label: 'Tubule diameter', value: 'about 50-100 nm' },
    ],
    sizeNm: [1000, 10000],
    realRate: 'Each SERCA pump completes tens of transport cycles per second, moving 2 Ca2+ per cycle',
    accuracy:
      'Smooth ER is drawn as a separate tubular tangle. In the cell it is one continuous membrane system with the rough ER, and the boundary between the two is gradual.',
    references: ['alberts-sorting', 'alberts-signaling', 'lehninger-membranes'],
  },
  {
    id: 'ribosome',
    parent: null,
    name: 'Ribosome',
    category: 'molecular machine',
    summary:
      'A ribosome is the RNA-protein machine that translates mRNA into protein; in human cells it is the 80S ribosome, made of a 40S small subunit and a 60S large subunit.',
    function:
      'Free ribosomes in the cytosol make cytosolic and nuclear proteins and proteins later imported into mitochondria and peroxisomes, while ribosomes bound to the rough ER make secretory and membrane proteins, including preproinsulin. Ribosomal RNA, not protein, catalyses peptide bond formation, so the ribosome is a ribozyme. Several ribosomes usually translate one mRNA at the same time, forming a polysome.',
    structure: [
      '40S small subunit (18S rRNA and about 33 proteins)',
      '60S large subunit (28S, 5.8S and 5S rRNAs and about 47 proteins)',
      'A, P and E sites for tRNA',
      'Decoding center (small subunit)',
      'Peptidyl transferase center (large subunit)',
      'Polypeptide exit tunnel',
    ],
    processes: [
      {
        id: 'elongation-cycle',
        name: 'Translation elongation cycle',
        steps: [
          'An aminoacyl-tRNA, delivered by the elongation factor eEF1A bound to GTP, enters the A site; if its anticodon matches the codon, eEF1A hydrolyses its GTP and leaves.',
          'The peptidyl transferase center in the large-subunit rRNA moves the growing chain from the P-site tRNA onto the amino acid of the A-site tRNA, forming a new peptide bond.',
          'The tRNAs shift into hybrid positions, and eEF2 bound to GTP drives translocation, moving the mRNA along by one codon (three nucleotides).',
          'The empty tRNA moves to the E site and leaves; the tRNA carrying the chain now sits in the P site, and the A site is free for the next codon.',
          'The cycle repeats, using 2 GTP per amino acid added, while the new chain threads out through the exit tunnel.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 25-30 nm' },
      { label: 'Mass', value: 'about 4.3 MDa (human 80S)' },
      { label: 'Composition', value: '4 rRNAs and about 80 proteins' },
      { label: 'Copies per cell', value: 'millions in a typical mammalian cell' },
    ],
    sizeNm: [25, 30],
    realRate: 'about 5-6 amino acids per second in eukaryotes',
    accuracy:
      'Ribosomes are drawn as two simple rounded lumps and in far smaller numbers than the millions present. The real subunits have intricate shapes in which RNA and protein are interwoven.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'golgi',
    parent: null,
    name: 'Golgi apparatus',
    category: 'organelle',
    summary:
      'The Golgi apparatus is a stack of flattened membrane cisternae near the nucleus that modifies and sorts proteins and lipids arriving from the ER.',
    function:
      'It processes glycoproteins by trimming and adding sugars, and its exit face, the trans-Golgi network, sorts cargo to the plasma membrane, to endosomes and lysosomes, or into secretory granules. In the beta cell, proinsulin is concentrated and packaged into immature insulin granules at the trans-Golgi network, and conversion to insulin begins as these granules acidify.',
    structure: [
      'cis-Golgi network (entry face)',
      'cis cisternae',
      'medial cisternae',
      'trans cisternae',
      'trans-Golgi network (exit face)',
      'COPI vesicles',
    ],
    processes: [
      {
        id: 'golgi-maturation',
        name: 'Cargo maturation and sorting',
        steps: [
          'COPII vesicles from ER exit sites fuse into vesicular-tubular clusters that travel to the cis face of the Golgi.',
          'Cargo moves through the cis, medial and trans cisternae; in the cisternal maturation model each cisterna itself matures, while COPI vesicles carry Golgi enzymes backward.',
          'Glycosylation enzymes in each region act in sequence, for example trimming mannose early and adding N-acetylglucosamine, galactose and sialic acid later.',
          'At the trans-Golgi network, proinsulin condenses in the mildly acidic, Ca2+-rich lumen and is gathered into budding immature granules that carry patches of clathrin coat.',
          'Lysosomal enzymes tagged with mannose 6-phosphate are captured by M6P receptors and sent to endosomes in clathrin-coated vesicles.',
          'Immature insulin granules pinch off from the trans-Golgi network and begin to acidify, activating the enzymes that convert proinsulin to insulin.',
        ],
      },
    ],
    facts: [
      { label: 'Cisternae per stack', value: 'about 4-8 in mammalian cells' },
      { label: 'Lumenal pH', value: 'about 6.7 (cis) falling to about 6.0 (trans-Golgi network)' },
      { label: 'Stack diameter', value: 'about 1 µm' },
    ],
    sizeNm: [1000, 5000],
    realRate: 'Cargo typically takes on the order of 10-20 minutes to cross the Golgi stack',
    accuracy:
      'The Golgi is drawn as one neat stack of evenly curved cisternae. In mammalian cells many stacks are linked side by side into a ribbon, the cisternae are perforated and irregular, and vesicles are far more numerous.',
    references: ['alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'mitochondrion',
    parent: null,
    name: 'Mitochondrion',
    category: 'organelle',
    summary:
      'The mitochondrion is a double-membrane organelle that oxidizes fuels and makes most of the cell’s ATP by oxidative phosphorylation.',
    function:
      'It oxidizes pyruvate and fatty acids through the citric acid cycle and uses the electron transport chain to pump protons and drive ATP synthase. In the beta cell this ATP is the glucose signal itself: faster glucose oxidation raises the cytosolic ATP/ADP ratio, which closes K_ATP channels and triggers insulin release. Mitochondria also take up Ca2+, which stimulates citric acid cycle dehydrogenases, and export metabolites that amplify insulin secretion.',
    structure: [
      'Outer membrane',
      'Intermembrane space',
      'Inner membrane folded into cristae',
      'Matrix',
      'mtDNA nucleoids',
      'Respiratory complexes and ATP synthase',
    ],
    processes: [
      {
        id: 'tca-cycle',
        name: 'Citric acid cycle',
        steps: [
          'Pyruvate enters the matrix through the mitochondrial pyruvate carrier, and pyruvate dehydrogenase converts it to acetyl-CoA, releasing CO2 and making NADH.',
          'Citrate synthase joins acetyl-CoA (2 carbons) to oxaloacetate (4 carbons) to make citrate (6 carbons).',
          'Around the cycle, two carbons leave as CO2, and each turn makes 3 NADH, 1 FADH2 (on Complex II) and 1 GTP or ATP, regenerating oxaloacetate.',
          'In beta cells, pyruvate carboxylase also converts much of the pyruvate directly to oxaloacetate, topping up cycle intermediates that can leave the mitochondrion as signals that amplify secretion.',
        ],
      },
      {
        id: 'electron-transport',
        name: 'Electron transport and proton pumping',
        steps: [
          'NADH gives 2 electrons to Complex I, which passes them to ubiquinone and moves 4 H+ from the matrix to the intermembrane space.',
          'Complex II passes electrons from succinate to ubiquinone without pumping protons.',
          'Ubiquinol carries the electrons to Complex III, which, through the Q cycle, moves 4 H+ into the intermembrane space per 2 electrons and reduces cytochrome c.',
          'Cytochrome c carries electrons one at a time to Complex IV, which reduces O2 to water, pumping 2 H+ and consuming 2 more H+ from the matrix per 2 electrons.',
          'Per NADH, about 10 H+ are moved across the inner membrane, building a proton-motive force of roughly 200 mV, mostly as membrane potential.',
        ],
      },
      {
        id: 'atp-synthesis',
        name: 'ATP synthesis and export',
        steps: [
          'Protons flow back into the matrix through the F0 part of ATP synthase, turning its ring of 8 c subunits and the attached central stalk.',
          'The rotating stalk changes the shape of the three catalytic beta subunits in turn, so each binds ADP and phosphate, forms ATP, and releases it.',
          'One full turn uses 8 H+ and makes 3 ATP, about 2.7 H+ per ATP.',
          'The adenine nucleotide translocase exports ATP in exchange for ADP, and the phosphate carrier brings in phosphate with 1 H+, so each ATP delivered to the cytosol costs about 3.7 H+.',
          'In the beta cell, the resulting rise in cytosolic ATP/ADP closes K_ATP channels in the plasma membrane.',
        ],
      },
    ],
    facts: [
      { label: 'Width', value: 'about 0.5-1 µm' },
      { label: 'P/O ratio', value: 'about 2.5 for NADH, about 1.5 for succinate' },
      { label: 'H+ moved per NADH', value: 'about 10' },
      { label: 'ATP per glucose (complete oxidation)', value: 'about 30-32' },
      { label: 'Proton-motive force', value: 'roughly 200 mV' },
    ],
    sizeNm: [1000, 5000],
    realRate: 'ATP synthase spins at about 100-150 rotations per second, making 3 ATP per rotation',
    accuracy:
      'Mitochondria are drawn as separate bean-shaped bodies with a few regular cristae. In living beta cells they form a dynamic, branching network that constantly fuses and divides, cristae are far more numerous, and the respiratory complexes shown are enlarged and few.',
    references: ['lehninger-tca', 'lehninger-oxphos', 'alberts-energy'],
  },
  {
    id: 'lysosome',
    parent: null,
    name: 'Lysosome',
    category: 'organelle',
    summary:
      'A lysosome is an acidic organelle, bounded by a single membrane and filled with hydrolytic enzymes, that digests macromolecules.',
    function:
      'It breaks down proteins, nucleic acids, lipids and carbohydrates delivered by endocytosis and autophagy, and returns the building blocks to the cytosol. A V-ATPase keeps its lumen at about pH 4.5-5, where its acid hydrolases work best. In beta cells, lysosomes also destroy surplus insulin granules by crinophagy, matching the insulin store to demand.',
    structure: [
      'Single limiting membrane',
      'Heavily glycosylated membrane proteins (LAMP1, LAMP2)',
      'V-ATPase proton pumps',
      'Acid hydrolases in the lumen',
      'Transporters that export digestion products',
    ],
    processes: [
      {
        id: 'lysosomal-digestion',
        name: 'Digestion after fusion',
        steps: [
          'A late endosome or autophagosome fuses with a lysosome, mixing their contents.',
          'The V-ATPase pumps H+ into the lumen, keeping it at about pH 4.5-5.',
          'Acid hydrolases (proteases such as cathepsins, plus lipases, nucleases, glycosidases and phosphatases) break macromolecules down into amino acids, sugars, nucleotides and fatty acids.',
          'A dense sugar coat formed by LAMP proteins on the inner face of the membrane protects it from being digested.',
          'Transporters in the membrane export the small products to the cytosol for reuse.',
        ],
      },
      {
        id: 'crinophagy',
        name: 'Crinophagy',
        steps: [
          'When insulin demand is low, some mature insulin granules are not secreted.',
          'These surplus granules fuse directly with lysosomes, without first being enclosed by an autophagosome.',
          'Acid hydrolases digest the insulin crystals and the granule membrane.',
          'The resulting amino acids are recycled, and the lysosome may appear in electron micrographs as a dense body containing partly digested granule cores.',
        ],
      },
    ],
    facts: [
      { label: 'Lumenal pH', value: 'about 4.5-5' },
      { label: 'Diameter', value: 'about 0.1-1 µm' },
      { label: 'Hydrolase types', value: 'more than 40 (recent counts exceed 60)' },
    ],
    sizeNm: [100, 1000],
    realRate: 'Digesting delivered cargo takes minutes to hours; here it is compressed into seconds',
    accuracy:
      'Lysosomes are drawn as uniform spheres. Real ones vary widely in size and shape and often contain membrane whorls and partly digested material, and fusion and digestion are much slower than shown.',
    references: ['alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'peroxisome',
    parent: null,
    name: 'Peroxisome',
    category: 'organelle',
    summary:
      'A peroxisome is a small organelle bounded by a single membrane that carries out oxidation reactions which produce, and then destroy, hydrogen peroxide.',
    function:
      'It shortens very-long-chain fatty acids by beta-oxidation, makes precursors of plasmalogen lipids, and uses catalase to break down the H2O2 made by its oxidases. In humans its matrix is homogeneous and finely granular, with no crystalline core, because the urate oxidase gene is inactive. Beta cells have unusually low catalase activity, which may help explain their sensitivity to H2O2 when fatty acids are high.',
    structure: [
      'Single membrane',
      'Homogeneous, finely granular matrix (no crystalloid core in humans)',
      'Matrix enzymes such as catalase and acyl-CoA oxidase',
      'PEX protein import machinery',
    ],
    processes: [
      {
        id: 'vlcfa-oxidation',
        name: 'Very-long-chain fatty acid oxidation',
        steps: [
          'Very-long-chain fatty acids (22 or more carbons) are imported as acyl-CoA by the ABCD1 transporter in the peroxisomal membrane.',
          'Acyl-CoA oxidase removes two hydrogens to form a trans double bond, passing the electrons from FADH2 directly to O2 and making H2O2.',
          'A bifunctional enzyme adds water across the double bond and then oxidizes the product, reducing NAD+ to NADH.',
          'A thiolase cuts off acetyl-CoA, leaving an acyl-CoA two carbons shorter.',
          'After several rounds, the shortened chains are exported, for example as acylcarnitines, to mitochondria for complete oxidation.',
        ],
      },
      {
        id: 'h2o2-breakdown',
        name: 'Hydrogen peroxide breakdown',
        steps: [
          'Oxidases in the matrix produce H2O2 as they reduce O2.',
          'Catalase uses one H2O2 to oxidize its heme iron, forming a high-energy intermediate called Compound I and releasing water.',
          'A second H2O2 reduces Compound I back to the resting enzyme, releasing O2 and another water.',
          'Net reaction: 2 H2O2 → 2 H2O + O2.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 0.1-1 µm' },
      { label: 'Membrane', value: 'single bilayer' },
      { label: 'Catalase reaction', value: '2 H2O2 → 2 H2O + O2' },
    ],
    sizeNm: [100, 1000],
    realRate: 'Catalase, one of the fastest enzymes known, can break down up to about 40 million H2O2 per second',
    accuracy:
      'Peroxisomes are drawn as clean spheres with a smooth granular interior. Human peroxisomes lack the urate oxidase crystal cores seen in rodent liver, so none is shown.',
    references: ['alberts-sorting', 'lehninger-fatty-acids'],
  },
  {
    id: 'endosome',
    parent: null,
    name: 'Endosome',
    category: 'organelle',
    summary:
      'Endosomes are a family of membrane compartments that receive material taken in by endocytosis and sort it for recycling or for degradation.',
    function:
      'Early endosomes receive incoming vesicles, release ligands from their receptors in their mildly acidic lumen, and send many receptors back to the surface. Cargo marked for destruction is packed into internal vesicles as the endosome matures into a late endosome (multivesicular body), which then fuses with lysosomes. In beta cells, the endosomal system also handles membrane proteins retrieved after insulin granule exocytosis and receives lysosomal enzymes from the Golgi.',
    structure: [
      'Early (sorting) endosomes',
      'Recycling tubules',
      'Late endosomes (multivesicular bodies)',
      'Intraluminal vesicles',
      'Rab GTPases on the surface (Rab5 early, Rab7 late)',
    ],
    processes: [
      {
        id: 'endosome-maturation',
        name: 'Sorting and maturation',
        steps: [
          'Uncoated endocytic vesicles fuse with early endosomes, which are marked by Rab5 and the lipid PI(3)P.',
          'In the mildly acidic lumen (about pH 6-6.5), many ligands detach from their receptors.',
          'Narrow tubules carry receptors back to the plasma membrane, directly or through recycling endosomes.',
          'ESCRT complexes recognize ubiquitin-tagged membrane proteins and pack them into small vesicles that bud into the lumen.',
          'Rab5 is replaced by Rab7 and the lumen acidifies further, to about pH 5-5.5, as the early endosome becomes a late endosome.',
          'Late endosomes receive lysosomal enzymes from the Golgi and fuse with lysosomes, where their contents are digested.',
        ],
      },
    ],
    facts: [
      { label: 'Early endosome pH', value: 'about 6-6.5' },
      { label: 'Late endosome pH', value: 'about 5-5.5' },
      { label: 'Intraluminal vesicle diameter', value: 'about 40-100 nm' },
    ],
    sizeNm: [100, 1000],
    realRate: 'Endosome maturation takes from several minutes to tens of minutes',
    accuracy:
      'Endosomes are drawn as round vesicles with a few internal vesicles. Real early endosomes are irregular, with long tubular extensions, and maturation is a gradual change rather than a sharp switch.',
    references: ['alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'autophagosome',
    parent: null,
    name: 'Autophagosome',
    category: 'organelle',
    summary:
      'An autophagosome is a double-membrane vesicle that encloses a portion of cytoplasm or a damaged organelle and delivers it to lysosomes for digestion.',
    function:
      'Macroautophagy removes damaged organelles, protein aggregates and long-lived proteins, and supplies nutrients during starvation. In beta cells, basal autophagy is needed to keep mitochondria and ER healthy under the heavy demand of insulin production; mice whose beta cells lack the autophagy gene Atg7 lose beta-cell mass and develop impaired glucose tolerance.',
    structure: [
      'Outer membrane',
      'Inner membrane',
      'Enclosed cargo',
      'LC3-II on both membrane faces',
      'Cargo receptors (for example p62, optineurin, NDP52)',
    ],
    processes: [
      {
        id: 'mitophagy',
        name: 'Mitophagy',
        steps: [
          'A damaged mitochondrion loses its membrane potential, so the kinase PINK1 is no longer imported and degraded but builds up on the outer membrane.',
          'PINK1 phosphorylates ubiquitin and activates the ubiquitin ligase Parkin, which coats outer-membrane proteins with ubiquitin chains.',
          'Cargo receptors such as optineurin and NDP52 bind the ubiquitin chains and recruit the autophagy machinery.',
          'A cup-shaped double membrane, the phagophore, grows around the mitochondrion, with lipid supplied largely from the ER and LC3 attached to its surfaces.',
          'The edges of the cup seal, enclosing the mitochondrion in a double-membrane autophagosome.',
          'The outer membrane fuses with a lysosome, a step that uses the SNARE syntaxin 17, forming an autolysosome in which the inner membrane and the mitochondrion are digested.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 0.5-1.5 µm' },
      { label: 'Membranes', value: '2 (double membrane)' },
      { label: 'Formation time', value: 'roughly 5-10 minutes' },
    ],
    sizeNm: [500, 1500],
    realRate: 'Building and sealing an autophagosome takes roughly 5-10 minutes',
    accuracy:
      'The phagophore is shown closing smoothly around one mitochondrion in seconds. Real phagophores grow from contact sites with the ER over several minutes, and their shape is less regular.',
    references: ['alberts-traffic', 'alberts-proteins'],
  },
  {
    id: 'proteasome',
    parent: null,
    name: 'Proteasome',
    category: 'molecular machine',
    summary:
      'The 26S proteasome is a large ATP-dependent protease that destroys proteins tagged with chains of ubiquitin.',
    function:
      'It degrades misfolded, damaged and short-lived regulatory proteins in the cytosol and nucleus, controlling processes such as the cell cycle and gene expression. Misfolded proteins in the ER, including some misfolded proinsulin, are pulled back into the cytosol by ER-associated degradation (ERAD) and destroyed here, which matters greatly in beta cells with their heavy proinsulin load.',
    structure: [
      '20S core particle (four stacked rings, alpha7 beta7 beta7 alpha7)',
      '19S regulatory particle (one or two caps)',
      'Ubiquitin receptors',
      'Deubiquitinase Rpn11',
      'Ring of six AAA+ ATPases (Rpt1-6)',
      'Protease sites on beta1, beta2 and beta5',
    ],
    processes: [
      {
        id: 'ub-proteasome-degradation',
        name: 'Ubiquitin-dependent degradation',
        steps: [
          'An E1 enzyme activates ubiquitin using ATP and passes it to an E2, and an E3 ligase attaches it to a lysine on the target protein.',
          'Repeated rounds build a polyubiquitin chain, typically linked through lysine 48; a chain of at least four ubiquitins is recognized efficiently.',
          'Ubiquitin receptors on the 19S cap bind the chain, and an unstructured stretch of the target enters the ATPase ring.',
          'Rpn11 cuts off the ubiquitin chain for recycling as the target is pulled in.',
          'The six ATPases hydrolyse ATP to unfold the protein and thread it through the opened gate into the 20S core.',
          'Threonine protease sites on the inner beta rings cut the chain into peptides, mostly about 3-25 amino acids long, which leave and are broken down further by other peptidases.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 2.5 MDa (26S)' },
      { label: 'Core particle', value: '28 subunits in four rings of seven' },
      { label: 'Active sites', value: '6 per core (2 each of beta1, beta2, beta5)' },
      { label: 'Peptide products', value: 'mostly about 3-25 amino acids' },
    ],
    sizeNm: [30, 45],
    realRate: 'A typical protein is unfolded and degraded in seconds to tens of seconds',
    accuracy:
      'The proteasome is enlarged so it can be seen, and only a few are shown, whereas a real cell holds a very large number throughout the cytosol and nucleus. Unfolding and threading are slowed.',
    references: ['alberts-proteins'],
  },
  {
    id: 'vesicle',
    parent: null,
    name: 'Transport vesicle',
    category: 'vesicle',
    summary:
      'Transport vesicles are small membrane-enclosed carriers that bud from one compartment and fuse with another, moving proteins and lipids through the secretory and endocytic pathways.',
    function:
      'Coat proteins shape each vesicle and select its cargo: COPII for ER-to-Golgi transport, COPI for transport back from the Golgi to the ER and between cisternae, and clathrin for transport from the trans-Golgi network and the plasma membrane. Rab GTPases and tethering proteins direct each vesicle to the right target, and SNARE proteins fuse the membranes. This traffic delivers proinsulin to the Golgi and keeps each membrane compartment distinct.',
    structure: [
      'Lipid bilayer',
      'Coat (COPII, COPI or clathrin)',
      'Cargo and cargo receptors',
      'v-SNAREs',
      'Rab GTPases',
    ],
    processes: [
      {
        id: 'bud-transport-fuse',
        name: 'Budding, transport and fusion',
        steps: [
          'A small GTPase (Sar1 or Arf1) binds GTP, inserts an amphipathic helix into the donor membrane and recruits coat proteins.',
          'Coat proteins bind cargo or cargo receptors and bend the membrane into a bud.',
          'The bud pinches off; for clathrin-coated vesicles the GTPase dynamin cuts the neck.',
          'GTP hydrolysis and uncoating enzymes shed the coat, exposing v-SNAREs and Rab proteins.',
          'The vesicle reaches its target by diffusion or motor transport, where tethering proteins bound to an active Rab capture it.',
          'The v-SNARE on the vesicle zips together with t-SNAREs on the target membrane into a four-helix bundle, pulling the two bilayers together until they fuse.',
          'NSF and alpha-SNAP use ATP to pull the spent SNARE complex apart so the SNAREs can be reused.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 50-150 nm, depending on the coat' },
      { label: 'SNARE bundle', value: '4 helices' },
      { label: 'Main coat types', value: '3 (COPII, COPI, clathrin)' },
    ],
    sizeNm: [50, 150],
    realRate: 'A clathrin-coated pit takes roughly 20-100 seconds to form a vesicle; the fusion step itself takes milliseconds',
    accuracy:
      'Vesicles are drawn larger and fewer than in life, with smooth, idealized coats. Real coats are lattices of many protein subunits, and the different vesicle types look much alike without labels.',
    references: ['alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'insulin-granule',
    parent: null,
    name: 'Insulin granule',
    category: 'vesicle',
    summary:
      'An insulin granule is a dense-core secretory vesicle that stores crystallized insulin until a rise in Ca2+ triggers its release.',
    function:
      'It stores insulin at very high concentration, completes the conversion of proinsulin to insulin, and releases insulin, C-peptide and Zn2+ into the blood by regulated exocytosis. A beta cell holds about 10,000 granules, but only a small fraction are docked at the plasma membrane and ready for immediate release, which helps explain why insulin secretion comes in a fast first phase followed by a slower second phase.',
    structure: [
      'Granule membrane',
      'Dense crystalline core of Zn2+-insulin hexamers',
      'Clear halo surrounding the core',
      'V-ATPase proton pumps',
      'Zinc transporter ZnT8',
      'Exocytosis proteins (VAMP2, synaptotagmin, Rab27a)',
    ],
    processes: [
      {
        id: 'granule-maturation',
        name: 'Granule maturation',
        steps: [
          'An immature granule buds from the trans-Golgi network, partly coated with clathrin and filled with proinsulin.',
          'The V-ATPase acidifies the lumen toward about pH 5.5, and together with high Ca2+ this activates the prohormone convertases.',
          'PC1/3 cuts proinsulin at the junction of the B chain and C-peptide (after Arg31-Arg32), and PC2 cuts at the junction of C-peptide and the A chain (after Lys64-Arg65).',
          'Carboxypeptidase E trims off the exposed basic residues, leaving insulin (A and B chains joined by disulfide bonds) and free C-peptide in equal amounts.',
          'Zn2+ brought in by ZnT8 binds insulin, and six insulin molecules with two Zn2+ ions form hexamers that pack into a dense crystal.',
          'Clathrin and proteins not meant for the granule are removed in small vesicles, and the granule becomes mature.',
        ],
      },
      {
        id: 'regulated-exocytosis',
        name: 'Regulated exocytosis',
        steps: [
          'Mature granules are carried toward the cell surface along microtubules, then through the cortical actin web by myosin.',
          'Rab27a and its effector proteins tether the granule at the plasma membrane, where it docks.',
          'Munc18 and Munc13 guide the partial assembly of a SNARE complex from VAMP2 on the granule and syntaxin 1 and SNAP-25 on the plasma membrane, priming the granule.',
          'When voltage-gated Ca2+ channels open, Ca2+ binds synaptotagmin, which triggers full SNARE zippering.',
          'A fusion pore opens; the core meets the neutral pH outside, dissolves, and the hexamers dilute and fall apart into dimers and active monomers.',
          'The granule membrane flattens into the plasma membrane, or in kiss-and-run events reseals and is retrieved intact.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 250-350 nm' },
      { label: 'Granules per beta cell', value: 'about 10,000' },
      { label: 'Lumenal pH', value: 'about 5.5' },
      { label: 'Zn2+ per insulin hexamer', value: '2' },
    ],
    sizeNm: [250, 350],
    realRate:
      'Fusion follows Ca2+ entry within milliseconds; first-phase secretion lasts about 5-10 minutes; proinsulin conversion takes on the order of an hour',
    accuracy:
      'Granules are drawn fewer and larger than in life; a real beta cell packs about 10,000 of them. The core is shown as a regular crystal, though in electron micrographs the cores of human granules vary in shape.',
    references: ['rorsman-2018', 'alberts-traffic', 'lehninger-hormones'],
  },

  // ---------- Plasma membrane components ----------
  {
    id: 'phospholipid',
    parent: 'plasma-membrane',
    name: 'Phospholipid',
    category: 'lipid',
    summary:
      'A phospholipid is an amphipathic lipid with a water-loving, phosphate-containing head group and two water-avoiding fatty acid tails.',
    function:
      'Phospholipids spontaneously form the bilayer that is the basic fabric of every cell membrane. The two leaflets differ: phosphatidylcholine and sphingomyelin are enriched on the outer face, while phosphatidylserine and phosphatidylethanolamine are mostly on the inner face. Minor phosphoinositides such as PIP2 act as signals and docking sites, and PIP2 supports both K_ATP channel activity and insulin granule exocytosis.',
    structure: [
      'Polar head group (for example choline)',
      'Phosphate',
      'Glycerol backbone',
      'Two fatty acid tails (one often unsaturated, with a kink)',
    ],
    facts: [
      { label: 'Length of one molecule', value: 'about 2.5 nm (half the bilayer)' },
      { label: 'Lateral diffusion', value: 'about 1 µm² per second' },
      { label: 'Spontaneous flip-flop between leaflets', value: 'less than about once a month per molecule' },
    ],
    sizeNm: [2, 3],
    enlargement: 10,
    accuracy:
      'Drawn 10 times larger than true size with a simplified head-and-two-tails shape. In a real membrane the tails are flexible and constantly in motion.',
    references: ['alberts-membranes'],
  },
  {
    id: 'cholesterol',
    parent: 'plasma-membrane',
    name: 'Cholesterol',
    category: 'lipid',
    summary:
      'Cholesterol is a rigid four-ring sterol lipid with a small polar hydroxyl group that sits between phospholipids in animal cell membranes.',
    function:
      'It lies with its hydroxyl group near the phospholipid heads and its rigid rings alongside the upper parts of the fatty acid tails, which stiffens the bilayer and makes it less permeable to small water-soluble molecules. It gathers with sphingolipids in more ordered membrane regions. In beta cells, the cholesterol content of the membrane influences insulin granule exocytosis.',
    structure: ['Hydroxyl head group', 'Rigid steroid ring system (four fused rings)', 'Short hydrocarbon tail'],
    facts: [
      { label: 'Formula', value: 'C27H46O' },
      { label: 'Molar mass', value: 'about 387 g/mol' },
      { label: 'Plasma membrane content', value: 'up to about one cholesterol per phospholipid' },
    ],
    sizeNm: [1.5, 2],
    enlargement: 10,
    accuracy:
      'Drawn 10 times larger than true size. Real cholesterol molecules are packed tightly among the phospholipids rather than spaced out.',
    references: ['alberts-membranes'],
  },
  {
    id: 'na-k-atpase',
    parent: 'plasma-membrane',
    name: 'Na+/K+-ATPase',
    category: 'membrane protein',
    summary:
      'The Na+/K+-ATPase is a P-type ion pump that uses the energy of ATP to export 3 Na+ and import 2 K+ across the plasma membrane.',
    function:
      'It builds the steep Na+ and K+ gradients that power secondary transporters and underlie the resting membrane potential. In typical animal cells it uses about a third of the cell’s ATP. In beta cells, the gradients it maintains are needed for the electrical activity that triggers insulin release, and its own electrogenic current contributes to the membrane potential.',
    structure: [
      'Alpha subunit (catalytic: 10 transmembrane helices, ATP site, phosphorylated aspartate)',
      'Beta subunit (glycosylated, needed for delivery to the membrane)',
      'FXYD regulatory subunit',
      'Extracellular binding site for ouabain and digoxin',
    ],
    processes: [
      {
        id: 'na-k-cycle',
        name: 'Pump cycle',
        steps: [
          'In the E1 state, open to the cytosol, the pump binds 3 Na+ and ATP.',
          'The terminal phosphate of ATP is transferred to an aspartate on the alpha subunit, and the 3 Na+ are occluded.',
          'The pump flips to the E2 state, opening to the outside; its affinity for Na+ drops and the 3 Na+ are released.',
          'Two extracellular K+ bind, triggering hydrolysis of the aspartyl phosphate.',
          'The pump returns to E1, releasing the 2 K+ into the cytosol.',
          'Net per cycle: 1 ATP used, 3 Na+ out, 2 K+ in, and one positive charge moved out of the cell.',
        ],
      },
    ],
    facts: [
      { label: 'Stoichiometry', value: '3 Na+ out and 2 K+ in per ATP' },
      { label: 'Na+ inside vs outside', value: 'about 5-15 mM vs 145 mM' },
      { label: 'K+ inside vs outside', value: 'about 140 mM vs 5 mM' },
      { label: 'ATP use', value: 'about one third of the ATP of a typical animal cell' },
    ],
    sizeNm: [10, 15],
    realRate: 'up to about 100 transport cycles per second',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size, with its shape changes exaggerated and slowed so the inward-open and outward-open states are easy to see.',
    references: ['alberts-transport', 'lehninger-membranes'],
  },
  {
    id: 'katp-channel',
    parent: 'plasma-membrane',
    name: 'K_ATP channel (Kir6.2/SUR1)',
    category: 'membrane protein',
    summary:
      'The ATP-sensitive K+ channel is an octamer of four Kir6.2 pore subunits and four SUR1 regulatory subunits that couples the beta cell’s metabolism to its membrane potential.',
    function:
      'At low glucose, the open channels let K+ leak out and hold the beta cell near its resting potential of about -70 mV. When glucose metabolism raises the ATP/ADP ratio, ATP closes the channel, the membrane depolarizes, and Ca2+ entry triggers insulin secretion. Sulfonylurea drugs used in type 2 diabetes close it by binding SUR1, and diazoxide opens it; mutations that keep it open cause neonatal diabetes, and mutations that inactivate it cause congenital hyperinsulinism.',
    structure: [
      'Four Kir6.2 subunits forming the central K+ pore',
      'ATP-binding inhibitory site on each Kir6.2 subunit',
      'Four SUR1 subunits (ABC transporter family)',
      'Nucleotide-binding domains on SUR1, where MgADP stimulates opening',
      'Drug-binding pocket on SUR1 for sulfonylureas',
    ],
    processes: [
      {
        id: 'katp-gating',
        name: 'Metabolic gating',
        steps: [
          'At low glucose, the ATP/ADP ratio is low; MgADP bound to the nucleotide-binding domains of SUR1 stimulates the channel, so some channels are open.',
          'K+ flows out through the Kir6.2 pore, holding the membrane near -70 mV.',
          'As glucose metabolism raises ATP and lowers ADP, ATP binds the inhibitory sites on Kir6.2 and stimulation by MgADP falls.',
          'The channel closes, the outward K+ current drops, and the membrane depolarizes toward the threshold for opening voltage-gated Ca2+ channels.',
          'Sulfonylureas such as glibenclamide bind SUR1 and close the channel even at low glucose, which is why they stimulate insulin release.',
        ],
      },
    ],
    facts: [
      { label: 'Composition', value: '4 Kir6.2 + 4 SUR1 (octamer)' },
      { label: 'Genes', value: 'KCNJ11 (Kir6.2) and ABCC8 (SUR1)' },
      { label: 'Mass', value: 'about 900 kDa' },
      { label: 'ATP sensitivity', value: 'half-inhibited by about 10 µM ATP in excised membrane patches, far below cellular ATP, so MgADP and other factors tune it in the cell' },
    ],
    sizeNm: [15, 20],
    realRate: 'Opens and closes on a millisecond timescale; an open channel passes millions of K+ ions per second',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size. The real complex is a propeller-shaped octamer; the model shows a simplified pore with four regulatory arms, and nucleotide binding is slowed.',
    references: ['rorsman-2018', 'alberts-transport'],
  },
  {
    id: 'cav-channel',
    parent: 'plasma-membrane',
    name: 'Voltage-gated Ca2+ channel',
    category: 'membrane protein',
    summary:
      'A voltage-gated Ca2+ channel is a membrane protein that opens when the membrane depolarizes, letting Ca2+ flow into the cell down its steep electrochemical gradient.',
    function:
      'In human beta cells, mainly L-type (Cav1.2 and Cav1.3) and P/Q-type (Cav2.1) channels open during the action potentials that glucose triggers. The Ca2+ that enters forms small zones of high concentration around channels lying close to docked insulin granules, and this Ca2+ triggers exocytosis. Drugs that block L-type channels, such as dihydropyridines, reduce insulin secretion.',
    structure: [
      'Alpha1 pore-forming subunit with four repeated domains (I-IV)',
      'S4 voltage-sensing helices',
      'Selectivity filter (a ring of glutamates)',
      'Cytosolic beta subunit',
      'Extracellular alpha2-delta subunit',
    ],
    processes: [
      {
        id: 'cav-gating',
        name: 'Voltage gating and Ca2+ entry',
        steps: [
          'At rest (about -70 mV), the positively charged S4 helices are held toward the inside and the pore is shut.',
          'When the membrane depolarizes, the S4 helices move outward and pull on linkers that open the pore gate.',
          'Ca2+ passes through the selectivity filter, where a ring of glutamate side chains binds Ca2+ far more strongly than Na+.',
          'About a million Ca2+ ions per second enter through each open channel, raising Ca2+ to tens of micromolar within a few tens of nanometres of the pore.',
          'The channel closes when the membrane repolarizes, or inactivates, partly through Ca2+-calmodulin binding to its C-terminal tail.',
        ],
      },
    ],
    facts: [
      { label: 'Ca2+ gradient', value: 'about 1-2 mM outside vs about 0.1 µM inside' },
      { label: 'Selectivity', value: 'more than 1000-fold for Ca2+ over Na+' },
      { label: 'Ion flow when open', value: 'about 1 million Ca2+ per second' },
      { label: 'Main human beta-cell types', value: 'L-type (Cav1.2, Cav1.3) and P/Q-type (Cav2.1)' },
    ],
    sizeNm: [10, 20],
    realRate: 'Opens within about a millisecond of depolarization and passes about a million Ca2+ ions per second',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size. One generic channel stands in for the L-type and P/Q-type families, and ion flow is shown as a slow trickle rather than about a million ions per second.',
    references: ['rorsman-2018', 'alberts-transport'],
  },
  {
    id: 'glut',
    parent: 'plasma-membrane',
    name: 'Glucose transporter (GLUT1)',
    category: 'membrane protein',
    summary:
      'GLUT1 is a uniporter of the major facilitator superfamily that carries glucose across the plasma membrane by facilitated diffusion.',
    function:
      'It lets glucose move down its concentration gradient into the beta cell without using energy, so glucose inside the cell quickly matches blood glucose. Human beta cells express mainly GLUT1 (with some GLUT3), whereas rodent beta cells rely on GLUT2. Because transport is faster than glucose phosphorylation, the transporter does not limit glucose sensing; glucokinase does.',
    structure: [
      '12 transmembrane helices',
      'N-terminal and C-terminal halves (6 helices each)',
      'Central glucose-binding site',
      'Extracellular N-linked glycan',
    ],
    processes: [
      {
        id: 'alternating-access',
        name: 'Alternating-access transport',
        steps: [
          'The transporter faces outward, with its central binding site open to the extracellular fluid.',
          'A glucose molecule binds the central site.',
          'The two halves of the transporter rock around the site, first closing it off on both sides and then opening it to the cytosol.',
          'Glucose is released into the cytosol.',
          'The empty transporter returns to the outward-facing state. The cycle runs equally well in either direction, so net flow always follows the glucose gradient.',
        ],
      },
    ],
    facts: [
      { label: 'Length', value: '492 amino acids (about 55 kDa)' },
      { label: 'Km for glucose', value: 'about 1-3 mM' },
      { label: 'Energy source', value: 'none; facilitated diffusion' },
    ],
    sizeNm: [5, 7],
    realRate: 'roughly hundreds to about a thousand glucose molecules per second per transporter',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size; the rocking motion is exaggerated, and real transporters cycle far faster than shown.',
    references: ['lehninger-membranes', 'rorsman-2018'],
  },
  {
    id: 'aquaporin',
    parent: 'plasma-membrane',
    name: 'Aquaporin',
    category: 'membrane protein',
    summary:
      'An aquaporin is a channel protein that lets water molecules cross the membrane rapidly in single file while blocking protons.',
    function:
      'It allows fast osmotic water movement, so cell volume can adjust quickly to changes in solute concentration. Several aquaporins have been reported in beta cells, including AQP7, an aquaglyceroporin that also passes glycerol.',
    structure: [
      'Tetramer of four subunits, each with its own pore',
      'Six transmembrane helices per subunit',
      'Two NPA (Asn-Pro-Ala) motifs at the pore center',
      'Narrow aromatic/arginine selectivity filter',
    ],
    facts: [
      { label: 'Water flow', value: 'up to about 1 billion molecules per second per pore' },
      { label: 'Narrowest point of pore', value: 'about 0.3 nm' },
      { label: 'Subunit mass', value: 'about 28-30 kDa' },
    ],
    sizeNm: [6, 8],
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size. Water molecules are not shown at their true rate, which is up to about a billion per second through each pore.',
  },
  {
    id: 'glp1r',
    parent: 'plasma-membrane',
    name: 'GLP-1 receptor',
    category: 'membrane protein',
    summary:
      'The GLP-1 receptor is a class B G-protein-coupled receptor that binds glucagon-like peptide-1, a hormone released by the gut after a meal.',
    function:
      'When GLP-1 binds, the receptor activates the G protein Gs, raising cAMP inside the beta cell. cAMP, acting through protein kinase A and Epac2, amplifies insulin secretion, but only when glucose is already elevated, which is why GLP-1 drugs given alone rarely cause hypoglycemia. It is the target of GLP-1 receptor agonist drugs used for type 2 diabetes and obesity.',
    structure: [
      'Large extracellular N-terminal domain (grips the C-terminal half of GLP-1)',
      'Seven transmembrane helices',
      'Peptide-binding pocket in the transmembrane core',
      'Intracellular surface that binds Gs',
    ],
    processes: [
      {
        id: 'glp1r-camp',
        name: 'cAMP signalling',
        steps: [
          'GLP-1 binds the extracellular domain and inserts its N-terminus into the transmembrane core.',
          'The receptor changes shape and causes the alpha subunit of Gs to release GDP and bind GTP.',
          'Gs-alpha bound to GTP separates from the beta-gamma pair and activates adenylyl cyclase, which converts ATP into cAMP.',
          'cAMP activates protein kinase A and Epac2, which increase granule priming and make exocytosis more sensitive to Ca2+.',
          'Gs-alpha hydrolyses its GTP and switches off, and the receptor is phosphorylated, binds arrestin and is internalized, ending the signal.',
        ],
      },
    ],
    facts: [
      { label: 'Receptor length', value: '463 amino acids' },
      { label: 'Active hormone', value: 'GLP-1(7-36) amide, 30 amino acids' },
      { label: 'GLP-1 half-life in blood', value: 'about 2 minutes (cleaved by DPP-4)' },
    ],
    sizeNm: [8, 12],
    realRate: 'cAMP rises within seconds of GLP-1 binding',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size. G-protein coupling and cAMP production are shown as a simple, slowed sequence, and real receptors are fewer and less evenly spread.',
    references: ['alberts-signaling', 'lehninger-hormones'],
  },
  {
    id: 'glycocalyx',
    parent: 'plasma-membrane',
    name: 'Glycocalyx',
    category: 'complex',
    summary:
      'The glycocalyx is the carbohydrate-rich coat on the outer surface of the plasma membrane, made of the sugar chains of glycoproteins, glycolipids and proteoglycans.',
    function:
      'It protects the cell surface, holds a layer of water, and takes part in cell-cell recognition and adhesion. All of its sugars face outward because glycosylation happens inside the ER and Golgi, whose lumen is topologically equivalent to the outside of the cell.',
    structure: [
      'N-linked and O-linked oligosaccharides on glycoproteins',
      'Glycolipids, including gangliosides',
      'Proteoglycans with long glycosaminoglycan chains',
      'Negatively charged sialic acids at the chain tips',
    ],
    facts: [
      { label: 'Thickness', value: 'from tens of nanometres to about 0.5 µm, depending on cell type and method' },
      { label: 'Orientation', value: 'always on the extracellular face' },
    ],
    sizeNm: [20, 500],
    enlargement: 6,
    accuracy:
      'Drawn 6 times thicker than true size as a fuzzy outer shell. Real glycocalyx thickness varies widely and is hard to measure because the layer collapses in many preparation methods.',
  },
  {
    id: 'clathrin-pit',
    parent: 'plasma-membrane',
    name: 'Clathrin-coated pit',
    category: 'complex',
    summary:
      'A clathrin-coated pit is a patch of plasma membrane being pulled inward by a lattice of clathrin and adaptor proteins, the first stage of clathrin-mediated endocytosis.',
    function:
      'It concentrates specific receptors and the cargo they carry, such as iron-loaded transferrin, and pinches them off into vesicles bound for early endosomes. In beta cells, clathrin-mediated endocytosis also helps retrieve granule membrane proteins after insulin exocytosis.',
    structure: [
      'Clathrin triskelions (three heavy and three light chains each)',
      'AP2 adaptor complexes',
      'Cargo receptors',
      'Dynamin collar at the neck',
      'PI(4,5)P2-rich membrane',
    ],
    processes: [
      {
        id: 'pit-to-vesicle',
        name: 'From pit to vesicle',
        steps: [
          'AP2 binds PI(4,5)P2 and the sorting signals (such as tyrosine-based and dileucine motifs) on receptor tails.',
          'Clathrin triskelions bind AP2 and assemble into a lattice of hexagons and pentagons that curves the membrane.',
          'The pit deepens into a coated bud joined to the membrane by a narrow neck.',
          'Dynamin wraps around the neck and hydrolyses GTP to constrict and cut it.',
          'Hsc70, recruited by auxilin, uses ATP to remove the clathrin, freeing the vesicle to fuse with an early endosome.',
        ],
      },
    ],
    facts: [
      { label: 'Pit diameter', value: 'about 100-200 nm' },
      { label: 'Triskelion', value: '3 heavy chains + 3 light chains' },
      { label: 'Lifetime of a productive pit', value: 'roughly 20-100 seconds' },
    ],
    sizeNm: [100, 200],
    realRate: 'A productive coated pit forms a vesicle in roughly 20-100 seconds',
    enlargement: 1.5,
    accuracy:
      'Drawn 1.5 times larger than true size with an idealized hexagon-and-pentagon lattice. Real pits are irregular, and many start and then abort.',
    references: ['alberts-traffic'],
  },
  {
    id: 'snare-complex',
    parent: 'plasma-membrane',
    name: 'SNARE complex',
    category: 'complex',
    summary:
      'The SNARE complex is a bundle of four helices, contributed by SNARE proteins on the vesicle and target membranes, that pulls two membranes together and fuses them.',
    function:
      'In beta cells, VAMP2 on the insulin granule zips together with syntaxin 1A and SNAP-25 on the plasma membrane to drive granule fusion and insulin release. Regulators such as Munc18, Munc13 and complexin control when the complex assembles, and synaptotagmin couples the final zippering to the rise in Ca2+.',
    structure: [
      'VAMP2 (v-SNARE, one helix, anchored in the granule membrane)',
      'Syntaxin 1A (t-SNARE, one helix)',
      'SNAP-25 (t-SNARE, two helices)',
      'Central ionic layer (one arginine and three glutamines)',
      'Transmembrane anchors',
    ],
    processes: [
      {
        id: 'snare-zippering',
        name: 'SNARE zippering and fusion',
        steps: [
          'Syntaxin 1A, held in a closed shape by Munc18, is opened with the help of Munc13 so it can pair with SNAP-25.',
          'VAMP2 on a docked granule starts to zip with syntaxin and SNAP-25 from their membrane-distant ends, forming a partly assembled complex that bridges the two membranes.',
          'Complexin and synaptotagmin hold this partly zipped complex in a primed, ready state.',
          'Ca2+ binding to synaptotagmin releases the clamp, and zippering continues toward the membranes, pulling them together until they fuse.',
          'After fusion, all the SNAREs sit in one membrane; NSF and alpha-SNAP use ATP to pull the complex apart for reuse.',
        ],
      },
    ],
    facts: [
      { label: 'Helices', value: '4 (1 VAMP2, 1 syntaxin, 2 SNAP-25)' },
      { label: 'Bundle length', value: 'about 12 nm' },
      { label: 'Toxin targets', value: 'botulinum and tetanus toxins cleave SNAREs' },
    ],
    sizeNm: [12, 15],
    realRate: 'Ca2+-triggered fusion of a primed granule occurs within milliseconds',
    enlargement: 6,
    accuracy:
      'Drawn 6 times larger than true size. Zippering, which takes milliseconds once Ca2+ arrives, is slowed, and most of the regulatory proteins are left out.',
    references: ['alberts-traffic'],
  },

  // ---------- Cytosol components ----------
  {
    id: 'glucokinase',
    parent: 'cytosol',
    name: 'Glucokinase',
    category: 'enzyme',
    summary:
      'Glucokinase (hexokinase IV) is the enzyme that phosphorylates glucose to glucose 6-phosphate in beta cells and liver, and it acts as the beta cell’s glucose sensor.',
    function:
      'Its low affinity and cooperative glucose binding make its activity rise steeply over the normal range of blood glucose, so it sets the rate of glycolysis and of the ATP signal that controls insulin release. Activating mutations in its gene, GCK, cause low blood sugar from excess insulin; inactivating mutations cause a mild monogenic diabetes (GCK-MODY), or permanent neonatal diabetes when both copies are lost.',
    structure: [
      'Large domain',
      'Small domain',
      'Glucose-binding cleft between the domains',
      'Allosteric site where glucokinase activator drugs bind',
    ],
    processes: [
      {
        id: 'gk-catalysis',
        name: 'Cooperative glucose phosphorylation',
        steps: [
          'Without glucose, glucokinase rests mostly in a wide-open, inactive conformation.',
          'Glucose binds in the cleft between the large and small domains.',
          'The small domain swings over and the cleft closes around glucose, forming the active conformation, which binds ATP.',
          'The terminal phosphate of ATP is transferred to the 6-hydroxyl of glucose, making glucose 6-phosphate and ADP.',
          'The products leave. At high glucose the enzyme quickly rebinds glucose and stays active; at low glucose it relaxes slowly to the open form. This slow switching gives its sigmoidal response to glucose.',
        ],
      },
    ],
    facts: [
      { label: 'Glucose for half-maximal activity', value: 'about 7-8 mM' },
      { label: 'Hill coefficient', value: 'about 1.7 (cooperative)' },
      { label: 'Size', value: 'monomer of 465 amino acids (about 52 kDa)' },
      { label: 'Product inhibition', value: 'none by glucose 6-phosphate' },
    ],
    sizeNm: [5, 7],
    realRate: 'roughly 60 glucose molecules phosphorylated per second at saturating glucose',
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size, with its domain-closing motion exaggerated and slowed.',
    references: ['lehninger-glycolysis', 'rorsman-2018'],
  },
  {
    id: 'lipid-droplet',
    parent: 'cytosol',
    name: 'Lipid droplet',
    category: 'organelle',
    summary:
      'A lipid droplet is a store of neutral lipids (triacylglycerol and cholesteryl esters) wrapped in a single layer of phospholipids and proteins.',
    function:
      'It stores fatty acids safely as triacylglycerol and releases them by lipolysis when they are needed for energy or for making membranes. In beta cells, lipid droplets buffer incoming fatty acids, and lipolysis supplies lipid signals that can enhance insulin secretion. Human beta cells, unlike rodent beta cells, accumulate lipid droplets with age.',
    structure: [
      'Core of triacylglycerol and cholesteryl esters',
      'Phospholipid monolayer',
      'Surface proteins (perilipins)',
      'Lipases recruited for lipolysis (ATGL, HSL)',
    ],
    facts: [
      { label: 'Surface', value: 'a monolayer, not a bilayer' },
      { label: 'Diameter in non-fat cells', value: 'about 0.1 µm to a few µm' },
      { label: 'Origin', value: 'buds from the ER membrane' },
    ],
    sizeNm: [100, 3000],
    accuracy:
      'Drawn as a few uniform spheres. Beta cells contain variable numbers of droplets of very different sizes, and many stay closely associated with the ER.',
  },

  // ---------- Cytoskeleton components ----------
  {
    id: 'microtubule',
    parent: 'cytoskeleton',
    name: 'Microtubule',
    category: 'structural protein',
    summary: 'A microtubule is a hollow tube about 25 nm wide built from 13 protofilaments of alpha/beta-tubulin dimers.',
    function:
      'Microtubules are the tracks along which kinesin and dynein carry vesicles, insulin granules and organelles, and they position the Golgi apparatus and other organelles. They are polar, with a fast-growing plus end and a minus end usually anchored at the centrosome or the Golgi. In beta cells, glucose speeds microtubule turnover, and the dense mesh near the membrane appears to restrain granule access as well as deliver granules.',
    structure: [
      '13 protofilaments',
      'Alpha/beta-tubulin dimers',
      'Plus end (beta-tubulin exposed)',
      'Minus end (alpha-tubulin exposed)',
      'GTP cap at the growing plus end',
      'Hollow lumen about 15 nm wide',
    ],
    processes: [
      {
        id: 'dynamic-instability',
        name: 'Dynamic instability',
        steps: [
          'Tubulin dimers carrying GTP add to the plus end, forming a short stabilizing cap of GTP-tubulin.',
          'Soon after a dimer joins the lattice, its beta-tubulin hydrolyses GTP to GDP; GDP-tubulin is strained and prefers a curved shape.',
          'As long as addition outpaces hydrolysis, the GTP cap persists and the microtubule keeps growing.',
          'If the cap is lost, the protofilaments peel outward and the microtubule shrinks rapidly, an event called catastrophe.',
          'A shrinking microtubule can regain a cap and resume growth, called rescue, so each microtubule switches unpredictably between growing and shrinking.',
        ],
      },
    ],
    facts: [
      { label: 'Outer diameter', value: 'about 25 nm' },
      { label: 'Protofilaments', value: '13' },
      { label: 'Dimers per micrometre', value: 'about 1,600' },
      { label: 'Dimer length', value: '8 nm' },
    ],
    sizeNm: [1000, 15000],
    realRate: 'Plus ends grow at a few tenths of a micrometre per second in living cells; shrinkage is usually faster',
    enlargement: 2,
    accuracy:
      'Drawn 2 times wider than true size, and far fewer microtubules are shown than the cell contains. Growth and catastrophe are slowed so they can be watched.',
    references: ['alberts-cytoskeleton'],
  },
  {
    id: 'tubulin-dimer',
    parent: 'cytoskeleton',
    name: 'Tubulin dimer',
    category: 'structural protein',
    summary:
      'The tubulin dimer, the building block of microtubules, is a tightly bound pair of alpha-tubulin and beta-tubulin, each about 50 kDa.',
    function:
      'Dimers add head to tail to form protofilaments, and 13 protofilaments line up side by side to make a microtubule. Both subunits bind GTP, but only the GTP on beta-tubulin is hydrolysed after assembly, which drives dynamic instability. Drugs such as colchicine, taxol and vinblastine work by binding tubulin.',
    structure: [
      'Alpha-tubulin (its GTP is never hydrolysed)',
      'Beta-tubulin (its GTP is hydrolysed after assembly)',
      'Binding sites for taxol, colchicine and vinca alkaloids',
      'Flexible C-terminal tails (sites of chemical modification and motor binding)',
    ],
    facts: [
      { label: 'Length', value: '8 nm' },
      { label: 'Mass', value: 'about 100 kDa (two subunits of about 50 kDa)' },
      { label: 'GTP per dimer', value: '2 (1 hydrolysable, on beta-tubulin)' },
    ],
    sizeNm: [8, 8],
    enlargement: 2,
    accuracy:
      'Drawn 2 times larger than true size as two simple beads. The real subunits are compact globular proteins with flexible tails that are not shown.',
    references: ['alberts-cytoskeleton'],
  },
  {
    id: 'actin-filament',
    parent: 'cytoskeleton',
    name: 'Actin filament',
    category: 'structural protein',
    summary:
      'An actin filament (microfilament) is a two-stranded helical polymer of globular actin subunits, about 7 nm in diameter.',
    function:
      'Actin filaments support the plasma membrane, drive changes in cell shape and serve as tracks for myosin motors. In beta cells, a dense web of cortical actin under the plasma membrane acts as a barrier that limits granule access to release sites. Glucose stimulation remodels this web locally, letting granules through, and myosin motors carry granules the final short distance.',
    structure: [
      'G-actin subunits (each binds ATP or ADP)',
      'Two-stranded helix',
      'Plus (barbed) end, fast growing',
      'Minus (pointed) end, slow growing',
      'Crosslinking and capping proteins',
    ],
    facts: [
      { label: 'Diameter', value: 'about 7 nm (5-9 nm)' },
      { label: 'Subunit', value: '375 amino acids, about 42 kDa' },
      { label: 'Helical repeat', value: 'about 37 nm' },
      { label: 'Abundance', value: 'often about 5% of total cell protein' },
    ],
    sizeNm: [100, 2000],
    enlargement: 3,
    accuracy:
      'Drawn 3 times thicker than true size as a loose mesh. The real cortical web is much denser, with filaments only tens of nanometres apart, and it constantly assembles and disassembles.',
    references: ['alberts-cytoskeleton', 'lodish-cytoskeleton'],
  },
  {
    id: 'intermediate-filament',
    parent: 'cytoskeleton',
    name: 'Intermediate filament',
    category: 'structural protein',
    summary: 'An intermediate filament is a rope-like protein polymer about 10 nm in diameter that gives cells mechanical strength.',
    function:
      'Intermediate filaments resist stretching and help cells withstand mechanical stress. Unlike actin filaments and microtubules, they have no polarity, bind no nucleotide and do not serve as motor tracks. Beta cells, which are epithelial, express keratins (mainly K8 and K18), and the nucleus is lined by a different class, the nuclear lamins.',
    structure: [
      'Central alpha-helical rod domain',
      'Coiled-coil dimers',
      'Antiparallel tetramers (so the filament has no overall polarity)',
      'Unit-length filaments that join end to end',
    ],
    facts: [
      { label: 'Diameter', value: 'about 10 nm' },
      { label: 'Cross-section', value: 'about 8 tetramers packed side by side' },
      { label: 'Polarity', value: 'none' },
    ],
    sizeNm: [500, 10000],
    enlargement: 2.5,
    accuracy:
      'Drawn 2.5 times thicker than true size and much sparser than the real network, which spreads through the cytoplasm and links to cell junctions.',
    references: ['alberts-cytoskeleton'],
  },
  {
    id: 'kinesin',
    parent: 'cytoskeleton',
    name: 'Kinesin-1',
    category: 'motor protein',
    summary: 'Kinesin-1 is a two-headed motor protein that walks toward the plus ends of microtubules, carrying cargo outward.',
    function:
      'It moves vesicles, organelles and insulin granules from the cell interior toward the periphery. In beta cells, kinesin-1 (heavy chain KIF5B) is needed for normal granule movement and insulin secretion.',
    structure: [
      'Two motor heads, each binding ATP and the microtubule',
      'Neck linkers',
      'Coiled-coil stalk',
      'Light chains and tail that bind cargo adaptors',
    ],
    processes: [
      {
        id: 'hand-over-hand',
        name: 'Hand-over-hand stepping',
        steps: [
          'One head is bound to the microtubule while the other trails behind it.',
          'ATP binds the front head, and its neck linker docks onto the head, swinging the rear head forward.',
          'The swinging head travels 16 nm and binds the next binding site ahead, so the cargo advances 8 nm.',
          'The rear head hydrolyses its ATP and releases phosphate, loosening its grip on the microtubule.',
          'The heads keep alternating, one ATP per 8 nm step, and the motor takes about 100 steps on average before letting go.',
        ],
      },
    ],
    facts: [
      { label: 'Step size', value: '8 nm' },
      { label: 'ATP per step', value: '1' },
      { label: 'Speed', value: 'about 800 nm per second' },
      { label: 'Stall force', value: 'about 6 pN' },
      { label: 'Run length', value: 'about 1 µm' },
    ],
    sizeNm: [60, 80],
    realRate: 'about 800 nm per second, or about 100 steps per second',
    enlargement: 2.5,
    accuracy:
      'Drawn 2.5 times larger than true size. Stepping is slowed so individual 8 nm steps are visible, and the flexible stalk is shown as a stiff rod.',
    references: ['alberts-cytoskeleton', 'lodish-cytoskeleton'],
  },
  {
    id: 'dynein',
    parent: 'cytoskeleton',
    name: 'Cytoplasmic dynein',
    category: 'motor protein',
    summary:
      'Cytoplasmic dynein is a large motor protein that walks toward microtubule minus ends, built around a ring of six AAA+ ATPase domains.',
    function:
      'It carries vesicles, endosomes and other cargo toward microtubule minus ends, generally inward toward the centrosome and Golgi. It needs the dynactin complex and an adaptor protein to move steadily. It also helps position the Golgi and the nucleus, and in dividing cells helps build the spindle.',
    structure: [
      'Two heavy chains, each with a ring of six AAA+ domains',
      'Stalk with a microtubule-binding domain at its tip',
      'Linker that acts as the power-stroke lever',
      'Tail with intermediate and light chains',
      'Partner dynactin complex and an activating adaptor (for example BICD2)',
    ],
    processes: [
      {
        id: 'dynein-stroke',
        name: 'Power stroke',
        steps: [
          'ATP binds the main site in the AAA+ ring, and the microtubule-binding domain at the tip of the stalk lets go of the track.',
          'The linker swings across the ring into a primed position (the recovery stroke).',
          'The microtubule-binding domain rebinds the microtubule further along toward the minus end.',
          'Release of phosphate and ADP swings the linker back (the power stroke), pulling the cargo toward the minus end.',
          'Steps average about 8 nm but vary, and dynein steps sideways or backward more often than kinesin.',
        ],
      },
    ],
    facts: [
      { label: 'Heavy chain', value: 'about 500 kDa each' },
      { label: 'Whole dynein-1 complex', value: 'about 1.4 MDa' },
      { label: 'Typical step', value: 'about 8 nm (variable)' },
      { label: 'Speed', value: 'up to about 1 µm per second with dynactin and an adaptor' },
    ],
    sizeNm: [40, 50],
    realRate: 'up to about 1 µm per second when activated by dynactin and an adaptor',
    enlargement: 3,
    accuracy:
      'Drawn 3 times larger than true size. Dynactin is simplified, and steps are shown slowed and more regular than the real, rather variable ones.',
    references: ['alberts-cytoskeleton', 'lodish-cytoskeleton'],
  },

  // ---------- Centrosome components ----------
  {
    id: 'centriole',
    parent: 'centrosome',
    name: 'Centriole',
    category: 'complex',
    summary: 'A centriole is a small cylinder built from nine triplet microtubules arranged in a ring.',
    function:
      'Two centrioles, an older mother and a younger daughter set at right angles, form the core of the centrosome and recruit the pericentriolar material that nucleates microtubules. The mother centriole can dock at the plasma membrane and become the basal body of the primary cilium. Centrioles duplicate exactly once per cell cycle.',
    structure: [
      'Nine triplet microtubules (A, B and C tubules)',
      'Cartwheel at the base of new centrioles',
      'Distal and subdistal appendages (mother centriole only)',
      'Pair arranged at right angles',
    ],
    facts: [
      { label: 'Diameter', value: 'about 0.25 µm' },
      { label: 'Length', value: 'about 0.5 µm' },
      { label: 'Symmetry', value: '9-fold' },
    ],
    sizeNm: [400, 500],
    accuracy:
      'Shown with idealized geometry; the fine structure of the microtubule triplets and the appendages is simplified.',
    references: ['alberts-cytoskeleton'],
  },
  {
    id: 'pericentriolar-material',
    parent: 'centrosome',
    name: 'Pericentriolar material',
    category: 'complex',
    summary:
      'The pericentriolar material is the protein matrix around the centrioles that anchors and activates microtubule-nucleating complexes.',
    function:
      'Scaffold proteins such as pericentrin, CDK5RAP2 and CEP192 recruit gamma-tubulin ring complexes, so most centrosomal microtubule nucleation happens here. It expands greatly before mitosis, a process called centrosome maturation, boosting nucleation for spindle assembly.',
    structure: [
      'Scaffold proteins (pericentrin, CDK5RAP2, CEP192)',
      'Gamma-tubulin ring complexes',
      'Inner layer organized around the centriole wall',
      'Outer, less ordered matrix',
    ],
    facts: [
      { label: 'Main nucleator', value: 'gamma-tubulin ring complex (about 2.2 MDa)' },
      { label: 'Change before mitosis', value: 'expands several-fold' },
    ],
    sizeNm: [300, 1000],
    accuracy:
      'Drawn as a cloud with a clear edge. Real pericentriolar material is a porous, layered matrix whose boundary is gradual and whose size changes through the cell cycle.',
  },
  {
    id: 'gamma-turc',
    parent: 'centrosome',
    name: 'Gamma-tubulin ring complex',
    category: 'complex',
    summary:
      'The gamma-tubulin ring complex (gamma-TuRC) is a cone-shaped protein assembly that templates the start of a new microtubule.',
    function:
      'Its ring of gamma-tubulin matches the 13-protofilament geometry of a microtubule and binds alpha-tubulin, so it both nucleates the microtubule and caps its minus end. It works at the centrosome, at the Golgi, and on the sides of existing microtubules via the augmin complex.',
    structure: [
      'Ring of 14 gamma-tubulin molecules, the first and last overlapping',
      'Scaffold proteins GCP2-GCP6',
      'Actin and MZT1 inside the cone',
      'Attachment to the pericentriolar material through CDK5RAP2',
    ],
    facts: [
      { label: 'Mass', value: 'about 2.2 MDa' },
      { label: 'Diameter', value: 'about 25 nm' },
      { label: 'Template geometry', value: '13 protofilaments' },
    ],
    sizeNm: [25, 30],
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size as a neat closed ring; the real complex is an asymmetric, partly open cone.',
    references: ['alberts-cytoskeleton'],
  },

  // ---------- Nucleus components ----------
  {
    id: 'nuclear-envelope',
    parent: 'nucleus',
    name: 'Nuclear envelope',
    category: 'membrane',
    summary: 'The nuclear envelope is the double membrane that surrounds the nucleus and separates the genome from the cytoplasm.',
    function:
      'Its outer membrane is continuous with the rough ER and carries ribosomes, while its inner membrane holds proteins that bind the lamina and chromatin. The space between the two membranes is continuous with the ER lumen. Nuclear pores, where the two membranes join, are the only route across.',
    structure: [
      'Outer nuclear membrane (continuous with the ER)',
      'Perinuclear space (continuous with the ER lumen)',
      'Inner nuclear membrane',
      'Nuclear pore complexes',
      'LINC complexes linking the nucleus to the cytoskeleton',
    ],
    facts: [
      { label: 'Membranes', value: '2' },
      { label: 'Perinuclear space', value: 'about 30-50 nm wide' },
      { label: 'In mitosis', value: 'breaks down in mammalian cells and reforms afterwards' },
    ],
    sizeNm: [5000, 10000],
    accuracy:
      'Idealized as two smooth concentric shells, with far fewer pores than the few thousand a real nucleus has.',
    references: ['alberts-sorting'],
  },
  {
    id: 'nuclear-pore',
    parent: 'nucleus',
    name: 'Nuclear pore complex',
    category: 'complex',
    summary:
      'The nuclear pore complex is a huge protein assembly, about 110-120 MDa in vertebrates, that forms a gated channel through the nuclear envelope.',
    function:
      'It lets small molecules diffuse freely but makes larger ones depend on transport receptors (importins and exportins), and the Ran-GTP gradient across the envelope gives transport its direction. Transcription factors such as PDX1 enter through it, and ribosomal subunits and insulin mRNA leave through it; most mRNA is exported by a separate receptor, NXF1, that does not use Ran.',
    structure: [
      'Eight-fold symmetric scaffold built from about 30 different nucleoporins',
      'Cytoplasmic ring and filaments',
      'Central channel filled with FG-repeat nucleoporins',
      'Nuclear ring',
      'Nuclear basket',
    ],
    processes: [
      {
        id: 'ran-transport',
        name: 'Ran-driven import and export',
        steps: [
          'In the cytoplasm, an importin binds a cargo protein that carries a nuclear localization signal.',
          'The importin-cargo complex binds briefly to FG repeats and passes through the pore’s selective barrier.',
          'In the nucleus, Ran-GTP, kept high by the chromatin-bound exchange factor RCC1, binds the importin and makes it release the cargo.',
          'The importin-Ran-GTP complex returns to the cytoplasm, where RanGAP and RanBP1 trigger GTP hydrolysis, freeing the importin for another round.',
          'Export works the other way round: exportins bind their cargo only together with Ran-GTP in the nucleus and release it when the GTP is hydrolysed in the cytoplasm.',
          'Ran-GDP is carried back into the nucleus by NTF2, where RCC1 reloads it with GTP.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 110-120 MDa (vertebrates)' },
      { label: 'Outer diameter', value: 'about 120 nm' },
      { label: 'Symmetry', value: '8-fold' },
      { label: 'Transport capacity', value: 'up to about 1,000 macromolecules per second per pore' },
    ],
    sizeNm: [100, 120],
    realRate: 'up to about 1,000 macromolecules per second per pore; one crossing takes a few milliseconds',
    enlargement: 1,
    accuracy:
      'Drawn at true size relative to the envelope, but the FG-repeat meshwork is shown as a simple plug, and only a few pores are drawn instead of a few thousand.',
    references: ['alberts-sorting'],
  },
  {
    id: 'nuclear-lamina',
    parent: 'nucleus',
    name: 'Nuclear lamina',
    category: 'structural protein',
    summary:
      'The nuclear lamina is a meshwork of intermediate filament proteins, the lamins, lining the inner face of the nuclear envelope.',
    function:
      'It supports the nucleus mechanically, anchors nuclear pores, and binds chromatin, helping to hold silent genes at the edge of the nucleus. It comes apart when lamins are phosphorylated at the start of mitosis. Mutations in lamin A cause diseases called laminopathies, including progeria.',
    structure: [
      'A-type lamins (lamin A and C)',
      'B-type lamins (lamin B1 and B2)',
      'Inner nuclear membrane partners such as the lamin B receptor and emerin',
      'Lamina-associated chromatin domains',
    ],
    facts: [
      { label: 'Lamin classes', value: '2 (A-type and B-type)' },
      { label: 'Lamina-associated chromatin', value: 'roughly a third of the genome' },
    ],
    sizeNm: [5000, 10000],
    accuracy:
      'Drawn as a regular grid. Real lamin filaments form an irregular, layered meshwork only tens of nanometres thick.',
    references: ['alberts-cytoskeleton', 'alberts-sorting'],
  },
  {
    id: 'chromatin',
    parent: 'nucleus',
    name: 'Chromatin',
    category: 'nucleic acid',
    summary: 'Chromatin is the complex of DNA with histones and other proteins that makes up chromosomes in the nucleus.',
    function:
      'It packs about 2 m of DNA into a nucleus a few micrometres across while keeping genes accessible when they need to be read. Loosely packed euchromatin contains active genes, such as the insulin gene in beta cells, while compact heterochromatin is mostly silent. Chemical marks on histones and DNA help fix which genes each cell type can use.',
    structure: [
      'DNA double helix (2 nm wide)',
      'Nucleosomes',
      'Linker DNA and linker histone H1',
      'Euchromatin',
      'Heterochromatin',
      'Chromosome territories',
    ],
    facts: [
      { label: 'Chromosomes', value: '46 (diploid human)' },
      { label: 'DNA per cell', value: 'about 6.4 billion base pairs, about 2 m long' },
      { label: 'Nucleosome spacing', value: 'about one every 200 base pairs' },
    ],
    sizeNm: [2000, 10000],
    accuracy:
      'Drawn as loose, beaded strands so the structure is visible. Real chromatin is packed far more densely, and each chromosome occupies its own territory in the nucleus.',
    references: ['alberts-genome'],
  },
  {
    id: 'nucleosome',
    parent: 'nucleus',
    name: 'Nucleosome',
    category: 'complex',
    summary:
      'The nucleosome is the basic unit of chromatin: 147 base pairs of DNA wrapped about 1.65 turns around a histone octamer.',
    function:
      'Nucleosomes compact DNA and control access to it. The promoters and enhancers of active genes, such as INS in beta cells, are often cleared of nucleosomes or have them shifted by remodelling complexes. The flexible histone tails carry modifications such as acetylation and methylation that recruit activators or repressors.',
    structure: [
      'Histone octamer: two each of H2A, H2B, H3 and H4',
      '147 base pairs of core DNA',
      'Linker DNA',
      'Linker histone H1',
      'Flexible N-terminal histone tails',
    ],
    facts: [
      { label: 'DNA wrapped', value: '147 base pairs, about 1.65 turns' },
      { label: 'Diameter', value: 'about 11 nm' },
      { label: 'Histone octamer mass', value: 'about 108 kDa' },
      { label: 'Repeat length', value: 'about 200 base pairs including linker DNA' },
    ],
    sizeNm: [10, 11],
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size. The DNA path is smoothed, and the histone tails and linker histone are left out.',
    references: ['alberts-genome'],
  },
  {
    id: 'nucleolus',
    parent: 'nucleus',
    name: 'Nucleolus',
    category: 'compartment',
    summary:
      'The nucleolus is a membraneless region of the nucleus where ribosomal RNA is made and ribosomal subunits are assembled.',
    function:
      'It forms around clusters of rRNA genes carried on five human chromosomes (13, 14, 15, 21 and 22). RNA polymerase I transcribes a 47S precursor that is modified and cut into the 18S, 5.8S and 28S rRNAs, which are assembled with ribosomal proteins and 5S rRNA. Beta cells, which make protein at a high rate, depend on plentiful ribosome production.',
    structure: [
      'Fibrillar centers (rRNA genes and RNA polymerase I)',
      'Dense fibrillar component (early processing)',
      'Granular component (subunit assembly)',
      'Nucleolar organizer regions on 5 chromosome pairs',
    ],
    processes: [
      {
        id: 'ribosome-biogenesis',
        name: 'Ribosome subunit assembly',
        steps: [
          'RNA polymerase I transcribes tandem rRNA genes at the borders of the fibrillar centers, making a 47S precursor rRNA.',
          'Small nucleolar RNAs guide chemical modification of the precursor, mainly 2′-O-methylation and pseudouridine formation.',
          'The precursor is cut in stages into the 18S, 5.8S and 28S rRNAs.',
          'Ribosomal proteins, made in the cytoplasm and imported, assemble with the rRNAs; 5S rRNA, made by RNA polymerase III elsewhere in the nucleus, joins the large subunit.',
          'Pre-40S and pre-60S particles leave the nucleolus and are exported through nuclear pores for final maturation in the cytoplasm.',
        ],
      },
    ],
    facts: [
      { label: 'rRNA gene copies', value: 'about 200 per haploid genome' },
      { label: 'Precursor rRNA', value: '47S, about 13 kb' },
      { label: 'Chromosomes carrying rRNA genes', value: '13, 14, 15, 21 and 22' },
    ],
    sizeNm: [1000, 3000],
    realRate: 'A growing mammalian cell makes thousands of ribosomal subunits per minute',
    accuracy:
      'Drawn as a single sphere with crisp layers. Real nucleoli are irregular, a nucleus may have several, and their sub-regions blend into one another.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'rna-pol-ii',
    parent: 'nucleus',
    name: 'RNA polymerase II',
    category: 'molecular machine',
    summary:
      'RNA polymerase II is the 12-subunit enzyme that transcribes protein-coding genes, including the insulin gene, into messenger RNA.',
    function:
      'It reads the template DNA strand 3′ to 5′ and builds RNA 5′ to 3′. Its C-terminal domain, a tail of 52 seven-amino-acid repeats in humans, is phosphorylated in a changing pattern that recruits the capping, splicing and polyadenylation machinery while the RNA is being made.',
    structure: [
      '12 subunits (Rpb1 to Rpb12)',
      'Clamp and DNA-binding cleft',
      'Active site containing Mg2+',
      'RNA-DNA hybrid of about 8-9 base pairs',
      'C-terminal domain (52 YSPTSPS repeats)',
    ],
    processes: [
      {
        id: 'pol2-transcription',
        name: 'Transcribing a gene',
        steps: [
          'General transcription factors, beginning with TFIID binding the promoter, position RNA polymerase II at the start of the INS gene.',
          'TFIIH unwinds the DNA to open a transcription bubble and phosphorylates serine 5 of the C-terminal domain, freeing the polymerase to leave the promoter.',
          'Ribonucleoside triphosphates pair with the template strand, and the enzyme joins each one to the 3′ end of the growing RNA, releasing pyrophosphate.',
          'DNA ahead of the enzyme is unwound and DNA behind it rewinds, keeping a moving bubble of about 12-14 base pairs.',
          'The capping enzyme adds a 5′ cap, and as elongation continues, serine 2 phosphorylation of the C-terminal domain recruits splicing and 3′-end processing factors.',
          'After the polymerase passes the polyadenylation signal, the RNA is cut and given a poly(A) tail, and the polymerase is released.',
        ],
      },
    ],
    facts: [
      { label: 'Subunits', value: '12' },
      { label: 'Mass', value: 'about 0.5 MDa' },
      { label: 'C-terminal domain', value: '52 heptad repeats (human)' },
      { label: 'Elongation rate', value: 'about 1-4 kilobases per minute' },
    ],
    sizeNm: [10, 15],
    realRate: 'about 1-4 kilobases per minute (roughly 20-70 nucleotides per second)',
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size with simplified subunits. Most of the transcription factors and the Mediator complex that assemble around it are left out, and transcription is slowed.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'mrna',
    parent: 'nucleus',
    name: 'Messenger RNA',
    category: 'nucleic acid',
    summary: 'Messenger RNA is the processed, single-stranded RNA copy of a gene that carries its coding sequence to the ribosomes.',
    function:
      'A mature human mRNA has a 5′ cap, a 5′ untranslated region, the coding sequence, a 3′ untranslated region and a poly(A) tail. Insulin mRNA is one of the most abundant mRNAs in the beta cell, and raised glucose increases both its translation and its stability, quickly boosting proinsulin synthesis.',
    structure: [
      '5′ cap (7-methylguanosine)',
      '5′ untranslated region',
      'Coding sequence (from the AUG start codon to a stop codon)',
      '3′ untranslated region',
      'Poly(A) tail',
    ],
    facts: [
      { label: 'Insulin coding sequence', value: '333 nucleotides (110 codons plus a stop codon)' },
      { label: 'New poly(A) tail', value: 'about 200 adenines' },
      { label: 'Codon', value: '3 nucleotides' },
    ],
    sizeNm: [100, 1000],
    accuracy:
      'Drawn as a smooth ribbon. Real mRNA is coated with proteins and folds back on itself, so its compact shape is much shorter than its stretched-out length.',
    references: ['alberts-dna-to-protein'],
  },

  // ---------- Rough ER components ----------
  {
    id: 'sec61',
    parent: 'rough-er',
    name: 'Sec61 translocon',
    category: 'membrane protein',
    summary:
      'Sec61 is the protein-conducting channel of the ER membrane, a complex of three subunits: Sec61 alpha, beta and gamma.',
    function:
      'It forms a water-filled pore through which secretory proteins such as preproinsulin pass into the ER lumen, and a side opening (the lateral gate) through which the hydrophobic segments of membrane proteins move into the lipid bilayer. The ribosome docks directly on it, so the path from the ribosome exit tunnel into the lumen is sealed.',
    structure: [
      'Sec61 alpha (10 transmembrane helices, forms the channel)',
      'Sec61 beta and Sec61 gamma (small subunits)',
      'Pore ring of hydrophobic side chains',
      'Plug helix',
      'Lateral gate',
    ],
    processes: [
      {
        id: 'sec61-translocation',
        name: 'Co-translational translocation',
        steps: [
          'A ribosome making a protein with a signal peptide is delivered by SRP and binds the cytosolic face of Sec61.',
          'The signal peptide wedges into the lateral gate, which opens the channel and displaces the plug.',
          'The growing chain passes through the pore into the lumen as the ribosome extends it.',
          'The signal peptide moves sideways into the membrane, where signal peptidase cuts it off.',
          'When translation ends, the ribosome leaves and the plug returns, sealing the channel against ion leaks.',
        ],
      },
    ],
    facts: [
      { label: 'Subunits', value: '3 (alpha, beta, gamma)' },
      { label: 'Sec61 alpha', value: '10 transmembrane helices' },
      { label: 'Throughput', value: 'matches translation, about 5-6 amino acids per second' },
    ],
    sizeNm: [4, 6],
    realRate: 'about 5-6 amino acids per second, the speed of translation',
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size, with the channel opening and the chain passing through it shown slowed and simplified.',
    references: ['alberts-sorting'],
  },
  {
    id: 'srp',
    parent: 'rough-er',
    name: 'Signal recognition particle',
    category: 'complex',
    summary:
      'The signal recognition particle (SRP) is a particle made of one RNA (7SL RNA) and six proteins that targets ribosomes making secretory or membrane proteins to the ER.',
    function:
      'It binds the hydrophobic signal sequence as it emerges from the ribosome, slows elongation, and delivers the ribosome to the SRP receptor on the ER membrane. This ensures that preproinsulin is threaded into the ER rather than released into the cytosol.',
    structure: [
      '7SL RNA (about 300 nucleotides)',
      'SRP54 (binds the signal sequence; a GTPase)',
      'Alu domain (SRP9/14; slows elongation)',
      'S domain (SRP19, SRP68/72)',
    ],
    processes: [
      {
        id: 'srp-targeting',
        name: 'Targeting to the ER',
        steps: [
          'A methionine-rich groove in SRP54 binds the signal peptide as it emerges from the ribosome exit tunnel.',
          'The Alu domain reaches into the ribosome’s elongation factor binding site, slowing translation.',
          'SRP54 bound to GTP docks on the SRP receptor, also a GTPase, on the ER membrane.',
          'The ribosome is handed over to the Sec61 translocon.',
          'Both GTPases hydrolyse their GTP, SRP lets go and is recycled, and translation resumes into the channel.',
        ],
      },
    ],
    facts: [
      { label: 'RNA', value: '7SL RNA, about 300 nucleotides' },
      { label: 'Proteins', value: '6' },
      { label: 'GTPases in the targeting step', value: '2 (SRP54 and the SRP receptor)' },
    ],
    sizeNm: [20, 25],
    realRate: 'Targeting is completed within seconds, while only a short stretch of the chain has been made',
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size. The real particle is a long, flexible rod; its shape and the handover to Sec61 are simplified and slowed.',
    references: ['alberts-sorting'],
  },
  {
    id: 'signal-peptidase',
    parent: 'rough-er',
    name: 'Signal peptidase',
    category: 'enzyme',
    summary:
      'Signal peptidase is a membrane-bound protease complex of the ER that cuts signal peptides off newly translocated proteins.',
    function:
      'Its active site sits just inside the lumen, where it removes the 24-amino-acid signal peptide of preproinsulin to produce proinsulin. The cut frees the protein to fold, and the leftover signal peptide is broken down further in the membrane by signal peptide peptidase.',
    structure: [
      'Catalytic subunit (SEC11A or SEC11C)',
      'Accessory subunits (SPCS1, SPCS2, SPCS3)',
      'Active site at the lumenal surface of the membrane',
    ],
    processes: [
      {
        id: 'signal-cleavage',
        name: 'Signal peptide removal',
        steps: [
          'The signal peptide spans the ER membrane with its cleavage site lying at the lumenal surface.',
          'Signal peptidase recognizes small amino acids at positions -1 and -3 before the cut site.',
          'Its catalytic serine attacks the peptide bond, releasing proinsulin into the lumen.',
          'The signal peptide stays in the membrane, where signal peptide peptidase cuts it further for disposal.',
        ],
      },
    ],
    facts: [
      { label: 'Preproinsulin signal peptide', value: '24 amino acids' },
      { label: 'Product', value: 'proinsulin, 86 amino acids' },
      { label: 'Subunits per complex', value: '4' },
    ],
    sizeNm: [5, 10],
    realRate: 'Cleavage occurs during translocation, typically within seconds of the signal peptide entering the membrane',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, with its membrane-embedded subunits simplified into one block.',
    references: ['alberts-sorting'],
  },
  {
    id: 'bip',
    parent: 'rough-er',
    name: 'BiP (GRP78)',
    category: 'molecular machine',
    summary: 'BiP, also called GRP78, is the main Hsp70-family chaperone of the ER lumen.',
    function:
      'It binds exposed hydrophobic stretches of new proteins to stop them aggregating, helps them fold, seals the translocon when it is idle, and holds misfolded proteins for degradation. It also senses ER stress: when unfolded proteins pile up, BiP is drawn away from the stress sensors IRE1, PERK and ATF6, which then switch on the unfolded protein response. Beta cells, with their huge proinsulin load, rely heavily on this system.',
    structure: [
      'N-terminal nucleotide-binding domain (ATPase)',
      'Substrate-binding domain with a groove for peptide segments',
      'Helical lid',
      'C-terminal KDEL signal that keeps it in the ER',
    ],
    processes: [
      {
        id: 'bip-cycle',
        name: 'Chaperone cycle',
        steps: [
          'With ATP bound, BiP’s lid is open and it binds and releases peptides quickly.',
          'A J-domain partner protein (an ERdj protein) presents an unfolded chain and stimulates BiP to hydrolyse its ATP.',
          'In the ADP-bound state the lid closes, gripping a hydrophobic segment of the chain tightly.',
          'A nucleotide exchange factor (such as GRP170 or SIL1) swaps ADP for ATP.',
          'The lid opens and the chain is released for another attempt at folding; cycles repeat until the protein folds or is sent for degradation.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 78 kDa' },
      { label: 'ER retention signal', value: 'KDEL (Lys-Asp-Glu-Leu)' },
      { label: 'ATP per binding cycle', value: '1' },
    ],
    sizeNm: [7, 10],
    realRate: 'A binding-and-release cycle typically takes seconds; BiP’s own ATPase is very slow until a J-domain partner stimulates it',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, with the lid motion exaggerated and slowed.',
    references: ['alberts-proteins', 'alberts-sorting'],
  },
  {
    id: 'ost',
    parent: 'rough-er',
    name: 'Oligosaccharyltransferase',
    category: 'enzyme',
    summary:
      'Oligosaccharyltransferase (OST) is a multi-subunit ER membrane enzyme that transfers a preassembled 14-sugar oligosaccharide onto asparagines of new proteins.',
    function:
      'It N-glycosylates many secretory and membrane proteins at Asn-X-Ser/Thr sequences (where X is not proline) as they enter the lumen, and these glycans help folding and quality control. Proinsulin has no such site and is not glycosylated, but many other beta-cell proteins, including granule membrane proteins and receptors, are.',
    structure: [
      'Catalytic subunit STT3A or STT3B',
      'Accessory subunits, including ribophorins',
      'Binding site for the dolichol-linked oligosaccharide',
      'Pocket that binds the Asn-X-Ser/Thr sequence',
    ],
    processes: [
      {
        id: 'n-glycosylation',
        name: 'N-linked glycosylation',
        steps: [
          'A 14-sugar oligosaccharide (Glc3Man9GlcNAc2) is built on the lipid carrier dolichol phosphate in the ER membrane.',
          'OST, positioned next to the Sec61 translocon, scans the incoming chain for Asn-X-Ser/Thr sequences.',
          'The STT3 subunit transfers the whole oligosaccharide in one step from dolichol pyrophosphate to the asparagine side chain.',
          'Glucosidases then trim the glucoses; glycans with a single glucose let the chaperones calnexin and calreticulin check folding.',
          'Folded glycoproteins move on to the Golgi, where their glycans are trimmed and modified further.',
        ],
      },
    ],
    facts: [
      { label: 'Oligosaccharide transferred', value: '14 sugars (Glc3Man9GlcNAc2)' },
      { label: 'Target sequence', value: 'Asn-X-Ser/Thr, X not proline' },
      { label: 'Catalytic isoforms', value: '2 (STT3A, mostly during translation; STT3B, mostly after)' },
    ],
    sizeNm: [10, 15],
    realRate: 'Transfers a glycan within seconds as each target sequence enters the lumen, keeping pace with translation',
    enlargement: 4,
    accuracy:
      'Drawn 4 times larger than true size. It is shown acting on generic secretory and membrane proteins, not on proinsulin, which is never N-glycosylated.',
    references: ['alberts-sorting'],
  },
  {
    id: 'pdi',
    parent: 'rough-er',
    name: 'Protein disulfide isomerase',
    category: 'enzyme',
    summary:
      'Protein disulfide isomerase (PDI) is an abundant enzyme of the ER lumen that forms, breaks and rearranges disulfide bonds in new proteins.',
    function:
      'It catalyses correct pairing of cysteines so proteins reach their native fold. Proinsulin must form three disulfide bonds (B7-A7, B19-A20 and A6-A11), and PDI and related enzymes help it do so; proinsulin with wrongly paired cysteines is held in the ER and can cause ER stress.',
    structure: [
      'Four thioredoxin-like domains (a, b, b′, a′)',
      'CGHC active sites in the a and a′ domains',
      'Hydrophobic substrate-binding pocket in the b′ domain',
      'C-terminal KDEL retention signal',
    ],
    processes: [
      {
        id: 'disulfide-formation',
        name: 'Disulfide bond formation',
        steps: [
          'Oxidized PDI carries a disulfide bond in its CGHC active site.',
          'A cysteine on the substrate attacks this disulfide, forming a temporary mixed disulfide between PDI and the substrate.',
          'A second cysteine on the substrate attacks, forming the new disulfide within the substrate and leaving PDI reduced.',
          'Reduced PDI can rearrange wrongly paired bonds, or it is reoxidized by ERO1, which passes the electrons to O2 and produces H2O2.',
          'For proinsulin, repeated rounds produce the three native disulfides: B7-A7, B19-A20 and A6-A11.',
        ],
      },
    ],
    facts: [
      { label: 'Disulfide bonds in insulin', value: '3 (2 between chains, 1 within the A chain)' },
      { label: 'Active-site motif', value: 'CGHC (2 per molecule)' },
      { label: 'Mass', value: 'about 57 kDa' },
    ],
    sizeNm: [7, 10],
    realRate: 'Each thiol-disulfide exchange takes a fraction of a second; proinsulin folds within minutes',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; its four domains are simplified into a compact shape.',
    references: ['alberts-proteins', 'alberts-sorting'],
  },
  {
    id: 'er-exit-site',
    parent: 'rough-er',
    name: 'ER exit site',
    category: 'compartment',
    summary:
      'ER exit sites are specialized, ribosome-free patches of the ER where COPII-coated carriers bud to take cargo to the Golgi.',
    function:
      'They collect folded proteins, including proinsulin, and package them into COPII carriers, while leaving ER-resident proteins and misfolded proteins behind. In beta cells these sites handle a very large flow of cargo.',
    structure: ['Sec16 scaffold', 'Sar1 GTPase', 'Sec23/Sec24 inner coat', 'Sec13/Sec31 outer coat', 'Cargo receptors'],
    processes: [
      {
        id: 'copii-budding',
        name: 'COPII budding',
        steps: [
          'The exchange factor Sec12 loads GTP onto Sar1, which inserts an amphipathic helix into the ER membrane.',
          'Sar1-GTP recruits the Sec23/Sec24 inner coat; Sec24 binds export signals on cargo or on cargo receptors.',
          'Sec13/Sec31 assembles over the inner coat as an outer cage that bends the membrane into a bud.',
          'The bud pinches off as a COPII vesicle about 60-90 nm across.',
          'Sec23 stimulates Sar1 to hydrolyse its GTP, which releases the coat so the vesicle can fuse with the ER-Golgi intermediate compartment.',
        ],
      },
    ],
    facts: [
      { label: 'COPII vesicle diameter', value: 'about 60-90 nm' },
      { label: 'Exit sites per mammalian cell', value: 'a few hundred' },
    ],
    sizeNm: [200, 500],
    realRate: 'ER-to-Golgi transport of typical cargo takes on the order of 10-20 minutes',
    accuracy:
      'Shown as a single tidy budding site. Real exit sites are numerous, and their carriers may be small vesicles or larger tubules.',
    references: ['alberts-traffic'],
  },

  // ---------- Smooth ER components ----------
  {
    id: 'serca',
    parent: 'smooth-er',
    name: 'SERCA pump',
    category: 'membrane protein',
    summary:
      'SERCA (sarco/endoplasmic reticulum Ca2+-ATPase) is a P-type pump that uses ATP to move Ca2+ from the cytosol into the ER.',
    function:
      'It keeps cytosolic Ca2+ low (about 0.1 µM at rest) and ER Ca2+ high, refilling the store after each release. Beta cells mainly express SERCA2b and SERCA3. SERCA activity shapes the Ca2+ oscillations that pace insulin secretion, and reduced SERCA2 activity is linked to ER stress in diabetes.',
    structure: [
      '10 transmembrane helices with two Ca2+-binding sites',
      'Actuator (A) domain',
      'Phosphorylation (P) domain with a conserved aspartate',
      'Nucleotide-binding (N) domain',
    ],
    processes: [
      {
        id: 'serca-cycle',
        name: 'Pump cycle',
        steps: [
          'In the E1 state, two Ca2+ ions from the cytosol bind high-affinity sites among the transmembrane helices.',
          'ATP phosphorylates the conserved aspartate in the P domain, and the Ca2+ ions become occluded.',
          'The pump changes to the E2-P state, opening toward the ER lumen with lowered Ca2+ affinity, and both ions are released.',
          'Protons from the lumen bind the empty sites, and the phosphate is hydrolysed off.',
          'The pump returns to E1, releasing the protons into the cytosol, ready for another cycle.',
        ],
      },
    ],
    facts: [
      { label: 'Stoichiometry', value: '2 Ca2+ per ATP' },
      { label: 'Mass', value: 'about 110 kDa' },
      { label: 'Beta-cell isoforms', value: 'mainly SERCA2b and SERCA3' },
    ],
    sizeNm: [10, 15],
    realRate: 'tens of transport cycles per second, moving 2 Ca2+ each cycle',
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size, with its domain movements exaggerated and slowed.',
    references: ['alberts-transport', 'lehninger-membranes'],
  },
  {
    id: 'ip3-receptor',
    parent: 'smooth-er',
    name: 'IP3 receptor',
    category: 'membrane protein',
    summary:
      'The IP3 receptor is a large Ca2+ channel in the ER membrane, made of four subunits, that opens when it binds inositol 1,4,5-trisphosphate (IP3) and Ca2+.',
    function:
      'It releases stored Ca2+ into the cytosol in response to signals that activate phospholipase C, such as acetylcholine acting on M3 muscarinic receptors in beta cells. Because cytosolic Ca2+ helps open the channel at low levels but inhibits it at high levels, it can produce Ca2+ puffs, waves and oscillations.',
    structure: [
      'Four subunits of about 310 kDa each',
      'Cytosolic IP3-binding cores',
      'Ca2+-sensing sites',
      'Six transmembrane helices per subunit around a central pore',
    ],
    processes: [
      {
        id: 'ip3-release',
        name: 'IP3-triggered Ca2+ release',
        steps: [
          'A Gq-coupled receptor activates phospholipase C, which cleaves PIP2 into IP3 and diacylglycerol.',
          'IP3 diffuses to the ER and binds the IP3-binding cores of the receptor.',
          'IP3 binding together with a modest rise in cytosolic Ca2+ opens the channel.',
          'Ca2+ flows from the ER lumen into the cytosol, and the released Ca2+ helps open neighbouring receptors, spreading the signal.',
          'High local Ca2+ then inhibits the receptor, and SERCA pumps refill the store.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 1.2 MDa (tetramer)' },
      { label: 'Human isoforms', value: '3 (IP3R1-3)' },
      { label: 'Co-agonists', value: 'IP3 and Ca2+' },
    ],
    sizeNm: [18, 25],
    realRate: 'Opens within milliseconds once IP3 and Ca2+ are bound',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, with the channel opening simplified and Ca2+ flow slowed.',
    references: ['alberts-signaling'],
  },
  {
    id: 'cytochrome-p450',
    parent: 'smooth-er',
    name: 'Cytochrome P450',
    category: 'enzyme',
    summary:
      'Cytochrome P450 enzymes are heme-containing monooxygenases anchored in the ER membrane that hydroxylate a wide range of lipids and foreign compounds.',
    function:
      'They insert one oxygen atom from O2 into a substrate, using electrons from NADPH delivered by cytochrome P450 reductase. They are most abundant in liver, where they metabolize drugs; other cells, including beta cells, contain far less and use P450s mainly on their own lipids, such as fatty acids and sterols.',
    structure: [
      'Heme with its iron held by a cysteine sulfur',
      'N-terminal membrane anchor',
      'Substrate-binding pocket',
      'Partner enzyme: NADPH-cytochrome P450 reductase',
    ],
    facts: [
      { label: 'Human P450 genes', value: '57' },
      { label: 'Reaction', value: 'RH + O2 + NADPH + H+ → ROH + H2O + NADP+' },
      { label: 'Name origin', value: 'absorbs light at 450 nm when reduced and bound to CO' },
      { label: 'Mass', value: 'about 50-60 kDa' },
    ],
    sizeNm: [5, 7],
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size; its reductase partner is not shown.',
    references: ['lehninger-fatty-acids'],
  },

  // ---------- Ribosome components ----------
  {
    id: 'small-subunit',
    parent: 'ribosome',
    name: '40S small subunit',
    category: 'molecular machine',
    summary:
      'The 40S small ribosomal subunit binds the mRNA and decodes it, matching each codon with the correct tRNA anticodon.',
    function:
      'It holds the mRNA in a channel, scans from the 5′ cap to find the start codon during initiation, and in its decoding center checks codon-anticodon pairing so that only matching aminoacyl-tRNAs are accepted.',
    structure: [
      '18S rRNA (about 1,900 nucleotides)',
      'About 33 ribosomal proteins',
      'Head, body and platform',
      'mRNA entry and exit channels',
      'Decoding center',
    ],
    facts: [
      { label: 'rRNA', value: '18S, about 1,900 nucleotides' },
      { label: 'Proteins', value: 'about 33' },
      { label: 'Mass', value: 'about 1.2-1.4 MDa' },
    ],
    sizeNm: [20, 25],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a simple rounded shape; the real subunit has a distinct head, body and platform.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'large-subunit',
    parent: 'ribosome',
    name: '60S large subunit',
    category: 'molecular machine',
    summary: 'The 60S large ribosomal subunit forms peptide bonds and holds the tunnel through which the new protein leaves.',
    function:
      'Its peptidyl transferase center, made of rRNA, joins each new amino acid to the growing chain. It also binds the GTP-using elongation factors and holds the exit tunnel, whose outer end binds SRP and docks on the Sec61 translocon when the ribosome is on the ER.',
    structure: [
      '28S rRNA (about 5,000 nucleotides)',
      '5.8S rRNA (about 160 nucleotides)',
      '5S rRNA (about 120 nucleotides)',
      'About 47 ribosomal proteins',
      'Peptidyl transferase center',
      'Exit tunnel',
    ],
    facts: [
      { label: 'rRNAs', value: '3 (28S, 5.8S, 5S)' },
      { label: 'Proteins', value: 'about 47' },
      { label: 'Mass', value: 'about 3 MDa' },
      { label: 'Exit tunnel holds', value: 'about 30-40 amino acids of the new chain' },
    ],
    sizeNm: [25, 30],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a simple dome; the real subunit has protrusions and a deep tunnel.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'trna',
    parent: 'ribosome',
    name: 'Transfer RNA',
    category: 'nucleic acid',
    summary:
      'Transfer RNA (tRNA) is a small RNA, about 75-90 nucleotides long, that carries an amino acid to the ribosome and reads a codon with its anticodon.',
    function:
      'Each tRNA is loaded with its own amino acid by an aminoacyl-tRNA synthetase, using ATP. At the ribosome its anticodon pairs with the mRNA codon, so the genetic code is read through this pairing. Wobble pairing at the third codon position lets one tRNA read more than one codon.',
    structure: [
      'Acceptor stem ending in CCA (amino acid attached to the final adenosine)',
      'D arm',
      'Anticodon loop',
      'Variable loop',
      'T arm',
      'L-shaped overall fold',
    ],
    facts: [
      { label: 'Length', value: 'about 75-90 nucleotides' },
      { label: 'Shape', value: 'L-shaped, about 7 nm per arm' },
      { label: 'Cost of loading', value: 'ATP → AMP + PPi (2 high-energy bonds)' },
    ],
    sizeNm: [6, 7],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a simplified L shape; only a few tRNAs are shown, and their movement is slowed.',
    references: ['alberts-dna-to-protein'],
  },
  {
    id: 'nascent-chain',
    parent: 'ribosome',
    name: 'Nascent polypeptide',
    category: 'complex',
    summary: 'The nascent chain is the growing polypeptide emerging from the ribosome’s exit tunnel during translation.',
    function:
      'The newest 30-40 amino acids are shielded inside the exit tunnel. The N-terminal end emerges first and can begin folding or binding chaperones, and if it is a signal peptide, like that of preproinsulin, it is recognized by SRP. On ER-bound ribosomes the chain passes straight from the tunnel into the Sec61 channel.',
    structure: [
      'N-terminus (made first)',
      'Signal peptide (on secretory proteins)',
      'Segment inside the exit tunnel',
      'C-terminus attached to the tRNA in the P site',
    ],
    facts: [
      { label: 'Inside the tunnel', value: 'about 30-40 amino acids' },
      { label: 'Growth rate', value: 'about 5-6 amino acids per second' },
      { label: 'Preproinsulin length', value: '110 amino acids' },
    ],
    sizeNm: [5, 40],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a smooth tube; a real chain is a flexible string of amino acids that folds as it emerges.',
    references: ['alberts-dna-to-protein'],
  },

  // ---------- Golgi components ----------
  {
    id: 'cis-golgi',
    parent: 'golgi',
    name: 'cis-Golgi',
    category: 'compartment',
    summary: 'The cis-Golgi is the entry face of the Golgi stack, where cargo arrives from the ER.',
    function:
      'Carriers from the ER fuse to form the cis-Golgi network. Here, ER-resident proteins that escaped are captured by KDEL receptors and sent back in COPI vesicles, and early processing begins, including mannose trimming and the first step in tagging lysosomal enzymes with mannose 6-phosphate.',
    structure: ['cis-Golgi network (tubules)', 'First cisternae', 'KDEL receptors', 'COPI budding sites'],
    facts: [
      { label: 'Lumenal pH', value: 'about 6.7' },
      { label: 'Retrieval signal recognized', value: 'C-terminal KDEL (4 amino acids)' },
    ],
    sizeNm: [500, 1500],
    accuracy: 'Drawn as one smooth, evenly curved cisterna; the real cis face is a tubular network.',
    references: ['alberts-traffic'],
  },
  {
    id: 'medial-golgi',
    parent: 'golgi',
    name: 'medial-Golgi',
    category: 'compartment',
    summary: 'The medial-Golgi cisternae form the middle of the stack, where much of the processing of N-linked glycans takes place.',
    function:
      'Enzymes here, such as mannosidase II and N-acetylglucosamine transferases, convert high-mannose glycans into complex glycans. Each enzyme is concentrated in the cisternae where it acts, so glycans are processed in order as cargo moves through the stack.',
    structure: ['Flattened cisternae', 'Mannosidase II', 'N-acetylglucosamine transferases', 'Rims that bud COPI vesicles'],
    facts: [
      { label: 'Lumenal pH', value: 'between about 6.7 (cis) and 6.0 (trans-Golgi network)' },
      { label: 'Key enzyme', value: 'mannosidase II' },
    ],
    sizeNm: [500, 1500],
    accuracy: 'Drawn as evenly curved discs; real cisternae are perforated and irregular.',
    references: ['alberts-traffic'],
  },
  {
    id: 'trans-golgi',
    parent: 'golgi',
    name: 'trans-Golgi',
    category: 'compartment',
    summary: 'The trans-Golgi cisternae are the last cisternae of the stack, where glycans are completed before cargo reaches the trans-Golgi network.',
    function:
      'Galactosyltransferases and sialyltransferases here add galactose and sialic acid to the ends of glycan chains. The lumen becomes more acidic, preparing cargo for sorting in the trans-Golgi network.',
    structure: ['Flattened cisternae', 'Galactosyltransferases', 'Sialyltransferases', 'Junction with the trans-Golgi network'],
    facts: [
      { label: 'Lumenal pH', value: 'about 6.0-6.2' },
      { label: 'Sugars added', value: 'galactose and sialic acid' },
    ],
    sizeNm: [500, 1500],
    accuracy: 'Drawn as evenly curved discs separate from the network beyond; in cells the boundary is gradual.',
    references: ['alberts-traffic'],
  },
  {
    id: 'tgn',
    parent: 'golgi',
    name: 'trans-Golgi network',
    category: 'compartment',
    summary: 'The trans-Golgi network (TGN) is the tubular sorting station on the exit face of the Golgi.',
    function:
      'It sorts cargo into different carriers: constitutive vesicles to the plasma membrane, clathrin-coated vesicles carrying lysosomal enzymes to endosomes, and, in beta cells, immature insulin granules for regulated secretion. Its lumen is the most acidic part of the Golgi, about pH 6.0, and rich in Ca2+, conditions that favour condensation of proinsulin.',
    structure: [
      'Tubular network',
      'Budding immature insulin granules',
      'Clathrin and AP-1 coated buds',
      'Constitutive secretory carriers',
    ],
    processes: [
      {
        id: 'tgn-sorting',
        name: 'Sorting into granules and vesicles',
        steps: [
          'Cargo arrives from the trans cisternae; the mildly acidic, Ca2+-rich lumen promotes condensation of proinsulin.',
          'Proinsulin condensates collect in membrane regions that bud as immature granules, partly coated with clathrin and AP-1.',
          'Lysosomal enzymes carrying mannose 6-phosphate bind M6P receptors and are packaged into clathrin/AP-1-coated vesicles bound for endosomes.',
          'Proteins without sorting signals leave in constitutive carriers that fuse with the plasma membrane without any trigger.',
          'Immature granules mature as they move away, while missorted proteins are removed from them in small clathrin-coated vesicles.',
        ],
      },
    ],
    facts: [
      { label: 'Lumenal pH', value: 'about 6.0' },
      { label: 'Main exit routes', value: '3 (constitutive, endosome/lysosome, regulated granules)' },
    ],
    sizeNm: [500, 2000],
    realRate: 'Newly made proinsulin typically reaches the trans-Golgi network on the order of half an hour after synthesis',
    accuracy:
      'Drawn as a few tubules with budding granules. The real network is a dense, branching tubular mesh, and granule budding is shown much faster than it occurs.',
    references: ['alberts-traffic', 'lodish-traffic'],
  },
  {
    id: 'm6p-receptor',
    parent: 'golgi',
    name: 'Mannose 6-phosphate receptor',
    category: 'membrane protein',
    summary:
      'The mannose 6-phosphate receptor is a transmembrane protein of the trans-Golgi network that captures lysosomal enzymes tagged with mannose 6-phosphate.',
    function:
      'It binds these enzymes at the mildly acidic pH of the trans-Golgi network, carries them in clathrin-coated vesicles to endosomes, lets them go in the more acidic endosomal lumen, and then returns to the Golgi for reuse. This route stocks lysosomes, including those that destroy surplus insulin granules, with their digestive enzymes. There are two forms: the cation-independent receptor (about 300 kDa) and the cation-dependent receptor (about 46 kDa).',
    structure: [
      'Lumenal mannose 6-phosphate-binding domains',
      'Single transmembrane helix',
      'Cytosolic tail with sorting signals for AP-1 and GGA adaptors',
    ],
    processes: [
      {
        id: 'm6p-cycle',
        name: 'Receptor cycle',
        steps: [
          'In the cis-Golgi, a phosphotransferase recognizes a signal patch on lysosomal enzymes and adds GlcNAc-phosphate to mannose residues.',
          'A second enzyme removes the GlcNAc, exposing mannose 6-phosphate.',
          'In the trans-Golgi network, M6P receptors bind the tagged enzymes and are gathered into clathrin-coated vesicles by AP-1 and GGA adaptors.',
          'The vesicles fuse with endosomes, where the lower pH makes the enzymes let go.',
          'A phosphatase removes the phosphate so the enzymes cannot rebind, and the empty receptors return to the trans-Golgi network with the help of the retromer complex.',
        ],
      },
    ],
    facts: [
      { label: 'Cation-independent receptor', value: 'about 300 kDa' },
      { label: 'Cation-dependent receptor', value: 'about 46 kDa' },
      { label: 'pH behaviour', value: 'binds near pH 6.5, releases in endosomes below about pH 6' },
    ],
    sizeNm: [10, 20],
    realRate: 'Each receptor makes many round trips between the Golgi and endosomes, each taking minutes',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, and its cargo is shown as generic beads rather than particular enzymes.',
    references: ['alberts-traffic'],
  },

  // ---------- Mitochondrion components ----------
  {
    id: 'outer-mito-membrane',
    parent: 'mitochondrion',
    name: 'Outer mitochondrial membrane',
    category: 'membrane',
    summary:
      'The outer mitochondrial membrane is the smooth outer boundary of the mitochondrion, made permeable to small molecules by porin channels.',
    function:
      'VDAC channels let ions and metabolites up to about 5 kDa through, so the intermembrane space resembles the cytosol in its small molecules. The membrane holds the TOM complex, the entry gate for nearly all mitochondrial proteins made in the cytosol, along with enzymes of lipid metabolism, and it forms contact sites with the ER. Proteins on its surface also mark damaged mitochondria for removal by mitophagy.',
    structure: [
      'Lipid bilayer',
      'VDAC (porin) channels',
      'TOM protein import complex',
      'Fusion and fission proteins (mitofusins, Drp1 receptors)',
      'Contact sites with the ER',
    ],
    facts: [
      { label: 'Permeability limit', value: 'molecules up to about 5 kDa' },
      { label: 'Main channel', value: 'VDAC (porin)' },
    ],
    sizeNm: [1000, 5000],
    accuracy: 'Drawn as a smooth, closed capsule; real mitochondria change shape continuously as they fuse and divide.',
    references: ['alberts-energy'],
  },
  {
    id: 'vdac',
    parent: 'mitochondrion',
    name: 'VDAC (mitochondrial porin)',
    category: 'membrane protein',
    summary:
      'VDAC (voltage-dependent anion channel, also called mitochondrial porin) is a beta-barrel channel in the outer mitochondrial membrane.',
    function:
      'Its wide pore lets ATP, ADP, phosphate, pyruvate and other metabolites cross the outer membrane, so it is the first step for ATP leaving the mitochondrion on its way to K_ATP channels in the beta cell. Its permeability is tuned by voltage and by proteins that bind it, such as hexokinase.',
    structure: ['19-stranded beta barrel', 'N-terminal alpha helix lying inside the pore', 'Pore about 2.5-3 nm across'],
    facts: [
      { label: 'Beta strands', value: '19' },
      { label: 'Pore diameter', value: 'about 2.5-3 nm' },
      { label: 'Mass', value: 'about 31 kDa' },
      { label: 'Human isoforms', value: '3 (VDAC1-3)' },
    ],
    sizeNm: [3.5, 4.5],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, with far fewer copies than the outer membrane really contains.',
    references: ['alberts-energy'],
  },
  {
    id: 'cristae',
    parent: 'mitochondrion',
    name: 'Cristae',
    category: 'membrane',
    summary:
      'Cristae are folds of the inner mitochondrial membrane that project into the matrix and carry the respiratory chain and ATP synthase.',
    function:
      'They greatly increase the area of inner membrane available for oxidative phosphorylation. Rows of ATP synthase dimers line their curved edges and help bend the membrane, while respiratory complexes sit in the flatter regions. Narrow crista junctions connect each crista to the rest of the inner membrane, and the lipid cardiolipin, needed by many respiratory enzymes, is concentrated here.',
    structure: [
      'Crista junctions (narrow necks)',
      'Crista membrane',
      'Rows of ATP synthase dimers along the curved edges',
      'Intracristal space',
      'MICOS complex at the junctions',
    ],
    facts: [
      { label: 'Crista junction width', value: 'about 20-40 nm' },
      { label: 'Cardiolipin', value: 'about 15-20% of inner-membrane phospholipid' },
    ],
    sizeNm: [200, 1000],
    accuracy: 'Drawn as a few regular shelves. Real cristae are more numerous, vary in shape between cells, and are remodelled as energy demand changes.',
    references: ['alberts-energy', 'lehninger-oxphos'],
  },
  {
    id: 'mito-matrix',
    parent: 'mitochondrion',
    name: 'Mitochondrial matrix',
    category: 'compartment',
    summary: 'The mitochondrial matrix is the protein-dense space enclosed by the inner membrane.',
    function:
      'It contains the enzymes of the citric acid cycle, pyruvate dehydrogenase and fatty acid beta-oxidation, along with mtDNA and mitochondrial ribosomes. Its pH is higher than that of the intermembrane space because protons are pumped out of it. In beta cells, Ca2+ entering the matrix through the mitochondrial calcium uniporter activates dehydrogenases, boosting ATP production during stimulation.',
    structure: [
      'Citric acid cycle enzymes',
      'Pyruvate dehydrogenase complex',
      'mtDNA nucleoids',
      'Mitochondrial ribosomes (55S)',
      'Pyruvate carboxylase',
    ],
    facts: [
      { label: 'pH', value: 'about 7.8-8' },
      { label: 'Mitochondrial ribosome', value: '55S (28S + 39S subunits)' },
    ],
    sizeNm: [500, 4000],
    accuracy: 'Shown as a lightly tinted space. The real matrix is so crowded with enzymes that it behaves more like a gel than a solution.',
    references: ['lehninger-tca', 'alberts-energy'],
  },
  {
    id: 'mtdna',
    parent: 'mitochondrion',
    name: 'Mitochondrial DNA (nucleoid)',
    category: 'nucleic acid',
    summary:
      'Mitochondrial DNA is the small circular genome of the mitochondrion, packaged with proteins into nucleoids in the matrix.',
    function:
      'Human mtDNA encodes 13 proteins, all core subunits of the respiratory complexes and ATP synthase, plus 22 tRNAs and 2 rRNAs used by mitochondrial ribosomes. Each cell holds hundreds to thousands of copies, and it is inherited from the mother. The mutation m.3243A>G causes maternally inherited diabetes and deafness, in part by impairing beta-cell ATP production.',
    structure: [
      'Circular double-stranded DNA',
      'Heavy and light strands',
      'Control region (D-loop)',
      'TFAM packaging protein',
      'Nucleoid (about 100 nm across)',
    ],
    facts: [
      { label: 'Genome size', value: '16,569 base pairs' },
      { label: 'Genes', value: '13 proteins, 22 tRNAs, 2 rRNAs' },
      { label: 'Copies per cell', value: 'hundreds to thousands' },
      { label: 'Nucleoid diameter', value: 'about 100 nm' },
    ],
    sizeNm: [70, 120],
    accuracy: 'Drawn as a single glowing knot; real mitochondria contain several nucleoids, each usually holding one or two genomes.',
    references: ['alberts-energy'],
  },
  {
    id: 'complex-i',
    parent: 'mitochondrion',
    name: 'Complex I (NADH dehydrogenase)',
    category: 'enzyme',
    summary:
      'Complex I (NADH:ubiquinone oxidoreductase) is a large L-shaped enzyme that passes electrons from NADH to ubiquinone and pumps protons across the inner membrane.',
    function:
      'It is the main entry point for electrons from the citric acid cycle into the respiratory chain. For each NADH oxidized it moves 4 H+ from the matrix to the intermembrane space, providing a large share of the proton-motive force that drives ATP synthesis in the beta cell. It is also a major source of superoxide.',
    structure: [
      'Peripheral arm in the matrix (NADH site, FMN, iron-sulfur clusters)',
      'Membrane arm with four proton-pumping modules',
      'Ubiquinone-binding tunnel where the arms meet',
      '45 subunits in mammals, 7 encoded by mtDNA',
    ],
    processes: [
      {
        id: 'complex-i-pumping',
        name: 'NADH oxidation and proton pumping',
        steps: [
          'NADH binds in the peripheral arm and transfers 2 electrons, as a hydride ion, to FMN.',
          'The electrons pass one at a time along a chain of iron-sulfur clusters to the ubiquinone site near the membrane.',
          'Ubiquinone is reduced to ubiquinol (QH2), taking up 2 H+ from the matrix.',
          'Energy released by this reduction drives shape changes that travel along the membrane arm.',
          'These changes move 4 H+ from the matrix to the intermembrane space through the four pumping modules.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 1 MDa' },
      { label: 'Subunits', value: '45 in mammals' },
      { label: 'Protons pumped', value: '4 H+ per NADH (2 electrons)' },
      { label: 'Iron-sulfur clusters', value: '8' },
    ],
    sizeNm: [20, 25],
    realRate: 'Each catalytic cycle takes on the order of milliseconds',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size with a simplified L shape; electron and proton movements are slowed and shown as glowing dots.',
    references: ['lehninger-oxphos'],
  },
  {
    id: 'complex-ii',
    parent: 'mitochondrion',
    name: 'Complex II (succinate dehydrogenase)',
    category: 'enzyme',
    summary:
      'Complex II (succinate dehydrogenase) is both a citric acid cycle enzyme and part of the respiratory chain, passing electrons from succinate to ubiquinone.',
    function:
      'It oxidizes succinate to fumarate and passes the 2 electrons through FAD and iron-sulfur clusters to ubiquinone. Unlike Complexes I, III and IV it pumps no protons, so electrons entering here yield less ATP: about 1.5 ATP per pair, compared with about 2.5 from NADH. All four of its subunits are encoded by nuclear genes.',
    structure: [
      'SDHA (covalently bound FAD and succinate site)',
      'SDHB (three iron-sulfur clusters)',
      'SDHC and SDHD (membrane anchor, ubiquinone site and heme b)',
    ],
    processes: [
      {
        id: 'succinate-oxidation',
        name: 'Succinate to ubiquinone',
        steps: [
          'Succinate binds SDHA and gives 2 electrons and 2 H+ to the bound FAD, becoming fumarate.',
          'FADH2 passes the electrons one at a time through the three iron-sulfur clusters of SDHB.',
          'At the membrane anchor, ubiquinone accepts the 2 electrons and 2 H+ from the matrix, becoming ubiquinol.',
          'Ubiquinol diffuses through the membrane to Complex III. No protons are pumped.',
        ],
      },
    ],
    facts: [
      { label: 'Subunits', value: '4, all nuclear-encoded' },
      { label: 'Protons pumped', value: '0' },
      { label: 'ATP per electron pair', value: 'about 1.5' },
    ],
    sizeNm: [10, 12],
    realRate: 'Each succinate oxidation takes on the order of milliseconds',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; electron transfer is shown slowed.',
    references: ['lehninger-tca', 'lehninger-oxphos'],
  },
  {
    id: 'ubiquinone',
    parent: 'mitochondrion',
    name: 'Ubiquinone (coenzyme Q10)',
    category: 'lipid',
    summary:
      'Ubiquinone (coenzyme Q10) is a small, lipid-soluble electron carrier with a quinone head and a long isoprenoid tail that moves within the inner mitochondrial membrane.',
    function:
      'It collects electrons from Complexes I and II, and from other enzymes, and carries them to Complex III. It can accept one or two electrons, passing through a semiquinone radical, which lets it link two-electron donors to the one-electron carrier cytochrome c through the Q cycle.',
    structure: ['Quinone ring (the redox-active head)', 'Tail of 10 isoprene units in humans'],
    facts: [
      { label: 'Tail', value: '10 isoprene units (50 carbons)' },
      { label: 'Redox states', value: '3 (ubiquinone, semiquinone, ubiquinol)' },
      { label: 'Molar mass', value: 'about 863 g/mol' },
    ],
    sizeNm: [3, 5],
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size. Its tail lies within the hydrophobic core of the membrane, and only a few of the many copies are shown.',
    references: ['lehninger-oxphos'],
  },
  {
    id: 'complex-iii',
    parent: 'mitochondrion',
    name: 'Complex III (cytochrome bc1)',
    category: 'enzyme',
    summary:
      'Complex III (cytochrome bc1 complex) is a dimeric enzyme that passes electrons from ubiquinol to cytochrome c and moves protons by the Q cycle.',
    function:
      'It transfers electrons from ubiquinol, which carries two, to cytochrome c, which carries one. Through the Q cycle, 4 H+ are moved into the intermembrane space for every 2 electrons passed to cytochrome c, adding to the proton-motive force.',
    structure: [
      'Functional dimer, 11 subunits per monomer in mammals',
      'Cytochrome b (hemes bL and bH)',
      'Rieske iron-sulfur protein with a mobile head',
      'Cytochrome c1',
      'Qo and Qi quinone-binding sites',
    ],
    processes: [
      {
        id: 'q-cycle',
        name: 'Q cycle',
        steps: [
          'A ubiquinol binds the Qo site near the intermembrane space and gives 1 electron to the Rieske iron-sulfur center, releasing 2 H+ into the intermembrane space.',
          'That electron passes through cytochrome c1 to a cytochrome c molecule.',
          'The second electron travels through hemes bL and bH to a ubiquinone at the Qi site, forming a semiquinone.',
          'A second ubiquinol is oxidized at Qo in the same way, sending 1 electron to another cytochrome c and releasing 2 more H+; its other electron completes reduction of the semiquinone at Qi, which takes up 2 H+ from the matrix.',
          'Net per 2 electrons delivered to cytochrome c: 4 H+ released into the intermembrane space and 2 H+ taken from the matrix, with one ubiquinol oxidized overall.',
        ],
      },
    ],
    facts: [
      { label: 'Protons moved', value: '4 H+ per 2 electrons' },
      { label: 'Subunits', value: '11 per monomer (mammals), working as a dimer' },
      { label: 'Electron acceptor', value: 'cytochrome c, 1 electron at a time' },
    ],
    sizeNm: [12, 15],
    realRate: 'Each turn of the Q cycle takes on the order of milliseconds',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size. The two-step Q cycle is shown slowed and simplified, and the dimer is drawn as one block.',
    references: ['lehninger-oxphos'],
  },
  {
    id: 'cytochrome-c',
    parent: 'mitochondrion',
    name: 'Cytochrome c',
    category: 'membrane protein',
    summary:
      'Cytochrome c is a small, water-soluble heme protein in the intermembrane space that carries one electron at a time from Complex III to Complex IV.',
    function:
      'It moves along the outer surface of the inner membrane, binding Complex III to pick up an electron and Complex IV to deliver it. If mitochondria are damaged, cytochrome c released into the cytosol triggers apoptosis by assembling the apoptosome and activating caspase-9, a pathway involved in beta-cell death in diabetes.',
    structure: [
      'Single chain of 104 amino acids',
      'Covalently attached heme c',
      'Iron that alternates between Fe3+ and Fe2+',
      'Ring of positively charged lysines used for docking',
    ],
    facts: [
      { label: 'Length', value: '104 amino acids' },
      { label: 'Mass', value: 'about 12 kDa' },
      { label: 'Electrons carried per trip', value: '1' },
    ],
    sizeNm: [3, 3.5],
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size; real cytochrome c molecules are far more numerous and move much faster.',
    references: ['lehninger-oxphos', 'alberts-energy'],
  },
  {
    id: 'complex-iv',
    parent: 'mitochondrion',
    name: 'Complex IV (cytochrome c oxidase)',
    category: 'enzyme',
    summary:
      'Complex IV (cytochrome c oxidase) is the final enzyme of the respiratory chain; it takes electrons from cytochrome c and reduces O2 to water.',
    function:
      'It uses nearly all the oxygen a cell consumes. For every 2 electrons it pumps 2 H+ into the intermembrane space and uses 2 more H+ from the matrix to make water, and both add to the proton-motive force. Cyanide, carbon monoxide and azide inhibit it.',
    structure: [
      '13-14 subunits in mammals; the 3 core subunits are encoded by mtDNA',
      'CuA center (receives electrons)',
      'Heme a',
      'Binuclear center of heme a3 and CuB (where O2 is reduced)',
      'Proton pathways (D and K channels)',
    ],
    processes: [
      {
        id: 'o2-reduction',
        name: 'Oxygen reduction and proton pumping',
        steps: [
          'Reduced cytochrome c docks and gives 1 electron to the CuA center.',
          'The electron passes to heme a and then to the heme a3-CuB center.',
          'O2 binds heme a3 and is reduced through a series of bound intermediates as more electrons arrive.',
          'For every 4 electrons, one O2 and 4 H+ taken from the matrix form 2 H2O, and 4 more H+ are pumped across the membrane.',
          'Per 2 electrons, therefore, 2 H+ are pumped and 2 H+ are consumed chemically from the matrix.',
        ],
      },
    ],
    facts: [
      { label: 'Overall reaction', value: '4 cyt c(red) + 8 H+(matrix) + O2 → 4 cyt c(ox) + 4 H+(intermembrane space) + 2 H2O' },
      { label: 'Per 2 electrons', value: '2 H+ pumped, 2 H+ consumed' },
      { label: 'Metal centers', value: 'CuA, heme a, heme a3, CuB' },
    ],
    sizeNm: [10, 13],
    realRate: 'Each O2 is reduced to water within milliseconds',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; the stepwise reduction of O2 is simplified to a single animated event.',
    references: ['lehninger-oxphos'],
  },
  {
    id: 'atp-synthase',
    parent: 'mitochondrion',
    name: 'ATP synthase',
    category: 'molecular machine',
    summary:
      'ATP synthase (Complex V) is a rotary motor in the inner mitochondrial membrane that uses the flow of protons to make ATP from ADP and phosphate.',
    function:
      'Protons flowing down their electrochemical gradient turn the membrane rotor (F0), and the rotation drives ATP synthesis in the F1 head by the binding-change mechanism. In mammals the rotor ring has 8 c subunits, so about 2.7 H+ pass through per ATP made. In the beta cell, the ATP it makes is what closes K_ATP channels after a meal.',
    structure: [
      'F0 c8 ring (the rotor in the membrane)',
      'Subunit a (two proton half-channels)',
      'Central stalk (gamma, delta, epsilon)',
      'F1 head: alpha3 beta3 hexamer, with catalytic sites on the beta subunits',
      'Peripheral stalk (the stator)',
      'Dimers that bend the cristae',
    ],
    processes: [
      {
        id: 'rotary-catalysis',
        name: 'Rotary catalysis (binding change)',
        steps: [
          'A proton enters a half-channel in subunit a from the intermembrane space and neutralizes a glutamate on one c subunit.',
          'The neutralized c subunit can now face the lipid bilayer, so the c ring rotates by one step.',
          'After nearly a full turn, that c subunit reaches the second half-channel and releases its proton into the matrix.',
          'The central stalk turns with the c ring inside the alpha3 beta3 head, which is held still by the peripheral stalk.',
          'Each 120 degree turn shifts the three beta subunits through their open, loose and tight states: one releases ATP, one binds ADP and phosphate, and one makes ATP.',
          'One full turn uses 8 H+ and releases 3 ATP, about 2.7 H+ per ATP.',
        ],
      },
    ],
    facts: [
      { label: 'c-ring size (mammals)', value: '8 c subunits' },
      { label: 'ATP per rotation', value: '3' },
      { label: 'H+ per ATP', value: 'about 2.7 (about 3.7 counting phosphate import)' },
      { label: 'Mass', value: 'about 600 kDa' },
    ],
    sizeNm: [20, 25],
    realRate: 'about 100-150 rotations per second',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size. Rotation is slowed by a large factor so the three catalytic states can be followed, and only a few of the many synthases are shown.',
    references: ['boyer-1997', 'lehninger-oxphos'],
  },
  {
    id: 'ant',
    parent: 'mitochondrion',
    name: 'Adenine nucleotide translocase',
    category: 'membrane protein',
    summary:
      'The adenine nucleotide translocase (ADP/ATP carrier) is an inner-membrane antiporter that exchanges ATP made in the matrix for ADP from the cytosol.',
    function:
      'It exports each new ATP in exchange for one ADP, supplying the cytosol with ATP and ATP synthase with ADP. Because ATP carries one more negative charge than ADP, the exchange is driven by the membrane potential. In beta cells, this export is the step that turns mitochondrial ATP production into the rising cytosolic ATP/ADP ratio sensed by K_ATP channels.',
    structure: [
      'Six transmembrane helices in three repeats',
      'Central substrate-binding cavity',
      'Matrix and cytoplasmic gates formed by salt-bridge networks',
      'Tightly bound cardiolipin',
    ],
    processes: [
      {
        id: 'adp-atp-exchange',
        name: 'ADP/ATP exchange',
        steps: [
          'Open toward the intermembrane space, the carrier binds ADP3- in its central cavity.',
          'It switches to the matrix-open state and releases ADP into the matrix.',
          'ATP4- from the matrix binds the cavity.',
          'The carrier switches back and releases ATP into the intermembrane space, from where it leaves through VDAC.',
          'Each exchange exports one net negative charge, so it spends part of the membrane potential.',
        ],
      },
    ],
    facts: [
      { label: 'Exchange', value: '1 ATP4- out for 1 ADP3- in' },
      { label: 'Mass', value: 'about 32 kDa' },
      { label: 'Inhibitors', value: 'atractyloside and bongkrekic acid' },
    ],
    sizeNm: [4, 5],
    realRate: 'Each exchange takes on the order of milliseconds',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; its opening and closing are exaggerated and slowed.',
    references: ['lehninger-oxphos'],
  },

  // ---------- Lysosome components ----------
  {
    id: 'v-atpase',
    parent: 'lysosome',
    name: 'V-ATPase',
    category: 'molecular machine',
    summary:
      'The V-ATPase is a rotary proton pump that uses ATP to acidify lysosomes, endosomes, the Golgi and secretory granules.',
    function:
      'It pumps H+ into the lumen, holding lysosomes at about pH 4.5-5 and insulin granules at about pH 5.5. In insulin granules this acidity activates the prohormone convertases that turn proinsulin into insulin. Its structure resembles ATP synthase running in reverse.',
    structure: [
      'V1 domain (cytosolic, with an A3B3 catalytic hexamer)',
      'V0 domain (membrane, with a ring of proteolipid c subunits)',
      'Central rotor stalk',
      'Peripheral stator stalks',
      'Subunit a (proton pathway)',
    ],
    processes: [
      {
        id: 'v-atpase-pumping',
        name: 'Rotary proton pumping',
        steps: [
          'ATP binds and is hydrolysed at the three catalytic A subunits of V1 in turn.',
          'Hydrolysis drives rotation of the central stalk and the attached c ring in V0.',
          'As the ring turns, each c subunit picks up a proton from the cytosol through a half-channel in subunit a.',
          'After nearly a full turn, the proton is released into the lumen through a second half-channel.',
          'Anions such as Cl- move in alongside, so the pump can build a large pH gradient.',
          'The cell can switch the pump off by detaching V1 from V0.',
        ],
      },
    ],
    facts: [
      { label: 'Mass', value: 'about 1 MDa' },
      { label: 'Lysosomal pH maintained', value: 'about 4.5-5' },
      { label: 'Insulin granule pH maintained', value: 'about 5.5' },
    ],
    sizeNm: [25, 30],
    realRate: 'Each pump moves on the order of tens to hundreds of protons per second',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; rotation is slowed and only a few pumps are shown.',
    references: ['alberts-traffic', 'alberts-transport'],
  },
  {
    id: 'acid-hydrolase',
    parent: 'lysosome',
    name: 'Acid hydrolases',
    category: 'enzyme',
    summary:
      'Acid hydrolases are the digestive enzymes of the lysosome, including proteases, nucleases, lipases, glycosidases, phosphatases and sulfatases, that work best at acidic pH.',
    function:
      'They break proteins, nucleic acids, lipids and sugars down into small building blocks for reuse. Because they are most active at pH 4.5-5 and much less active at the near-neutral pH of the cytosol, enzymes leaking from a damaged lysosome do limited harm. Cathepsins, the main lysosomal proteases, digest proteins such as the insulin delivered by crinophagy.',
    structure: [
      'Mannose 6-phosphate tags (used for delivery from the Golgi)',
      'Glycosylated, acid-stable surfaces',
      'Active sites suited to acidic pH',
    ],
    facts: [
      { label: 'Number of types', value: 'more than 40 (recent counts exceed 60)' },
      { label: 'Optimum pH', value: 'about 4.5-5' },
    ],
    sizeNm: [4, 10],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a few generic enzymes; a real lysosome contains many copies of dozens of different hydrolases.',
    references: ['alberts-traffic'],
  },
  {
    id: 'lamp',
    parent: 'lysosome',
    name: 'LAMP proteins',
    category: 'membrane protein',
    summary:
      'LAMPs (lysosome-associated membrane proteins 1 and 2) are heavily glycosylated proteins that make up much of the protein in the lysosomal membrane.',
    function:
      'Their dense sugar coat lines the inner face of the lysosomal membrane and protects it from the hydrolases inside. LAMP2 is also needed for lysosomes to fuse with autophagosomes, and one form, LAMP2A, is the receptor for chaperone-mediated autophagy.',
    structure: [
      'Large, heavily N-glycosylated lumenal domain',
      'Single transmembrane helix',
      'Short cytosolic tail with a lysosome-targeting signal',
    ],
    facts: [
      { label: 'Apparent mass of LAMP1', value: 'about 110-120 kDa, from a protein core of about 40 kDa' },
      { label: 'Transmembrane helices', value: '1' },
    ],
    sizeNm: [10, 15],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size, with the sugar coat shown as a soft fuzz rather than individual glycan chains.',
    references: ['alberts-traffic'],
  },

  // ---------- Peroxisome components ----------
  {
    id: 'catalase',
    parent: 'peroxisome',
    name: 'Catalase',
    category: 'enzyme',
    summary: 'Catalase is a heme enzyme of four identical subunits, found in the peroxisomal matrix, that breaks hydrogen peroxide down into water and oxygen.',
    function:
      'It removes the H2O2 made by peroxisomal oxidases before it can damage the cell. It can also use H2O2 to oxidize small molecules such as ethanol and formaldehyde. Beta cells make unusually little catalase, which makes them sensitive to H2O2.',
    structure: [
      'Four identical subunits',
      'One heme per subunit',
      'One bound NADPH per subunit (protects against inactivation)',
      'Narrow channel leading to each heme',
    ],
    processes: [
      {
        id: 'catalase-cycle',
        name: 'Breaking down H2O2',
        steps: [
          'A first H2O2 enters the channel and oxidizes the heme iron, forming Compound I and releasing H2O.',
          'A second H2O2 reduces Compound I back to the resting enzyme, releasing O2 and H2O.',
          'Net reaction: 2 H2O2 → 2 H2O + O2.',
          'When H2O2 is scarce and substrates such as ethanol are present, Compound I can oxidize them instead.',
        ],
      },
    ],
    facts: [
      { label: 'Reaction', value: '2 H2O2 → 2 H2O + O2' },
      { label: 'Turnover', value: 'up to about 4 × 10^7 per second' },
      { label: 'Mass', value: 'about 240 kDa (tetramer)' },
      { label: 'Hemes', value: '4' },
    ],
    sizeNm: [9, 10],
    realRate: 'up to about 40 million H2O2 molecules per second per enzyme',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size. Its real speed is far too fast to show, so each reaction is slowed to a visible pulse.',
    references: ['lehninger-fatty-acids'],
  },
  {
    id: 'acyl-coa-oxidase',
    parent: 'peroxisome',
    name: 'Acyl-CoA oxidase',
    category: 'enzyme',
    summary:
      'Acyl-CoA oxidase 1 (ACOX1) carries out the first step of peroxisomal beta-oxidation, creating a double bond in a fatty acyl-CoA.',
    function:
      'It oxidizes very-long-chain and other straight-chain fatty acyl-CoAs, passing electrons from its FAD directly to O2 to make H2O2, rather than into the respiratory chain as the mitochondrial enzyme does. That is why peroxisomal beta-oxidation captures less of the energy as ATP and why catalase is needed alongside it. Loss of ACOX1 causes a severe inherited disorder.',
    structure: ['Dimer of two subunits', 'FAD in each active site', 'C-terminal SKL targeting signal (PTS1)'],
    processes: [
      {
        id: 'acox-reaction',
        name: 'First step of peroxisomal beta-oxidation',
        steps: [
          'A fatty acyl-CoA binds the active site next to oxidized FAD.',
          'FAD removes two hydrogens from carbons 2 and 3, forming trans-delta2-enoyl-CoA and FADH2.',
          'FADH2 is reoxidized directly by O2, producing H2O2.',
          'The enoyl-CoA moves on to the next enzymes of the pathway, and catalase destroys the H2O2.',
        ],
      },
    ],
    facts: [
      { label: 'Reaction', value: 'acyl-CoA + O2 → trans-2-enoyl-CoA + H2O2' },
      { label: 'Import signal', value: 'C-terminal Ser-Lys-Leu (SKL)' },
      { label: 'Preferred substrates', value: 'straight-chain acyl-CoAs, including those of 22 or more carbons' },
    ],
    sizeNm: [8, 12],
    realRate: 'Each turnover takes a fraction of a second; it is the slow, controlling step of the pathway',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; the fatty acid chain is drawn shorter than a real very-long-chain fatty acid.',
    references: ['lehninger-fatty-acids'],
  },

  // ---------- Endosome components ----------
  {
    id: 'early-endosome',
    parent: 'endosome',
    name: 'Early endosome',
    category: 'compartment',
    summary: 'An early endosome is the first sorting station for material taken in by endocytosis, located mostly near the cell periphery.',
    function:
      'In its mildly acidic lumen (about pH 6-6.5), many ligands detach from their receptors. Receptors are sent back to the surface in tubules, while cargo for degradation stays in the main body. It is marked by Rab5 and the lipid PI(3)P, which recruit the tether EEA1 and other fusion proteins.',
    structure: ['Vacuolar body', 'Tubular extensions for recycling', 'Rab5 and PI(3)P on the surface', 'EEA1 tethers', 'V-ATPase pumps'],
    processes: [
      {
        id: 'early-sorting',
        name: 'Early sorting',
        steps: [
          'Endocytic vesicles carrying Rab5 fuse with the early endosome, aided by the tether EEA1.',
          'Acidification by the V-ATPase releases ligands, such as LDL, from their receptors.',
          'Freed receptors gather in narrow tubules, which bud off and return to the plasma membrane.',
          'Ubiquitin-tagged receptors meant for destruction are captured by ESCRT-0 and kept in the vacuolar body.',
          'The vacuolar body moves inward along microtubules and begins converting into a late endosome.',
        ],
      },
    ],
    facts: [
      { label: 'Lumenal pH', value: 'about 6-6.5' },
      { label: 'Identity marker', value: 'Rab5' },
      { label: 'Diameter', value: 'about 100-500 nm' },
    ],
    sizeNm: [100, 500],
    realRate: 'Receptors can recycle back to the surface within a few minutes',
    accuracy: 'Drawn as a rounded vesicle with a few short tubules. Real early endosomes are irregular, and their tubules are longer and more numerous.',
    references: ['alberts-traffic'],
  },
  {
    id: 'late-endosome',
    parent: 'endosome',
    name: 'Late endosome (multivesicular body)',
    category: 'compartment',
    summary:
      'A late endosome, or multivesicular body, is a more acidic endosome filled with small internal vesicles that carries cargo on to lysosomes.',
    function:
      'It holds membrane proteins destined for destruction inside its internal vesicles, receives new lysosomal enzymes from the Golgi, and fuses with lysosomes to deliver its contents for digestion. It is marked by Rab7 and has a lumen of about pH 5-5.5.',
    structure: ['Limiting membrane', 'Intraluminal vesicles', 'Rab7 on the surface', 'ESCRT machinery'],
    processes: [
      {
        id: 'mvb-formation',
        name: 'Multivesicular body formation',
        steps: [
          'ESCRT-0 binds ubiquitin-tagged cargo on the limiting membrane.',
          'ESCRT-I and ESCRT-II gather the cargo and begin bending the membrane inward, away from the cytosol.',
          'ESCRT-III polymerizes in the neck of the bud and cuts it, releasing an intraluminal vesicle; the ATPase Vps4 then recycles ESCRT-III.',
          'Rab7 replaces Rab5, and the lumen acidifies to about pH 5-5.5.',
          'The late endosome fuses with a lysosome, fully or briefly, forming an endolysosome where digestion begins.',
        ],
      },
    ],
    facts: [
      { label: 'Lumenal pH', value: 'about 5-5.5' },
      { label: 'Identity marker', value: 'Rab7' },
      { label: 'Intraluminal vesicle diameter', value: 'about 40-100 nm' },
    ],
    sizeNm: [250, 1000],
    realRate: 'Maturation from early to late endosome takes from several minutes to tens of minutes',
    accuracy: 'Drawn with a handful of internal vesicles; real multivesicular bodies can contain dozens.',
    references: ['alberts-traffic'],
  },

  // ---------- Autophagosome components ----------
  {
    id: 'lc3',
    parent: 'autophagosome',
    name: 'LC3',
    category: 'membrane protein',
    summary:
      'LC3 (MAP1LC3) is a small ubiquitin-like protein that becomes attached to the lipid phosphatidylethanolamine on autophagosome membranes.',
    function:
      'Lipid-linked LC3 (LC3-II) helps the phagophore membrane grow and close, and it binds cargo receptors such as p62, optineurin and NDP52 through their LC3-interacting regions, tying cargo to the growing membrane. Because it stays on autophagosomes, LC3-II is the standard marker used to count them.',
    structure: [
      'Ubiquitin-like fold',
      'N-terminal helices',
      'Hydrophobic pockets that bind LC3-interacting motifs',
      'C-terminal glycine, where the lipid is attached after processing',
    ],
    processes: [
      {
        id: 'lc3-lipidation',
        name: 'LC3 lipidation',
        steps: [
          'The protease ATG4 cuts newly made LC3 just after a C-terminal glycine, producing LC3-I.',
          'ATG7, which works like an E1 enzyme, activates LC3-I using ATP and passes it to ATG3, which works like an E2.',
          'The ATG12-ATG5-ATG16L1 complex on the phagophore directs ATG3 to join LC3’s glycine to phosphatidylethanolamine, forming LC3-II.',
          'LC3-II on the membrane binds cargo receptors carrying ubiquitinated cargo, such as a damaged mitochondrion.',
          'After the autophagosome closes, ATG4 removes LC3 from the outer membrane, while LC3 on the inner membrane is digested in the autolysosome.',
        ],
      },
    ],
    facts: [
      { label: 'LC3B length', value: '125 amino acids' },
      { label: 'Apparent mass', value: 'about 16 kDa (LC3-I), about 14 kDa (LC3-II) on gels' },
      { label: 'Lipid partner', value: 'phosphatidylethanolamine' },
    ],
    sizeNm: [3, 4],
    realRate: 'LC3 lipidation and phagophore growth take place over a few minutes',
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size and far less densely packed than on a real autophagosome membrane.',
    references: ['alberts-traffic'],
  },

  // ---------- Proteasome components ----------
  {
    id: 'core-20s',
    parent: 'proteasome',
    name: '20S core particle',
    category: 'enzyme',
    summary:
      'The 20S core particle is the barrel-shaped catalytic chamber of the proteasome, built from four stacked rings of seven subunits.',
    function:
      'Its two outer alpha rings form a gate that admits only unfolded chains, and its two inner beta rings carry six protease sites facing the inside, so proteins are cut only within the chamber. The three kinds of active site (beta1, beta2, beta5) cut after acidic, basic and hydrophobic amino acids, respectively. The cancer drug bortezomib inhibits the beta5 site.',
    structure: [
      'Two outer alpha rings (alpha1-7, forming the gate)',
      'Two inner beta rings (beta1-7)',
      'Six active sites: two each on beta1, beta2 and beta5',
      'N-terminal threonine at each active site',
      'Central degradation chamber',
    ],
    facts: [
      { label: 'Subunits', value: '28 (four rings of seven)' },
      { label: 'Dimensions', value: 'about 15 nm long and 11 nm wide' },
      { label: 'Active sites', value: '6' },
    ],
    sizeNm: [11, 15],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size as a smooth barrel; the real particle has a ridged surface of 28 subunits.',
    references: ['alberts-proteins'],
  },
  {
    id: 'cap-19s',
    parent: 'proteasome',
    name: '19S regulatory particle',
    category: 'molecular machine',
    summary:
      'The 19S regulatory particle is the cap that recognizes ubiquitin-tagged proteins, removes their ubiquitin, unfolds them and feeds them into the 20S core.',
    function:
      'Ubiquitin receptors (Rpn1, Rpn10 and Rpn13) bind polyubiquitin chains, Rpn11 removes the chains for reuse, and a ring of six AAA+ ATPases (Rpt1-6) uses ATP to unfold the target and open the core’s gate. One or two caps can bind each core.',
    structure: [
      'Lid subcomplex, including the deubiquitinase Rpn11',
      'Base with six AAA+ ATPases (Rpt1-6)',
      'Ubiquitin receptors Rpn1, Rpn10 and Rpn13',
    ],
    facts: [
      { label: 'Subunits', value: 'about 19' },
      { label: 'ATPase ring', value: '6 subunits' },
      { label: 'Caps per core', value: '1 or 2' },
    ],
    sizeNm: [15, 20],
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size with its many subunits merged into a simple cap.',
    references: ['alberts-proteins'],
  },
  {
    id: 'ubiquitin',
    parent: 'proteasome',
    name: 'Ubiquitin',
    category: 'complex',
    summary: 'Ubiquitin is a small, highly conserved protein of 76 amino acids that is attached to other proteins as a tag.',
    function:
      'Chains of ubiquitin linked through lysine 48 mark proteins for destruction by the proteasome, while other linkages, such as through lysine 63, and single ubiquitins signal endocytosis, DNA repair or kinase activation. In beta cells, ubiquitination clears misfolded proinsulin removed from the ER by ER-associated degradation.',
    structure: [
      'Compact beta-grasp fold',
      'Seven lysines (K6, K11, K27, K29, K33, K48, K63) used to build chains',
      'N-terminal methionine (used for linear chains)',
      'C-terminal glycine-glycine (the attachment point)',
    ],
    processes: [
      {
        id: 'ubiquitination',
        name: 'Ubiquitin tagging',
        steps: [
          'An E1 enzyme uses ATP to activate ubiquitin’s C-terminal glycine and links it to its own active-site cysteine.',
          'Ubiquitin is passed to the cysteine of an E2 conjugating enzyme.',
          'An E3 ligase binds both the E2 and a specific target protein, and ubiquitin is joined to a lysine on the target.',
          'Further ubiquitins are added to lysine 48 of the previous one, building a chain.',
          'A chain of four or more ubiquitins is recognized by the proteasome, and deubiquitinating enzymes recycle the ubiquitin.',
        ],
      },
    ],
    facts: [
      { label: 'Length', value: '76 amino acids' },
      { label: 'Mass', value: 'about 8.6 kDa' },
      { label: 'Human E3 ligases', value: 'about 600' },
      { label: 'Proteasome signal', value: 'chain of 4 or more, usually linked through lysine 48' },
    ],
    sizeNm: [2.5, 3],
    realRate: 'A ubiquitin chain can be built on a target within seconds',
    enlargement: 6,
    accuracy: 'Drawn 6 times larger than true size; the E1, E2 and E3 enzymes are shown as simple shapes.',
    references: ['alberts-proteins'],
  },

  // ---------- Transport vesicle components ----------
  {
    id: 'copii-vesicle',
    parent: 'vesicle',
    name: 'COPII vesicle',
    category: 'vesicle',
    summary: 'A COPII-coated vesicle carries newly made proteins from ER exit sites toward the Golgi.',
    function:
      'Its coat selects cargo such as proinsulin, helped by cargo receptors, and leaves ER-resident proteins behind. After shedding its coat, it fuses with other carriers to form the ER-Golgi intermediate compartment.',
    structure: ['Sar1 GTPase', 'Inner coat Sec23/Sec24', 'Outer cage Sec13/Sec31', 'Cargo receptors (for example ERGIC-53)'],
    processes: [
      {
        id: 'copii-cycle',
        name: 'COPII transport',
        steps: [
          'Sar1-GTP on the ER membrane recruits Sec23/Sec24, which binds cargo.',
          'Sec13/Sec31 assembles into an outer cage, curving the membrane into a bud.',
          'The vesicle buds free, about 60-90 nm across.',
          'Sar1 hydrolyses its GTP and the coat falls away.',
          'The vesicle tethers to and fuses, through SNAREs, with the ER-Golgi intermediate compartment.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 60-90 nm' },
      { label: 'Coat layers', value: '2 (Sec23/24 inner, Sec13/31 outer)' },
    ],
    sizeNm: [60, 90],
    realRate: 'Cargo reaches the Golgi within minutes of leaving the ER',
    accuracy: 'Drawn as a neat sphere with a regular coat; many COPII carriers are irregular, and some cargo leaves in tubules.',
    references: ['alberts-traffic'],
  },
  {
    id: 'copi-vesicle',
    parent: 'vesicle',
    name: 'COPI vesicle',
    category: 'vesicle',
    summary: 'A COPI-coated vesicle carries material backward, from the Golgi to the ER and between Golgi cisternae.',
    function:
      'It returns escaped ER-resident proteins, recognized by their KDEL or KKXX signals, to the ER, and in the cisternal maturation model it carries Golgi enzymes back to younger cisternae. Its coat is built by the small GTPase Arf1 and coatomer, a complex of seven subunits.',
    structure: ['Arf1 GTPase', 'Coatomer (7 subunits)', 'KDEL receptors', 'Cargo with KKXX signals'],
    processes: [
      {
        id: 'copi-cycle',
        name: 'COPI retrieval',
        steps: [
          'An exchange factor loads GTP onto Arf1, which inserts into the Golgi membrane.',
          'Arf1-GTP recruits coatomer as a preassembled unit.',
          'Coatomer binds KKXX signals on membrane proteins directly, and KDEL receptors carrying lumenal KDEL proteins.',
          'The coat curves the membrane and the vesicle buds off.',
          'GTP hydrolysis on Arf1 releases the coat, and the vesicle fuses with its target, such as the ER.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 60-80 nm' },
      { label: 'Coatomer subunits', value: '7' },
      { label: 'Retrieval signals', value: 'KDEL (lumenal proteins), KKXX (membrane proteins)' },
    ],
    sizeNm: [60, 80],
    realRate: 'COPI vesicles bud and recycle continuously, each in seconds to tens of seconds',
    accuracy: 'Drawn as a neat sphere with a regular coat; real coatomer forms a less ordered lattice.',
    references: ['alberts-traffic'],
  },
  {
    id: 'clathrin-vesicle',
    parent: 'vesicle',
    name: 'Clathrin-coated vesicle',
    category: 'vesicle',
    summary:
      'A clathrin-coated vesicle is a transport vesicle wrapped in a basket of clathrin, formed at the plasma membrane, the trans-Golgi network and endosomes.',
    function:
      'At the plasma membrane, with the adaptor AP2, it carries receptors and their ligands into the cell; at the trans-Golgi network, with AP-1 and GGAs, it carries lysosomal enzymes bound to M6P receptors to endosomes. In beta cells, clathrin-coated vesicles also remove unwanted proteins from immature insulin granules as they mature.',
    structure: [
      'Clathrin cage of hexagons and pentagons',
      'Adaptor proteins (AP2 at the plasma membrane, AP-1 and GGAs at the trans-Golgi network)',
      'Cargo receptors',
      'Membrane vesicle inside the cage',
    ],
    processes: [
      {
        id: 'clathrin-cycle',
        name: 'Clathrin coating and uncoating',
        steps: [
          'Adaptor proteins bind cargo sorting signals and phosphoinositide lipids on the donor membrane.',
          'Clathrin triskelions assemble into a cage of hexagons and pentagons, curving the membrane.',
          'Dynamin cuts the neck using GTP.',
          'Hsc70 and auxilin use ATP to take the coat apart within seconds.',
          'The uncoated vesicle fuses with its target, for example an early endosome.',
        ],
      },
    ],
    facts: [
      { label: 'Diameter', value: 'about 60-120 nm' },
      { label: 'Triskelion', value: '3 heavy chains + 3 light chains' },
      { label: 'Uncoating', value: 'within seconds of budding' },
    ],
    sizeNm: [60, 150],
    realRate: 'Forming a vesicle takes roughly 20-100 seconds; uncoating takes seconds',
    accuracy: 'Drawn with a perfectly regular cage; real clathrin coats are less symmetric and vary in size.',
    references: ['alberts-traffic'],
  },

  // ---------- Insulin granule components ----------
  {
    id: 'insulin-hexamer',
    parent: 'insulin-granule',
    name: 'Zn2+-insulin hexamer',
    category: 'complex',
    summary:
      'The insulin hexamer is the storage form of insulin: six insulin molecules arranged around two Zn2+ ions, packed in very large numbers into the crystalline core of the granule.',
    function:
      'Hexamer formation and crystallization let the granule store insulin at very high density and protect it from degradation. After exocytosis, the neutral pH outside and dilution make the hexamers fall apart into dimers and then active monomers, which bind the insulin receptor. Each insulin monomer has an A chain of 21 amino acids and a B chain of 30, joined by two disulfide bonds, with a third disulfide inside the A chain.',
    structure: [
      'Six insulin monomers (three dimers)',
      'Two Zn2+ ions, each held by three B10 histidines',
      'A chain (21 amino acids)',
      'B chain (30 amino acids)',
      'Three disulfide bonds per monomer',
    ],
    facts: [
      { label: 'Insulin monomer', value: '51 amino acids, about 5.8 kDa' },
      { label: 'Hexamer', value: '6 insulin + 2 Zn2+, about 35 kDa' },
      { label: 'Hexamer diameter', value: 'about 5 nm' },
    ],
    sizeNm: [5, 6],
    accuracy:
      'The crystalline core is drawn as a solid, dense body. The individual hexamers that make it up are only about 5 nm across and far too small to see at this scale.',
    references: ['lehninger-hormones'],
  },
  {
    id: 'prohormone-convertase',
    parent: 'insulin-granule',
    name: 'Prohormone convertases (PC1/3 and PC2)',
    category: 'enzyme',
    summary:
      'Prohormone convertases PC1/3 and PC2 are calcium-dependent serine proteases of the subtilisin family that cut proinsulin inside maturing granules.',
    function:
      'PC1/3 cleaves proinsulin mainly at the junction between the B chain and C-peptide, and PC2 mainly at the junction between C-peptide and the A chain, each cutting after a pair of basic amino acids. Both work best at the acidic pH and high Ca2+ of immature granules. Carboxypeptidase E then trims the leftover basic residues to give mature insulin and C-peptide.',
    structure: [
      'Prodomain (removed when the enzyme is activated)',
      'Catalytic domain with an Asp-His-Ser triad',
      'P domain (needed for folding and stability)',
      'C-terminal domain (helps sort the enzyme to granules)',
    ],
    processes: [
      {
        id: 'proinsulin-cleavage',
        name: 'Proinsulin to insulin',
        steps: [
          'PC1/3 and PC2 are made as inactive precursors; PC2 needs the helper protein 7B2 to mature.',
          'As immature granules acidify toward about pH 5.5 and fill with Ca2+, the convertases become active.',
          'PC1/3 cuts after Arg31-Arg32, at the junction of the B chain and C-peptide.',
          'PC2 cuts after Lys64-Arg65, at the junction of C-peptide and the A chain.',
          'Carboxypeptidase E removes the exposed basic residues, leaving insulin (A and B chains joined by disulfides) and C-peptide in equal amounts.',
        ],
      },
    ],
    facts: [
      { label: 'PC1/3 cleavage site', value: 'after Arg31-Arg32 (B chain/C-peptide junction)' },
      { label: 'PC2 cleavage site', value: 'after Lys64-Arg65 (C-peptide/A chain junction)' },
      { label: 'Optimal conditions', value: 'acidic pH (about 5.5) and millimolar Ca2+' },
    ],
    sizeNm: [5, 8],
    realRate: 'Converting a granule’s proinsulin takes on the order of an hour',
    enlargement: 4,
    accuracy: 'Drawn 4 times larger than true size; cleavage of each proinsulin is shown as a quick, slowed-down event rather than a gradual process across the granule.',
    references: ['lehninger-hormones', 'alberts-traffic'],
  },
];
