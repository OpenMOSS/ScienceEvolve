---
name: sci-urban-mechanism-driven-resilience-research-design-w-4dd1031e
description: A reusable end-to-end research design workflow for generating mechanism-based hypotheses, minimum viable validation studies, and iterative analysis across wind, urban, seismic, flood, and resilient infrastructure systems.
scienceevolve-title: "Urban hazard resilience · mechanism driven resilience research design workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Use this skill to transform a new research idea in wind, urban, seismic, flood, or resilient infrastructure domains into a transferable, mechanism-driven study plan. The goal is to help an agent formulate falsifiable hypotheses, design controlled validation studies, and iterate safely without copying source-paper parameters or treating single studies as field consensus.

# When to use

Use when the user asks to:
- Explore new research questions involving flow-structure interaction, dynamic loading, nonlinear response, or multi-hazard resilience.
- Design simulation, experimental, or hybrid validation plans for mechanisms such as dynamic stall, wake interaction, pressure redistribution, isolation, rocking, staged yielding, or damage-recovery coupling.
- Compare innovative concepts against conventional baselines using matched controls.
- Plan iterative hypothesis refinement based on multi-field evidence and uncertainty audit.

Do not use for operational engineering design, construction instructions, safety certification, or field-deployment decisions.

# Inputs required

- Target system class and research objective.
- Candidate mechanism and the response metric it should affect.
- Available benchmark or validation evidence (experiments, simulations, literature, field data).
- Baseline system or conventional practice for matched comparison.
- Constraints: computational or experimental resources, safety boundaries, regulatory limits, and data access.
- Desired outputs: research questions, hypothesis set, study design, analysis plan, or iteration roadmap.

# Core Workflow

1. **Frame the mechanism gap.** Define the mismatch between current assumptions and the proposed system's behavior. Convert this into a measurable research question focused on a single causal mechanism.
   - *Gate:* If the question cannot be framed as a falsifiable mechanism claim, stop and clarify.

2. **Generate ranked hypotheses.** For each candidate mechanism:
   - State the mechanism claim, expected response link, and operating regime.
   - Label evidence strength (high / medium / low / speculative).
   - List key assumptions, most likely failure modes, and extrapolation boundaries.
   - Prefer hypotheses falsifiable through contrasts (enhanced vs. suppressed conditions).
   - *Gate:* If no hypothesis can be falsified with available resources, stop and redefine scope.

3. **Design minimum viable validation.** Construct a study with:
   - Baseline condition (mechanism weak or absent).
   - Mechanism-enhanced condition.
   - Mechanism-suppressed or negative control condition.
   - Positive control or benchmark comparison.
   - Independent, dependent, and nuisance variables.
   - Evaluation metrics spanning global response, local mechanism indicators, and credibility checks.
   - *Stop condition:* If controls cannot isolate the mechanism, redesign before proceeding.

4. **Validate the approach before embedding.** Confirm that the model, simulation, or experimental setup reproduces trusted benchmarks or recognized trends under comparable conditions.
   - *Gate:* If validation fails or discrepancies are unexplained, treat them as hypothesis generators, not failures to ignore. Stop if artifacts dominate.

5. **Execute and analyze.** Run the study and analyze in this order:
   - Check data quality, repeatability, and uncertainty.
   - Compare global responses across conditions.
   - Inspect local diagnostics where responses diverge.
   - Triangulate using multiple fields (e.g., pressure/velocity/force, or displacement/energy/damage).
   - Map discrepancies to confounders (boundary conditions, resolution, geometry, inflow, material assumptions).
   - Classify conclusions as verified, inferred, or speculative.

6. **Audit uncertainty and robustness.** Test sensitivity to modeling choices, boundary assumptions, scenario selection, and measurement methods.
   - *Gate:* If conclusions flip under reasonable assumption changes, downgrade evidence strength and redesign.

7. **Iterate or stop.** Update the hypothesis set based on evidence:
   - *If supported:* Narrow the extrapolation boundary and test the next limiting condition.
   - *If mixed:* Split the hypothesis by regime or variable range.
   - *If contradicted:* Preserve the negative result, revise the mechanism, and rerun minimum viable validation.
   - *Stop conditions:* Unresolved setup verification, dominant numerical or measurement artifacts, inconsistent mechanism-response timing, safety or compliance violations, or diminishing returns where additional work repeats the same mechanism without testing new uncertainty.

