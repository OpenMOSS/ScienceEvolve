---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-24670d29
description: A reusable end-to-end workflow for discovering and validating physical mechanisms in quantum, topological, transport, and phase systems using symmetry analysis, minimal modeling, and falsifiable hypothesis testing.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 50"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to discover and validate physical mechanisms in complex quantum, topological, transport, and phase systems by leveraging symmetry analysis, minimal effective models, and structured falsification. The workflow converts ambiguous observations or theoretical gaps into ranked, testable hypotheses and iterative validation plans without reproducing any single study.

# When to use

Use this skill when:
- A problem involves competing mechanisms (e.g., topology-driven versus geometry-driven, local versus nonlocal, symmetry-broken versus symmetric).
- Standard linear or equilibrium descriptions fail to explain anomalous transport, relaxation, phase coexistence, or emergent order.
- The user needs a research plan spanning hypothesis generation, minimal model design, control strategy, and iterative refinement.
- The target system involves quantum geometric features, topological invariants, tensor responses, or symmetry-protected phases.

Do not use this skill for direct operational execution of hazardous experiments, materials discovery without a mechanism question, or reproducing a single study's specific parameter set.

# Inputs required

Before starting, obtain or define:
- **Target system class** and relevant degrees of freedom: dimensionality, symmetry group, order parameter, band topology, or collective coordinates.
- **Observable anomaly or gap**: the deviation from baseline behavior that motivates the mechanism search.
- **Baseline model / null expectation**: the simplest description that should hold if the proposed mechanism is absent.
- **Candidate mechanism classes**: explanations tied to symmetry, topology, geometry, nonlocal coupling, hidden dynamics, or competing order.
- **Available tools**: analytic methods, numerical solvers, experimental observables, or literature benchmarks.
- **Constraints**: safety boundaries, computational or experimental feasibility, and acceptable uncertainty thresholds.

If any critical input is missing, state the assumption explicitly and treat downstream conclusions as lower-confidence hypotheses.

# Core Workflow

Execute the following ordered steps. Do not skip decision gates.

1. **Frame the mechanism-level question**
   - Reframe descriptive questions into structural ones: "Which symmetry or geometric ingredients make phenomenon Y possible?"
   - Define the null expectation and the alternative mechanism class.
   - **Gate:** If the question lacks a falsifiable contrast between null and alternative, stop and reformulate.

2. **Build a minimal symmetry-faithful model**
   - Construct the lowest-dimensional model that preserves the symmetries and low-energy degrees of freedom needed to test the mechanism.
   - Strip material-specific parameters and implementation details.
   - **Gate:** If the model cannot simultaneously represent both the null and the alternative hypotheses, expand or simplify until it can.

3. **Classify allowed states and channels by symmetry**
   - Use symmetry, topology, and statistics to enumerate candidate order parameters, transport channels, response tensors, or phase pathways.
   - Identify symmetry-allowed deviations from the ideal limit that could restore or suppress the target phenomenon.
   - **Gate:** If classification yields a single unavoidable outcome with no competing alternative, the mechanism is trivial; stop.

4. **Generate falsifiable hypotheses**
   - For each candidate mechanism, state: "If [symmetry/geometry/topology condition] holds, then [observable signature] should appear."
   - Tag evidence strength (speculative, low, medium, high, robust), list key assumptions, and list failure modes.
   - **Gate:** If a hypothesis lacks a distinct predicted signature or cannot be distinguished from the null, deprioritize or discard.

5. **Design minimal validation with layered controls**
   - **Negative control:** remove the proposed symmetry ingredient or mechanism.
   - **Positive control:** confirm the measurement or simulation pipeline with a known baseline.
   - **Reversal / orthogonality control:** vary a parameter expected to affect the competing mechanism but not the proposed one.
   - **Boundary control:** test the regime where the mechanism should weaken, saturate, or revert to null behavior.
   - **Stop condition:** If validation requires unsafe operational details or inaccessible parameters, redesign at the conceptual level.

6. **Execute analysis and extract mechanism-sensitive signatures**
   - Compute intermediates (e.g., effective kernels, reflection channels, tensor components, interface diagnostics) and compare against null predictions.
   - Prefer qualitative sign changes, scaling crossovers, topology transitions, or channel-specific evidence over single-point agreement.
   - **Gate:** If the signature is ambiguous or confounded by artifacts, do not proceed to mechanism attribution.

7. **Compare full and reduced descriptions**
   - Check whether a simplified analytic or collective-coordinate model captures the trend observed in full dynamics or detailed simulations.
   - If the reduced model disagrees with the full description, diagnose boundary effects, missing terms, or instability before claiming mechanism identification.
   - **Gate:** If the discrepancy is unresolved, flag the mechanism as unverified.

8. **Assess robustness and tradeoffs**
   - Test sensitivity to disorder, finite size, temperature, drive strength, or model refinement.
   - Evaluate stability-versus-control tradeoffs (e.g., symmetry breaking may enhance controllability while reducing stability).
   - **Gate:** If the effect exists only for a single untested parameter choice, downgrade evidence strength to low or speculative.

