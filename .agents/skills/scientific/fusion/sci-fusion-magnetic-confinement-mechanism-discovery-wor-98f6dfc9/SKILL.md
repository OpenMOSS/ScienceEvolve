---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-98f6dfc9
description: A reusable end-to-end workflow for generating, discriminating, and validating symmetry-guided transport and stability mechanisms in magnetic-confinement plasmas through controlled configuration families, hierarchical evidence layers, and iterative claim bounding.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow 3"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Guide agents to formulate mechanism-driven research questions, design controlled validation studies, and iterate on hypotheses for magnetic-confinement plasma transport, stability, and heating phenomena. The workflow transfers a reusable pattern of symmetry-guided mechanism discovery: isolate a controllable configuration or model variable, compare evidence across hierarchical layers, and update claims based on controlled discrepancies rather than paper-specific conclusions.

# When to use

- Use when the user asks for new research questions in stellarator, tokamak, or related magnetic-confinement concepts.
- Use when the task involves transport, stability, heating, energetic-particle confinement, field-error tolerance, or topology-sensitive phenomena.
- Use when designing theoretical, computational, or diagnostic validation plans with explicit controls and stop conditions.
- Do not use for operational device instructions, executable high-risk procedures, or as a substitute for facility safety review.

# Inputs required

- Target system class and geometry family.
- Controllable mechanism variable (e.g., magnetic configuration, symmetry property, profile shape, or coupling channel).
- Quantities to predict or compare (transport, stability, heating, confinement, or loss).
- Available evidence stack (analytic limits, reduced proxies, linear diagnostics, nonlinear simulations, experimental diagnostics).
- Boundary conditions and constraints to hold fixed for isolation.
- Known limiting cases, conservation laws, symmetries, or benchmarks.
- Resource limits and safety constraints.

If key inputs are missing, state assumptions, mark them as uncertain, and propose a minimal information-gathering step.

# Core Workflow

1. **Frame the mechanism question.** Define a causal link between a controllable configuration or model variable and a transport, stability, or heating outcome. State the performance gap and why existing explanations are insufficient.

2. **Identify the domain gap.** Locate where prior models, optimizations, or diagnostics fail to explain observed or predicted behavior. Separate paper-supported methods from new inferences.

3. **Construct a controlled family.** Generate candidate states or models that vary the target mechanism variable while preserving key global constraints and boundary conditions. Define baseline, mechanism-on, mechanism-off, and strong-control cases.

4. **Generate discriminating hypotheses.** Produce 3–5 hypotheses, each with:
   - Mechanism claim and model implication.
   - Evidence strength (weak / moderate / strong / speculative).
   - Key assumptions and expected signatures across evidence layers.
   - Failure modes and extrapolation boundaries.

5. **Design hierarchical validation.** Plan evidence layers matched to the claim:
   - Reduced proxies for directional screening only.
   - Linear or analytic diagnostics for mechanistic clues.
   - Nonlinear simulations or experimental observables for confirmation.
   - Independent validation metrics not used for tuning.

6. **Run layer-wise analysis.**
   - Verify equilibrium or model generation preserves intended controls.
   - Apply proxies without treating them as absolute predictions.
   - Compare linear diagnostics to identify plausible mechanisms.
   - Perform higher-fidelity validation at representative points.

7. **Decision Gate 1 — Control & Confounding Check.**  
   *If* unrelated equilibrium changes, profile assumptions, numerical artifacts, or stability limits dominate the outcome, *then* stop and redesign the controlled family. *Else* proceed.

8. **Cross-layer evidence synthesis.** Classify each result as supportive, neutral, contradictory, or inconclusive. Use discrepancies between layers as signals of missing physics or regime boundaries, not as noise.

9. **Decision Gate 2 — Mechanism Discrimination.**  
   *If* negative controls show the predicted signature or positive controls fail, *then* reject or redesign the hypothesis. *If* proxy and nonlinear evidence diverge, *then* refine the screening model. *If* agreement is strong, *then* strengthen the claim and proceed.

