---
name: sci-quantum-observable-driven-mechanism-discovery-workf-d06c7d7a
description: A reusable workflow for proposing, validating, and iterating mechanism hypotheses from multi-modal observables in quantum, transport, and laser-driven systems, with explicit claim boundaries and assumption-sensitivity controls.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 17"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent to transform ambiguous or anomalous observables into testable mechanism hypotheses, validate them through controlled cross-observable analysis and model auditing, and iterate while bounding claims, without relying on source-specific parameters or single-study conclusions.

## When to use

Use when the user needs to design research questions or validation plans where hidden mechanisms must be inferred from indirect observables—such as spectra, emission traces, transport coefficients, structure factors, or interference patterns—especially when competing definitions, model assumptions, or mechanism interpretations exist. Do not use for operational laboratory protocols, safety-critical procedures, fabrication recipes, or as a substitute for domain-specific peer review and institutional safety oversight.

## Inputs required

Before generating a plan, collect or request:

- **Target system class and regime:** material or platform family, relevant phase or state region, and known limiting behavior.
- **Observable inventory:** available data types (e.g., spectral, temporal, spatial, transport, imaging) and their known relationship to hidden variables.
- **Candidate frameworks:** theoretical models, phenomenological descriptions, or null scaling laws that could explain the phenomenon.
- **Evidence map:** prior measurements, simulations, or domain knowledge, explicitly separated from the current gap.
- **Constraints:** non-operational boundaries on validation depth, reproducibility requirements, and acceptable model complexity.

## Core Workflow

1. **Claim and causal chain audit** — Map the proposed outcome onto a chain: primary process → intermediate state → observable. Explicitly list assumptions at each transition. Rank assumptions by impact and plausibility.
   - *Decision gate:* If the causal chain cannot be articulated or lacks a testable observable proxy, stop and reformulate the research question.

2. **Definition and observable audit** — Separate conceptual quantities from their operational estimators. Distinguish raw measurements, corrected data, and model-inferred quantities. Verify dimensional consistency and limiting behavior.
   - *Decision gate:* If key quantities have inconsistent definitions across theory and data, return to step 1 before proceeding.

3. **Hypothesis generation with mechanism discrimination** — Generate competing hypotheses (target mechanism, conventional alternative, dynamical/artifact, and mixed-state). For each, specify predicted signature, evidence strength, key assumptions, discriminating test, likely failure mode, and boundary conditions.
   - *Decision gate:* If hypotheses cannot be discriminated by plausible observables or controls, redesign the observable set or mark the question as underdetermined.

4. **Minimal validation design** — Define conceptual independent variables, dependent variables, and nuisance variables. Specify baseline, candidate, positive, negative, mechanism, and boundary controls. Pre-register stop conditions (e.g., negative control matches test signal, calibration uncertainty dominates, nonstationarity persists).
   - *Decision gate:* If controls cannot isolate the mechanism from confounders, flag the hypothesis as provisional and require additional diagnostics.

5. **Cross-observable analysis and model audit** — Triangulate independent routes to the same concept. Compare time-domain, frequency-domain, transport, and structural observables for consistency. Audit forward models for physical consistency. Fit interpretable reduced models before complex simulations.
   - *Decision gate:* If cross-observable comparisons contradict the hypothesis or dimensional checks fail, reject or reformulate the proposed relation.

6. **Assumption-sensitivity and robustness probe** — Perturb one assumption class at a time (e.g., geometry, material response, transport, loss, background treatment). Propagate changes through the causal chain. Test stability across model variants, fitting windows, and correction schemes.
   - *Decision gate:* If the claim collapses under a plausible alternative assumption, downgrade evidence strength and narrow claim boundaries.

7. **Regime classification and claim bounding** — Classify results as supported, ambiguous, contradicted, boundary-limited, or outside the model’s valid regime. Bound all claims to the tested system class, state region, and model assumptions. Label conclusions as directly observed, model-inferred, or speculative.
   - *Decision gate:* If results require extrapolation beyond tested boundaries, enforce claim boundaries and mandate independent validation before generalization.

