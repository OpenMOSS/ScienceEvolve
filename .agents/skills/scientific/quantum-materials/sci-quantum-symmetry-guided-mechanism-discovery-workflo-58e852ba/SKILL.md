---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-58e852ba
description: A reusable end-to-end workflow for generating research questions, discriminating competing mechanisms, and validating symmetry-guided hypotheses across surface, phase, defect, and wave systems using controlled experiments, simulations, and iterative evidence grading.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 51"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to transform unresolved observations in surface, phase, defect, and wave systems into structured, symmetry-guided mechanism-discovery campaigns. The workflow produces testable hypotheses, minimally sufficient validation plans, and iterative decision rules while keeping claims bounded by evidence.

## When to use

Use this skill when a user asks to:

- Propose new research questions where competing mechanisms may explain an observation.
- Design phase-mapping, mode-conversion, or symmetry-breaking studies.
- Reconcile conflicting reports by identifying hidden control variables.
- Validate a predicted phase, state, or wave signature against alternatives.
- Build non-operational research plans with strong controls and clear stop conditions.

Do not use this skill for operational lab recipes, hazardous protocols, or as a substitute for domain-specific safety review.

## Inputs required

Before generating a plan, request or infer:

- Target system class and relevant length/energy/time scales.
- The unresolved observation or discrepancy to be explained.
- Candidate mechanisms and symmetry classes.
- Available modeling hierarchy (analytical, reduced, full simulation).
- Available observables and diagnostic modalities.
- Known confounders and boundary conditions.
- Constraints on feasible perturbations and validation resources.

## Core Workflow

Follow this ordered end-to-end route. Advance through a gate only when the criterion is satisfied; otherwise iterate or stop.

1. **Frame the gap.**  
   Define the unresolved observation as a discriminating target in terms of observables, not preferred mechanisms.  
   *Gate:* Is the gap expressible as a conflict between at least two plausible mechanisms? If no, refine the scope or gather more context.

2. **Define symmetry and control axes.**  
   Select structural, electronic, field, or environmental variables that plausibly alter the energy landscape, mode structure, or phase stability. Map how symmetry operations or breaking patterns couple to these axes.  
   *Gate:* Can the axes be varied independently in available models or measurements? If no, redesign the variable set.

3. **Generate ranked competing hypotheses.**  
   Produce at least three hypotheses: a primary mechanism hypothesis, a symmetry-breaking or confounder hypothesis, and an artifact or alternative-pathway hypothesis. For each, state predicted signatures across independent observables, evidence strength, key assumptions, and failure modes.  
   *Gate:* Are the hypotheses falsifiable by distinct patterns in at least two independent variables? If no, redefine observables or controls.

4. **Design minimal validation.**  
   Specify candidate states/phases, the smallest set of controls (positive, negative, strong/trivial), primary metrics tied to mechanism discrimination, and predeclared stop conditions. Keep designs non-operational: define variables, observables, and decision logic only.  
   *Gate:* Can the controls separate the target mechanism from artifacts and alternative explanations? If no, add orthogonal probes or redesign.

5. **Execute model hierarchy or measurement.**  
   Proceed from analytical or reduced models to full simulations or experiments, comparing relative stability, mode structure, or response across control axes. Document geometry, basis, truncation, and disorder assumptions.  
   *Iteration:* If simulation and experiment disagree, check as-fabricated geometry, probe response, finite-size effects, and background before revising the hypothesis.

6. **Analyze with mechanism discrimination.**  
   Normalize comparisons across a common reference. Map boundaries where candidate states are near-degenerate. Test consistency across diffraction orders, spectral peaks, momentum transfers, polarization channels, or spatial maps. Assess model identifiability and parameter sensitivity.  
   *Gate:* Do independent observables converge on the same mechanism within propagated uncertainty? If no, add an orthogonal observable or control before claiming.

7. **Grade evidence and bound claims.**  
   Label each conclusion as directly observed, model-inferred, analogy-supported, or speculative. Bound transfer by symmetry class, control regime, and boundary conditions.  
   *Gate:* Does the claim strength match the validation tier reached? If no, downgrade the claim or iterate.

