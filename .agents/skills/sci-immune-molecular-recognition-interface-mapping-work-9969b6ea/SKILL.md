---
name: sci-immune-molecular-recognition-interface-mapping-work-9969b6ea
description: A reusable end-to-end workflow for in vitro dissection of binding interfaces, epitopes, minimal functional units, and structure-function relationships using biochemical and biophysical reasoning.
scienceevolve-title: "Antibody and immune recognition · molecular recognition interface mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help an agent migrate the "candidate interface screening → perturbation validation → boundary refinement" research pattern to new problems in molecular recognition. The workflow focuses on identifying protein–protein, protein–nucleic acid, or protein–glycan interaction interfaces, generating testable hypotheses, and designing minimal viable validation with strong controls and iterative refinement—not on recapitulating any single study’s conclusions.

## When to use

Use this workflow when:
- You need to propose new research questions or candidate sites for a binding interface, epitope, or minimal functional unit.
- You must integrate structural accessibility, sequence conservation, perturbation data, and functional readouts to infer interaction mechanisms.
- You lack a complete complex structure and require a convergent, stepwise candidate validation plan.
- You want to map structure–function relationships for antibodies, receptors, enzymes, or modular binding proteins in a new system.

Do not use when:
- The user only wants a paper summary, terminology explanation, or historical background.
- The research question is unrelated to molecular recognition, binding interfaces, or structure–function relationships.
- The task requests operational lab recipes, dosages, culture conditions, device parameters, or clinical/diagnostic advice.

## Inputs required

Before starting, gather or acknowledge gaps in:
- **Target system**: molecular identity, domain organization, available conformations, and oligomeric state.
- **Binding partner**: identity, known or hypothesized contact regions, and available competitors or perturbagens.
- **Research objective**: interface localization, selectivity explanation, affinity modulation, or minimal-unit definition.
- **Evidence inventory**: structural coordinates or models, sequence alignments, functional assays, perturbation results, and known mutational data.
- **Evaluation metrics**: binding strength, capacity, selectivity, conformational stability, or downstream functional activation/inhibition.
- **Constraints**: ethical approvals, biosafety level, sample provenance, data governance, and reproducibility standards.

If inputs are incomplete, list missing information and its impact, then proceed with low-confidence hypothesis drafts.

## Core Workflow

### Stage 1: Frame the research question
- Define the specific interaction, the functional gap, and the key unknown (e.g., which surface region mediates recognition, or which minimal unit retains function).
- Distinguish observed phenotypes from inferred mechanisms and speculative extensions.
- **Decision gate**: If the functional readout is not reproducible or lacks a clear mechanistic link, stop and refine the phenotype definition before proceeding.

### Stage 2: Build an evidence map
- Compile independent evidence streams: structural accessibility, evolutionary conservation, physicochemical complementarity, and prior perturbation or mutational data.
- Rate each stream’s relevance to the interface versus overall fold stability.
- Flag conflicts between structural models and functional data.
- **Decision gate**: If no candidate region is supported by at least two independent evidence streams, downgrade to exploratory mode and broaden the candidate search.

### Stage 3: Generate ranked candidate hypotheses
- For each candidate interface or minimal unit, formulate a hypothesis stating the region, proposed mechanism, and expected functional impact.
- Assign evidence strength (Strong / Moderate / Weak / Speculative) based on convergence of independent streams.
- Explicitly list key assumptions (e.g., conformational state, post-translational modification, partner identity) and possible failure modes (e.g., allosteric regulation, non-specific charge effects, folding disruption).
- **Decision gate**: Discard hypotheses that rely on a single, unvalidated structural state or that cannot be falsified with available resources.

### Stage 4: Design minimal viable validation
- Define the smallest set of non-operational experiments or analyses that can distinguish the candidate hypothesis from alternatives:
  1. A structure- or model-supported candidate region definition.
  2. A sequence/evolutionary or cross-system consistency check.
  3. A perturbation or comparative condition that isolates the candidate from non-specific effects.
  4. A functional readout linked to the mechanistic claim.
- Specify controls: baseline (unperturbed), negative (non-target or irrelevant region), positive (known active reference), and quality (structural integrity/folding) controls.
- Define stop conditions: candidate fails independent replication, structural integrity is compromised, background exceeds signal, or the perturbation is non-specific.

### Stage 5: Integrate and triangulate results
- Compare perturbation outcomes across multiple readouts (binding, function, stability).
- Check for consistency between structural predictions and observed phenotypes.
- If binding and function diverge, treat them as separate hypotheses: update the interface model or challenge the assumed mechanism.
- **Decision gate**: If the candidate region is supported by structure and sequence but not by functional perturbation, revisit accessibility assumptions or test allosteric models.

