---
name: sci-quantum-quantum-lattice-matter-qcd-evidence-analysi-4c15bc89
description: End-to-end evidence analysis and claim audit workflow for quantum, lattice, matter, and QCD research, guiding hypothesis generation, control-based validation, convergence auditing, and iterative claim boundary setting.
scienceevolve-title: "Quantum materials and condensed matter · quantum lattice matter qcd evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

A reusable workflow for transforming theoretical or computational anomalies into structured, auditable research claims. It helps agents generate falsifiable hypotheses, design layered validation with positive, negative, strong, and robustness controls, execute convergence-aware analysis, and grade evidence before drawing conclusions. The workflow emphasizes distinguishing verified results from analogy-driven inferences and enforcing explicit claim boundaries.

## When to use

- When investigating anomalies, residuals, or gaps in quantum many-body, lattice field theory, condensed matter, or QCD contexts.
- When finite-size, finite-order, or finite-resolution effects may confound claims about emergent behavior.
- When multiple competing explanations exist and need to be discriminated via controlled validation.
- When migrating a method or insight from one system to a new system and need to re-establish evidence boundaries.
- Not for operational experimental recipes, hazardous procedures, or direct hardware control.

## Inputs required

- Target system description (model class, symmetries, relevant scales, and degrees of freedom).
- Baseline expectation or reference model against which anomalies are defined.
- Candidate observables or proxy quantities that connect to the claim.
- Known limits or benchmarks (exact solutions, known fixed points, established asymptotics).
- Computational or data constraints (scale ranges, ensemble sizes, resource budget).
- Prior evidence map: what is already verified versus inferred versus speculative.

## Core Workflow

1. **Gap Definition & Baseline Audit**
   - Frame the anomaly or research gap relative to an established baseline, exact limit, or widely accepted model.
   - Inventory existing evidence and tag each item as verified, inferred-by-analogy, or speculative.
   - *Decision gate*: Is the gap bounded and the baseline unambiguous? If not, refine the scope before proceeding.

2. **Competing Hypothesis Generation**
   - Produce at least two mechanistic hypotheses, including an artifact or null hypothesis.
   - For each hypothesis record: a concise mechanism, key physical assumptions, expected directional signals, and explicit failure modes.
   - Assign a preliminary evidence strength (high / medium / low) anchored to the distance from verified benchmarks.
   - *Decision gate*: Is every hypothesis falsifiable with the available observables and resources? If not, redesign the diagnostic set.

3. **Proxy & Diagnostic Selection**
   - Choose proxy observables or statistical diagnostics that are computable within constraints and structurally linked to the target claim (e.g., through moments, scaling variables, spectral features, or correlation functions).
   - Calibrate each proxy against the baseline so that its known-limit behavior is recoverable.
   - *Decision gate*: Does the proxy have a clear interpretation in both the baseline and hypothesized regimes? If not, replace or augment it.

4. **Control Architecture Design**
   - **Positive control**: a limit or system where the proxy must reproduce a known result.
   - **Negative control**: a limit or system where the hypothesized signal should be absent, inverted, or strongly suppressed.
   - **Strong control**: an independent model, method, or observable that tests the same claim through a logically separate path.
   - **Robustness control**: a sensitivity sweep over discretization, boundary conditions, ensemble size, truncation order, or initialization.
   - Define hard stop conditions (e.g., positive control fails, negative control false positive, effect size below combined uncertainty, convergence absent).
   - *Decision gate*: Can the target claim be isolated from numerical artifacts, finite-size effects, and model-specific biases? If not, tighten the control set.

5. **Execution & Convergence Audit**
   - Execute the minimal viable validation first; escalate complexity only after the core pipeline passes.
   - Monitor convergence with respect to system size, approximation order, sampling depth, or evolution time.
   - Check statistical stability across independent seeds, initializations, or subsamples.
   - *Iteration trigger*: If convergence is non-monotonic or stalls, return to proxy selection or control design.
   - *Stop condition*: If positive controls fail or numerical instabilities appear, halt interpretation and debug the implementation.

6. **Evidence Grading & Cross-Validation**
   - Grade each hypothesis:
     - **Supported**: signal is stable across controls, failure modes are excluded, and sensitivity to analysis choices is low.
     - **Partially supported**: signal is present but conditional on a specific observable class, scale, boundary, or parameter window.
     - **Unsupported**: signal is consistent with the negative control or absent.
     - **Undecidable**: effect size is within uncertainty, or controls deliver conflicting signals.
   - Require agreement between the strong control and the primary proxy before upgrading evidence strength.
   - *Decision gate*: Do independent indicators converge on the same conclusion? If not, downgrade the evidence grade.

