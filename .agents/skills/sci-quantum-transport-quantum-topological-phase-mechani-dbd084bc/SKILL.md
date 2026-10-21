---
name: sci-quantum-transport-quantum-topological-phase-mechani-dbd084bc
description: Symmetry-guided mechanism discovery and validation workflow for quantum transport, topological, and correlated phase systems using competing hypotheses, paired observables, and iterative controls.
scienceevolve-title: "Quantum materials and condensed matter · transport quantum topological phase mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to generate and evaluate research questions where a transport, quantum, topological, or phase-competition mechanism must be discriminated from alternatives. The goal is to convert a plausible microscopic or collective mechanism into testable hypotheses, discriminating validations, analysis plans, and iteration rules without treating any single study’s conclusion as a field-wide consensus.

# When to use

Trigger this skill when a user asks to:

- Propose new research questions in quantum transport, topological matter, correlated phases, constrained lattice systems, or symmetry-controlled collective behavior.
- Design experiments, simulations, or theoretical analyses that distinguish intrinsic structural or topological effects from contact, interface, disorder, environmental, or measurement artifacts.
- Translate a hypothesized mechanism into observable signatures constrained by symmetry, conservation laws, or phase-competition rules.
- Evaluate whether a proposed mechanism respects reciprocity, time-reversal, gauge, parity, or other relevant constraints.
- Build an iterative research plan after preliminary results show mixed, weak, or confounded evidence.

Do not use this skill to generate directly executable hazardous experimental procedures, high-risk operational protocols, or exact replication of paper-specific device parameters. Use it only for non-operational research design, conceptual validation planning, and safety-aware planning.

# Inputs required

Before producing a final plan, request or identify:

- **Target system class:** continuum or lattice model, material family, device geometry, or correlated many-body platform.
- **Observable of interest:** transport coefficient, response curve, order parameter, correlation function, or other measurable signature.
- **Candidate mechanisms:** at least two plausible explanations, including a primary structural/topological hypothesis and alternatives such as interface, contact, disorder, resonance, environmental, or artifact channels.
- **Symmetry and conservation constraints:** reciprocity, time-reversal, gauge invariance, parity, particle-number conservation, or system-specific selection rules.
- **Available evidence:** experimental data, simulation outputs, analytic results, structural models, prior literature benchmarks, or conceptual hypotheses.
- **Paired observables or controls:** responses or transformations that should reverse, preserve, or null the signal under each candidate mechanism.
- **Practical constraints:** model fidelity, computational limits, measurement resolution, finite-size or boundary effects, reproducibility requirements, and acceptable validation scope.
- **Safety and compliance context:** whether the domain involves high fields, extreme conditions, nanomaterials, or regulated environments.

# Core Workflow

Follow this ordered end-to-end route. Apply decision gates at each numbered step; if a gate fails, iterate or stop as indicated.

1. **Frame the mechanism-sensitive gap**
   - Define the unresolved distinction between competing mechanisms.
   - Start from a reproducible signature, regime boundary, or path mismatch, not from a preferred microscopic explanation.
   - **Decision gate:** Is the gap well-defined and resolvable by the available observables?
     - *If no:* Reframe the question or stop.

2. **Impose symmetry and conservation constraints**
   - Identify the symmetry, conservation, or topological constraints that any valid mechanism must satisfy.
   - List the transformation pairs that should reverse, preserve, or null the signal under a true intrinsic mechanism.
   - **Decision gate:** Are constraints correctly identified and applicable to the target system?
     - *If no:* Return to inputs and revise assumptions.

3. **Generate ranked competing hypotheses**
   - Produce at least three hypotheses:
     1. A primary structural, topological, or symmetry-breaking mechanism.
     2. An interface, contact, boundary, or environmental alternative.
     3. A disorder, resonance, artifact, or measurement alternative.
   - For each, label: evidence strength (established / plausible / speculative / unsupported), key assumptions, predicted observable signature, and likely failure modes.
   - **Decision gate:** Are the hypotheses mutually distinguishable by the proposed controls?
     - *If no:* Refine observables or add paired diagnostics before proceeding.

