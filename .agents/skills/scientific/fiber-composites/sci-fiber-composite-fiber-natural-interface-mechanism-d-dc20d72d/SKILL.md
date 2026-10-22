---
name: sci-fiber-composite-fiber-natural-interface-mechanism-d-dc20d72d
description: A reusable end-to-end workflow for generating mechanism-based research questions, designing controlled validation plans, and iterating on composite, fiber, and natural-material interface systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber natural interface mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to turn a material-interface limitation into a testable mechanism-based research plan. It guides an agent to define bottlenecks, generate hypotheses with bounded evidence, design minimal controlled validations, triangulate orthogonal measurements, and iterate without treating any single source system as a universal rule.

## When to use

Use when the user asks to propose new research questions, design experiments, or analyze results for composite, fiber-reinforced, natural-material, or surface-interface systems where structure, interface, and performance are coupled. Applicable across polymer composites, geotechnical reinforcements, textile yarns, porous scaffolds, bioinspired coatings, and nanoscale structures. Do not use for clinical recommendations, construction specifications, or operational safety protocols.

## Inputs required

- Target system class and application bottleneck (e.g., adhesion, load transfer, moisture ingress, anisotropy, dispersion, cracking, thermal stability).
- Candidate design variables (e.g., reinforcement class, interface strategy, architecture, processing route, geometry).
- Available measurement access (mechanical, morphological, thermal, chemical, environmental) described at a design level.
- Comparison groups: baseline, single-variable, combined-variable, negative control, positive benchmark.
- Constraints: reproducibility, safety boundaries, resource limits, and acceptable stopping conditions.

## Core Workflow

1. **Bottleneck-to-Mechanism Mapping**
   - Define the dominant failure mode or performance limitation independently of any proposed solution.
   - Identify mechanism variables: interface chemistry, reinforcement geometry, dispersion, orientation, matrix continuity, void content, environmental exposure.
   - **Decision gate:** If the bottleneck cannot be stated without referencing a preferred material or additive, stop and redefine.

2. **Hypothesis Generation & Ranking**
   - Generate at least three mechanism-linked hypotheses. Each must include: expected benefit, key assumption, minimal observable evidence, likely failure mode, and evidence strength (strong / moderate / weak / speculative).
   - Prioritize hypotheses that are falsifiable with a small set of orthogonal measurements and clear controls.
   - **Decision gate:** If a hypothesis lacks a clear mediator variable or control condition, reformulate before proceeding.

3. **Minimal Viable Validation Design**
   - Build a comparison ladder: baseline (unmodified), single-variable, combined-variable (only after single effects are isolated), negative control (mechanism weakened), and positive benchmark if available.
   - Select independent variables tied to one dominant mechanism at a time.
   - Select dependent variables across at least two categories: structural/morphological and performance/response.
   - Predefine failure criteria and stop conditions.
   - **Stop/Redesign gate:** If controls are infeasible or safety constraints cannot be met, halt and redesign.

4. **Controlled Execution & Measurement**
   - Measure mediator variables (e.g., dispersion, interface indicators, geometry, localization) and outcome variables (e.g., mechanical, thermal, moisture, durability).
   - Record process stability, batch variability, and covariates.
   - **Decision gate:** If process instability or uncontrolled drift exceeds predefined thresholds, pause and address confounders before interpreting data.

5. **Mechanism Discrimination & Triangulation**
   - Normalize comparisons by composition, structure, or geometry where relevant.
   - Require at least two independent measurements before assigning a mechanism.
   - Inspect tradeoffs: an improvement in one endpoint may degrade another.
   - Classify conclusions: direct observation, mechanism-supported inference, transfer hypothesis, unsupported extrapolation.
   - **Decision gate:** If morphology and performance evidence conflict, flag the mechanism as unverified and consider alternative explanations.

