---
name: sci-quantum-phase-dynamics-mechanism-discovery-workflow-343e5192
description: A reusable end-to-end workflow for discovering and validating microscopic mechanisms in quantum, ferroelectric, interfacial, and correlated phase systems from ambiguous observations.
scienceevolve-title: "Quantum materials and condensed matter · phase dynamics mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent turn ambiguous observations in complex phase-related systems into a structured, iterative research program. The workflow generates mechanism-level hypotheses, designs discriminating controls and orthogonal measurements, analyzes evidence with explicit uncertainty, and iterates until claims are either validated, bounded, or refuted—without overgeneralizing from single-source evidence.

# When to use

Use this skill when:

- A suspected transition, coupling, or dynamic response is hidden, weak, or disputed.
- Bulk observables imply a mechanism but do not directly identify it.
- The user needs hypotheses, experiments, or analysis plans for quantum, ferroelectric, interfacial, correlated, or soft-matter phase systems.
- The goal is mechanism discrimination rather than routine characterization.
- The task is method design and evaluation, not operational execution of a specific apparatus.

Do not use for fabrication recipes, clinical recommendations, or as a substitute for domain-specific safety review.

# Inputs required

Before proposing a plan, request or identify:

- Target system class and relevant order parameters or observables.
- Ambiguous phenomenon and the baseline theoretical expectation.
- Candidate mechanism families, including at least one artifact or alternative hypothesis.
- Available structural, spectroscopic, imaging, transport, or computational probes.
- Controllable variables, known constraints, and environmental boundaries.
- Safety, ethics, and compliance boundaries for the domain.

# Core Workflow

Follow this ordered route from ambiguity to bounded claim.

## Step 1: Frame the ambiguity
- Define the phenomenon, the baseline expectation, and why the mechanism is uncertain.
- Identify the domain gap between standard theory and the observation.
- State the inference boundary: path, state, probe sensitivity, and model assumptions.

## Step 2: Map the mechanism space
- List candidate mechanisms (intrinsic, extrinsic, and artifact).
- For each, derive distinguishing predictions: scaling laws, sign behavior, spatial or temporal dependence, and material dependence.
- Define the boundary beyond which each hypothesis is expected to fail.

## Step 3: Generate ranked hypotheses
- Formulate testable hypotheses with evidence strength, key assumptions, minimal test, and disconfirming observation.
- Include at least one artifact hypothesis as a first-class candidate.
- Rank by discriminative value: prefer hypotheses that distinguish competing structures rather than reproduce obvious predictions.

**Decision Gate 1 — Candidate Gate:** If no hypothesis is falsifiable with available probes, stop and redesign the research question or acquire new capabilities.

## Step 4: Design minimal viable validation
- Select one focused mechanism-discrimination question.
- Define independent, dependent, and controlled variables.
- Specify a control set: baseline, positive, negative, structural, reversibility, and replicate.
- Predefine decision rules (support, partial support, refutation, inconclusive) and stop conditions.
- Keep the design at the research-planning level; avoid operational recipes or hazardous parameters.

## Step 5: Execute and analyze
- Normalize data transparently; pre-register analysis choices and fitting ranges.
- Compute primary metrics and uncertainty estimates.
- Compare candidate mechanisms using the same data splits and controls.
- Inspect residuals for systematic deviations that indicate missing physics.
- Separate descriptive results from mechanistic interpretation.

**Decision Gate 2 — Mechanism Exclusion:** If controls show the same behavior as the test condition, treat the leading hypothesis as weakened and prioritize artifact or alternative explanations.

## Step 6: Discriminate and validate
- Classify evidence as supported, partially supported, inconclusive, or contradicted.
- Require orthogonal measurements (e.g., structural plus functional) before claiming mechanism support.
- Check confounders: drift, preparation history, boundary effects, model dependence, and probe insensitivity.
- Verify reproducibility across independent samples, regions, or runs.

**Decision Gate 3 — Robustness Check:** If results are not reproducible or confounders remain unresolved, stop claiming mechanism support and return to Step 4 to add orthogonal controls.

