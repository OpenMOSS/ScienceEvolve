---
name: sci-immune-structural-interface-mechanism-workflow-961c6039
description: End-to-end workflow to map binding interfaces, predict hotspots and structural motifs, and validate mechanistic hypotheses through targeted perturbation and orthogonal structural and functional readouts.
scienceevolve-title: "Antibody and immune recognition · structural interface mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Synthesize a reusable, domain-agnostic workflow for mapping and validating structural binding interfaces—such as antibody–antigen, receptor–ligand, or MHC–peptide systems. The workflow generates falsifiable mechanistic hypotheses about interface hotspots, epitopes, paratopes, and functional motifs; prioritizes candidate sites via multi-method cross-validation; and designs non-operational validation plans with orthogonal structural and functional readouts.

# When to use

Use this workflow when:
- A candidate interacting system is available with sequence and/or structural data, and the goal is to explain binding, specificity, escape, cross-reactivity, or functional modulation through interface-level mechanisms.
- The user needs to identify core hotspots, edge contacts, shielding sites, conformation-sensitive regions, or structural motifs that may drive recognition.
- The task requires migrating methodological patterns to new homologous systems rather than replicating a specific paper’s objects or numerical conditions.
- The objective is hypothesis generation, evidence grading, and research design, not clinical diagnosis, treatment recommendation, or executable laboratory protocol generation.

Do not use when:
- No sequence or structural information is available and cannot be reasonably modeled.
- The task is limited to literature summarization, terminology explanation, or result repetition without new hypothesis generation.
- The user requests clinical advice, patient management, directly executable wet-lab steps, hazardous protocols, or fabrication parameters.

# Inputs required

Before starting, collect and document:

- **Candidate systems**: identities and functional roles of interacting molecules; known binding, weak-binding, or non-binding relationships.
- **Sequence and variation data**: sequences, variants, lineage information, conservation profiles, and functional annotations.
- **Structural data**: experimental structures, predicted models, or docking models, with an assessment of confidence, resolution, or predicted accuracy.
- **Interface definition**: known epitopes/paratopes, computed interface residues, spatial distance rules, or experimental interface evidence.
- **Comparator systems**: at least one positive control (known strong interaction or key site), one negative control (weak/non-interface), and one structural neighbor with a different functional outcome.
- **Study objective**: the specific research question, acceptable evidence tiers, and intended downstream validation boundaries.
- **Constraints and uncertainties**: model quality limits, potential post-translational modifications, conformational variability, glycosylation shielding, solvent effects, and safety/ethics boundaries.

If structural data are missing or unreliable, downgrade the workflow to sequence-based hypothesis generation and explicitly flag that energetic or spatial conclusions cannot be drawn.

# Core Workflow

Execute the following phases in order. At each decision gate, pause, evaluate, and only proceed if the pass criteria are met; otherwise, iterate or stop.

## Phase 1: Problem definition and interface mapping
1. Frame the biological difference (e.g., binding vs. non-binding, escape, affinity shift, cross-recognition) as an interface-level question.
2. Align sequences and superimpose structures to map variants or candidate residues onto the defined interface.
3. **Decision Gate 1 (Mapping quality)**: Are candidates locatable on the interface with confidence?  
   - *No / uncertain*: Stop spatial inference; reformulate as a sequence-level or modeling-gap hypothesis and list required data.

## Phase 2: Candidate pooling and role classification
1. Derive a candidate pool from sequence variation, conservation gaps, contact networks, burial/exposure metrics, and known functional clues.
2. Classify each candidate by putative interface role: core hotspot, edge contact, potential shielding site, conformation-sensitive site, or non-interface background.
3. **Decision Gate 2 (Candidate relevance)**: Does the pool contain interface-mapped candidates?  
   - *No*: Reassess the interface definition or structural model before proceeding.