9. **Iterate based on evidence**
   - **If supported:** Strengthen the hypothesis only if negative, positive, and reversal controls behave as expected. Propose the next discriminating test.
   - **If absent:** Check whether model assumptions fail before rejecting the mechanism. Revise the hypothesis or target a more robust observable.
   - **If ambiguous:** Add an orthogonal observable, replace broad claims with channel-specific tests, or narrow the claimed validity range.
   - **If alternatives fit equally well:** Design a discrimination test where mechanisms predict opposite trends.
   - **Stop condition:** Stop if uncertainty intervals overlap the null prediction, competing phases dominate unanalyzed, or the claim requires unsupported extrapolation across platforms.

10. **Bound claims and document provenance**
    - Separate minimal-model predictions, robustness-tested predictions, and speculative extensions.
    - Label conclusions as directly supported, model-dependent inference, analogy, or extrapolation.

# Output Format

When using this skill, produce:

1. **Research question** — mechanism-level framing and null/alternative contrast.
2. **Gap diagnosis** — what is missing and why existing evidence is insufficient.
3. **Ranked hypotheses table** — for each: mechanism, evidence strength, key assumptions, predicted signature, and likely failure modes.
4. **Minimal validation plan** — independent variables, dependent variables, layered controls, evaluation metrics, and stop conditions.
5. **Analysis plan** — model hierarchy, symmetry checks, signature extraction, reduced-model comparison, and robustness tests.
6. **Iteration rules** — update logic for supported, weakened, refuted, and ambiguous outcomes.
7. **Validity and ethics statement** — scope limits, confounders, safety boundaries, and non-operational constraints.
8. **Evidence classification** — label each conclusion as direct, model-dependent inference, analogy, or extrapolation.

# Validation Gates

Before claiming support for a mechanism, confirm:

- **Symmetry validity:** The model includes all symmetries that constrain the mechanism and does not impose artificial symmetries that hide competing phases.
- **Statistics validity:** Fermionic antisymmetry, parity, or analogous constraints are enforced consistently.
- **Topology validity:** Topological invariants or protected signatures are computed only in appropriate regimes with compatible boundary conditions.
- **Numerical validity:** Results are stable under mesh refinement, finite-size changes, convergence tolerances, and initialization choices.
- **Control validity:** Negative, positive, reversal, orthogonality, and boundary controls are defined and evaluated.
- **Mechanism specificity:** The diagnostic distinguishes the target mechanism from alternatives, not merely shows that the null model is incomplete.

# Claim Boundaries

- Distinguish **minimal-model predictions** from **robustness-tested predictions** and **speculative extensions**.
- Do not transfer conclusions across material platforms or system classes without checking symmetry, dimensionality, disorder, and interaction differences.
- Do not present single-study or single-model findings as field consensus.
- Mark agent-inferred hypotheses separately from source-supported patterns.

# Failure Modes

- The proposed mechanism exists only for an accidental or unsupported parameter choice.
- The observable is equally explained by a simpler alternative mechanism (e.g., barrier variation, density-of-states change, disorder).
- The result depends on a symmetry or condition absent in the target platform.
- Numerical convergence, finite-size artifacts, or initialization bias remain unresolved.
- Boundary or edge effects dominate the diagnostic region.
- Competing orders or phases dominate but are not analyzed.
- The signature disappears under reversal or negative control.
- The validation plan requires operational details outside the agent's safe scope.

# Validity Checks

Before presenting results:

- Is the research question mechanism-level rather than a direct copy of a source platform?
- Does the plan identify why existing evidence is insufficient without treating any source as domain consensus?
- Are the necessary ingredients, symmetry constraints, and causal pathways explicit?
- Are negative, positive, symmetry, topology, geometry, boundary, and reference controls included where applicable?
- Are uncertainties estimated with methods appropriate for correlated, spatial, or stochastic data?
- Are initialization biases, conservation laws, and model-dependence addressed?
- Is reproducibility documentation sufficient for independent replication without hidden settings?
- Are extrapolation limits and material-specific assumptions separated from new inferences?
- Does the output remain at the non-operational research-design level and avoid hazardous procedural details?

# Provenance

- Derived from cluster **10.0** (symmetry-guided mechanism discovery and validation).
- Synthesized from representative source skills: `topological-geometric-superconductivity-workflow`, `light-driven-2d-material-andreev-transport-exploration`, `topological-dirac-pairing-research-design`, `nonequilibrium-phase-coexistence-workflow`, `nonlinear-magnetic-response-research-workflow`, `transient-network-relaxation-mechanism-discovery`, `superconducting-spintronics-phase-pumping-research`, `skyrmion-symmetry-tensor-transport-planning`.
- Paper-specific conclusions, numerical parameters, material choices, and operational protocols have been removed to produce a transferable workflow.