## Step 7: Iterate or terminate
- **If supported:** sharpen predictions with a stronger test or broader parameter space, then return to Step 4.
- **If partially supported:** split the response into regimes and propose regime-specific mechanisms, then return to Step 3.
- **If ambiguous:** add orthogonal controls that separate the remaining candidates, then return to Step 4.
- **If contradicted:** identify the failed assumption, revise the causal chain, and return to Step 2.
- **If artifact-dominated:** redesign the measurement protocol before revising scientific hypotheses, then return to Step 4.
- **Stop condition:** Terminate when the mechanism is supported by multiple independent controls, or when remaining candidates cannot be discriminated with available methods and the claim has been appropriately bounded.

# Output Format

Produce a structured research package containing:

1. **Research question** — Phenomenon, baseline expectation, and why the mechanism is uncertain.
2. **Mechanism map** — Candidate mechanisms, distinguishing predictions, and artifact hypotheses.
3. **Ranked hypotheses table** — For each: statement, evidence strength, key assumptions, minimal test, disconfirming observation, and boundary.
4. **Study design** — Variables, control set, metrics, decision rules, and stop conditions.
5. **Analysis plan** — Normalization, model comparison, uncertainty treatment, residual checks, and mechanism discrimination criteria.
6. **Iteration plan** — Actions for supported, partial, ambiguous, contradictory, and artifact-dominated outcomes.
7. **Validity and claim-boundary notes** — Confounders, reproducibility risks, extrapolation limits, and compliance constraints.

# Validation Gates

Before accepting any conclusion, verify:

- **Common-mode assumption:** Are targeted artifacts reproducible and comparable across conditions?
- **Isomorphism check:** Do test and control conditions differ only in the intended dimension?
- **Orthogonality check:** Are structural and functional readouts independently interpretable?
- **Statistical check:** Are uncertainty estimates sufficient to distinguish systematic bias from noise?
- **Control check:** Does every hypothesis have a corresponding disconfirming observation and matched control?

# Claim Boundaries

- Distinguish paper-supported methodological patterns from new-system inferences and speculative extensions.
- Do not treat a single study, simplified model, or source paper as field-wide consensus.
- Bound claims by the tested path, probe sensitivity, state window, and model assumptions.
- Avoid extrapolating from one material class, geometry, or measurement modality to another without stating required assumptions.

# Failure Modes

- Artifact or confounder dominates the signal.
- Variables are confounded (e.g., structural and interaction changes co-vary).
- Model overfitting or post-hoc scaling obscures missing physics.
- Low signal-to-noise or contrast prevents discrimination between bias and noise.
- Non-reproducibility across independent preparations or runs.
- Compensation or correction introduces new systematic bias.
- Inference exceeds the tested parameter window, path history, or probe resolution.

# Validity Checks

Before finalizing any plan or claim:

- The research question targets a mechanism, not merely reproduction of a known effect.
- Artifact hypotheses are included as first-class candidates.
- Each hypothesis has a minimal test and a disconfirming observation.
- Controls cover positive, negative, baseline, structural, reversibility, and replication dimensions.
- Normalization and fitting choices are pre-registered and theoretically justified.
- Safety, ethics, and compliance boundaries are stated for the specific domain.
- Paper-specific numerical values, sample recipes, or operational settings are excluded.
- Uncertainty, detection thresholds, reproducibility risks, and stop conditions are explicit.

# Provenance

- Synthesized from cluster 130.0 (end-to-end mechanism discovery and validation).
- Source skill references: interfacial-cross-coupling-exploration (82ef5eff5019cfc6), reaction-network-localization-exploration (047abac43fce4fd7), semiflexible-network-scaling-research (39132bded6d0f213), ferroelectric-liquid-crystal-research-design (bfe8a71dc5174b14), epitaxial-strain-gradient-flexoelectric-research (943a0da7327dd558), path-resolved-hidden-phase-boundary-discovery (337b7d843a9a04a3), associating-soft-matter-anomaly-workflow (f304519441f3f495), common-mode-balanced-precision-interrogation (2ceceaad14a2ebed).