8. **Iteration or redesign** — Based on accumulated evidence, classify the next step:
   - **Pursue:** robust across controls and sensitivity checks.
   - **Revise:** plausible mechanism remains but needs narrower regime or additional controls.
   - **Deprioritize:** outcome is highly assumption-dependent with weak diagnostic discrimination.
   - **Reject:** core mechanism fails under credible assumptions or controls fail.
   - *Stop conditions:* Halt if predefined failure criteria are met (e.g., proxy signal is ambiguous, competing mechanisms fit equally well, or source instability dominates). Otherwise, loop back to step 3 or 1 with updated hypotheses.

## Output Format

Return the research plan in this structure:

1. **Research question** — concise question, domain scope, and significance.
2. **Evidence map** — established facts, domain support, and speculative extensions.
3. **Hypotheses table** — hypothesis, mechanism, predicted signature, evidence strength, key assumptions, discriminating test, likely failure mode, and boundary.
4. **Minimal validation design** — variables, controls, observables, metrics, and stop conditions.
5. **Analysis plan** — definition checks, cross-observable comparisons, model audits, sensitivity tests, uncertainty treatment, and visualization strategy.
6. **Iteration plan** — rules for strengthening, splitting, downgrading, reframing, or rejecting hypotheses based on outcomes.
7. **Validity and boundary statement** — main confounders, reproducibility checks, extrapolation limits, and non-operational safety constraints.

## Validation Gates

- **Definition validity:** Quantities are defined consistently across theory, data, and comparison studies.
- **Dimensional validity:** Proposed relations have correct units and sensible limiting behavior.
- **Estimator validity:** Operational definitions measure the same conceptual quantity within uncertainty.
- **Control adequacy:** Baseline, positive, negative, mechanism, and boundary controls are specified and executed.
- **Cross-observable consistency:** Independent observables agree on the inferred mechanism or reveal contradictions.
- **Assumption-sensitivity pass:** The claim survives perturbation of the highest-impact hidden assumptions.
- **Statistical validity:** Uncertainties are propagated and model improvement is meaningful relative to added complexity.
- **Reproducibility:** Analysis choices, model inputs, and exclusion criteria are documented for independent rerun.

## Claim Boundaries

- **Directly observed:** Raw or minimally corrected measurements.
- **Model-inferred:** Quantities derived from an audited forward model with stated assumptions.
- **Extrapolated:** Extensions to untested regimes, systems, or scales requiring explicit assumptions.
- **Speculative:** Conceptual predictions without current discriminating evidence.
- Do not treat single-study or single-system results as field-wide consensus. Label agent-inferred extensions separately from paper-supported methodological precedents.

## Failure Modes

- **Confounder dominance:** Background, detector response, geometry, or calibration artifacts explain the signature.
- **Assumption dependence:** The claim collapses when a simplifying assumption is relaxed.
- **Underdetermination:** Multiple mechanisms or models fit the data equally well.
- **Boundary limitation:** Finite size, resolution limits, nonstationarity, or transient effects constrain interpretation.
- **Proxy misidentification:** The observable is not primarily generated by the hypothesized hidden process.
- **Model misspecification:** The forward model omits competing processes or uses inconsistent physical dependencies.

## Validity Checks

Before presenting conclusions, verify:

- **Task fit:** The problem genuinely involves mechanism inference from indirect observables.
- **Mechanism clarity:** The causal chain, observable proxy, and discriminating signature are distinct.
- **Control completeness:** All planned controls are included or their absence is justified.
- **Evidence separation:** Source-supported observations, new-system inferences, and extrapolated claims are labeled separately.
- **Confounding factors:** Instrument response, background, boundary effects, and preprocessing artifacts are considered.
- **Reproducibility:** Selection criteria, calibration assumptions, model inputs, and residuals are documented.
- **Boundary conditions:** Regime limits and extrapolation risks are stated explicitly.
- **Alternative models:** Plausible competing mechanisms have been tested or explicitly ruled out.
- **Consensus discipline:** A single analysis or dataset is not presented as settled consensus.

## Provenance

Synthesized from cluster 197 / subcluster 197.0. Derived from source skills: `condensed-matter-relaxation-dynamics-workflow`, `superfluid-turbulent-domain-scale-exploration`, `phase-programmable-polaritonic-interference-skill`, `radiative-divertor-research-planning`, `hadron-spectroscopy-exotic-research-design`, `ultrafast-spectroscopy-model-audit`, `ultrafast-secondary-emission-transport-workflow`, `laser-plasma-assumption-sensitivity-workflow`.
