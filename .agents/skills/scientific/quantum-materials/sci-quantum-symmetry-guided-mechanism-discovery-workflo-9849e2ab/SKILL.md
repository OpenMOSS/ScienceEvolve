---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-9849e2ab
description: A reusable end-to-end workflow for discovering and validating physical mechanisms by comparing symmetry-constrained models against baseline predictions, using controlled minimal validation, multi-model discrimination, and iterative evidence grading.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 32"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Turn a theoretical or phenomenological gap into a reproducible research program. Use symmetry principles, covariance constraints, or conservation laws to generate falsifiable mechanism hypotheses, design discriminating tests against baseline and alternative explanations, and iterate until claims are explicitly bounded by evidence strength and domain of validity.

## When to use

Use this skill when:

- A baseline model, reduced description, or standard framework fails to explain observed or simulated behavior in a domain governed by symmetries, conservation laws, or transformation constraints.
- You need to compare formally related definitions, regimes, channels, or limits (e.g., Euclidean vs Lorentzian, perturbative vs nonperturbative, near-threshold vs asymptotic).
- You suspect hidden degrees of freedom, coupled channels, internal modes, or slow corrections are responsible for a mismatch.
- You must design a non-operational validation plan with explicit controls, stopping conditions, and claim boundaries.

Do not use this skill for:

- Ordinary literature summarization or broad domain review.
- Operational lab recipes, hazardous protocols, fabrication parameters, or executable hardware instructions.
- General-purpose tutoring unrelated to mechanism discrimination.

## Inputs required

Before generating a research plan, identify or request:

- **Target system and regime:** degrees of freedom, relevant symmetry group, interaction scale, and expected validity range of the baseline.
- **Baseline framework:** the established model, effective theory, or reduced description and the assumptions it relies on.
- **Gap or mismatch:** the observed or expected behavior the baseline cannot reproduce, and the observable that exposes the failure.
- **Symmetry and constraint context:** exact and approximate symmetries, conservation laws, selection rules, or covariance requirements that organize the model space.
- **Candidate observables:** primary measurements and structural probes sensitive to the suspected mechanism.
- **Validation resources:** available analytical tools, simulations, benchmarks, data access, compute limits, and reproducibility requirements.
- **Provenance scope:** which elements are inherited from prior literature and which are new agent-generated hypotheses.

## Core Workflow

Follow this ordered route. Do not skip decision gates or stopping conditions.

### Step 1: Frame the gap and formal relation

1. State the baseline model and its domain of validity.
2. Define the mismatch, equivalence question, or missing behavior in terms of specific observables.
3. State what would count as a genuine mechanism discovery versus a numerical or definitional artifact.

### Step 2: Symmetry-organize the hypothesis space

1. Use justified symmetries, conservation laws, or transformation constraints to enumerate allowed mechanisms and reduce model freedom.
2. Map candidate hidden variables, coupled channels, internal modes, correction terms, or contour/domain effects that could produce the mismatch.
3. Produce a ranked hypothesis table for each candidate:
   - **Claim:** falsifiable statement about the mechanism.
   - **Evidence strength:** High, Medium, Low, or Pending.
   - **Key assumptions:** premises required for the claim.
   - **Likely failure modes:** what could invalidate it.
   - **Boundary conditions:** where it should and should not generalize.
   - **Discriminating tests:** observations that distinguish it from alternatives.

**Decision Gate 1:** Are the hypotheses falsifiable with accessible observables?  
- If **no**, return to Step 2 to broaden the observable set or narrow the claim.  
- If **yes**, proceed.

### Step 3: Build a minimal viable validation system

1. Choose the smallest model, comparison, or regime that still preserves the suspected mechanism.
2. Define a model hierarchy:
   - **Baseline model:** the standard framework without the proposed extension.
   - **Extended model:** adds one physically motivated ingredient at a time.
   - **Alternative mechanism model:** tests a competing non-pole, artifact, or background explanation.