## Phase 3: Hypothesis generation and evidence grading
1. Formulate falsifiable mechanistic hypotheses linking specific interface features to observed binding or functional outcomes.
2. Grade evidence strength per hypothesis:
   - **High**: consistent across ≥2 independent evidence types and supported by control discrimination.
   - **Medium**: structural evidence exists but methods disagree, or only one strong evidence line is available.
   - **Low**: relies primarily on sequence similarity, single-model prediction, or homology transfer without interface localization.
3. Explicitly list key assumptions (model reliability, interface definition accuracy, absence of dominant allosteric effects) and failure modes (model error, shielding, conformational rearrangement, non-specific effects).
4. **Decision Gate 3 (Hypothesis viability)**: Are there testable hypotheses with at least Low evidence and defined failure modes?  
   - *No*: Stop and request additional data or reformulate the research question.

## Phase 4: Validation design with tiered controls
1. **Localization/screening layer**: define candidate fragments or sites against adjacent non-candidate regions; estimate background signal.
2. **Specificity layer**: design comparisons against related decoys, irrelevant decoys, and competing ligands/epitopes.
3. **Perturbation layer**: plan targeted changes with parallel monitoring of structural integrity to separate specific interface effects from global unfolding.
4. Define mandatory controls:
   - **Positive control**: known strong binder or established key interface site to confirm pipeline sensitivity.
   - **Negative control**: non-interface region or known weak-effect site to estimate false-positive background.
   - **Specificity/strong control**: structural neighbor or related molecule with a different outcome to test whether the mechanism explains differences rather than merely detecting conserved interfaces.
   - **Quality control**: folding, expression, aggregation, or structural stability checks to exclude artifactual readouts.
5. **Decision Gate 4 (Control readiness)**: Are positive and negative controls predicted to be discriminable?  
   - *No*: Halt and recalibrate the interface definition, alignment, or prediction pipeline.

## Phase 5: Multi-method cross-validation
1. Apply at least two independent analysis methods (e.g., energy/geometry-based, contact-network, evolutionary coupling, or independent predictive models) to rank candidates.
2. Compare rankings across methods and across comparator systems.
3. **Decision Gate 5 (Convergence)**: Do independent methods agree on top candidates, or can disagreements be reconciled by a mechanistic explanation?  
   - *Irreconcilable conflict*: Downgrade confidence to Low, flag the conflict, and require additional orthogonal data before proceeding.

## Phase 6: Mechanistic interpretation and spatial mapping
1. Interpret convergent candidates through structural mechanisms (contact networks, burial changes, solvent accessibility shifts, electrostatic/steric effects).
2. Map perturbation effects back onto the spatial model, explicitly distinguishing:
   - Direct contact contributions
   - Local conformational or accessibility effects
   - Global stability/folding artifacts (exclude from interface claims)
3. **Decision Gate 6 (Structural integrity)**: Are perturbation effects separable from global unfolding or aggregation?  
   - *No*: Reject those candidates as specific interface evidence and revisit the perturbation design.

## Phase 7: Iteration, update, and stop conditions
1. **Upgrade** hypothesis confidence when multi-method support, control discrimination, and structural integrity are all satisfied; propose narrower follow-up questions.
2. **Downgrade** confidence when support is single-method, controls are weak, or conflicts remain unresolved.
3. **Redirect** when results favor an alternative mechanism (e.g., allosteric, non-interface, context-dependent); reformulate hypotheses accordingly.
4. **Stop and report** if any of the following occur:
   - Structural quality is insufficient and cannot be reasonably improved.
   - Positive and/or negative controls fail to discriminate.
   - Multi-method conclusions conflict irreconcilably.
   - Conclusions depend on unverified external assumptions (unknown modifications, uncharacterized conformational states, uncaptured sample bias).
   - Perturbation effects cannot be separated from structural integrity loss or non-specific artifacts.

# Output Format

Deliver a structured report containing:

