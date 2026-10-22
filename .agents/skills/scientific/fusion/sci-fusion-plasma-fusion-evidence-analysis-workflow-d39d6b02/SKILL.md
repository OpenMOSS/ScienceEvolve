---
name: sci-fusion-plasma-fusion-evidence-analysis-workflow-d39d6b02
description: End-to-end evidence analysis and claim audit workflow for magnetic confinement fusion and plasma research, from anomaly identification through falsifiable hypothesis validation to iterated claim refinement.
scienceevolve-title: "Magnetic confinement fusion · plasma fusion evidence analysis workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Help an agent conduct rigorous, end-to-end evidence analysis and claim auditing in magnetic confinement fusion and plasma physics. The workflow moves from an observed anomaly or explanatory gap to falsifiable hypotheses, controlled validation, multi-source cross-checking, and iterated claim refinement—without reproducing single-study conclusions, operational protocols, or device-specific parameters.

# When to use

- When evaluating a research claim, transport anomaly, stability observation, or performance gap in tokamak, stellarator, or related magnetic confinement systems.
- When designing validation for hypotheses that involve linear or nonlinear simulation, multi-diagnostic experiment, cross-code comparison, or synthetic diagnostic mapping.
- When migrating an analytical method pattern from one device, regime, or parameter space to a new problem and explicit boundary checks are required.
- When auditing whether evidence supports a mechanistic claim versus a correlational association, and distinguishing verified knowledge from novel inference.

# Inputs required

- **Target system context**: Device class, magnetic geometry, equilibrium characteristics, and operational regime relevant to the question.
- **Observed phenomenon or gap**: The specific anomaly, non-diffusive transport, mode activity, or performance deviation to be explained.
- **Evidence sources**: Available simulation codes, diagnostic sets, historical data, theoretical models, and their resolution/coverage limits.
- **Baseline knowledge**: Prior literature or established results that define the dominant mechanism and known confounders.
- **Constraints**: Computational budgets, diagnostic access, safety and compliance boundaries, and acceptable perturbation limits.

# Core Workflow

An ordered, end-to-end route with decision gates (G) and iteration/stop conditions.

1. **Frame the question and audit the gap**
   - Define the observed anomaly and the explanatory failure of existing models.
   - Distinguish the observation from noise, artifact, or background drift.
   - **G1**: Is the phenomenon well-defined and reproducible across independent samples or discharges?
     - *No*: Stop. Refine measurement protocol or increase sample size before proceeding.

2. **Map baseline mechanisms**
   - Catalog dominant/established mechanisms and their predicted signatures in the available observables.
   - **G2**: Does the dominant mechanism fully account for the observation within estimated uncertainties?
     - *Yes*: Stop. Claim is consistent with baseline; document boundary conditions.
     - *No*: Proceed to identify the explanatory gap.

3. **Generate falsifiable candidate hypotheses**
   - Derive alternative mechanisms from the gap (e.g., hidden linear branches, saturation pathway changes, geometry-dependent damping, cross-scale coupling).
   - For each candidate, specify: predicted signature in observables, evidence strength (high/medium/low), key assumptions, and pre-defined failure criteria.
   - **G3**: Are hypotheses specific enough to produce distinct, observable signatures under the planned controls?
     - *No*: Reformulate or decompose into sub-hypotheses.

4. **Design minimal viable validation (MVV)**
   - Select the smallest set of observations, scans, or control simulations that can discriminate among candidates.
   - Define controls:
     - **Strong control**: Vary only the target mechanism while holding background conditions fixed.
     - **Negative control**: Remove or suppress the target mechanism; expect signal disappearance or reduction.
     - **Positive control**: Use a known scenario to confirm the diagnostic/analysis pipeline can recover the expected signal.
     - **Input/control consistency**: Verify that cross-code or cross-diagnostic inputs are aligned before comparing outputs.
   - Pre-register stop/failure criteria (e.g., negative control yields target signal, results are numerically sensitive, safety boundary reached).
   - **G4**: Can the MVV be executed within current constraints without violating safety or compliance boundaries?
     - *No*: Redesign with lower-risk proxies or narrower scope.

5. **Execute multi-source evidence collection**
   - Collect evidence from independent diagnostics, simulation realizations, or cross-code comparisons.
   - Map model outputs to observable space via synthetic diagnostics or equivalent observables; do not compare unobservable internal quantities directly to experiment.
   - Record deviations, uncertainties, and sensitivity to input variations.

6. **Score evidence and audit claims**
   - Compare results against pre-registered predictions and controls.
   - Classify each hypothesis:
     - **Supported**: Predictions match observations; negative controls behave as expected; independent sources agree.
     - **Partially supported**: Trend matches but confounders or calibration issues remain.
     - **Not supported**: Predictions fail or negative control contradicts the hypothesis.
     - **Inconclusive**: Data quality, coverage, or reproducibility is insufficient.
   - **G5**: Have the pre-registered stop/failure criteria been triggered?
     - *Yes*: Halt the current hypothesis line; document failure mode and return to Step 3 for alternatives, or to Step 4 for refined MVV.
     - *No*: Proceed to claim closure.