3. Avoid copying paper-specific parameters, dimensions, sizes, or action terms unless the user explicitly requests reproduction.

### Step 4: Design controls, observables, and stopping conditions

1. **Controls**
   - **Strong control:** compare baseline and extended under identical observable definitions, error estimation, and convergence diagnostics.
   - **Negative control:** a regime or observable where the proposed mechanism should be absent or suppressed.
   - **Positive control:** a regime or observable where the mechanism should appear.
   - **Method control:** independent sampling, initialization, resolution, or analytic limit checks.
   - **Finite-size / resolution / boundary control:** vary system complexity or discretization to separate mechanism changes from artifacts.
2. **Observables**
   - Select symmetry-allowed primary observables tied to the research question.
   - Add at least one structural probe sensitive to the suspected mechanism (e.g., dominance changes, phase interference, contour relevance, correlation geometry, scaling drift).
   - Define success criteria before interpreting results.
3. **Stopping conditions**
   Stop or revise if:
   - numerical instability prevents reliable interpretation;
   - the mechanism candidate set is incomplete;
   - positive controls fail;
   - negative controls show artificial differences;
   - finite-size, resolution, or fit-window trends contradict the intended extrapolation;
   - results depend on undocumented implementation choices.

**Decision Gate 2:** Are controls sufficient and stopping conditions defined before data collection or simulation?  
- If **no**, refine Step 4.  
- If **yes**, proceed.

### Step 5: Execute comparison and collect evidence

1. Run the baseline, extended, and alternative models under the defined control conditions.
2. Collect primary observables and structural probes.
3. Document all analysis choices (fit windows, filters, coarse-graining, randomization, boundary treatment).

### Step 6: Mechanism-validation analysis loop

1. **Definition check:** confirm that comparisons use the same variable conventions, symmetry assumptions, boundary conditions, and observable definitions.
2. **Limit check:** verify that the extended model reduces to the baseline in the regime where the baseline is valid. Agreement in a limit supports consistency but does not prove full equivalence.
3. **Mechanism check:** determine whether observed differences align with a specific mechanism rather than an artifact.
4. **Error check:** compare observed differences against statistical, systematic, finite-size, and sampling errors. Treat unstable or underdiagnosed results as Pending.
5. **Structural-probe check:** use diagnostics to infer whether dominant configurations or mechanisms changed. Prefer explanations supported by both primary observables and structural probes.
6. **Evidence grading:**
   - **High:** multiple observables, multiple regions, independent checks, and stable errors support the same conclusion.
   - **Medium:** the main effect is stable, but coverage is limited to a simplified model or restricted region.
   - **Low:** evidence relies on one observable, one region, formal reasoning, or unverified extrapolation.
   - **Pending:** error structure, mechanism closure, or reproducibility is insufficient.

**Decision Gate 3:** Does the evidence meet minimum strength (Medium or higher) to support a mechanism claim?  
- If **Pending**, refine diagnostics, add controls, or stop.  
- If **yes**, proceed to iteration.

### Step 7: Iterate, extrapolate, or terminate

1. **If the extended model succeeds and controls are robust:** strengthen the mechanism hypothesis, document which alternatives were ruled out, and propose complementary-channel or higher-resolution corroboration.
2. **If divergence appears only in one observable or region:** lower evidence strength, add structural probes or method controls, and avoid generalization.
3. **If positive controls fail:** improve sensitivity before interpreting the main comparison.
4. **If negative controls fail:** treat all apparent differences as suspect until the analysis pipeline is corrected.
5. **If an alternative mechanism fits equally well:** present the interpretation as ambiguous and design a discriminating test.
6. **If extrapolating to a new system or regime:** revalidate the symmetry basis, thresholds, available observables, and known failure modes; do not transfer numerical values or conditions mechanically.

**Stop conditions (terminal):**
- The candidate signal disappears under reasonable background or model variations.
- The model requires unjustified tuning or omits channels/variables that could dominate the conclusion.
- Conclusions depend on a single dataset, observable, or undocumented implementation choice.

