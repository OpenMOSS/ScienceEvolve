---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-49c488de
description: Design reusable, end-to-end research workflows for discovering and validating physical mechanisms through symmetry-aware hypothesis generation, benchmark-controlled validation, and strict claim bounding across quantum, spectral, and many-body domains.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 88"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides an agent to design reusable, end-to-end research workflows for discovering and validating physical mechanisms in quantum, spectral, lattice, few-body, nuclear, or cosmological systems. The emphasis is on method: using structural invariants and symmetry constraints to generate discriminating hypotheses, validating them against independent benchmarks, and bounding claims to the tested regime rather than memorizing any single study’s result.

## When to use

Use this skill when the user asks for new research questions, mechanism hypotheses, or validation plans where spectral data, discrete states, transition strengths, scattering observables, or abundance estimates must be interpreted through structural or symmetry-based models. It is especially appropriate when:

- Direct computation is intractable and an asymptotic, finite-size, or effective description is needed.
- Finite-confinement or discrete-spectrum effects must be bridged to continuum or thermodynamic predictions.
- Multiple competing explanations must be discriminated (e.g., stable versus dynamic, localized versus extended, integrable versus chaotic).
- A proposed scaling law, selection rule, or response function needs robustness testing against independent references.

Do not use this skill for operational experimental protocols, clinical inference, materials synthesis recipes, or as a substitute for domain-specific numerical solvers or peer-reviewed consensus.

## Inputs required

Before generating a research plan, collect or infer:

- **Target system class** and relevant symmetries, conservation laws, or selection rules.
- **Observable catalog:** spectral features, state energies, lifetimes, widths, transition rates, correlation functions, or integrated yields.
- **Known structural invariants or organizing principles:** spectral order parameters, symmetry sectors, partial-wave channels, classical invariants, bottlenecks, or rank/support conditions.
- **Benchmark references:** exactly solvable limits, established counting laws, prior datasets, or literature-backed constraints.
- **Boundary assumptions:** dimensionality, rank, confinement geometry, temperature regime, asymptotic parameter, or model approximations.
- **Evaluation priorities:** proof strength, detection power, computational tractability, robustness, or conceptual unification.

## Core Workflow

1. **Frame the mechanism-selection gap.** Identify an observable mismatch, spectral anomaly, or scaling behavior not explained by the canonical regime. Define the competing mechanism classes (e.g., stable versus dynamic, localized versus extended).
   - *Stop condition:* If the gap is already resolved by literature consensus or a trivial calculation, stop and report the established explanation.

2. **Anchor in structural invariants.** Identify symmetries, conservation laws, spectral order parameters, or organizing quantities that constrain the possible mechanisms. State how these invariants map to observable signatures.
   - *Decision gate:* If no invariant can be identified, downgrade to exploratory analysis and return to step 1 after collecting additional observables or theoretical constraints.

3. **Generate ranked mechanism hypotheses.** For each candidate mechanism, produce:
   - A concise hypothesis statement.
   - The structural reason (mechanism) linking the invariant to the observable.
   - Evidence strength (high / medium / low / speculative).
   - Key assumptions and falsification signals.
   - Likely failure modes.
   - *Decision gate:* If every hypothesis is speculative and lacks a testable signature, stop and request additional benchmark data or constraints before proceeding.

4. **Design controlled validation.** Define a minimal viable validation set:
   - Target variables (couplings, geometry, symmetry sector, size, energy window, or temperature).
   - Positive control: a known limit where the mechanism must reproduce an independent benchmark.
   - Negative control: a regime where the mechanism should vanish or be suppressed.
   - Boundary/stress control: low-rank, high-dimension, near-threshold, symmetry-broken, or finite-size edge case.
   - Independent benchmark: estimate the organizing invariant separately from the observable fit to avoid circular reasoning.
   - *Stop condition:* If no independent benchmark exists, flag the validation as provisional and limit claim strength accordingly.

5. **Execute analysis with robustness checks.**
   - Pre-register the expected signature before fitting or interpreting data.
   - Extract state-resolved or feature-resolved quantities with consistent procedures.
   - Check internal consistency (normalization, sum rules, selection rules, orthogonality, completeness).
   - Test stability under changes in analysis windows, parameters, representations, and alternative methods.
   - Compare independent methods only in their overlap regime.
   - *Iteration gate:* If residuals show systematic structure, if methods disagree, or if the signature reverses under reasonable variations, return to step 3 to refine hypotheses or step 4 to add controls.

6. **Discriminate mechanisms.** Evaluate whether independent diagnostics converge on a single mechanism class.
   - If multiple observables agree, strengthen the hypothesis and proceed to claim bounding.
   - If diagnostics conflict, test mixing or perturbation hypotheses, or classify the result as inconclusive.
   - *Decision gate:* If unresolved channel mixing, finite-size artifacts, background, or proxy effects dominate, stop mechanism discrimination and design a targeted follow-up.