# Output Format

Return the research plan in this structure:

1. **Research question** — concise mechanism-level question and its significance.
2. **Mechanism hypothesis set** — each with claim, evidence strength, key assumptions, failure modes, and extrapolation boundary.
3. **Study design** — baseline, enhanced, suppressed, positive control, negative control, benchmark, variables, metrics, and stop conditions.
4. **Validation plan** — benchmark checks, credibility metrics, and sensitivity scope.
5. **Analysis plan** — data quality checks, comparison logic, multi-field triangulation, discrepancy mapping, and evidence classification.
6. **Iteration plan** — decision rules for support, mixed evidence, contradiction, and unvalidated states.
7. **Validity and ethics review** — confounders, reproducibility checks, safety boundaries, and claim limits.

# Validation Gates

- **Mechanism clarity:** The hypothesis identifies a causal mechanism, not just a desired outcome.
- **Baseline fairness:** Target and baseline are matched in demand, boundary behavior, and measurement approach.
- **Control adequacy:** Positive, negative, and benchmark controls are defined and capable of isolating the mechanism.
- **Metric coherence:** Metrics capture both primary response and secondary effects (e.g., damage vs. recovery, force vs. displacement).
- **Reproducibility:** Inputs, assumptions, post-processing definitions, and exclusion rules are documented for independent review.
- **Statistical and numerical validity:** Uncertainty, repeated observations, convergence, and sampling adequacy support the claim strength.

# Claim Boundaries

- Distinguish source-paper methods from agent-inferred extensions.
- Label conclusions as verified (benchmark-supported), inferred (plausible under assumptions), or speculative (untested).
- State explicit extrapolation limits for geometry, regime, environment, and system scale.
- Do not generalize from a single study, model family, or narrow parameter set to domain-wide consensus.

# Failure Modes

- **Hidden degradation:** A mechanism improves one metric while masking damage or secondary amplification.
- **Metric saturation:** The chosen metric fails to resolve differences in the regime of interest.
- **Confounded comparison:** The baseline and target differ by more variables than the hypothesis can interpret.
- **Artifact-driven results:** Numerical, measurement, or boundary artifacts are mistaken for physical mechanisms.
- **Unfair benchmark:** The conventional comparison is mismatched in demand, stiffness, mass, or boundary conditions.
- **Extrapolation overreach:** Findings are applied beyond tested geometries, flow regimes, hazard classes, or system scales.

# Validity Checks

- **Evidence separation:** Benchmark-confirmed results are distinct from new inferences.
- **Confounding review:** Geometry, inflow, boundary, material, measurement, and numerical assumptions are listed as alternative explanations.
- **Repeatability:** Phase-resolved or run-resolved consistency is required with uncertainty estimates.
- **Resolution sensitivity:** Mesh, discretization, time resolution, or sensor density does not drive the mechanism.
- **Boundary-condition validity:** Inlet, outlet, support, and environmental abstractions are appropriate and do not create the observed effect.
- **Mechanism consistency:** Local diagnostics and global metrics tell the same story; if not, downgrade the claim.
- **External validity:** Findings are not generalized to full-scale design, fluctuating environments, or other system classes without further evidence.

# Provenance

- Synthesized from cluster 19.0 (wind-urban-seismic-flood-resilience-cfd research design).
- Source skill references: `vawt-dynamic-stall-research-pattern`; `stall-regulated-wind-turbine-cfd-design-exploration`; `flexible-membrane-wind-research-workflow`; `layered-response-control-research`; `seismic-resilient-coupled-wall-research`; `resilient-structural-damage-recovery-assessment`; `cfd-wake-research-exploration`; `bridge-rocking-isolation-research-workflow`.
- Methodological patterns were abstracted from peer-reviewed studies in wind engineering, structural/seismic engineering, and computational fluid dynamics; no paper-specific parameters, numerical results, or operational protocols are preserved in this reusable workflow.
