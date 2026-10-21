---
name: sci-quantum-transport-quantum-topological-defect-eviden-db976a3f
description: A reusable end-to-end workflow for generating mechanism-based hypotheses, designing minimal viable validation with strong controls, and auditing evidence claims across transport, quantum, topological, and defect-driven systems.
scienceevolve-title: "Quantum materials and condensed matter · transport quantum topological defect evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Provide a reusable, end-to-end agent instruction for proposing new research questions, generating ranked mechanism-based hypotheses, designing minimal viable validation plans with rigorous controls, executing multi-method evidence analysis, and iteratively auditing claim strength in studies of transport, quantum, topological, and defect-driven phenomena. The workflow emphasizes claim bounding and robustness checking over single-study conclusion replication.

# When to use

- When asked to propose a new research question or mechanism hypothesis in condensed matter, quantum materials, or statistical physics where transport, topology, defects, or strong correlations play a role.
- When migrating a known mechanism from a benchmark system to a new system, geometry, or parameter regime.
- When designing validation plans that require distinguishing causal mechanisms from correlational artifacts using controlled comparisons.
- When auditing the strength of evidence for a claim involving non-uniformities, interfaces, localized states, or emergent topological/order properties.
- When iterating on a study plan after initial simulation, computation, or experiment yields partial, contradictory, or noisy results.

# Inputs required

- Target system class and its key degrees of freedom (e.g., lattice, continuum, many-body, open quantum).
- Benchmark or reference behavior for the system class in a simplified limit (uniform, defect-free, closed, or equilibrium).
- Candidate perturbations or design variables (defects, interfaces, boundary conditions, driving protocols, disorder).
- Observable space: measurable or computable quantities that can resolve local vs. global, static vs. dynamic, or linear vs. non-linear responses.
- Available methods/theory tiers and their known approximations.
- Constraints: resource limits, safety/ethics boundaries, convergence requirements, and reproducibility standards.

# Core Workflow

1. **Frame the gap and benchmark**
   - Define the macroscopic target phenomenon or transport/functionality bottleneck.
   - Establish a benchmark model in a simplified, controllable limit (e.g., uniform, infinite, defect-free, closed) to anchor expectations.
   - **Decision Gate 1:** Can the benchmark be reliably reproduced or referenced? If no, stop and fix the benchmark before proceeding.

2. **Generate mechanism-based hypotheses**
   - Propose candidate mechanisms linking perturbations to observable changes via causal chains (perturbation → coupling → local/global response → functional consequence).
   - For each hypothesis, assign evidence strength (High / Medium / Low), state key assumptions, identify falsifiable predictions, and list failure modes.
   - Include at least one null/competing hypothesis and one failure-mode hypothesis.
   - **Decision Gate 2:** Are the hypotheses distinguishable by available observables within resource constraints? If no, refine observables or narrow scope.

3. **Design minimal viable validation (MVV)**
   - Define the smallest system or dataset that can discriminate the leading hypothesis from the null/competitor.
   - Specify control hierarchy:
     - *Positive control:* benchmark system with known behavior to verify pipeline sensitivity.
     - *Negative control:* system where the target mechanism is absent or suppressed.
     - *Strong control:* identical protocol but with one mechanistic factor altered to isolate causality.
   - Define independent variables, dependent variables, and confounding variables to hold constant.
   - **Decision Gate 3:** Does the MVV include a clear stop condition if baseline checks fail (e.g., benchmark not reproduced, conservation laws violated, statistical noise dominates signal)? If no, redesign controls.

4. **Execute multi-method evidence collection**
   - Run the MVV using the primary method.
   - Collect data at multiple scales (local, intermediate, global) and resolutions as relevant.
   - Cross-check with an independent method, approximation tier, or analytical limit where possible.
   - **Decision Gate 4:** Do internal consistency checks pass (conservation laws, convergence, reproducibility across seeds/initial conditions)? If no, halt and diagnose numerical or experimental artifacts.

5. **Analyze and triangulate**
   - Map responses onto the hypothesized causal chains.
   - Compare results across controls to attribute effects to the intended mechanism rather than artifacts (boundary effects, finite-size, initialization bias, measurement back-action).
   - Quantify uncertainties and sensitivity to analysis choices (thresholds, windows, binning, fitting ranges).
   - **Decision Gate 5:** Does the effect size exceed combined uncertainty and confounding variation? If no, classify as "unresolved" rather than "supported".

6. **Iterate or redesign**
   - *If supported:* escalate to broader parameter scans, scale analysis, or robustness checks (disorder, geometry, method sensitivity).
   - *If partially supported:* decompose the causal chain; identify which sub-step is weak or ambiguous; design a targeted follow-up MVV.
   - *If contradicted:* preserve the negative result as a constraint; reformulate mechanism or revisit benchmark assumptions.
   - *If inconclusive:* improve statistical power, reduce noise, or switch observables; do not extrapolate.
   - **Stop Condition:** Terminate when claim is either robustly bounded, falsified, or deemed unverifiable under current constraints; document the limiting factor.