6. **Iteration or Redesign**
   - If evidence supports the hypothesis: strengthen the claim within tested boundaries, refine the design window, and test robustness (e.g., batch variation, environmental exposure).
   - If performance improves without mediator support: add targeted characterization or consider alternative mechanisms.
   - If mediator changes without performance improvement: reassess endpoint sensitivity or application relevance.
   - If tradeoffs are unacceptable: reformulate with balancing variables or hybrid strategies.
   - If variability dominates: improve process controls and replication before expanding.
   - **Stop conditions:**
     - Leading treatment fails under stronger controls.
     - Improvement in one endpoint causes unacceptable degradation in another.
     - Dispersion or preparation is not reproducible.
     - Mechanism-specific evidence contradicts the hypothesis.
     - Design offers no advantage over simpler alternatives.

7. **Claim Bounding & Documentation**
   - State boundary conditions: material class, architecture, loading context, and application scope.
   - Separate verified facts from agent inferences.
   - Document confounders, reproducibility limits, and unsupported extrapolations.

## Output Format

1. **Research question and bottleneck**
2. **Mechanism model** with mapped variables
3. **Hypothesis table** (hypothesis, evidence strength, key assumption, minimal validation, likely failure mode)
4. **Experimental design matrix** (variables, controls, metrics, replication, stop conditions)
5. **Analysis plan** (normalization, orthogonal evidence chain, tradeoff inspection, conclusion classification)
6. **Iteration plan** (update rules per evidence pattern)
7. **Validity and safety notes** (confounders, boundaries, ethics constraints)

## Validation Gates

- **Reference/Baseline check:** Does the baseline reproduce expected behavior? If not, halt.
- **Control check:** Are negative and positive controls discriminating? If controls fail, invalidate the run.
- **Mechanism consistency:** Do structural/morphological and performance metrics converge? If divergent, do not advance the mechanism claim.
- **Reproducibility gate:** Do independent batches or repeated measurements show consistent trends? If variability overlaps treatment effects, stop for process refinement.
- **Convention sensitivity:** For nanoscale or computed metrics, does the conclusion hold under alternative geometric conventions? If not, bound the claim.

## Claim Boundaries

- Do not generalize from one matrix/reinforcement pair to all systems.
- Do not extrapolate from in vitro or laboratory results to implant, structural, or field performance.
- Do not infer therapeutic efficacy, regulatory suitability, or environmental benefit from single-metric improvements.
- Treat single-source findings as one evidence source, not field consensus.
- Label all extensions to new substrates, chemistries, or architectures as hypotheses until tested.

## Failure Modes

- Bottleneck defined by preferred solution rather than independent failure mode.
- Hypothesis lacks falsifiable mediator or control.
- Single-endpoint success treated as sufficient without orthogonal confirmation.
- Confounding between material, geometry, processing, and environment unaddressed.
- Non-monotonic response missed due to insufficient parameter range.
- Morphology evidence over-interpreted as chemical proof, or vice versa.
- Variability mistaken for treatment effect.
- Overgeneralization beyond tested boundary conditions.

## Validity Checks

- **Confounders:** batch, moisture history, surface energy, porosity, geometry, preparation order, measurement calibration.
- **Statistical validity:** independent replicates, uncertainty reporting, avoidance of synergy claims without single-variable baselines.
- **Mechanistic validity:** at least two independent measurements required for mechanism assignment.
- **Reproducibility:** predefined sampling rules, repeated batches, and documented analysis choices.
- **Boundary conditions:** explicit scope on material class, architecture, and environment.
- **Evidence separation:** clearly label source-verified, literature-supported, and agent-inferred claims.

## Provenance

- Synthesized from cluster 68, subcluster 68.0.
- Source skills: interface-tuned-scaffold-exploration, fiber-reinforced-soil-research-workflow, reinforcement-interface-composite-workflow, biodegradable-composite-process-structure-property-research, bioinspired-surface-coating-exploration, els-composite-spinning-research-workflow, nanoscale-mechanical-local-descriptor, biocomposite-interface-orientation-exploration.