7. **Bound claims and define the validity perimeter.**
   - State the exact regime (symmetry, dimension, rank, temperature, size, or coupling range) where the claim holds.
   - Distinguish proven implications from sufficient conditions, analogical extensions, and agent-generated conjectures.
   - Identify extrapolation limits and label any extension beyond the tested regime as speculative.
   - *Stop condition:* If the claim depends on unverified assumptions outside the tested regime, bound it strictly and do not generalize.

8. **Plan iteration or redesign.**
   - On success: propose the next perturbation, comparator, or asymptotic extension.
   - On failure: determine whether the failure invalidates the mechanism globally or only outside a stated assumption; refine the object class or weaken the claim.
   - On ambiguity: specify the smallest additional diagnostic test needed to break the degeneracy.
   - *Iteration gate:* If the hypothesis becomes too narrow to be scientifically useful, abandon the mechanism and return to step 1.

## Output Format

For each invocation, return:

1. **Research question and gap:** the scoped mechanism-selection problem and why it is unresolved.
2. **Structural anchors:** identified invariants, symmetries, or organizing principles and their justification.
3. **Ranked hypotheses table:** for each hypothesis, include mechanism, evidence strength, key assumptions, predicted signature, and likely failure mode.
4. **Validation plan:** target variables, positive/negative/boundary controls, independent benchmarks, evaluation metrics, and stopping conditions.
5. **Analysis plan:** extraction method, consistency checks, robustness tests, method cross-validation, and uncertainty handling.
6. **Mechanism discrimination summary:** whether independent diagnostics converge, conflict, or remain inconclusive, with a provisional classification.
7. **Claim boundary statement:** regime of validity, assumption audit, extrapolation limits, and explicit distinction between proven and inferred results.
8. **Iteration path:** recommended next step under success, failure, or ambiguity.

## Validation Gates

- **Gap relevance:** Does the question address a genuine unresolved mechanism rather than restate known results?
- **Invariant identification:** Is the organizing symmetry or structural invariant explicitly stated and justified?
- **Hypothesis testability:** Does each hypothesis have a falsifiable signature and a defined failure mode?
- **Control completeness:** Are positive, negative, and boundary controls included?
- **Benchmark independence:** Is the reference standard estimated separately from the target observable?
- **Robustness:** Does the conclusion survive reasonable changes in analysis windows, parameters, or representations?
- **Method agreement:** Do independent methods or diagnostics agree in their overlap region?
- **Scale separation:** Are short-range, confinement, asymptotic, or finite-size effects properly separated and accounted for?

## Claim Boundaries

- Do not infer equivalence from one-way implications; clearly distinguish sufficient from necessary conditions.
- Do not treat a single study or paper result as field-wide consensus.
- Do not extrapolate beyond the tested symmetry class, dimensionality, rank, temperature, or system size without labeling the extension as speculative.
- Separate mathematical sufficiency from physical feasibility or experimental realizability.
- Limit claims to the model class, state sector, and asymptotic regime actually validated.

## Failure Modes

- **Invariant misidentification:** The assumed symmetry or structural invariant does not actually organize the observed data.
- **Circular benchmarking:** The reference standard is derived from the same data or model used to test the hypothesis.
- **Finite-range or asymptotic mismatch:** A claimed scaling law is supported only by data outside the asymptotic regime.
- **Window or parameter artifact:** The observed signature disappears or reverses under reasonable changes in selection windows or control parameters.
- **Channel or mechanism mixing:** Unresolved competing processes mimic the target mechanism.
- **Overgeneralization:** A mechanism validated in one symmetry sector or model family is applied to a broader class without justification.
- **Numerical or representation instability:** Conclusions depend on gauge choices, contour deformations, discretization, or finite precision in uncontrolled ways.

## Validity Checks

- **Assumption audit:** List hidden assumptions about dimension, rank, support, symmetry, asymptotics, boundary conditions, and allowed operations.
- **Direction check:** Verify the logical direction of implications; do not reverse them.
- **Boundary tests:** Evaluate low-rank, high-dimensional, degenerate, symmetry-broken, near-threshold, or finite-size edge cases.
- **Counterexample search:** Actively seek cases where the proposed mechanism fails, not only examples that support it.
- **Reference triangulation:** Compare with independent criteria, canonical families, or external constraints.
- **Numerical validity:** Report precision, tolerances, sampling coverage, and whether conclusions depend on finite precision.
- **Reproducibility:** Provide definitions, model or state-family descriptions, and enough detail for independent verification.
- **Extrapolation boundary:** State whether conclusions apply only to the tested class or whether extension is speculative.

## Provenance

- Synthesized from cluster 143, subcluster 143.1 (symmetry-guided mechanism discovery and validation).
- Source skills: quantum-entanglement-majorization-exploration; open-chaotic-spectral-scaling-exploration; integrable-models-rh-overlap-workflow; qcd-axion-cosmological-observable-window; confined-few-body-scattering-exploration; quantum-transport-research-design; scalar-dark-matter-agent-exploration; nuclear-octupole-collectivity-exploration.
