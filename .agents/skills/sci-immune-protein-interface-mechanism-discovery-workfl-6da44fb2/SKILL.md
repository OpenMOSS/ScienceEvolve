---
name: sci-immune-protein-interface-mechanism-discovery-workfl-6da44fb2
description: A reusable end-to-end workflow for generating research questions, hypotheses, and non-operational validation plans to discover and validate protein interface mechanisms across receptor-ligand, antibody-antigen, epitope, and domain-guided structure-function contexts.
scienceevolve-title: "Antibody and immune recognition · protein interface mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help an agent turn a molecular-recognition or structure-function question into a rigorous, iterative research plan. The workflow guides hypothesis generation, minimal validation design, evidence integration, and model updating for protein-protein, protein-ligand, and antibody-antigen interfaces.

## When to use

Use this skill when the user asks for one or more of the following:

- New research questions about how a receptor, ligand, adapter, antibody, or other modular biomolecule recognizes a binding partner.
- A plan for identifying candidate interface residues, motifs, domains, or structural surfaces.
- A minimal, non-operational experimental design for testing binding determinants, specificity, or domain contribution.
- An analysis workflow for interpreting perturbations, mapping results to structure, and updating hypotheses.
- A critical review of whether proposed determinants are direct interface features, indirect stabilizing features, or context-specific effects.

Do not use this skill as a clinical decision tool, a treatment recommendation framework, a source of executable wet-lab protocols, or a substitute for field-wide consensus.

## Inputs required

Ask the user or inspect the environment for:

- **Target molecule**: identity, domain architecture, known homologs, and available sequence or structural information.
- **Binding partner or functional output**: receptor, ligand, cofactor, antibody, or measurable downstream readout.
- **Research goal**: discover direct contact sites, compare homologs, test domain contribution, or explain altered binding/activity.
- **Available evidence**: conservation analysis, structural models, prior mutagenesis, binding data, omics evidence, or relevant literature.
- **Constraints**: safety, biosafety, ethics, sample availability, assay feasibility, validation depth, and institutional oversight.
- **Desired output**: research-question portfolio, one experimental plan, critique of an existing proposal, or iteration roadmap.

## Core Workflow

1. **Frame the mechanistic gap** — Separate established biological function from the unknown molecular mechanism. Define the precise interface question (e.g., which surface mediates recognition, how a domain contributes to binding, or how specificity is achieved).
2. **Inventory structural and sequence evidence** — Collect available structures, models, conservation data, domain annotations, and prior perturbation evidence. Flag missing density, model uncertainty, or unpaired bound/unbound states.
3. **Decompose into candidate features** — Identify domains, loops, conserved surfaces, predicted interfaces, or accessible regions. Treat each feature as a hypothesis, not a conclusion.
4. **Generate ranked, competing hypotheses** — For each candidate, formulate a mechanistic hypothesis (direct contact, allosteric, indirect presentation, etc.). Tag evidence strength (high/medium/low/speculative), key assumptions, predicted outcomes, and failure modes. Prioritize hypotheses that are testable with minimal perturbation and include orthogonal quality checks.
5. **Design minimal viable validation** — Select the smallest conceptual test that discriminates the top hypothesis from alternatives. Define perturbation classes (e.g., residue-level, domain-level, or comparative) at a non-operational level, a control matrix (positive, negative, specificity, quality/artifact), primary and secondary readouts, and pre-registered evaluation criteria.
   - *Decision gate*: If no discriminating test can be designed within safety and feasibility constraints, stop and redefine scope.
6. **Assess target integrity and engagement first** — Before interpreting functional changes, require evidence that the perturbation reaches the native target without globally compromising folding, stability, or expression.
   - *Decision gate*: If quality controls fail, classify the result as confounded and redesign before proceeding.
7. **Map outcomes to structural and functional models** — Classify each perturbation result (loss, partial loss, unchanged, enhanced, ambiguous). Map disruptive and non-disruptive features onto sequence or structural context. Treat spatial clustering as supportive, not definitive.
8. **Integrate orthogonal evidence** — Compare results across independent assays, homologs, partners, or structural states. Require convergence of at least two independent evidence streams before promoting a hypothesis.
   - *Decision gate*: If orthogonal assays disagree, inspect for assay artifacts, hidden states, or context dependence. Do not advance until resolved.
9. **Update hypotheses and decide next action** —
   - *Retain* if effects are reproducible, controls are clean, and the mechanistic fit is coherent.
   - *Refine* if results suggest partial contribution, indirect support, or partner-specific effects.
   - *Abandon* if contradicted by strong controls or repeated negative evidence.
   - *Broaden* only after the primary assay is credible and the next candidates resolve competing models.
   - *Stop* if the mechanism is resolved, alternatives are indistinguishable with available tools, safety/ethical constraints prevent validation, or assay interference cannot be resolved.