4. **Map mechanisms to pre-registered observable contrasts**
   - For each hypothesis, predict how paired observables, symmetry transformations, scaling relations, or regime boundaries should respond.
   - State qualitative contrasts (phase, sign, amplitude trend, periodicity, scaling, or null result) before fitting or interpreting data.
   - **Decision gate:** Are predictions robust to plausible nuisance variables?
     - *If no:* Add robustness hypotheses or redesign the control axis.

5. **Design minimal validation with paired controls**
   - Define independent variables, dependent observables, and covariates.
   - Include:
     - *Positive control:* regime where the expected mechanism should be supported.
     - *Negative control:* regime where the signature should weaken or disappear.
     - *Strong control:* condition that changes a suspected confounder while holding the target mechanism constant.
     - *Replication control:* repeated measurements or independent realizations.
   - Specify minimal viable validation: the smallest credible test that can support or falsify a hypothesis.
   - **Decision gate:** Can the minimal test falsify at least one hypothesis?
     - *If no:* Redesign controls or reduce claim scope.

6. **Execute theoretical, numerical, or conceptual validation**
   - Perform the planned calculation, simulation, or reanalysis.
   - Benchmark the implementation against known limits before interpreting new results.
   - Separate backgrounds, decompose responses into candidate channels, and check consistency across independent diagnostics.
   - **Decision gate:** Did the implementation pass benchmark checks and produce stable results?
     - *If no:* Debug, increase convergence checks, or stop.

7. **Discriminate mechanisms using converging evidence**
   - Compare results against pre-registered predictions.
   - Require agreement across multiple observables, system sizes, boundary conditions, or analysis routes before favoring one mechanism.
   - Perform sensitivity analysis over model choices, disorder, broadening, contact assumptions, or environmental perturbations.
   - **Decision gate:** Do independent diagnostics converge on the same mechanism?
     - *If no:* Investigate confounders, add diagnostics, or downgrade evidence strength.

8. **Update hypotheses via iteration gate**
   - Apply one of the following rules based on evidence:
     - *Keep:* signature is robust across independent controls and alternatives are weakened.
     - *Narrow:* effect appears only under specific geometries, energy alignments, contact regimes, or environmental conditions.
     - *Split:* signal contains separable intrinsic and extrinsic contributions.
     - *Reframe:* construct is poorly defined or observable cannot distinguish mechanisms.
     - *Reject:* mechanism violates required constraints or disappears under null controls.
     - *Suspend:* evidence is mixed and the next validation cannot discriminate alternatives.
   - Document what changed, which control caused the update, and which assumptions were weakened or strengthened.
   - **Decision gate:** Is the evidence sufficient to bound a claim?
     - *If no:* Return to step 4, 5, or 6 with refined hypotheses.

9. **Bound claims and document limitations**
   - State the claim boundary: whether the conclusion applies to the tested model, a material family, or remains system-specific.
   - Rank evidence by hierarchy (theorem, analytic derivation, numerical demonstration, experimental benchmark, analogy, speculation).
   - Explicitly label observed evidence, inferred mechanism, and speculative extension.
   - **Stop condition:** Claims are bounded, reproducibility documentation is complete, and residual risks are noted.

# Output Format

When using this skill, produce:

1. **Scope and target system:** system class, relevant symmetries, observable, available evidence, and constraints.
2. **Mechanism candidates:** primary structural/topological hypothesis and alternatives (interface, disorder, artifact, environmental).
3. **Hypothesis table:** for each hypothesis—observation, gap, mechanism, predicted signature, evidence strength, key assumptions, failure modes, minimal validation, and stop conditions.
4. **Validation plan:** variables, paired controls (positive, negative, strong, replication), minimal viable validation, evaluation metrics, and stopping rules.
5. **Analysis plan:** normalization, decomposition, sensitivity checks, independent diagnostic cross-checks, and evidence-grading criteria.
6. **Iteration plan:** keep, narrow, split, reframe, reject, or suspend rules for likely outcomes, with decision triggers.
7. **Validity and claim boundaries:** confounders, reproducibility requirements, external-validity limits, safety boundaries, and residual risks.

# Validation Gates

Before accepting a mechanism or publishing a claim, verify that:

