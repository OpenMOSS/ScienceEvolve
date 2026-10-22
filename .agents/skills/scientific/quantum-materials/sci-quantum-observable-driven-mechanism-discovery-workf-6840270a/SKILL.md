---
name: sci-quantum-observable-driven-mechanism-discovery-workf-6840270a
description: A reusable end-to-end workflow for framing observables, generating competing mechanistic hypotheses, designing minimal validations with strong controls, and iterating toward bounded mechanism discovery in complex physical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 13"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent to design reusable research plans for discovering and validating mechanisms behind complex observable behavior in physical systems. It abstracts the shared methodological pattern across domains: frame an observable, generate competing hypotheses, decompose mechanisms through controlled experiments or simulations, map robustness boundaries, and bound claims. The goal is transferable research design, not reproduction of any specific paper or system.

# When to use

Use this skill when:
- A target system shows an observable response, transition, instability, or emergent behavior whose underlying mechanism is unknown or contested.
- Multiple competing mechanisms could explain the same observable.
- You need to design experiments, simulations, or analyses that discriminate between hypotheses rather than merely demonstrate an effect.
- You must map where a proposed mechanism dominates, weakens, or fails.
- You need to iterate from ambiguous, negative, or artifact-ridden results toward a bounded conclusion.

Do not use this skill as a substitute for domain-specific safety review, operational protocols, equipment operation, or direct execution of hazardous procedures.

# Inputs required

Before starting the workflow, obtain or define:
- **Target observable**: the measurable behavior, response, or state change to explain.
- **System abstraction**: minimal model or module set that captures the relevant physics near the operating point.
- **Candidate mechanisms**: competing explanations with distinct predictions.
- **Hidden or mediating variables**: quantities that must be inferred to separate mechanisms.
- **Available controls**: positive, negative, sham, calibration, and mechanism-specific comparators.
- **Constraints**: safety, ethics, measurement limits, simulation scope, and regime boundaries.
- **Evaluation metrics**: primary and secondary metrics with predefined success and failure criteria.

If inputs are missing, state assumptions explicitly and flag conclusions as conditional.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, iterate, or stop.

1. **Observable Framing & System Abstraction**
   - Define the target observable in measurable terms and abstract the system into a minimal controllable model.
   - Identify stable states, thresholds, crossovers, or boundaries relevant to the behavior.
   - **Gate 1 — Abstraction check**: If the observable cannot be measured or the system resists meaningful abstraction, stop and refine the research question.

2. **Competing Hypothesis Generation**
   - For each candidate mechanism, formulate a falsifiable hypothesis linking hidden variables to the observable.
   - Assign evidence strength (high / moderate / weak / speculative), state key assumptions, and list likely failure modes.
   - Ensure hypotheses predict distinguishable trends, secondary diagnostics, or control outcomes.
   - **Gate 2 — Discrimination check**: If hypotheses are not empirically separable with available variables and controls, return to Step 1 to add auxiliary observables or refine the abstraction.

3. **Minimal Viable Validation Design**
   - Design the smallest experiment or simulation that can discriminate the leading hypotheses.
   - Specify independent variables, dependent variables, and a staged control suite: positive, negative, sham, mechanism, and calibration controls.
   - Define primary endpoints, failure criteria, and stop conditions before execution.
   - **Gate 3 — Feasibility check**: If no discriminating condition can be constructed safely and ethically, stop and reformulate.

4. **Execution & Baseline Verification**
   - Run the validation plan while monitoring baseline stability and control behavior.
   - **Gate 4 — Stability check**: If positive controls fail, negative controls mimic the test condition, or baseline drift exceeds tolerance, pause execution and troubleshoot before interpreting results.

5. **Mechanism Decomposition & Analysis**
   - Extract the primary observable and infer hidden variables using independent or semi-independent measurements.
   - Compare observations against baseline models; decompose residuals into candidate mechanism contributions.
   - Propagate uncertainty from indirect inputs, baseline fits, and preprocessing.
   - Check secondary diagnostics predicted by each mechanism.
   - **Gate 5 — Artifact check**: If residuals are dominated by artifacts, calibration errors, or uncontrolled confounders, flag for redesign and return to Step 3.

6. **Robustness & Boundary Mapping**
   - Sweep nearby parameters, geometries, or operating conditions to test sensitivity.
   - Identify regimes where the effect persists, weakens, reverses, or disappears.
   - **Gate 6 — Robustness check**: If the effect is fragile, irreproducible, or confined to an uncontrolled narrow regime, downgrade evidence strength and bound claims accordingly.

