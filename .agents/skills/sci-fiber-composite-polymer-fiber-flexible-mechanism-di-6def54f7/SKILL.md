---
name: sci-fiber-composite-polymer-fiber-flexible-mechanism-di-6def54f7
description: A reusable end-to-end workflow for discovering and validating structure-property mechanisms in composite, polymer, fiber, and flexible material systems through hypothesis-driven experimentation and layered analysis.
scienceevolve-title: "Fiber composites and battery materials · composite polymer fiber flexible mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent design a complete research program to discover and validate mechanisms in composite, polymer, fiber, and flexible material systems. The workflow abstracts transferable methodology from materials research: frame a design gap, generate mechanism-linked hypotheses, design controlled validation with minimal viable experiments, analyze results across linked length scales, and iterate based on evidence without copying any single paper's specific system.

# When to use

Use this skill when the user asks to:
- Design new research questions for composite, polymer, fiber, textile, or flexible material systems.
- Generate hypotheses linking architecture, formulation, processing, or interface strategy to properties.
- Plan experiments with proper controls, metrics, and stop conditions.
- Analyze multi-scale or multi-physics data to discriminate competing mechanisms.
- Iterate or redesign studies based on failure modes and boundary conditions.

Do not use this skill to provide operational lab recipes, clinical or therapeutic recommendations, unsafe experimental instructions, or product-deployment guidance without appropriate oversight.

# Inputs required

Ask the user or environment for:
- Target material class and application context.
- Performance bottleneck or design gap.
- Candidate variables (e.g., architecture, formulation, filler/fiber identity, interface strategy, processing category).
- Available measurement and characterization capabilities.
- Safety, environmental, and regulatory constraints.
- Prior evidence and its strength relative to the proposed system.
- Desired output: research questions, hypotheses, experimental plan, analysis plan, or iteration strategy.

If critical inputs are missing, state assumptions explicitly and mark resulting hypotheses as provisional.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

## 1. Frame the design gap and mechanism space
- Define the functional target and the performance bottleneck under realistic use conditions.
- Map candidate variables to plausible mechanisms (e.g., interface control, dispersion, network formation, orientation, polarization, percolation).
- Label prior evidence as verified, mechanism-plausible, or speculative.
- **Decision Gate 1:** If the gap cannot be addressed by controlled variation of measurable variables, stop and refine the research question.

## 2. Generate mechanism-linked hypotheses
- Produce 3–5 hypotheses, each connecting a design lever to a structure-property outcome.
- For each hypothesis specify: proposed mechanism, expected trend (monotonic, peaked, thresholded), evidence strength, key assumptions, likely failure modes, and a minimal falsification test.
- Prioritize hypotheses that are falsifiable with the smallest credible experiment and that include strong controls.
- **Iteration/Stop:** If no falsifiable hypothesis emerges, return to Step 1 to narrow the gap or redefine variables.

## 3. Design minimal viable validation
- Select independent variables, dependent variables (primary, coupled, mechanistic), and context variables at a non-operational design level.
- Define controls: baseline (no enhancement), benchmark (established practice), negative (expected failure), positive (known working), and ablation or mechanism-specific controls.
- Specify metrics, sample-identity tracking, replicate structure, and environmental bounds.
- Define stop conditions before data collection (e.g., controls fail, safety uncertainty, unacceptable trade-offs).
- **Decision Gate 2:** Do not proceed if controls are inadequate or if the design cannot separate mechanism from artifact.

## 4. Execute and collect layered data
- Gather data across linked layers: processability → morphology/structure → transport/properties → performance/robustness.
- Record batch metadata, replicate structure, deviations, and environmental conditions.
- Monitor for confounding (e.g., moisture, contact artifacts, batch drift, geometry effects).

## 5. Analyze and discriminate mechanisms
- Check process and morphology validity first; flag batch variability or sample defects before interpreting higher-level data.
- Analyze structure and interface evidence.
- Evaluate primary and coupled responses against all controls.
- Use multi-signal consistency (e.g., morphology + transport + functional response) to discriminate mechanism from artifact.
- **Decision Gate 3:** If signals conflict, add targeted discriminating experiments rather than forcing a single conclusion.