8. **Iterate or terminate.**  
   - *If robust:* Prioritize targeted validation at adjacent phase boundaries or extended parameter ranges.  
   - *If near-degenerate or ambiguous:* Add higher-order interactions, disorder, nonlinearity, or entropy before claiming a ground state or unique mechanism.  
   - *If contradicted:* Reject the hypothesis and return to step 2 or 3.  
   - *If stop conditions met (effect indistinguishable from background, controls fail, or model non-identifiable):* Terminate the line of inquiry and document negative results.

## Output Format

When using this skill, return:

1. **Research question.** One concise question framed around a control variable and a candidate mechanism.
2. **Ranked hypothesis table.** Columns: hypothesis, evidence strength, key assumptions, predicted signature, competing explanations, likely failure modes, minimal validation test.
3. **Minimal validation plan.** Candidate states/phases, control variables, positive/negative/strong controls, primary metrics, observable fingerprints, and stop conditions.
4. **Analysis plan.** Normalization strategy, competing-model comparison, consistency checks across independent observables, uncertainty propagation, and sensitivity analysis.
5. **Iteration rules.** Conditions for keeping, narrowing, reframing, or discarding each hypothesis.
6. **Validity and boundary statement.** Confounders, reproducibility requirements, external-validity limits, and safety scope.

## Validation Gates

Before advancing between workflow stages or finalizing claims, confirm:

- **Gap clarity:** The discrepancy is defined in terms of discriminable observables, not preferred mechanisms.
- **Hypothesis falsifiability:** Each hypothesis predicts distinct patterns across at least two independent variables or controls.
- **Control sufficiency:** Positive, negative, and strong controls can separate the target mechanism from artifacts.
- **Model identifiability:** Parameters are constrained by independent data, not by arbitrary offsets or underdetermined fits.
- **Cross-observable consistency:** Multiple independent observables converge on the same mechanism within uncertainty.
- **Evidence threshold:** The claim strength does not exceed the validation tier reached.

## Claim Boundaries

- Distinguish symmetry-protected or topological claims from conventional phase, band, or wave effects; require an invariant, winding, or equivalent argument before assigning a topological label.
- Separate directly measured observables from model-inferred, reconstructed, or extrapolated quantities.
- Limit transfer to systems sharing the validated symmetry class, control regime, and boundary conditions.
- Do not extrapolate beyond the tested parameter range without labeling the conclusion as speculative.

## Failure Modes

- **Underdetermination:** Multiple mechanisms fit the same data with similar support.
- **Control failure:** Controls are indistinguishable from background or fail to behave as expected.
- **Non-unique fingerprints:** Observables overlap across candidate states or modes.
- **Model dependence:** Rankings or interpretations change under reasonable alternative bases, truncations, or perturbations.
- **Confounding:** Disorder, finite-size, probe response, environmental asymmetry, or calibration drift mimics the target signature.
- **Premature convergence:** Stopping before orthogonal validation is completed.

## Validity Checks

Before presenting conclusions, check:

- **Confounding variables:** Disorder, finite-size, substrate, stray fields, probe artifacts, calibration drift, and background signals.
- **Reproducibility:** Stability across repeated runs, independent datasets, and alternative preprocessing choices.
- **Statistical validity:** Uncertainty propagation, multiple-comparison handling, sampling convergence, and sensitivity to model priors.
- **Boundary conditions:** Applicability of symmetry assumptions, linear-response approximations, and model geometry.
- **Fingerprint uniqueness:** Whether proposed observables distinguish all competing phases or modes.
- **Evidence discipline:** Whether claims are framed as predictions, reconciliations, or validated findings.

## Provenance

Synthesized from cluster 82.0 (symmetry-guided mechanism discovery and validation). Source skills: arxiv-cmoat__2606.18148 (2d-vdw-magnetism-exploration), 3522f11eeb3733ba (strong-field-wavepacket-control-research-planning), 54776e8f6182fc67 (topological-nanophotonics-research-design), 53785fb75b29292c (rydberg-electrostatic-mirror-research), f80c9c2f008f7f24 (soft-xray-standing-wave-scattering-research), 75485b2c1adca264 (magnetohydrodynamic-wave-mode-conversion-exploration), 18e9b6b2b3944a86 (hydrophobic-hydration-force-spectroscopy-workflow), arxiv-cmoat__2606.20271 (open-quantum-liouvillian-mode-interpretation).
