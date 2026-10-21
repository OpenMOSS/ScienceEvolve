---
name: sci-catalysis-asymmetric-catalysis-chiral-catalyst-rese-1571cd89
description: End-to-end research design workflow for asymmetric catalysis and chiral catalyst exploration, covering hypothesis generation, minimal validation, iterative redesign, and evidence-boundary management.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral catalyst research design workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent transform literature-informed scientific reasoning into a transferable research design for asymmetric catalysis and chiral catalyst development. The goal is to generate falsifiable hypotheses, design minimal viable validations with proper controls, analyze results against mechanism models, and iterate or pivot based on evidence—without reproducing paper conclusions or providing executable lab recipes.

# When to use

- When proposing new research questions in stereoselective catalysis, chiral ligand/design, or asymmetric synthesis.
- When migrating a methodological pattern from literature to a new substrate class, catalyst scaffold, or reaction manifold.
- When designing non-operational experimental frameworks (variables, controls, metrics, stop conditions) rather than executing reactions.
- When evaluating evidence strength, mechanistic consistency, and extrapolation boundaries across catalyst, substrate, or reagent variations.
- When iterating on failed or partially successful results to update mechanism models or redesign studies.

# Inputs required

- Target transformation or chiral product class and its synthetic/strategic value.
- Known methodological gaps in efficiency, selectivity, scope, reproducibility, or mechanistic understanding.
- Candidate mechanism map or hypothesized key intermediates and selectivity-determining steps.
- Available baseline data: literature precedents, preliminary results, failed cases, or analogous systems.
- Analytical capabilities and limits for stereochemical assignment, kinetic monitoring, and structural confirmation.
- Constraints: safety/compliance boundaries, non-operational scope, resource limits, and acceptable failure criteria.

# Core Workflow

1. **Gap Definition & Problem Framing**
   - Define the synthetic bottleneck from strategic value, not from a single observation.
   - Frame a falsifiable core proposition about stereocontrol, catalyst function, or scope expansion.
   - *Decision Gate:* If the gap cannot be expressed as a testable "if...then...because" statement, pause and refine before proceeding.

2. **Hypothesis Generation & Evidence Grading**
   - Generate candidate hypotheses covering stereoselectivity origin, catalyst/substrate recognition, intermediate stability, and competing pathways.
   - Grade each hypothesis: Strong (direct precedent in an analogous system), Medium (mechanistic analogy), or Weak (theoretical inference).
   - Identify key assumptions and failure modes for each hypothesis.
   - *Decision Gate:* If no hypothesis can be linked to an observable metric and a falsifying control, return to Step 1.

3. **Minimal Viable Validation (MVV) Design**
   - Select a representative model system that tests the core proposition without full scope screening.
   - Define independent variables (catalyst architecture, substrate class, reagent type, environment category) and dependent variables (conversion, stereoselectivity, pathway distribution, downstream fidelity).
   - Design controls:
     - Baseline: absence of the chiral catalyst or key component.
     - Non-chiral catalyst: isolates the chiral-induction contribution.
     - Structural-deletion: removes hypothesized recognition or directing elements.
     - Positive: known competent system to validate analytics.
     - Negative: system expected to fail under the proposed mechanism.
   - Set primary/secondary metrics and pre-defined stop conditions.
   - *Decision Gate:* If the MVV design requires operational hazardous details, abstract it to a higher-level framework and flag for institutional safety review.

4. **Execution & Data Structuring (Conceptual)**
   - Organize results by variable class and evidence type: reactivity, stereoselectivity, mechanism, scope, and practicality.
   - Record null/negative results and anomalous outcomes with the same fidelity as successes.
   - *Decision Gate:* If data quality checks (sample integrity, analytical calibration, batch variance) fail, halt interpretation and repeat/revalidate.

5. **Mechanistic Analysis & Evidence Grading**
   - Classify each result as supporting, partially supporting, neutral, or contradicting the hypothesis.
   - Check mechanism consistency: the same model must explain successes, failures, and competing pathways.
   - Separate catalyst effects from condition effects and substrate effects.
   - Grade conclusions: verified, partially supported, compatible but not unique, weakened, or excluded.
   - *Decision Gate:* If negative controls yield unexplained positive signals, or if the mechanism cannot account for the majority of observed variance, flag confounding and proceed to Step 6B (Rewrite).

6. **Iteration Decision**
   - **6A. Accept:** Controls discriminate the hypothesis, selectivity is reproducible, and scope boundaries are clear. Generalize cautiously within defined limits.
   - **6B. Rewrite:** Results are valid but only under narrow or unexpected conditions. Narrow the hypothesis to a bounded platform and design discriminating experiments.
   - **6C. Pivot:** The core assumption is falsified (e.g., background reaction dominates, stereochemical assignment unreliable, catalyst decomposition). Return to Step 2 with a revised mechanism map.
   - **6D. Stop:** Stop conditions are met (irreproducibility, safety boundary reached, no viable path after two pivots). Archive findings and define residual uncertainties.
   - *Decision Gate:* Before expanding scope, confirm the mechanism model has survived at least one orthogonal challenge.

