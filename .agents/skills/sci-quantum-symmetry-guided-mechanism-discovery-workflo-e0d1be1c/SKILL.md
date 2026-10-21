---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-e0d1be1c
description: Use this skill when a hidden symmetry, order parameter, or phase mechanism must be inferred from indirect observables through controlled multi-probe experiments and iterative model discrimination.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 49"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent design a reusable, end-to-end research workflow for discovering and validating hidden mechanisms in quantum, correlated, or symmetry-broken systems when direct observation is infeasible. The workflow converts symmetry arguments into falsifiable proxy signatures, structures controls to separate mechanism from artifact, and iterates between hypothesis generation and evidence grading without embedding any material-specific protocol or paper conclusion.

# When to use

Use when the research question involves inferring an unobserved order parameter, symmetry property, topological invariant, collective phase, or hybrid excitation from secondary transport, spectroscopic, imaging, or response-map signatures. Applicable across quantum materials, spin systems, mesoscopic devices, defect-enabled platforms, and driven non-equilibrium phases. Do not use for direct operational laboratory protocols, fabrication recipes, or as a substitute for domain-specific safety review.

# Inputs required

Before generating a plan, collect or request:

- Target system class and known phases, symmetries, or Hamiltonian limits.
- Hidden mechanism, order parameter, or broken symmetry to be tested.
- Available measurement modalities and experimental constraints.
- Candidate proxy observables that should couple to the hidden mechanism.
- Known confounders, competing interpretations, and prior evidence strength.
- Desired output: hypothesis set, study design, analysis plan, or iteration roadmap.

If inputs are missing, state assumptions explicitly and separate high-confidence design elements from speculative ones.

# Core Workflow

## 1. Mechanism mapping
Define the hidden property and its symmetry implications. Derive predicted proxy signatures and their dependence on orientation, tuning variable, geometry, or state preparation. Map at least two competing mechanisms that could produce qualitatively similar signatures.

**Gate 1 — Proxy feasibility:** If no falsifiable proxy can be defined, stop and reformulate the research question.

## 2. Hypothesis generation
Generate a primary hypothesis and at least two alternatives. For each, specify:
- Mechanistic link between hidden property and proxy.
- Evidence strength (speculative, weak, moderate, strong, robust).
- Key assumptions and most likely failure modes.
- Predicted contrast relative to reference observables.

**Gate 2 — Discriminability:** If the primary hypothesis cannot be distinguished from alternatives using available proxies and controls, redesign the probe, tuning axis, or reference channel before proceeding.

## 3. Study design
Define independent variables (tuning axis, symmetry configuration, geometry). Define dependent variables (proxy signal, reference channel, normalized efficiency). Establish a control hierarchy:
- Baseline: no perturbation or neutral configuration.
- Positive: known regime that validates probe sensitivity.
- Negative: regime where the target mechanism should be absent or suppressed.
- Symmetry: condition where the predicted signature should vanish or invert.
- Artifact: tests for drift, contact effects, background, and instrumental offsets.
- Cross-probe: independent observable that should locate the same boundary if the mechanism is real.

Set minimal viable validation criteria, evaluation metrics, and stop conditions.

**Gate 3 — Control completeness:** If critical controls are infeasible, downgrade evidence expectations and flag residual ambiguity explicitly.

## 4. Data acquisition and preprocessing
Collect proxy and reference data under matched conditions. Preprocess transparently: record baseline windows, normalization rules, background treatment, and binning choices. Inspect raw data for drift, saturation, degradation, and sample-dependent artifacts before interpretation.

**Gate 4 — Quality:** If baseline instability, artifact level, or structural uncertainty exceeds the predicted effect size, stop and diagnose; do not proceed to mechanism discrimination.

## 5. Mechanism discrimination
Extract response features (trend, curvature, phase evolution, anisotropy, beating envelope). Compare observed patterns against predictions from each hypothesis. Evaluate whether controls suppress, invert, or mimic the signal. Classify evidence:
- **Supportive:** pattern, controls, and model agree.
- **Ambiguous:** anomaly exists but alternative explanations remain plausible.
- **Contradictory:** controls fail, prediction is missed, or signal disappears under repeated measurement.
- **Unsupported:** no reproducible anomaly beyond background variation.

**Gate 5 — Candidate selection:** If the primary hypothesis is contradicted by controls or pattern mismatch, pivot to the strongest alternative, redesign the experiment, or abandon the mechanism map.