7. **Audit and output**
   - Assemble the evidence map distinguishing "benchmark-verified", "analogical inference", and "new-system prediction".
   - State claim boundaries explicitly (dimensionality, symmetry, disorder strength, temperature/energy scale, method approximation).
   - Flag residual risks (untested assumptions, extrapolation distance to real materials/devices).

# Output Format

Each invocation must produce:

1. **Research Question** — One-sentence definition of the new problem and its challenge to the default model.
2. **Evidence Map** — Benchmark-verified facts, analogical inferences, and new-system predictions with evidence strength labels.
3. **Hypothesis Table** — Ranked hypotheses with mechanism, key assumptions, predicted observables, failure modes, and evidence strength.
4. **Validation Plan** — MVV description, variable definitions, control hierarchy (positive/negative/strong), metrics, and stop conditions.
5. **Analysis Plan** — Data triangulation strategy, uncertainty quantification, and robustness checks.
6. **Iteration Rules** — Decision tree for support / partial support / contradiction / inconclusive.
7. **Claim Boundary & Validity Statement** — Explicit scope, extrapolation limits, and reproducibility requirements.

# Validation Gates

- **Gate 1 (Benchmark Reproducibility):** The simplified benchmark must yield expected behavior within known tolerance.
- **Gate 2 (Hypothesis Discriminability):** Hypotheses must predict measurably different outcomes for at least one accessible observable.
- **Gate 3 (Control Integrity):** Positive and negative controls must behave as expected; otherwise the validation pipeline is invalid.
- **Gate 4 (Internal Consistency):** Conservation laws, sum rules, convergence, and statistical checks must hold.
- **Gate 5 (Mechanistic Attribution):** The effect must persist under strong-control variations that preserve the mechanism and vanish or shift under variations that remove it.
- **Gate 6 (Uncertainty Dominance Check):** Reported confidence intervals or convergence errors must not overlap with the null/competing hypothesis prediction.

# Claim Boundaries

- Distinguish "established mechanism" (reproduced in benchmark) from "plausible inference" (consistent with analogical reasoning) from "speculative prediction" (requires independent verification).
- Restrict claims to the validated parameter window; avoid extrapolation across dimensionality, symmetry class, disorder strength, or method approximation without recalibration.
- Do not present single-configuration, single-trajectory, or single-method results as consensus.
- Separate computational/experimental prediction from operational engineering recommendation.

# Failure Modes

- **Benchmark drift:** The benchmark system fails to reproduce known behavior due to implementation errors, inconsistent parameters, or changed boundary conditions.
- **Confounding dominance:** Observed signal arises from finite-size effects, boundary artifacts, initialization bias, numerical discretization, or measurement back-action rather than the target mechanism.
- **Mechanism misattribution:** Correlation between perturbation and response is mistaken for causation due to missing strong controls or alternative mechanism paths.
- **Statistical overreach:** Claims of significance based on insufficient sampling, multiple comparison without correction, or fitting in overly narrow windows.
- **Extrapolation overconfidence:** Applying a mechanism validated in one regime to an untested regime without downgrading evidence strength.
- **Tool misuse:** Applying an approximation outside its derived validity range.

# Validity Checks

- **Reproducibility:** Document model definitions, random seeds, sampling strategies, code versions, analysis scripts, and exclusion criteria.
- **Statistical rigor:** Report error propagation, confidence intervals, resampling outcomes, and sensitivity to analysis window/threshold choices.
- **Method cross-validation:** Core conclusions should be supported by at least two independent methods, approximations, or observable channels.
- **Confounding audit:** Systematically list and check finite-size, boundary, initialization, discretization, disorder realization, and environmental coupling effects.
- **Causal logic:** Ensure that controls are designed to break specific links in the proposed causal chain, not just vary unrelated parameters.
- **Scope discipline:** Verify that every claim is tagged with its applicable symmetry, dimensionality, temperature/energy scale, and approximation tier.

# Provenance

- Synthesized from cluster 18 / subcluster 18.0.
- Source skills: optical-lattice-entropy-redistribution-research (89aabeddde84e037), ferroelectric-defect-ter-exploration (0d5ba6f754fc70e9), high-pressure-mixture-exploration (3ce3ccedc5e16a3d), frustrated-lattice-ice-workflow (70c18310ed5076d1), polymer-correlation-scaling-research (35750062d4066028), plasma-discharge-regime-exploration (8a20af1250bb4d09), monitored-topological-entanglement-exploration (arxiv-cmoat__2606.25653), phonon-defect-scattering-research-pattern (e143e83888157487).
- No specific paper conclusions, numerical parameters, or operational protocols are inherited.