### Stage 6: Refine boundaries and iterate
- Narrow or expand the candidate interface based on convergent evidence.
- If the minimal unit loses function, evaluate whether the loss stems from boundary truncation, misfolding, or loss of partner compatibility; do not equate "no detected function" with "no function."
- If multiple candidates are equally plausible, design orthogonal discrimination tests rather than expanding the perturbation space blindly.
- **Iteration rule**: Continue only if the new round can falsify a remaining hypothesis. Stop if you reach diminishing returns, encounter unresolvable confounders, or approach ethical/safety boundaries.

### Stage 7: Synthesize outputs and bound claims
- Package the updated interface model, evidence matrix, and remaining uncertainties.
- Separate "candidate interface," "supported interface," and "validated interface" claims.
- State explicit extrapolation boundaries (e.g., limited to the assayed conformation, partner, or species).

## Output Format

Each invocation should produce:
1. **Research question definition**: target system, interaction, candidate interface, and key uncertainties.
2. **Evidence map**: table summarizing structural accessibility, sequence/evolutionary, perturbation, and functional evidence with confidence levels.
3. **Candidate hypotheses**: for each, the mechanistic statement, evidence strength, key assumptions, predicted outcomes, and failure modes.
4. **Minimal viable validation plan**: variables, controls, evaluation metrics, stop conditions, and boundary conditions.
5. **Analysis plan**: data integration strategy, conflict resolution, visualization approach, and statistical reasoning.
6. **Iteration roadmap**: rules for updating hypotheses, handling negative results, and deciding when to stop.
7. **Limitations statement**: clear separation of what is evidence-based, what is migrated inference, and what is not mechanically transferable.

## Validation Gates

- **Phenotype reproducibility**: The functional readout must be stable across independent preparations or measurements before mechanistic interpretation.
- **Specificity gate**: Candidate signals must exceed background and unrelated-target controls under equivalent conditions.
- **Integrity gate**: Perturbations must be shown not to destroy global fold, oligomeric state, or non-specific surface properties before attributing effects to interface disruption.
- **Mechanistic coherence gate**: Structural, sequence, perturbation, and functional evidence must converge on a consistent model; conflicting evidence must trigger alternative hypotheses, not selective reporting.
- **Extrapolation gate**: Claims about minimal units, epitopes, or interfaces must be tagged with their validated scope (conformation, partner, assay type, species).

## Claim Boundaries

- **Candidate interface**: A region supported by structural accessibility or sequence conservation but not yet tested by functional perturbation.
- **Supported interface**: A region with convergent structural and sequence evidence and consistent perturbation data, though independent replication may be limited.
- **Validated interface**: A region where perturbation specifically alters function without compromising integrity, and the effect is replicated under orthogonal readouts.
- Do not present single-system observations as domain consensus. Do not equate in vitro binding with in vivo function, clinical efficacy, or safety.

## Failure Modes

- **False-positive interface**: A region appears accessible and conserved, but perturbation does not alter binding or function, and non-specific effects are ruled out.
- **Integrity-confounded effect**: A perturbation changes function by destabilizing folding or promoting aggregation rather than by specific interface disruption.
- **Single-assay artifact**: A result appears in only one readout and cannot be reproduced with independent methods or candidate controls.
- **Over-extrapolation**: Conclusions about an interface are extended to unvalidated conformations, partners, or biological contexts.
- **Conflation of binding and function**: Surface binding is interpreted as mechanistic contribution to a downstream effect without functional necessity testing.
- **Unfalsifiable hypothesis**: The proposed mechanism is so flexible that any outcome can be accommodated; stop and reformulate.

## Validity Checks

- **Confounder check**: Could folding disruption, aggregation, non-specific charge effects, post-translational modification changes, conformational switching, or sample preparation differences explain the result?
- **Reproducibility check**: Are there independent samples, independent assays, independent candidate regions, and independent structural or sequence evidence sources?
- **Statistical validity check**: Were primary endpoints, controls, replication strategy, outlier handling, effect direction, and uncertainty intervals pre-defined?
- **Boundary condition check**: Are cross-species, cross-isoform, cross-conformation, cross-partner, and cross-assay extrapolation limits explicitly stated?
- **Mechanistic consistency check**: Do candidate regions, perturbation results, functional readouts, and alternative explanations form a coherent model?
- **Claim strength check**: Are "candidate," "supported," and "validated" interface statements kept distinct, avoiding over-generalization?
- **Source limitation check**: Are original study-specific objects, conditions, or conclusions not treated as field consensus?

## Provenance

- Synthesized from cluster `2`, subcluster `2.1.split0`.
- Derived from source skills: `fc-complement-interface-exploration-workflow` (b35d304557ef4fd9), `antibody-binding-interface-exploration` (6560a3fa9a75d735), `antibody-minimal-interface-research-design` (02c7f7ef73a9d58c), `microbial-surface-epitope-research-workflow` (e78d96ff5998e499), `catalytic-antibody-repertoire-evolution` (a28889448d563a2e), `antibody-domain-functional-modularity-workflow` (f40af1f9549c997f), `tumor-glycan-binder-mechanism-discovery` (dc6314d3dc05b70d), `helminth-ige-antigen-discovery-workflow` (efc07f41e852fd00).