## 6. Iteration or redesign
- **If supportive:** strengthen the hypothesis with orthogonal validation, expand the tuning range, or test explicit boundary conditions.
- **If ambiguous:** introduce an independent observable or structural constraint that breaks the degeneracy; prioritize reproducibility across independent samples.
- **If contradictory:** revise the mechanism map, proxy choice, or regime assumption; test whether confounders explain the data.
- **If artifact-dominated:** diagnose instrumentation, geometry, or sample quality before any scientific interpretation.

**Stop conditions**
- The signal reproducibly follows the predicted symmetry dependence and survives all controls.
- No reproducible effect remains after control subtraction and repeated measurement.
- Required controls fail or are infeasible.
- Structural or regime uncertainty prevents any interpretable pattern matching.

# Output Format

Return the following structure:

1. **Research question summary** — gap in understanding and why it matters.
2. **Mechanism map** — hidden property, coupling pathway, predicted proxy, and expected dependence.
3. **Ranked hypothesis table** — hypothesis, evidence strength, key assumptions, predicted signature, and failure modes.
4. **Study design concept** — variables, control hierarchy, metrics, and stop conditions.
5. **Analysis plan** — preprocessing rules, feature extraction, model comparison, and evidence grading criteria.
6. **Iteration roadmap** — update rules for supportive, ambiguous, contradictory, or artifact-dominated outcomes.
7. **Validity and boundary statement** — confounders, reproducibility requirements, scope limits, and safety constraints.

# Validation Gates

- **Proxy feasibility:** The hidden mechanism can be linked to a measurable, symmetry-dependent signature.
- **Discriminability:** The primary hypothesis predicts a distinct pattern from alternatives under the proposed design.
- **Control completeness:** Baseline, positive, negative, symmetry, artifact, and cross-probe controls are specified.
- **Regime validity:** The system is in an interpretable regime (e.g., coherent, ordered, symmetry-broken) before pattern matching.
- **Reproducibility:** Signatures are consistent across independent samples, cycles, or analysis pipelines.

# Claim Boundaries

- Limit claims to the tested control-variable ranges, sample conditions, and measurement regimes.
- Distinguish measured correlations from model-inferred mechanisms.
- Do not generalize single-system observations to entire material classes without comparative evidence.
- Label agent-inferred hypotheses separately from literature-supported facts.
- Avoid presenting a single-system pattern as a domain-wide rule.

# Failure Modes

- **Proxy misidentification:** The chosen observable is insensitive to the target mechanism or dominated by another channel.
- **Confounding dominance:** Artifacts, disorder, contacts, background, or environmental drift explain the signature.
- **Regime mismatch:** The system is not in the assumed coherent, ordered, or symmetry-broken state required for the model.
- **Control failure:** Negative or symmetry controls produce the same signal as the target configuration.
- **Overfitting:** Post-hoc model adjustments explain data without independent predictive power.
- **Irreversible changes:** Sample degradation, history effects, or conditioning masquerade as mechanism signatures.

# Validity Checks

- **Confounder audit:** Evaluate defects, strain, drift, calibration error, contact effects, thermal variation, disorder, and parasitic responses.
- **Structural validity:** Confirm that structural or symmetry assignments are independently constrained.
- **Statistical validity:** Use predefined primary observables, propagate uncertainty, and test sensitivity to analysis choices.
- **Model validity:** Ensure predictions derive from symmetry or plausible physical assumptions rather than post-hoc fitting.
- **Reproducibility:** Require independent samples, repeated cycles, and documented preprocessing for primary conclusions.
- **Boundary validity:** State whether the claim would fail under plausible alternative structure, orientation, or regime assumptions.

# Provenance

- Derived from cluster 58.1, workflow archetype *symmetry-guided mechanism discovery and validation*.
- Synthesized from source skills: `altermagnetic-spintronics-transport-inference`, `diamond-vacancy-emitter-research`, `nanotube-quantum-interference-workflow`, `cdw-non-equilibrium-order-probing`, `quantum-magnet-intermediate-phase-discovery`, `magnon-polaron-spin-transport-workflow`, `condensed-matter-dimensional-crossover-workflow`, `defect-motif-electronic-design`.
- Methodological pattern abstracted from peer-reviewed workflows; no paper-specific conclusions, numerical results, or operational parameters are embedded.
