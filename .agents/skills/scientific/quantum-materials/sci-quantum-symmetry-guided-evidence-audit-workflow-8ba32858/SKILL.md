---
name: sci-quantum-symmetry-guided-evidence-audit-workflow-8ba32858
description: A reusable end-to-end workflow for designing precision research studies that isolate target signals through symmetry-aware controls, structured hypothesis testing, and iterative residual auditing to bound claims and prevent overgeneralization.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence audit workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Enable agents to design methodologically grounded, precision-oriented research studies across quantum, optical, nuclear, and computational domains. The workflow teaches a transferable pattern: factorize the observable, use symmetry or auxiliary structures to suppress leading-order perturbations, validate through independent benchmarks and strong controls, and iterate on residual evidence to tighten claim boundaries.

## When to use

Use this skill when a user asks to:
- Propose or evaluate research questions in precision spectroscopy, quantum metrology, indirect measurement, weak-interaction tests, or computational response estimation.
- Design studies where a small target signal must be separated from systematic shifts, noise, approximation error, or scalability bottlenecks.
- Audit whether a proposed correction, mitigation, subspace mapping, or combined-sensitivity design is scientifically credible beyond a single benchmark.
- Generate hypotheses, validation plans, and iteration rules for studies employing controlled perturbations, common-mode cancellation, or descriptor-preserving auxiliary representations.

Do not use this skill as a substitute for domain-specific peer review, formal proofs, production code generation, laboratory safety review, or operational hardware protocols.

## Inputs required

Before producing a research plan, request or identify:

1. **Target quantity**: the intrinsic observable, parameter, or response to be inferred.
2. **Precision requirement**: the uncertainty or bias threshold that defines success.
3. **Dominant perturbation(s)**: unavoidable fields, noise, approximations, or systematics coupling to the measurement.
4. **Symmetry or auxiliary structure**: known conservation laws, dual representations, common-mode configurations, or reduced descriptors usable for cancellation or simplification.
5. **Forward model or factorization**: conceptual link from physical parameters to observed quantities.
6. **Independent benchmarks**: trusted references, limiting cases, exact solutions, or alternative datasets for non-circular validation.
7. **Constraints**: resource budgets, computational cost, safety boundaries, and acceptable extrapolation domains.

If any input is missing, state assumptions explicitly and mark resulting hypotheses as lower evidence strength.

## Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame and factorize**
   - Define the target quantity and decompose the observable into universal, process-specific, response, and correction terms.
   - Identify the bottleneck: which term most limits precision or validity?

2. **Formulate symmetry-aware hypotheses**
   - For each candidate mechanism, state: "If [mechanism] dominates, then [controlled variation / symmetry operation] should produce [predicted signature]."
   - Assign evidence strength (strong / moderate / weak / speculative).
   - List key assumptions and explicit failure modes.
   - **Decision gate**: Reject hypotheses that lack a falsifiable signature or independent benchmark.

3. **Design minimal validation with controls**
   - **Baseline control**: uncorrected or standard approximation.
   - **Positive control**: regime where the target signal is known or expected to be recoverable.
   - **Negative control**: regime where the signal should vanish or be suppressed.
   - **Robustness control**: perturb symmetry conditions, calibration, or model assumptions.
   - **Independent benchmark**: validation against external data or exact limits not used in construction.
   - Define stop conditions before data collection or simulation begins.

4. **Execute controlled perturbation or auxiliary mapping**
   - Vary the perturbation variable systematically; use symmetry operations (e.g., orientation reversal, state interchange, dual representation) to cancel leading-order effects.
   - If using an auxiliary representation or stochastic estimator, verify that physical structure (normalization, conservation laws, boundary conditions) is preserved.
   - **Stop condition**: If the leading-order cancellation cannot be reproduced, halt and revisit the symmetry assumption or model.

5. **Analyze residuals hierarchically**
   - Fit the leading-order dependence and locate the common-mode point or corrected estimate.
   - Examine residuals for structure across regime, preparation, or configuration variables.
   - Separate statistical uncertainty from systematic uncertainty.
   - Compare against independent benchmarks; document tensions rather than hiding them.
   - **Decision gate**: If residuals correlate with uncontrolled variables, flag confounding and do not proceed to claim interpretation.

6. **Audit claims and bound extrapolation**
   - Label each conclusion as demonstrated, projected, or extrapolated.
   - State the domain boundary: species, transition, regime, error model, or system size where the claim loses support.
   - Ensure the correction or mitigation improves multiple observable classes (scalar and structural), not just one metric.

