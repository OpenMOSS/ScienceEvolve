---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-7b836e3f
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in magnetic confinement research, from gap identification to iterative hypothesis testing and claim bounding.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow 2"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Help agents design reusable, end-to-end research plans for symmetry-guided mechanism discovery and validation in magnetic confinement systems. The workflow translates design gaps into falsifiable hypotheses, controlled studies, and iterative evidence updates without reproducing device-specific conclusions or operational details.

# When to use

- A user asks for new research questions in stellarator, tokamak, hybrid, or three-dimensional magnetic confinement concepts.
- A user provides a configuration concept, simulation result, or diagnostic dataset and asks how to design a minimal validation plan.
- A user needs to compare candidate magnetic geometries or distinguish competing physical mechanisms.
- A user wants to turn an optimization or design paper into a transferable research workflow.

Do not use this skill for operational plasma operation instructions, real-time control commands, facility safety certification, or non-plasma domains unless adapting by analogy.

# Inputs required

Ask for or infer:

- **Target system class**: confinement concept and geometry family.
- **Physical quantity to explain or improve**: equilibrium quality, stability margin, transport channel, confinement property, or exhaust behavior.
- **Candidate mechanisms or design levers**: symmetry properties, magnetic shaping, profile families, boundary topology, or feedback variables.
- **Baseline or reference case**: prior optimum, analytic construction, or established benchmark for comparison.
- **Available modeling and diagnostics**: simulation capabilities, synthetic diagnostics, or measurement classes.
- **Constraints and boundaries**: institutional, safety, compliance, or feasibility limits.

If inputs are incomplete, state assumptions explicitly and design a minimal validation that reduces the largest uncertainty first.

# Core Workflow

1. **Frame the gap and map mechanisms**
   - Compare accepted model assumptions or baseline behavior against unresolved observations or design tensions.
   - Identify the specific mismatch to be explained.
   - Build a mechanism map linking each candidate design lever to a predicted physical effect, a measurable signature, and a falsifier.
   - **Decision Gate — Candidate Gate**: If no falsifiable mechanism can be stated, stop and reformulate the research gap.

2. **Generate and rank competing hypotheses**
   - For each mechanism, state the causal prediction, the falsifier, evidence strength (Observed / Inferred / Hypothesis / Speculative), key assumptions, and likely failure modes.
   - Require at least one alternative hypothesis that could explain the same signature.
   - Rank by discriminating value, feasibility, and relevance to the target system.
   - **Decision Gate — Candidate Gate**: If hypotheses cannot be ranked or lack explicit controls, return to Step 1.

3. **Design a minimal discriminating study**
   - Define a baseline/reference case and a candidate case.
   - Specify independent variables (e.g., magnetic geometry, symmetry class, profile family), dependent variables (e.g., stability indicator, transport signature, confinement metric), and nuisance variables.
   - Include negative controls (absence of predicted mechanism), positive controls (validated benchmark), and initialization or instrumentation null tests.
   - Pre-register primary metrics, evaluation criteria, and stop conditions.
   - **Decision Gate — Robustness Check**: If diagnostics or simulations cannot distinguish the mechanism from confounders, reduce scope or abort.

4. **Execute and collect evidence**
   - Run simulations, process diagnostic data, or conduct analyses following the pre-registered plan.
   - Enforce comparability across arms: consistent coordinates, scaling conventions, resolution, and calibration.
   - Monitor for convergence, numerical artifacts, and unexpected coupled behavior.
   - **Stop Condition — Stability Gate**: Halt if convergence fails, safety or compliance boundaries are approached, or results are dominated by numerical artifacts. Preserve partial results.

5. **Analyze and validate mechanism specificity**
   - Verify input consistency and comparability across cases.
   - Compare candidate versus baseline on the primary metric.
   - Check coupled metrics for trade-offs or hidden degradation.
   - Assess whether the effect is localized and timed as predicted by the mechanism.
   - Classify each conclusion as demonstrated, inferred by analogy, speculative, or unsupported.
   - **Decision Gate — Mechanism Exclusion**: If the primary signature is absent and controls are valid, exclude or downgrade the mechanism and return to Step 2. If results are ambiguous, proceed to Step 6.

6. **Iterate or redesign**
   - **If supported**: Strengthen the claim only after controls pass; plan an independent validation case or broader parameter sweep before extrapolating.
   - **If trade-off appears**: Map the Pareto surface and test whether geometry or control variables can decouple the objectives.
   - **If contradicted**: Preserve the negative result, identify the failed assumption (geometry, boundary, model, diagnostic), and generate a revised hypothesis.
   - **Decision Gate — Iteration Gate**: If no mechanism survives two full cycles, stop and report the null finding with uncertainty bounds. Do not add unrelated success metrics to salvage a hypothesis.