1. **Research question**: a clear, falsifiable interface-level question.
2. **Mechanistic premise**: candidate mechanisms and theoretical rationale.
3. **Inputs and assumptions**: data available, data missing, key assumptions, and uncertainty sources.
4. **Hypothesis table**: candidate sites/features, evidence strength (High/Medium/Low), supporting evidence, key assumptions, failure modes, and priority ranking.
5. **Validation plan**: minimal viable validation, positive/negative/specificity controls, evaluation metrics, and stop conditions.
6. **Analysis plan**: structural mapping, multi-method cross-validation, control integration, and evidence-grading rules.
7. **Iteration triggers**: rules for upgrading, retaining, downgrading, or redirecting hypotheses based on outcomes.
8. **Validity and ethics statement**: confounders, extrapolation boundaries, reproducibility requirements, and safety/compliance limits.

# Validation Gates

- **Data quality gate**: sequence-structure correspondence is verified; interface definition is robust; model confidence is documented.
- **Method convergence gate**: high-confidence claims require agreement across ≥2 independent evidence lines.
- **Control discrimination gate**: positive, negative, and specificity controls must separate in the predicted direction.
- **Structural integrity gate**: perturbation-induced changes must be separable from global unfolding, aggregation, or expression collapse.
- **Reproducibility gate**: key rankings and mechanistic claims are supported by independent repeats, orthogonal readouts, or independent samples.

# Claim Boundaries

- Explicitly distinguish “verified in the source/known system,” “inferred for the new system,” and “exploratory hypothesis.”
- Interface predictions are bound to the specific conformational state, interface definition, and comparator set used.
- Do not extrapolate from a single structure or model to all homologs, all variants, or all experimental conditions.
- Computational predictions are hypothesis-generating and prioritization tools, not definitive proof of binding energetics, clinical relevance, or therapeutic utility.

# Failure Modes

- **Model error**: incorrect alignment, misassigned chains/residues, or low-confidence regions distort interface mapping.
- **Shielding/occlusion**: post-translational modifications, glycosylation, or dynamic loops mask the true interface.
- **Conformational/allosteric dominance**: long-range conformational changes or alternative states drive the phenotype rather than the mapped interface site.
- **Non-specific artifacts**: aggregation, non-specific binding, detection platform bias, or sample preparation artifacts mimic interface signals.
- **Sampling bias**: over-representation of certain clones, strains, or sequence variants skews candidate pools.
- **Tool sensitivity**: parameter choices or single-method biases produce inconsistent rankings across predictors.

# Validity Checks

Before finalizing conclusions, verify:

- **Confounders**: chain/residue numbering mismatches, crystal packing artifacts, docking artifacts, local flexibility, interface water molecules, and unmodeled modifications.
- **Reproducibility**: document structure sources, sequence versions, interface definition rules, prediction tool categories, and result aggregation methods; avoid reporting single-run outcomes as definitive.
- **Boundary conditions**: state that conclusions apply only to the current structural state, interface definition, and comparator systems; prohibit unconstrained extrapolation.
- **Statistical validity**: differentiate descriptive ranking, significance testing, and mechanistic inference; avoid claiming consensus from small samples or single structures.
- **Method consistency**: high-confidence candidates must be supported by at least two independent evidence types; conflicting results must be retained and explained, not suppressed.
- **Control sufficiency**: in the absence of positive, negative, and specificity controls, restrict output to exploratory hypotheses and prohibit strong mechanistic conclusions.
- **Safety and compliance**: when studying pathogens, immune escape, or dual-use contexts, output only research design, risk assessment, and compliance verification guidance; never provide directly executable hazardous operational details.

# Provenance

- Synthesized from cluster `13`, subcluster `13.0.split0`.
- Derived from source skills: `structural-hotspot-research-agent` (`072fe5dc5e44929c`), `structural-epitope-research-agent` (`d4b55f45e6062379`), `receptor-mimic-paratope-exploration` (`60b16bcae255048e`), `protein-epitope-exploration` (`fdb45641d8cd6347`), `receptor-epitope-functional-modulation-research` (`dc8dc1da979093f2`), `antigen-driven-autoimmunity-research` (`436aec3d374eb242`), `placental-malaria-adhesion-research` (`f095ebde7ffbb770`), `ps-motif-research-exploration` (`c692cb2b5168628d`).
