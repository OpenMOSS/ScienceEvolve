---
name: sci-immune-binder-repertoire-discovery-engineering-work-c0b896bc
description: A reusable end-to-end workflow for designing hypothesis-driven binder discovery and engineering studies from diverse molecular repertoires, with staged validation, orthogonal verification, and iterative refinement.
scienceevolve-title: "Antibody and immune recognition · binder repertoire discovery engineering workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to transform paper-derived binder discovery logic into a reusable, non-operational research design method. It guides the agent to propose testable hypotheses, design staged validation funnels, define controls and metrics, and iterate based on evidence—without copying study-specific experimental conditions or treating any single study as field consensus.

# When to use

Use when the user asks for:

- A research plan for discovering or engineering binders, affinity reagents, or molecular recognition candidates from a biological or synthetic repertoire.
- A framework to adapt enriched-source or constrained-library strategies to a new target, target class, or functional requirement.
- A workflow for generating hypotheses about repertoire composition, binding specificity, expression compatibility, epitope diversity, or modular design.
- A design review of controls, validation logic, iteration rules, and claim boundaries for selection-based discovery work.

Do not use for clinical recommendations, patient-specific interpretation, therapeutic guidance, or executable laboratory protocols.

# Inputs required

Before producing a plan, collect or infer:

- **Target biology:** molecular target, target class, intended mechanism (e.g., blockade, activation, recognition), and relevant pathway context.
- **Repertoire concept:** source rationale (e.g., immune-exposed, synthetic, computationally designed), expected diversity, and known constraints.
- **Intended output:** binder discovery, epitope mapping, specificity profiling, comparative repertoire analysis, affinity/activity optimization, or modular design.
- **Available evidence:** prior binding data, structural information, literature context, known positive/negative references, and baseline repertoire data if available.
- **Constraints:** biosafety level, ethics approvals, sample provenance, data-sharing limits, and whether work is computational, in vitro, or downstream characterization.
- **Decision need:** research question formulation, minimum viable validation plan, control matrix, iteration strategy, or mechanistic interpretation.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame the discovery gap and hypotheses**
   - Define the practical bottleneck: why existing reagents or unconstrained searches are insufficient.
   - Formulate layered hypotheses:
     - *Source hypothesis:* why the chosen repertoire increases the prior probability of relevant candidates.
     - *Repertoire-structure hypothesis:* whether diversity is sufficient to yield multiple independent solutions.
     - *Specificity/mechanism hypothesis:* how candidates should recognize the target and produce the intended functional effect.
   - Label each hypothesis with evidence strength (strong/moderate/weak/speculative), key assumptions, and likely failure modes.
   - **Decision Gate 1 (Scope Gate):** Are the hypotheses falsifiable, bounded, and aligned with a clear functional endpoint? If not, refine the scope before proceeding.

2. **Design the repertoire and selection strategy**
   - Choose a repertoire source or library design justified by the target and prior evidence.
   - Define independent variables (source, target presentation, candidate format, selection pressure), dependent variables (enrichment, specificity, function, diversity), and confounders.
   - Build a control matrix: positive reference, negative/irrelevant target, competition/scaffold control, process control, and replicate control.
   - Establish evaluation metrics: target specificity, functional modulation, candidate uniqueness, enrichment relative to baseline, breadth, and robustness across formats.
   - **Decision Gate 2 (Design Gate):** Does the design include a baseline population, matched comparison, and pre-specified stop conditions? If not, redesign.

3. **Execute discovery and primary triage**
   - Apply selection or screening pressure aligned with the intended function rather than a proxy alone.
   - Recover candidates; track identity and annotation from the outset.
   - Compare selected candidates against the unselected baseline to identify enriched or depleted features.
   - **Decision Gate 3 (Signal Gate):** Is there target-associated signal above relevant background and control thresholds? If no signal survives, stop and iterate the source, target presentation, or selection pressure.

4. **Orthogonal validation and context testing**
   - Validate candidates in at least one independent assay format or context (e.g., soluble vs. displayed, biochemical vs. cellular).
   - Test specificity against related and irrelevant targets; include competition or blocking readouts where appropriate.
   - Assess format-transfer consistency if early candidates are in a surrogate modality.
   - Evaluate pairing or modularity integrity if the candidate comprises multiple components.
   - **Decision Gate 4 (Specificity Gate):** Do candidates survive orthogonal validation with target-specific, competition-sensitive, and reproducible signal? If not, deprioritize and audit for assay artifacts or off-target binding.

5. **Mechanistic interpretation and evidence integration**
   - Map observations to distinct claims: source enrichment, library composition, candidate identity, binding, function, and specificity.
   - Integrate sequence, structural, and functional evidence; upgrade confidence only when multiple layers coherently support the same candidate.
   - Grade conclusions as observed, inferred, or speculative; visualize losses, biases, and bottlenecks in the discovery funnel.
   - **Decision Gate 5 (Integration Gate):** Is the evidence coherent across identity, presence, and function layers with valid controls? If evidence is mixed, require additional orthogonal tests before advancing.