- **Independent diagnostic agreement:** at least two independent observables or analysis routes support the same mechanism.
- **Control success:** positive, negative, and strong controls all behave as predicted by the leading hypothesis.
- **Robustness survival:** the signature persists under plausible nuisance-variable sweeps (disorder, broadening, contact variation, geometry perturbation, environmental change).
- **Uncertainty bounded:** statistical, numerical, or systematic uncertainty is reported and does not overlap with alternative mechanism predictions.
- **Mechanism uniqueness:** alternative hypotheses are actively compared and falsified rather than dismissed without test.
- **Symmetry compliance:** the favored mechanism respects the relevant conservation and symmetry constraints.
- **Reproducibility documented:** model definitions, boundary conditions, analysis choices, and failure criteria are specified for independent replication.

# Claim Boundaries

- Do not treat a single paper, simulation, or dataset as field-wide consensus.
- Separate directly observed evidence from model-inferred mechanism and from speculative extrapolation.
- Limit claims to the tested system class, model fidelity, and parameter regime unless cross-system validation is explicitly provided.
- Avoid direct structural or microscopic assignments from indirect observables without independent confirmation.
- Do not present qualitative agreement, limited controls, or single-platform results as definitive proof of a universal mechanism.
- Refrain from deployment advice for safety-critical, medical, security, or commercial applications without domain-specific validation and ethics review.

# Failure Modes

- **Artifact dominance:** the signal is explained by contact asymmetry, measurement imbalance, calibration drift, or numerical artifact. *Mitigation:* require artifact controls and symmetric-port checks.
- **Confounding by geometry or environment:** anisotropy, disorder, finite-size effects, boundary conditions, or uncontrolled environmental variables mimic the target signature. *Mitigation:* use geometry controls, finite-size scans, and environmental sensitivity analysis.
- **Non-separable channels:** area, perimeter, defect, interface, or bulk contributions cannot be decomposed. *Mitigation:* redesign perturbation variables to isolate one channel at a time.
- **Ansatz or model bias:** the chosen model, wave function, or numerical method cannot fairly represent competing mechanisms. *Mitigation:* compare alternative models and check limiting cases.
- **Unstable or narrow-regime effects:** the signature appears only under unstable dynamics, narrow parameter windows, or specific initial conditions. *Mitigation:* require stability controls and regime-width checks.
- **Overfitting to background:** regime boundaries or features are created by inappropriate global fitting or background subtraction. *Mitigation:* pre-register predictions and test background-model sensitivity.
- **False mechanism uniqueness:** the favored hypothesis is supported only because alternatives were not tested. *Mitigation:* mandate at least three competing hypotheses and explicit falsification criteria.

# Validity Checks

Before finalizing a research plan, check:

- **Symmetry validity:** does the mechanism respect reciprocity, time-reversal, gauge, parity, or other relevant constraints?
- **Structural validity:** is the proposed structural motif or topological feature actually present and well characterized in the target system?
- **Control validity:** do controls isolate one variable at a time, and do paired transformations test the intended symmetry?
- **Contact/artifact validity:** could electrode, interface, device asymmetry, measurement imbalance, or numerical artifact reproduce the signal?
- **Resonance/environment validity:** could energy-level alignment, resonant transport, disorder, screening, temperature, or conformational variation create a false positive?
- **Statistical validity:** are repeated measurements, uncertainty, effect sizes, convergence behavior, and sensitivity analyses reported?
- **Reproducibility validity:** are model definitions, filtering choices, seeds, scripts, boundary conditions, and reporting formats documented?
- **External validity:** are claims limited to the tested system class and not overextended to the entire field?
- **Operational safety:** are proposals kept at the non-operational research-design level, with hazardous or high-risk procedures excluded?

# Provenance

Derived from cluster 84, subcluster 84.0 ("symmetry-guided mechanism discovery and validation"). Synthesized from the following source skills: `arxiv-cmoat__2606.17865` (chiral-transport-mechanism-design), `6a78ce64ed9b05e6` (topological-semimetal-magneto-transport-exploration), `33b27bf991826fce` (quantum-hall-wigner-crystal-exploration), `040cef83a04a508e` (constrained-lattice-research-exploration), `df4cc67168abe679` (structural-superlubricity-edge-area-research-design), `816f2f723649d7c4` (dynamic-compression-research-pattern), `8ec61d93be50bb68` (photonics-topology-symmetry-exploration), `57b382769d9cccb9` (disordered-nanomagnetic-landscape-exploration). Source-specific systems, parameters, and conclusions have been abstracted into a reusable workflow.