7. **Iterate or terminate**
   - **Promote**: If controls agree and residuals are structureless, target the next dominant residual.
   - **Revise**: If the signature is present but model-dependent, tighten constraints or add orthogonal tests.
   - **Constrain**: If the method works only in a narrower regime, shrink the claim boundary.
   - **Reject**: If negative controls fail, variance dominates gains, or independent benchmarks disagree, abandon the hypothesis.
   - **Iteration loop**: Return to step 2 with an updated mechanism inventory; do not broaden claims until strong validation passes.

## Output Format

When using this skill, return a structured research plan containing:

1. **Research question** — concise statement of the target and gap.
2. **Hypothesis table** — mechanism, evidence strength, key assumptions, predicted signature, failure modes, and minimal test.
3. **Validation design** — variables, controls (baseline, positive, negative, robustness, independent), metrics, and stop conditions.
4. **Analysis plan** — factorization, leading-order fit, residual hierarchy, uncertainty decomposition, and benchmark comparison.
5. **Iteration rules** — conditions for promote, revise, constrain, or reject.
6. **Claim boundary statement** — explicit limits on extrapolation and generalization.
7. **Validity and ethics notes** — confounders, reproducibility requirements, and non-operational safety boundaries.

## Validation Gates

- **Conceptual validity**: The descriptor, symmetry, or auxiliary mapping is physically justified, not merely convenient.
- **Representability**: The simplified representation can plausibly preserve the target structure in the intended domain.
- **Control completeness**: All five control types (baseline, positive, negative, robustness, independent) are defined before testing.
- **Non-circular validation**: Construction inputs and validation references are strictly separated.
- **Structural validation**: At least one observable tests correlations, response, or structure beyond scalar agreement.
- **Uncertainty discipline**: Stochastic, numerical, model-form, and systematic uncertainties are propagated and reported separately.
- **Reproducibility**: Model definitions, assumptions, comparison references, and analysis choices are documented.

## Claim Boundaries

- Distinguish **paper-supported methodological patterns** from **agent-inferred extensions** for new systems.
- Do not present single-study or single-benchmark results as field-wide consensus.
- Computational agreement is not experimental confirmation; projected sensitivity is not demonstrated evidence.
- Claims are valid only within the tested regime, descriptor set, error model, and resource budget.

## Failure Modes

- **Confounding mimicry**: A correlated nuisance (calibration drift, background, hidden population, or solver bias) reproduces the target signature.
- **Post-hoc selection**: The operating point or symmetry condition is chosen after inspecting the data, inflating apparent significance.
- **Overfitting**: A complex correction or subspace improves one benchmark while failing structural or robustness checks.
- **Variance explosion**: A stochastic or multi-channel estimator reduces bias but introduces unacceptable variance or resource cost.
- **Circular validation**: The same dataset or approximation used to build the correction is used to validate it.
- **Extrapolation overreach**: Conclusions are generalized beyond the domain covered by controls and residual checks.

## Validity Checks

Before finalizing any output:

- [ ] Could a shared systematic, approximation error, or nuisance parameter mimic the target effect?
- [ ] Are symmetry assumptions, geometry, or alignment justified by independent diagnostics?
- [ ] Do repeated sessions, reconfigurations, or independent partitions yield consistent estimates?
- [ ] Is the assumed response model (linear, perturbative, etc.) valid over the tested range?
- [ ] Are control variables converted to physical quantities with propagated uncertainty?
- [ ] Does the correction improve structural observables and response functions, not just scalar agreement?
- [ ] Are dataset tensions disclosed rather than forced into a single pooled result?
- [ ] Are all approximations used only within their domain of validity?
- [ ] Is the evidence strength labeled for every hypothesis and sub-claim?

## Provenance

- Derived from cluster 183 (subcluster 183.0), workflow archetype "symmetry-guided evidence analysis and claim audit".
- Synthesized from source skills: `quantum-many-body-auxiliary-descriptor-qmc`, `neutrino-oscillation-combined-sensitivity`, `scalable-quantum-transport-stochastic-design`, `trapped-ion-systematic-shift-metrology`, `precision-correction-research-workflow`, `nuclear-beta-correlation-recoil-workflow`, `quantum-error-mitigation-subspace-workflow`, `optical-lattice-clock-research-pattern`.
- Preserves methodological patterns only; excludes paper-specific systems, parameters, numerical results, and operational protocols.