## 6. Bound claims and validate
- Separate observations from inferences and label evidence strength.
- Limit claims to the tested design space (material class, composition range, environmental conditions).
- Confirm reproducibility across replicates or batches.
- **Stop condition:** If variability exceeds effect size or if coupled properties degrade beyond acceptable limits, halt escalation.

## 7. Iterate, pivot, or stop
- **Continue:** If the hypothesis is supported and coherent across layers, narrow the design space and test robustness under additional conditions.
- **Pivot:** If the trend is nonlinear, disappears under stricter controls, or contradicts the proposed mechanism, reformulate the hypothesis and test competing explanations (e.g., diffusion limitation, artifact, alternative microstructural cause).
- **Stop:** If the candidate consistently underperforms baseline, if safety or ethical boundaries are breached, or if repeated iterations fail to reduce uncertainty.

# Output Format

When using this skill, return a structured research plan containing:

1. **Task framing** — research question, bottleneck, gap motivation, and boundary conditions.
2. **Hypothesis portfolio** — 3–5 ranked hypotheses with mechanism, evidence strength, key assumptions, failure modes, and minimal falsification tests.
3. **Experimental design** — variables, controls, metrics, replicate plan, and stop conditions.
4. **Analysis plan** — layered analysis sequence, mechanism-discrimination logic, and uncertainty handling.
5. **Iteration strategy** — decision rules for continue, pivot, or stop under each likely outcome.
6. **Validity and boundary notes** — confounders, reproducibility checks, claim limits, and safety constraints.

# Validation Gates

- **Gate 1 — Mechanism discriminability:** The gap must be addressable by controlled variation of measurable variables.
- **Gate 2 — Control adequacy:** Baseline, benchmark, and mechanism-specific controls must be defined and expected to behave distinctly.
- **Gate 3 — Cross-layer coherence:** Morphology, structure, and property trends must align before accepting a mechanism.
- **Gate 4 — Reproducibility:** Replicate or batch variation must not obscure the effect of interest.
- **Gate 5 — Safety and ethics review:** Human-facing, safety-critical, or environmentally hazardous claims require appropriate oversight and must not proceed unchecked.

# Claim Boundaries

- Distinguish paper-supported evidence from new-system inference and field consensus.
- Limit claims to tested material classes, formulation ranges, processing categories, and environmental conditions.
- Do not generalize from a single filler, fiber, matrix, or architecture to all related systems.
- Avoid application-readiness, product-performance, or clinical-benefit claims without dedicated validation and regulatory review.
- Treat literature comparisons as contextual rather than definitive proof.

# Failure Modes

- **Confounded variables:** Processing, geometry, or measurement effects co-vary with the intended factor.
- **Control failure:** Inadequate baseline or benchmark leads to artifactual trends.
- **Variability dominance:** High batch or measurement noise obscures true effects.
- **Mechanism misattribution:** Moisture, contact artifacts, porosity, or percolation effects are interpreted as intended filler/interface mechanisms.
- **Overfitting:** Best-case samples or outlier performance drive conclusions without replicate support.
- **Trade-off neglect:** A single metric improves while coupled properties (mechanical, thermal, environmental) degrade unacceptably.
- **Extrapolation:** Claims extend beyond the tested design space or material class.

# Validity Checks

Before finalizing a plan or conclusion, verify:
- **Confounding:** Material, processing, geometry, and measurement effects are separated.
- **Controls:** Baseline, benchmark, negative, positive, and ablation controls behave as expected.
- **Reproducibility:** Independent replicates, batch repeats, and transparent outlier handling are included.
- **Statistical validity:** Uncertainty is reported; rankings are avoided when differences fall within replicate spread.
- **Boundary conditions:** Conclusions are explicitly bounded by composition, loading, frequency, temperature, humidity, or other relevant environmental limits.
- **Mechanistic caution:** Alternative explanations are considered before claiming a single mechanism.
- **Evidence discipline:** Paper-supported findings are separated from new inferences.

# Provenance

- Synthesized from cluster 66, subcluster 66.0.
- Source skills: fiber__10.1002_adfm.75970, fiber__10.3390_jcs7020072, fiber__10.1177_15280837221094648, 2404.01992, fiber__10.1016_j.msec.2019.02.031, fiber__10.1177_09673911221122328, fiber__10.1016_j.compositesb.2018.11.111, fiber__10.1002_mame.202300296.
- Workflow archetype: end-to-end mechanism discovery and validation.