6. **Iterate, expand, or stop**
   - Classify the outcome:
     - *Confirmed:* advance to deeper characterization (mechanism, boundaries, robustness).
     - *Partial:* refine constraints, selection pressure, or target presentation and re-test.
     - *Negative:* preserve the negative result to eliminate the hypothesis; stop or pivot.
   - Update hypotheses based on observed failure modes (e.g., source bias, expression bias, clonal dominance, conformational mismatch).
   - **Stop Conditions:** Triggered when key controls fail, identity and function conflict without explanation, results are non-reproducible across batches/formats, the engineered format fundamentally alters mechanism, or safety/ethics boundaries are unclear.

# Output Format

When using this skill, produce:

1. **Research question** — Target, repertoire concept, intended output, and decision need.
2. **Evidence map** — Paper-supported method elements, agent-inferred extensions, and unsupported assumptions.
3. **Hypotheses table** — Hypothesis statement, evidence strength, key assumptions, likely failure mode, and minimal validation required.
4. **Experimental design** — Variables, control matrix, minimum viable validation gates, evaluation metrics, and stop/iteration conditions.
5. **Analysis plan** — Data checks, bias checks, diversity analysis, orthogonal validation logic, and uncertainty labels.
6. **Iteration plan** — Actions for positive, ambiguous, negative, or biased results.
7. **Validity and safety statement** — Main confounders, reproducibility requirements, ethical/biosafety boundaries, and limits on extrapolation.

# Validation Gates

A concise set of go/no-go criteria:

- **Gate 1 (Scope):** Hypotheses are falsifiable, bounded, and linked to a functional endpoint.
- **Gate 2 (Design):** Baseline population, matched comparison, and pre-specified controls are defined.
- **Gate 3 (Signal):** Target-associated signal exceeds background and negative controls.
- **Gate 4 (Specificity):** Orthogonal validation confirms target-specific, competition-sensitive, reproducible behavior.
- **Gate 5 (Integration):** Evidence across identity, presence, and function layers is coherent and controls are valid.

# Claim Boundaries

- **Supported claims:** Target-specific candidate discovery; repertoire diversity hypotheses; mechanistic proposals for recognition or function; comparative performance of design strategies under tested conditions.
- **Unsupported claims:** Clinical efficacy, therapeutic safety, dosing guidance, field-wide consensus, or generalizability beyond the tested targets, formats, and assay contexts.
- Do not convert a successful binder discovery into a therapeutic, diagnostic, or safety claim.

# Failure Modes

Common ways the workflow can fail or mislead:

- **Source bias:** Donor history, immune state, or sample representativeness dominates apparent repertoire structure.
- **Enrichment/amplification bias:** Source manipulation, primer choice, or assembly efficiency distorts family representation.
- **Expression or display bias:** Certain candidate families express or display better independent of target relevance.
- **Target-presentation artifacts:** Immobilization, conformational changes, tags, carriers, or scaffold effects create false positives.
- **Clonal dominance:** A few sequences overwhelm the selected population, masking true diversity.
- **Assay interference:** Fluorescence, aggregation, cytotoxicity, or detection artifacts drive apparent signal.
- **Format-dependent loss:** Surrogate formats alter binding geometry, valency, or stability, invalidating transfer to the intended modality.
- **Nonspecific binding:** Candidates recognize tags, surfaces, or generic protein features rather than the intended target.
- **Epitope mismatch:** Selected binders recognize irrelevant or non-functional target regions.

# Validity Checks

Before finalizing any plan or accepting a conclusion, verify:

- **Confounding:** Are disease state, donor variables, sample handling, or target presentation confounded?
- **Representativeness:** Does the source support the intended biological inference, or only a narrow case study?
- **Specificity:** Are related and irrelevant alternatives included in the control matrix?
- **Pairing/Modularity integrity:** Does the design test whether natural or designed component relationships matter?
- **Context dependence:** Are discovery and validation formats sufficiently different to reveal artifacts?
- **Reference validity:** Are positive and negative references appropriate and expected to behave correctly?
- **Statistical validity:** Are decision thresholds pre-specified, multiple comparisons addressed, and uncertainty reported?
- **Reproducibility:** Are independent candidates, sources, or validation contexts available?
- **Boundary clarity:** Are the limits of extrapolation explicitly stated?
- **Evidence separation:** Are paper-derived facts, user-provided context, and agent-generated inferences clearly separated?

# Provenance

Synthesized from cluster `9`, subcluster `9.0.split0` (binder-repertoire-discovery-engineering-workflow). Derived from source skills: `32c17f7fcef98a67`, `589544bcb4deb2f3`, `d58d8f130a3191dc`, `acabb210b2f5067a`, `210eca686bd3de3c`, `c18cfe5ceecd4720`, `a57d422ada786e38`, `dc7e901ea1d0c5d0`.