## Output Format

When using this skill, produce:

1. **Research question and gap statement**
   - Baseline model, mismatch, and what would constitute mechanism validation.

2. **Ranked hypotheses table**
   - Claim, mechanism, evidence strength, key assumptions, likely failure modes, boundary conditions, and discriminating tests.

3. **Validation design**
   - Minimal viable system, model hierarchy (baseline, extended, alternative), control variables, strong/negative/positive/method controls, primary observables, structural probes, success criteria, and stopping conditions.

4. **Analysis plan**
   - Definition checks, limit checks, mechanism checks, error checks, structural-probe checks, and evidence grading rules.

5. **Iteration plan**
   - How results update, narrow, reframe, or reject hypotheses, and what triggers redesign or stopping.

6. **Validity and boundary statement**
   - Main confounders, reproducibility risks, extrapolation limits, and what remains unverified.

## Validation Gates

- **Gate 1 — Hypothesis falsifiability:** Every mechanism claim must be paired with an observable that could weaken or refute it.
- **Gate 2 — Control sufficiency:** At least one strong control, one negative control, one positive control, and explicit stopping conditions must be defined before interpreting results.
- **Gate 3 — Mechanism closure:** Evidence must be graded and must not rely solely on a single observable, fit window, or realization.
- **Gate 4 — Extrapolation justification:** Claims about untested regimes, systems, or limits require independent revalidation of symmetry assumptions and channel basis; they cannot be transferred mechanically.

## Claim Boundaries

- Distinguish **structural claims** (what symmetries allow), **quantitative claims** (magnitude of an effect), and **extrapolated claims** (untested regimes).
- Label prior-paper findings, agent-generated hypotheses, and speculative extensions distinctly.
- Do not present a single simplified-model study as consensus for an entire field.
- Do not generalize beyond the tested model family or regime without explicit justification.
- State the domain of validity clearly (e.g., mass region, energy range, time scale, resolution, coarse-graining scale).

## Failure Modes

- **Hidden artifacts:** initialization bias, finite-size or resolution effects, boundary artifacts, fit-window selection, discretization limits, or late-time measurement degradation.
- **Confounding:** alternative mechanisms explain the same signature; dissipation mimics memory; continuum or threshold cusp mimics resonance; background leakage mimics signal.
- **Overfitting:** added flexibility from an extended model masquerades as a physical mechanism.
- **False equivalence:** agreement in a common limit or one observable does not prove full nonperturbative equivalence.
- **Symmetry overreach:** approximate symmetry constraints introduce long-time or off-shell artifacts if treated as exact.
- **Undocumented sensitivity:** results depend on implementation choices, cuts, or coarse-graining not captured in controls.

## Validity Checks

Before presenting conclusions, verify:

- **Assumption audit:** Which premises come from established theory, which are modeling choices, and which are speculative extensions?
- **Control audit:** Are strong, negative, positive, and method controls present and justified?
- **Reproducibility:** Are model definitions, observable definitions, fit windows, randomization choices, and comparison criteria documented?
- **Robustness:** Do conclusions survive changes in model form, data selection, resolution, fit range, and background description?
- **Boundary conditions:** Are regime limits, symmetry approximations, and channel accessibility stated as explicit inference limits?
- **Evidence separation:** Are published findings, model inference, and speculative extension labeled separately?
- **Single-paper boundary:** Is the source work treated as a methodological template rather than field-wide consensus?

## Provenance

- Synthesized from cluster 191.0 (symmetry-guided mechanism discovery and validation).
- Source skills: matrix-model-equivalence-exploration; internal-mode-collective-research; near-threshold-coupled-channel-research; axion-string-scaling-exploration; nuclear-cluster-state-exploration; cross-channel-constrained-research-design; two-photon-azimuthal-observables-research; galilei-covariant-open-quantum-research.