7. **Boundary Documentation & Knowledge Packaging**
   - Document structural, electronic, steric, and environmental boundaries of applicability.
   - Distinguish verified claims, analogical inferences, and agent-generated speculations.
   - Package outputs for the next cycle or for reporting.

# Output Format

The agent should produce:

1. **Research question & gap statement**
2. **Candidate hypothesis table:** hypothesis, evidence strength, key assumptions, predicted observations, failure modes
3. **MVV design:** model system rationale, variables, controls (baseline, non-chiral, structural-deletion, positive, negative), metrics, stop conditions
4. **Analysis plan:** data organization, mechanism-consistency checks, evidence-grading rubric, visualization approach
5. **Iteration roadmap:** accept/rewrite/pivot/stop criteria and next-round priorities
6. **Validity summary:** confounders checked, repeatability status, statistical limits, extrapolation boundaries
7. **Non-operational safety/compliance notes:** risk identification, institutional review triggers, and prohibition on executable hazardous detail

# Validation Gates

- **Problem Clarity Gate:** The research question must be falsifiable and scoped to a stereoselectivity or catalyst-control problem.
- **Hypothesis Rigor Gate:** Every hypothesis must carry an evidence-strength label and a linked falsifying observation.
- **Control Completeness Gate:** MVV must include baseline, non-chiral/induced, structural-deletion, positive, and negative controls before scope expansion.
- **Data Quality Gate:** Analytical reliability, batch repeatability, and sample integrity must be confirmed before mechanistic interpretation.
- **Mechanistic Consistency Gate:** The working model must explain both successful and failed outcomes; unexplained variance triggers a rewrite.
- **Extrapolation Gate:** Scope expansion is permitted only after the model survives orthogonal challenge; single-substrate success cannot be generalized.

# Claim Boundaries

- Distinguish three tiers in all outputs:
  - **Verified:** Supported by direct precedent or repeated experimental evidence in the current system.
  - **Inferred:** Supported by mechanistic analogy or literature precedent from related systems, but not directly tested here.
  - **Speculative:** Agent-generated inference for the new system; requires explicit labeling and pending validation.
- Never present single-system results as field consensus.
- Never equate synthetic accessibility with downstream safety, biological activity, or industrial viability without independent evidence.

# Failure Modes

- **Background Dominance:** The reaction proceeds without the chiral catalyst or key recognition element, invalidating stereocontrol claims.
- **Analytical Artifact:** Stereochemical assignment derives from a single uncalibrated method or contaminated sample.
- **Narrow Anomaly:** High selectivity observed for only one substrate/condition with no mechanistic rationale; mistaken for generalizable.
- **Mechanistic Overfit:** A model explains successes but ignores competing pathways, negative results, or batch variance.
- **False Extrapolation:** Conclusions from a model substrate are applied to complex or unrelated scaffolds without boundary testing.
- **Premature Platforming:** Declaring a "platform" before orthogonal evidence (multiple substrate classes, catalyst variants, or downstream fidelity) is obtained.

# Validity Checks

- **Confounders:** Screen for background reactions, catalyst decomposition, competitive coordination, racemization or erosion of stereochemical information, impurities, analytical bias, and substrate-selection bias.
- **Repeatability:** Key results must be reproducible across independent batches; enantiomeric catalysts should give mirror-image outcomes where applicable; structural assignments require orthogonal confirmation.
- **Statistical Rigor:** Avoid ranking incomparable datasets; separate exploratory screening from confirmatory validation; report uncertainty for borderline selectivity values.
- **Mechanistic Discrimination:** For every major conclusion, state at least one competing explanation and the control experiment that weakens it.
- **Boundary Conditions:** Explicitly note which structural features (steric, electronic, functional groups), catalyst classes, and reaction conditions are required, tolerated, or untested.
- **Safety & Compliance:** Confirm that no operational hazardous parameters are output; flag risks for institutional review; ensure waste minimization and failure transparency are addressed in the design.

# Provenance

- Synthesized from cluster 2 / subcluster 2.1 (`asymmetric-catalysis-chiral-catalyst-research-design-workflow`).
- Source-skill references: `p-chiral-organophosphorus-asymmetric-synthesis-explorer`, `asymmetric-sulfenylation-reagent-exploration`, `catalytic-method-research-workflow`, `axial-chiral-heteroaryl-research-design`, `chiral-phosphorus-ligand-exploration`, `p-stereogenic-modular-synthesis-exploration`, `chiral-electrophilic-catalysis-research-pattern`, `asymmetric-annulation-catalyst-discovery`.
- Preserves shared patterns: mechanism-guided hypothesis generation, minimal viable validation with graded controls, iterative model updating, and evidence-boundary management.
- Excludes source-specific reagents, metals, ligands, substrates, numerical results, and paper conclusions.