7. **Claim Boundary Setting**
   - Map the graded evidence back to the original research question.
   - Explicitly partition conclusions into: (a) verified within the tested regime, (b) inferred by analogy to other systems, and (c) speculative pending further validation.
   - State applicability boundaries (parameter ranges, system sizes, symmetry sectors, observable subsets).
   - *Decision gate*: Is the claim strength proportional to the evidence? If the claim overreaches, trim the scope.

8. **Iteration or Termination**
   - If **supported**: propose stricter independent tests or cautiously extend to adjacent parameter regions.
   - If **partially supported**: narrow the hypothesis scope and design a targeted follow-up with refined proxies.
   - If **unsupported**: document failure modes, check for simpler alternative explanations, and terminate or pivot.
   - If **undecidable**: improve controls, reduce uncertainty, or seek independent data before concluding.
   - *Final stop condition*: Terminate when further refinement yields no new mechanistic information, or when a simpler explanation satisfies all controls.

## Output Format

A structured report containing:
1. Research gap definition and baseline audit.
2. Hypothesis table (mechanism, key assumptions, expected signals, failure modes, preliminary evidence strength).
3. Control design summary (positive, negative, strong, robustness) with stated stop conditions.
4. Convergence and sensitivity audit results.
5. Evidence grading with cross-validation narrative.
6. Claim boundary statement distinguishing verified, inferred, and speculative components.
7. Iteration plan or termination rationale.

## Validation Gates

- **Baseline calibration**: positive control must recover the known limit within predefined tolerance.
- **Discriminatory power**: negative control must not produce the target signal under the same analysis pipeline.
- **Path independence**: strong control must arrive at the claim through a logically independent route.
- **Convergence**: numerical or statistical estimates must stabilize under refinement of resolution, order, or sample size.
- **Perturbation stability**: conclusions must remain intact when analysis windows, truncations, or seeds are varied.

## Claim Boundaries

- Single-model, single-observable, or single-scale results must not be presented as domain consensus.
- Asymptotic or infinite-system conclusions must not be extrapolated to finite systems without an explicit finite-size audit.
- "Method succeeds in benchmark" must be distinguished from "mechanism holds in the new target system."
- Analogy-driven inferences must be tagged separately from directly verified claims.
- Causal or mechanistic language is reserved for cases where multiple independent controls and cross-validation support the hypothesis; consistency evidence alone warrants only correlational language.
- The workflow does not authorize operational experimental recipes, hazardous procedures, fabrication parameters, or direct hardware control instructions.

## Failure Modes

- **Proxy misalignment**: The chosen observable is insensitive to the target mechanism or conflates multiple physical effects.
- **Control leakage**: Positive or negative controls share hidden structure with the target system, undermining discrimination.
- **Finite-scale masking**: An apparent signal is a finite-size, finite-order, or finite-time artifact that vanishes in the appropriate limit.
- **Window overfitting**: Critical behavior or scaling appears only within a narrow analysis window and disappears upon perturbation.
- **False extrapolation**: A verified benchmark result is mechanically transferred to a new system or regime without re-validation.
- **Mechanistic degeneracy**: Distinct physical mechanisms produce identical proxy signatures, leading to ambiguous attribution.
- **Premature termination**: A stop condition is triggered by implementation error rather than physics, but interpreted as evidence against the hypothesis.

## Validity Checks

- **Concept validity**: Are the baseline, proxy, and hypothesis definitions internally consistent and operationally defined?
- **Observable-class validity**: Does the proxy belong to the claimed symmetry sector or universality class, or are pathological or incompatible observables included?
- **Benchmark validity**: Do positive controls recover the baseline, and do negative controls reject spurious signals?
- **Statistical and numerical validity**: Are error estimates, ensemble sizes, convergence diagnostics, and seed variation sufficient for the claim?
- **Boundary-condition validity**: Are results sensitive to boundaries, initial states, symmetries, or conservation laws?
- **Extrapolation validity**: Are asymptotic conclusions clearly separated from finite-system evidence?
- **Reproducibility**: Are definitions, proxy formulas, control settings, and analysis workflows documented for independent replication?
- **Evidence grading**: Is every claim tagged with its evidence level, key assumptions, and failure modes?

## Provenance

- Derived from cluster 80, subcluster 80.0 (workflow archetype: end-to-end evidence analysis and claim audit).
- Synthesized from representative source skills: quantum-chaos-free-probability-research-pattern (fb3667d9f9e89c24), fluctuating-interface-extreme-statistics (3b9ed8a187179027), fdm-hybrid-zoom-research (954b545874b720af), open-quantum-memory-kernel-exploration (4897c26ee85ebd92), statistical-physics-partition-workflow (2932aa2f0d85669a), nuclear-lattice-finite-volume-research (2aca63157d6ab340), warm-dense-matter-collective-mode-thermodynamics (a12e110b3c42bb73), quantum-ergodicity-scaling-workflow (60ff83c44e479198).
