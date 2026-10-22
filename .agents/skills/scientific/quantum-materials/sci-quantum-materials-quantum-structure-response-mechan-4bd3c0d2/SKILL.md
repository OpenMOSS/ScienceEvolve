---
name: sci-quantum-materials-quantum-structure-response-mechan-4bd3c0d2
description: A reusable end-to-end workflow for discovering and validating quantum mechanical mechanisms in materials and condensed-matter systems through symmetry-aware hypothesis generation, controlled model comparison, and iterative evidence anchoring.
scienceevolve-title: "Quantum materials and condensed matter · materials quantum structure response mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents through a systematic, transferable workflow to identify why a baseline theoretical or computational model fails to explain a materials or quantum-response observable, generate competing mechanism hypotheses constrained by symmetry and conservation laws, and validate them via controlled comparisons against independent constraints.

## When to use

Use this skill when:
- A baseline electronic-structure, continuum, effective-field, or collective-mode model fails to explain spectral, magnetic, transport, structural, or resonance observables.
- The task requires generating falsifiable mechanism hypotheses rather than summarizing literature.
- The user asks to design controlled computational or theoretical validation plans with explicit decision gates.
- Competing symmetries, order parameters, coupling channels, or correlation effects may drive the observed behavior.

Do not use this skill for:
- Operational laboratory procedures, synthesis recipes, device fabrication, or hazardous materials handling.
- Generic literature reviews without a mechanism-discovery or validation-design goal.
- Direct engineering specifications or safety-critical design claims.

## Inputs required

Before producing a research plan, request or identify:

1. **Target system class**: material family, symmetry constraints, or abstract quantum system.
2. **Anomalous observable**: the specific response, spectrum, phase transition, or low-energy feature not explained by baseline theory.
3. **Baseline model status**: what current models reproduce and where they fail (energy placement, spectral weight, topology, response function, etc.).
4. **Available constraints**: independent data, benchmark systems, known analytic limits, or prior calculations not to be used for tuning.
5. **Candidate mechanisms**: plausible missing interactions, symmetry breakings, coupling channels, or correlation effects.
6. **Intended output**: hypothesis list, validation plan, analysis roadmap, or iteration strategy.

If inputs are missing, state assumptions explicitly and mark conclusions as provisional.

## Core Workflow

Execute the following ordered route. At each decision gate, choose to **proceed**, **revise**, or **stop**.

1. **Anomaly definition and baseline mapping**
   - Define the unresolved observable and separate primary anomalies from secondary symptoms.
   - Document what accepted baseline models reproduce and where they fail.
   - **Decision gate**: Is the anomaly well-defined and the baseline reproducible under its stated assumptions? If not, stop and refine inputs.

2. **Symmetry framing and gap localization**
   - Identify the relevant spacetime, internal, gauge, and conservation-law symmetries.
   - Locate the likely missing degree of freedom (localized states, order parameters, coupling channels, or response-function softening).
   - Check representation conventions and invariant quantities before comparing parameters.
   - **Decision gate**: Is the symmetry framework self-consistent and the gap localized to a specific mechanism? If not, revisit assumptions.

3. **Mechanism hypothesis generation**
   - Propose competing hypotheses that explain the gap via specific symmetry changes, coupling pathways, or correlation effects.
   - For each hypothesis record: statement, expected observable change, key assumptions, evidence strength (low/moderate/strong/mechanistic/field-level), secondary predictions, failure modes, and a discriminating test.
   - **Decision gate**: Are hypotheses falsifiable, symmetry-consistent, and discriminated by at least two observables? If not, reformulate.

4. **Control hierarchy design**
   - **Baseline control**: reproduce accepted reference behavior before adding the candidate mechanism.
   - **Model-pair / mechanism control**: compare models differing mainly by the candidate mechanism while holding other choices fixed.
   - **Negative control**: a case where the mechanism should be absent or suppressed.
   - **Positive / benchmark control**: a known case where the mechanism or observable is established.
   - **Sensitivity control**: vary uncertain assumptions, reference states, or approximation order.
   - **Decision gate**: Are controls independent, matched, and feasible? If not, redesign.

5. **Layered execution and independent validation**
   - Compute in layers: verify simplified limits and dominant contributions before adding corrections.
   - Validate against at least one independent constraint not used to motivate or fit the mechanism.
   - Check algebraic consistency, convergence, and conservation laws at each layer.
   - **Decision gate**: Do independent constraints agree with the hypothesis prediction? If not, downgrade evidence strength or pivot to a competing hypothesis.

6. **Analysis and mechanistic linkage**
   - Compare the same observables across model variants using matched reference frames.
   - Connect candidate interactions to observed shifts in spectral weight, response functions, or order parameters.
   - Verify secondary predictions; if only the primary fitted feature improves, downgrade evidence.
   - **Decision gate**: Do secondary predictions and cross-model comparisons align? If not, revise the hypothesis.

7. **Robustness and boundary assessment**
   - Test sensitivity to assumptions, geometry, finite-size effects, truncation order, and numerical parameters.
   - Mark trusted, marginal, and invalid regimes of the model or phase diagram.
   - **Decision gate**: Are conclusions stable under reasonable variations? If not, bound claims tightly or stop.