7. **Iterate or refine**
   - If **Supported**: Strengthen the claim, narrow the boundary of validity, and optionally design a stricter test (return to Step 4).
   - If **Partially supported**: Refine the hypothesis to address residual confounders, then return to Step 4.
   - If **Not supported**: Reject or downgrade the hypothesis; generate an alternative mechanism and return to Step 3.
   - If **Inconclusive**: Improve data quality, diagnostic coverage, or simulation convergence, then return to Step 4.

8. **Finalize audited claim package**
   - Assemble the claim, the supporting evidence chain, residual uncertainties, explicit boundary conditions, and a record of what was verified versus what remains inferred.

# Output Format

The agent must produce a structured audit package containing:

1. **Research question and gap statement**: The anomaly and why baseline explanations are insufficient.
2. **Baseline mechanism map**: Dominant mechanisms, their expected signatures, and the identified gap.
3. **Candidate hypothesis table**: For each hypothesis: predicted signature, evidence strength, key assumptions, failure criteria, and controls.
4. **MVV design**: Variables, strong/negative/positive controls, evaluation metrics, and stop conditions.
5. **Evidence audit summary**: Results mapped to predictions, cross-source consistency, and classification (Supported/Partially supported/Not supported/Inconclusive).
6. **Iteration log**: Decisions made at each gate, changes to hypotheses, and rationale for continuing or stopping.
7. **Boundary and validity statement**: Extrapolation limits, model dependencies, diagnostic coverage limits, and safety/compliance constraints.
8. **Provenance**: References to the workflow skill and source clusters used.

# Validation Gates

Explicit criteria applied at decision points:

- **Reproducibility gate (G1)**: The anomaly must be detectable across multiple independent samples, discharges, or realizations; single-event claims are flagged as exploratory only.
- **Baseline sufficiency gate (G2)**: The dominant mechanism must be shown to fail before alternative hypotheses are prioritized.
- **Falsifiability gate (G3)**: Every candidate hypothesis must have at least one observable discriminant and a defined failure condition.
- **Feasibility and safety gate (G4)**: The MVV must not require operational parameters, hazardous procedures, or compliance violations; if it does, redesign.
- **Pre-registered stop gate (G5)**: Results that meet failure criteria (negative control failure, numerical sensitivity, diagnostic inconsistency) automatically halt the claim line.

# Claim Boundaries

- Do not treat linear instability predictions as direct evidence of nonlinear transport dominance.
- Do not extrapolate claims across device classes or regimes without re-validation of geometry, collisionality, and diagnostic observability.
- Do not equate simulation outputs with experimental truth; synthetic diagnostic mapping is required for comparison.
- Do not present single-case or single-implementation results as domain consensus.
- Distinguish "method pattern migration" (reusable logic) from "new problem inference" (unverified claim).

# Failure Modes

Pre-defined conditions that stop or reject a hypothesis line:

- **Negative control failure**: The target signal persists when the candidate mechanism is suppressed.
- **Numerical sensitivity**: Results change qualitatively with resolution, domain size, boundary conditions, or input reconstruction.
- **Diagnostic inconsistency**: Independent diagnostics yield contradictory trends that cannot be reconciled by calibration or timing errors.
- **Confounded attribution**: Multiple variables change simultaneously, preventing mechanistic attribution.
- **Safety/compliance boundary**: The required test exceeds authorized operational limits.
- **Inconclusive repeatability**: The signal cannot be reproduced across independent samples at the same evidence strength.

# Validity Checks

- **Confounding factors**: Verify that gradients, equilibrium changes, species mix, collisionality, or model approximations do not co-vary with the target mechanism.
- **Reproducibility**: Key results must be traceable to specific scans, controls, and diagnostics; independent realizations or analysis pipelines should agree.
- **Statistical validity**: Distinguish single events from repeated trends; report uncertainties, time-averaging windows, and sensitivity to outliers.
- **Diagnostic independence**: Avoid using multiple channels with shared error sources as independent evidence.
- **Model validity**: Confirm that theoretical approximations remain valid in the target regime; if not, switch to higher-fidelity models.
- **Boundary conditions**: State whether conclusions depend on specific geometry, gradient profiles, local approximations, or collisionality regimes.

# Provenance

- Workflow synthesized from cluster `8.0` (stellarator-transport-plasma-fusion-evidence-analysis), merging method patterns from source skills:
  - `stellarator-finite-beta-turbulence-research`
  - `plasma-mode-conversion-research-agent`
  - `fusion-plasma-kbm-research-workflow`
  - `phase-space-turbulence-research-workflow`
  - `fusion-ae-vv-research-pattern`
  - `tokamak-rotation-diagnostic-exploration`
  - `stellarator-localized-drive-mhd-exploration`
  - `stellarator-ebw-research-workflow`
- Source-specific conclusions, numerical thresholds, and device parameters have been excluded; only the shared evidence-analysis workflow structure is retained.