10. **Robustness and scaling checks.** Test sensitivity to uncertain inputs, boundary conditions, profile assumptions, and closure choices. Verify that the mechanism persists across relevant scale, geometry, or regime variations.

11. **Decision Gate 3 — Claim Bounding.**  
    *If* conclusions reverse under modest sensitivity or closure refinement, *then* downgrade evidence strength and iterate. *If* the claim survives, *then* scope it explicitly to the tested configuration family and regime.

12. **Iterate or extrapolate.** Convert unresolved questions into new bounded hypotheses. Define the next validation step before broadening the claim.

# Output Format

When using this skill, return:

1. **Research question** — one bounded mechanism question.
2. **Evidence map** — known support, inferred gaps, and unverified items.
3. **Ranked hypotheses** — 3–5 hypotheses with evidence strength, assumptions, expected signatures, failure modes, and extrapolation boundaries.
4. **Study design** — controlled family, variables, controls, evaluation metrics, and stop conditions.
5. **Analysis plan** — hierarchical layer sequence and visualization strategy.
6. **Iteration rules** — how specific results strengthen, weaken, refute, or redirect the hypothesis.
7. **Validity and safety notes** — confounders, reproducibility needs, uncertainty, and non-operational boundaries.

# Validation Gates

- **Control validity:** Baseline and controls must isolate the target variable; confounding changes must be smaller than the mechanism signal.
- **Cross-layer consistency:** Claims require agreement across at least two independent evidence layers, or explicit accounting for discrepancies.
- **Structural validity:** Scalar metrics must be accompanied by spatial, spectral, or phase-space signatures when structure is part of the claim.
- **Reproducibility:** Inputs, normalizations, assumptions, and solution criteria must be explicit enough for independent replication.

# Claim Boundaries

- Label claims as paper-validated, benchmark-supported, or agent-inferred.
- Do not present a single study or configuration family as field-wide consensus.
- State the regime where the mechanism is expected to hold and where reduced proxies or simplified closures may fail.
- Separate demonstrated observations from inferred mechanisms and speculative extrapolations.

# Failure Modes

- Configuration family fails to isolate the target variable.
- Unrelated equilibrium or numerical changes dominate the outcome.
- Proxy, linear, and nonlinear evidence diverge without a resolved explanation.
- Negative controls show the predicted signature, indicating artifacts or hidden confounders.
- Conclusions depend on a single unvalidated model assumption or paper-specific numerical setting.
- Required mode amplitudes or profile separations lie outside credible physical or facility constraints.

# Validity Checks

- **Confounding:** Ensure observed changes are not caused by unrelated profile, equilibrium, stability, numerical-representation, or diagnostic artifacts.
- **Reproducibility:** Record configuration logic, diagnostics, comparison axes, and uncertainty estimates.
- **Statistical and numerical validity:** Use representative cases, sensitivity tests, convergence checks, and benchmark comparisons rather than single-point evidence.
- **Boundary conditions:** State the asymptotic regime, geometry family, and validity range explicitly.
- **Model hierarchy:** Keep proxies, linear diagnostics, and nonlinear validation distinct; do not treat a proxy as a substitute for validation.
- **Scope control:** Distinguish paper-supported findings, agent inferences, and proposed future tests.

# Provenance

- Derived from cluster 2 / subcluster 2.1: symmetry-guided mechanism discovery and validation.
- Synthesized from source skills: stellarator-shear-itg-exploration, icrf-heating-confinement-research-exploration, stellarator-transport-state-workflow, hybrid-mhd-gyrokinetic-exploration, periodic-field-error-research-workflow, toroidal-plasma-spatial-channeling-workflow, stellarator-neoclassical-transport-research-design, gyrokinetic-periphery-research-planning.
- Preserves methodological patterns without transferring paper-specific parameters, numerical results, or operational protocols.