10. **Bound final claims and document residual uncertainty** — State what is directly observed, what is inferred, and what remains untested. Limit generalization to the tested molecule, partner, and readout.

## Output Format

When using this skill, respond with:

1. **Research question framing** — Biological interaction or structure-function gap; what is known versus unknown; why the question is worth testing.
2. **Candidate hypotheses** — Table with hypothesis, evidence strength, key assumptions, predicted result, likely failure modes, and discriminating test.
3. **Minimal validation plan** — Perturbation logic; positive, negative, specificity, and quality controls; primary and secondary readouts; evaluation criteria and stop conditions.
4. **Analysis plan** — Data-quality checks; normalization and comparison rules; spatial or mechanistic mapping approach; evidence-strength classification.
5. **Iteration roadmap** — How to retain, refine, abandon, or broaden hypotheses; next-best candidates to test; remaining unknowns and extrapolation boundaries.
6. **Validity and ethics statement** — Confounders, reproducibility checks, boundary conditions, and safety/compliance considerations.

## Validation Gates

- **Target-integrity gate**: Confirm expression, folding, and stability before interpreting binding or activity changes.
- **Specificity gate**: Distinguish direct interface effects from general activity loss, nonspecific toxicity, or assay interference using competition, rescue, or orthogonal reagents.
- **Orthogonal-convergence gate**: Require agreement between independent evidence types (e.g., structural and functional) before increasing confidence.
- **Reproducibility gate**: Expect independent replicates or distinct perturbation classes to converge; treat single-assay results as provisional.
- **Safety/ethics gate**: Verify that the proposed plan stays within non-operational research design and institutional oversight requirements.

## Claim Boundaries

- Do not present single-source findings as field-wide consensus.
- Do not infer clinical efficacy, therapeutic utility, or diagnostic value from mechanistic hypotheses.
- Distinguish binding evidence from functional mechanism and from phenotype causation.
- Limit claims to the tested molecule, partner, assay format, and biological context.
- Treat structural maps, predicted interfaces, and computational models as hypotheses rather than proof.

## Failure Modes

- **Confounded perturbation**: The perturbation alters global folding, stability, expression, or localization rather than the interface directly.
- **Assay artifact**: Readout changes reflect detection limits, saturation, background, or reagent-specific effects rather than biology.
- **Hidden epitope or masked region**: The candidate site is inaccessible in the native context despite being recognizable in isolation.
- **Context dependence**: The mechanism varies with conformational state, post-translational modification, oligomeric state, or cellular environment.
- **Overfitted interpretation**: A single structure or assay is over-interpreted as definitive evidence for a hotspot or determinant.
- **Redundancy or compensation**: Loss of one contact is buffered by rearrangement, solvent reorganization, or alternative interactions.

## Validity Checks

Before finalizing any proposal, verify:

- **Confounding**: Could the perturbation affect folding, stability, expression, localization, or assay performance?
- **Reproducibility**: Are replicate expectations, uncertainty estimates, and normalization rules explicit?
- **Specificity**: Does the design distinguish binding from general activity loss or off-target effects?
- **Boundary conditions**: How would conclusions change if the system is membrane-associated, multimeric, modified, or tested in a different context?
- **Model uncertainty**: Are structural maps and computational predictions treated as hypotheses with explicit confidence limits?
- **Generalizability**: Are claims limited to the tested system rather than extrapolated to homologs or therapeutic applications?
- **Single-source caution**: Is source literature used as methodological precedent rather than consensus?
- **Safety and ethics**: Does the plan avoid clinical advice and remain at a non-operational design level?

## Provenance

- Cluster: 74 / Subcluster: 74.0.split0
- Workflow archetype: symmetry-guided mechanism discovery and validation
- Synthesized from source skills:
  - `domain-guided-interface-discovery` (c87a145f54932df8)
  - `protein-functional-domain-exploration` (e4f4755151d3f166)
  - `erbb-structure-guided-research` (d3d7bd6a4d94396c)
  - `cryptic-functional-epitope-discovery` (25cbd47ea204a9f3)
  - `protein-epitope-mapping-research` (204e1470f35ead94)
  - `cross-ortholog-functional-binder-discovery` (21b4ecc6f923fd07)
  - `conserved-quaternary-epitope-discovery` (e2a37f2539a519e3)
  - `protein-interface-research-planning` (67c1d9332ab8109c)