7. **Bound claims and archive**
   - State explicit claim boundaries: what is demonstrated, what is inferred, and what remains speculative.
   - Define extrapolation limits (device class, size, heating regime, model family).
   - Document assumptions, negative results, and failed controls for future reuse.

# Output Format

Return results in this structure:

1. **Research objective**: one sentence stating the target question.
2. **Mechanism map**: table with design lever, predicted physical effect, measurable signature, and falsifier.
3. **Ranked hypotheses**: list with evidence strength, key assumptions, likely failure modes, and minimum viable validation.
4. **Study design**: variables, controls, metrics, and stop conditions.
5. **Analysis plan**: comparability checks, mechanism-specific comparisons, uncertainty quantification, and evidence classification.
6. **Iteration plan**: how results update the hypothesis and what follow-up studies are triggered.
7. **Validity and boundary statement**: confounders, reproducibility requirements, extrapolation limits, and compliance boundaries.

# Validation Gates

- **Candidate Gate (Steps 1–2)**: A mechanism must be falsifiable and hypotheses must be rankable with explicit controls. If not, reformulate before proceeding.
- **Robustness Check (Step 3)**: The study design must include controls that can distinguish the proposed mechanism from confounders. If diagnostics or simulations lack discriminating power, reduce scope or abort.
- **Stability Gate (Step 4)**: Execution halts if convergence fails, numerical artifacts dominate, or safety and compliance boundaries are approached. Partial results are preserved.
- **Mechanism Exclusion (Step 5)**: If the primary signature is absent under valid controls, the mechanism is excluded or downgraded and the workflow returns to hypothesis generation.
- **Iteration Gate (Step 6)**: The workflow stops after two full cycles if no mechanism survives controls, reporting a null finding with uncertainty bounds.

# Claim Boundaries

- Do not treat single-paper, single-device, or single-simulation results as field-wide consensus.
- Do not extrapolate to reactor-relevant or scaled regimes without independent validation and explicit uncertainty analysis.
- Distinguish demonstrated, inferred, and speculative conclusions in every output.
- Do not assert causality without temporal ordering, spatial localization, and mechanism specificity.
- Keep claims bounded to the validated geometry family, regime, and model class.

# Failure Modes

- Local optimization artifacts or fragile optima that disappear under perturbation.
- Proxy mismatch: an engineering or reduced proxy fails to capture the intended physical property.
- Hidden coupling between metrics, where improving one objective degrades another.
- Confounding by initialization, resolution, profile assumptions, or coordinate choices.
- Diagnostic or reconstruction ambiguity that mimics the predicted signature.
- Overfitting to a single configuration, model family, or initialization path.
- Feasibility or safety constraint violations that invalidate the study design.

# Validity Checks

- **Confounding**: Ensure only the intended design lever varies; check for geometry, profile, boundary, calibration, or numerical side effects.
- **Reproducibility**: Require repeated runs, independent diagnostics, benchmark comparisons, or cross-device patterns before strengthening claims.
- **Numerical and model validity**: Verify convergence, residuals, conservation properties, resolution sensitivity, and model-form adequacy.
- **Mechanism specificity**: Confirm the strongest effect occurs where the mechanism predicts overlap between cause and response.
- **Boundary conditions**: Check whether vacuum, finite-pressure, edge, divertor, or heating-channel effects alter interpretation.
- **Extrapolation**: Label conclusions as specific to the tested configuration, generalizable within a device class, or speculative beyond current evidence.
- **Evidence labeling**: Separate source-paper observations, agent-inferred hypotheses, and untested extrapolations.

# Provenance

- Cluster 11 / Subcluster 11.0: symmetry-guided mechanism discovery and validation.
- Synthesized from source skills: computational-fusion-research-workflow (10.6028_jres.114.016), stellarator-physics-optimization-workflow (10.1063_1.860481), compact-qa-stellarator-optimization-workflow (10.1088_1361-6587_add598), qa-stellarator-research-pattern (10.1088_0741-3335_41_12b_320), three-dimensional-magnetic-shaping-research (10.1063_1.4806765), stellarator-diagnostic-research-workflow (10.1063_1.1148226), stellarator-neoclassical-turbulence-workflow (10.1063_5.0047291), and stellarator-integrated-design-exploration (10.1088_0029-5515_43_6_304).
- No paper-specific conclusions, numerical results, or operational protocols are included.