7. **Evidence Classification & Claim Bounding**
   - Classify overall evidence as strong, moderate, weak, or speculative based on controls, replication, boundary mapping, and uncertainty.
   - Distinguish paper-supported patterns, domain-supported inferences, and speculative extensions.
   - **Gate 7 — Claim check**: If evidence is weak and cannot be strengthened without violating constraints, stop and report bounded failure modes.

8. **Iteration or Termination**
   - If results support a hypothesis across regimes and controls, consider extending to a new stress dimension or related system.
   - If results are ambiguous, contradictory, or artifact-driven, update the mechanism map and return to Step 2 or Step 3 with revised hypotheses.
   - If the mechanism is falsified or infeasible, terminate with a clear null conclusion.
   - **Stop condition**: The loop ends when claims are validated across tested boundaries, falsified, or abandoned due to infeasibility.

# Output Format

Return results in this structure:

1. **Research question** — One concise, mechanism-centered question.
2. **System abstraction** — Minimal model, states, thresholds, or modules.
3. **Mechanism map** — Table of candidate mechanisms, predicted trends, hidden variables, diagnostics, and failure modes.
4. **Ranked hypotheses** — For each: claim, evidence strength, key assumptions, predicted observations, and minimal falsification test.
5. **Study plan** — Variables, staged controls, primary endpoint, and stop conditions.
6. **Analysis plan** — Baseline model, hidden-variable inference, residual decomposition, uncertainty treatment, and secondary diagnostics.
7. **Validation plan** — Robustness checks, boundary tests, and reproducibility strategy.
8. **Iteration rules** — How to update hypotheses for support, partial support, ambiguity, contradiction, or artifact.
9. **Claim boundaries** — What the study can and cannot conclude, including regime limits and evidence-type labels.

# Validation Gates

Summarize the decision gates from Core Workflow:

- **Abstraction gate**: Observable must be measurable and system abstractable.
- **Discrimination gate**: Hypotheses must predict separable outcomes.
- **Feasibility gate**: Validation must be constructible within constraints.
- **Stability gate**: Baselines and controls must behave as expected.
- **Artifact gate**: Residuals and confounders must not dominate mechanism signals.
- **Robustness gate**: Effects must survive parameter sweeps and replication.
- **Claim gate**: Evidence must justify the intended claim strength.

# Claim Boundaries

- Claims are valid only within the tested parameter regime, material class, geometry, and measurement window.
- Distinguish validated mechanism explanations from phenomenological correlations.
- Do not treat single-system results as field-wide consensus.
- Label inferences as paper-supported pattern, domain-supported inference, or speculative extension.
- Avoid extrapolating beyond mapped boundaries without labeling the extrapolation as unverified.

# Failure Modes

- **Abstraction failure**: System lacks identifiable states, thresholds, or separable modules.
- **Hypothesis failure**: Mechanisms are indistinguishable or predict identical observables.
- **Control failure**: Positive controls fail, negative controls replicate the effect, or sham controls produce false signals.
- **Artifact failure**: Calibration drift, measurement geometry, preprocessing, or environmental instability dominates the signal.
- **Robustness failure**: Effect disappears under replication, parameter variation, or independent measurement methods.
- **Overclaiming failure**: Conclusions exceed the evidence class or generalize beyond tested boundaries.

# Validity Checks

Before finalizing any proposal or conclusion, verify:
- **Mechanistic validity**: Observed trends are consistent with the proposed causal chain.
- **Control validity**: Controls isolate the target mechanism from artifacts and confounders.
- **Statistical validity**: Endpoints were pre-registered, uncertainty is reported, and multiple comparisons are handled.
- **Model validity**: Baseline models are appropriate for the regime; parameters are identifiable; residuals are inspected.
- **Reproducibility validity**: Independent repeats, cross-sample consistency, and temporal stability are addressed.
- **Boundary validity**: Operating limits and failure regimes are explicitly stated.
- **Ethical validity**: Safety, privacy, dual-use, and compliance risks are assessed for the intended scope.

# Provenance

- Derived from cluster `78`, subcluster `78.0`, archetype **observable-driven mechanism discovery and validation**.
- Synthesized from representative source skills: `e4572cf41c90afc6` (bistable-resonance-research-agent), `740e8e28d5644d09` (bioelectric-excitable-media-research), `da68f508c690bfe7` (interfacial-coverage-drop-deformation-research), `2bddbd396ad99420` (nonlinear-localization-research-design), `bc5cac68ecaca742` (semiconductor-spin-transition-exploration), `55b2ec62cf43a6bd` (cv-quantum-multifunction-platform-design), `560e013ebe86746e` (magneto-lattice-compensatory-materials-exploration), `87d77c6644a6a4cf` (topology-mediated-particle-routing).