8. **Claim bounding and iteration decision**
   - Classify each conclusion as: verified model behavior, supported inference, agent-generated inference, or speculative extrapolation.
   - Decide next action:
     - **Proceed** to stronger controls or broader benchmarks if evidence aligns.
     - **Revise** the hypothesis or model hierarchy if a specific failure layer is identified.
     - **Stop** if the baseline is irreproducible, the mechanism only fits a tuned feature, independent constraints contradict predictions, competing mechanisms remain indistinguishable, or the interpretation exceeds the model's valid regime.
   - If iterating, return to Step 3 or 4 with updated evidence and narrower scope.

## Output Format

Produce a structured research plan containing:

1. **Research target** — system class, anomalous observable, and baseline gap.
2. **Hypothesis set** — table with mechanism, evidence strength, assumptions, expected changes, failure modes, and discriminating tests.
3. **Design plan** — primary factors, control hierarchy, evaluation metrics, and minimal viable validation.
4. **Analysis plan** — baseline verification, matched comparison strategy, mechanistic linkage, robustness checks, and uncertainty handling.
5. **Iteration recommendation** — most informative next test, and conditions for continuing, pivoting, or stopping.
6. **Validity and safety statement** — confounders considered, evidence limits, and non-operational safety boundary.

## Validation Gates

Before finalizing any plan or claim, verify:

- **Trigger validity**: the task concerns mechanism discovery and model validation, not generic summarization.
- **Mechanism validity**: the proposed mechanism directly addresses the identified baseline gap.
- **Control validity**: baseline, negative, positive/benchmark, and sensitivity controls are included.
- **Constraint validity**: validation relies on independent data not used to tune the mechanism.
- **Symmetry validity**: symmetries, conservation laws, and representation conventions are respected and documented.
- **Reproducibility validity**: inputs, approximations, diagnostics, and failure criteria are documented for qualified reproduction.
- **Boundary validity**: claims do not generalize beyond the validated regime without broader evidence.
- **Confounder validity**: structural choices, reference-state approximations, numerical convergence, and competing channels are considered.
- **Safety validity**: no operational instructions for hazardous or regulated materials are included.

## Claim Boundaries

Distinguish strictly between:

- **Verified model behavior**: follows directly from the equations, approximations, and controlled checks within the validated regime.
- **Supported inference**: aligns with independent observables, benchmarks, or cross-model agreement.
- **Agent-generated inference**: a new hypothesis or design choice proposed for a different system; requires independent validation.
- **Speculative extrapolation**: plausible but untested beyond the current symmetry, equilibrium, or scale assumptions.

Do not treat a single source paper’s demonstration, a single benchmark, or one microscopic model as field-wide consensus.

## Failure Modes

Common failure modes that should trigger revision or stopping:

- The baseline model cannot be reproduced under its own stated assumptions.
- The candidate mechanism improves only the feature used to motivate it, with no improvement in independent constraints.
- Independent constraints contradict the mechanism’s predictions.
- Competing mechanisms produce indistinguishable observables within current resolution.
- Numerical artifacts, ill-conditioned transformations, or unconverged quantities dominate the predicted signal.
- The model violates known analytic limits, conservation laws, or symmetry constraints.
- Negative or benchmark controls fail without a plausible explanation.
- Results depend sensitively on arbitrary numerical choices, reference states, or untested truncation orders.
- The target regime violates core assumptions of the model (e.g., scale separation, small-amplitude, near-equilibrium).

## Validity Checks

Run this checklist before presenting conclusions:

- [ ] **Symmetry & representation**: conventions are explicit; equivalent parameter sets yield invariant predictions.
- [ ] **Control independence**: baseline, mechanism, negative, and positive controls are matched and do not share tuning data.
- [ ] **Convergence**: numerical, basis, sampling, and self-consistency convergence are sufficient for the claimed observable.
- [ ] **Attribution**: improvement is traced to the proposed mechanism rather than unrelated model changes or fitting flexibility.
- [ ] **Secondary predictions**: at least one consequence beyond the fitted feature was checked.
- [ ] **Robustness**: conclusions remain stable under reasonable changes in assumptions, geometry, or approximation order.
- [ ] **External validity**: extrapolations to new materials, regimes, or broader classes are labeled and justified.
- [ ] **Reproducibility**: model hierarchy, inputs, diagnostics, and stop conditions are documented.

## Provenance

- **Cluster**: 166 / subcluster 166.0
- **Workflow archetype**: symmetry-guided mechanism discovery and validation
- **Source skills synthesized**:
  - `ab788a97777db267` — correlated-electronic-structure-exploration
  - `97997f02d5290ce4` — electron-phonon-nonadiabatic-method-design
  - `458553a4c1cd7a20` — symmetry-competition-continuum-modeling
  - `db56ad2319ba0d1c` — dft-rpa-research-workflow
  - `4c4a08f70b63a6a2` — carbon-nanomaterial-magnetic-screening
  - `6fb7871c142dabbe` — rare-earth-crystal-field-magnetic-exploration
  - `5287e6a6cbd9cafb` — nuclear-electron-resonance-exploration
  - `c134163108c29399` — symmetry-guided-eft-exploration
