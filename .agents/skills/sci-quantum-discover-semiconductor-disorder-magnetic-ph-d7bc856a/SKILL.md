---
name: sci-quantum-discover-semiconductor-disorder-magnetic-ph-d7bc856a
description: Reusable end-to-end workflow for discovering and validating microscopic mechanisms in complex materials systems exhibiting phase transitions, disorder, semiconductor transport, or magnetic anomalies.
scienceevolve-title: "Quantum materials and condensed matter · discover semiconductor disorder magnetic phase transitions"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent transform ambiguous or anomalous observations in complex materials into a structured, falsifiable mechanism-discovery process. The workflow generates competing hypotheses, designs minimal viable validation with strong controls, discriminates mechanisms via multi-channel evidence, and iterates until claims are bounded by reproducible data rather than extrapolated from single sources.

# When to use

- When a macroscopic or mesoscopic observation (transport, spectroscopic, magnetic, structural, or optical) lacks a unique microscopic explanation.
- When multiple candidate mechanisms could explain the same anomaly and need systematic discrimination.
- When designing new experiments or computational campaigns to test causal links between hidden structural/electronic variables and observable responses.
- When evaluating whether a proposed mechanism is intrinsic or arises from confounding factors such as disorder, interfaces, defects, or instrumental artifacts.

# Inputs required

- Target system class and known constraints (dimensionality, symmetry, composition ranges, disorder types).
- Anomalous or unexplained observations with associated metadata (temperature, field, geometry, history).
- Candidate mechanism categories (e.g., intrinsic coupling, extrinsic disorder, interfacial effects, instrumental backgrounds).
- Available probes and modeling tools (experimental or computational) with their detection limits.
- Control resources: baseline samples, variant samples, or computational ablation strategies.
- Data quality context: uncertainty estimates, calibration status, repeatability history, and known confounders.

# Core Workflow

1. **Anomaly Definition & Robustness Gate**  
   Formalize the observation as a deviation from a well-defined baseline or standard model prediction. List all implicit assumptions in the baseline.  
   **Gate**: If the anomaly cannot be reproduced across independent samples, measurements, or simulation trajectories, stop and resolve reproducibility before mechanism generation.

2. **Candidate Mechanism Generation**  
   Elicit at least three competing hypotheses: a target intrinsic mechanism, dominant extrinsic alternatives, and instrumental or background explanations. For each hypothesis, construct a causal chain (control variable → intermediate physical state → observable signature). Generate distinguishable predictions (directional, sign, scaling, or cross-channel differences) that are unique to each hypothesis. Grade evidence strength (high / medium / low) and explicitly state key assumptions and failure modes.  
   **Gate**: If hypotheses generate identical predictions for all accessible observables, redesign the probe or variable space before proceeding.

3. **Minimal Viable Validation Design**  
   Select the smallest set of experiments or calculations that can falsify at least one major alternative. Define independent variables, intermediate state variables, and final observables. Design a control hierarchy: baseline control (unmodified reference), positive control (known system recovering expected signal), negative control (candidate mechanism suppressed), and strong control (variant changing the candidate mechanism while holding others constant). Specify evaluation metrics: effect size relative to uncertainty, directional consistency, scaling behavior, and cross-channel convergence. Define hard stop conditions: non-reproducibility, effect smaller than batch variance, confounding dominates, or safety/compliance limits reached.

4. **Execution & Data Quality Audit**  
   Acquire data with documented calibration, geometry, history, and batch metadata. Perform preprocessing with logged exclusion criteria.  
   **Gate**: If data quality checks (calibration drift, background anomalies, statistical power) fail, halt interpretation and return to measurement redesign.

5. **Mechanism Discrimination Analysis**  
   Exclude background and alternative mechanisms first; demonstrate that ordinary explanations are insufficient before evaluating the target mechanism. Compare candidate models using ablation, sensitivity analysis, or information criteria; avoid selecting a model based on a single curve or best-fit metric alone. Inspect intermediate state variables rather than relying solely on final performance metrics. Require multi-channel convergence: the target mechanism must consistently explain at least two independent observables without contradiction.  
   **Gate**: If negative or background controls reproduce the target signal, downgrade the hypothesis and return to Step 2.

6. **Evidence Integration & Claim Grading**  
   Synthesize results into an evidence ledger: Verified (independent controls, multiple observables), Tentative (primary data consistent but controls incomplete), and Speculative (inferred from analogy or limited extrapolation). Rank hypotheses by evidence strength, falsification status, and residual risk.  
   **Gate**: If no hypothesis reaches at least tentative status, stop and report the null or ambiguous result rather than forcing a conclusion.

7. **Iteration or Redesign**  
   - **Fully supported**: Test boundary conditions (temperature, composition, dimensionality, disorder level) to define the mechanism’s domain of validity; then stop or transition to predictive design.  
   - **Partially supported**: Identify the weakest causal link, modify only that link, and return to Step 3 with a narrowed hypothesis.  
   - **Contradicted**: Preserve falsified boundary conditions, pivot to the next-ranked hypothesis from Step 2, and redesign controls.  
   - **Ambiguous**: Prioritize resolving data comparability, sample variance, or model sensitivity before adding new variables.  
   **Stop conditions**: hypothesis falsified, controls exhausted, effect non-reproducible, or further iteration no longer improves discriminative power.

# Output Format

Each invocation must produce:

1. **Research question** — One sentence defining the anomaly and the gap.
2. **Mechanism map** — Competing hypotheses with causal chains, evidence grades, key assumptions, and failure modes.
3. **Validation plan** — Minimal viable experiment or computation, variable definitions, control hierarchy, metrics, and stop conditions.
4. **Analysis plan** — Data quality checks, background exclusion, model comparison, ablation strategy, and multi-channel integration rules.
5. **Evidence ledger** — Ranked hypotheses with current evidence grade and confidence bounds.
6. **Iteration roadmap** — Next steps for support, partial support, contradiction, or ambiguity.
7. **Boundary statement** — Extrapolation limits, unresolved confounders, and safety or compliance constraints.

# Validation Gates

- **Reproducibility**: Key trends appear across independent samples, batches, or simulation ensembles.
- **Control integrity**: Positive, negative, and strong controls are executed and interpreted before mechanism claims.
- **Statistical validity**: Effect exceeds combined uncertainty; model comparisons penalize over-parameterization.
- **Model robustness**: Conclusions hold under reasonable parameter variations and ablation of non-essential terms.
- **Confounder isolation**: Extrinsic factors (disorder, interfaces, defects, instrumentation, thermal history) are explicitly addressed.
- **Extrapolation check**: Claims are scoped to tested state variables; cross-system generalization requires re-validation.

# Claim Boundaries

- Distinguish paper-derived methods from new inferences made by the agent.
- Do not present single-platform, single-sample, or single-trajectory results as domain consensus.
- Mechanism claims must be conditional on the verified control hierarchy and stated assumptions.
- Predictions outside the validated parameter space must be labeled as speculative.
- Do not equate mechanism discovery with device performance, safety certification, or engineering readiness.

# Failure Modes

- **False anomaly**: The observation stems from miscalibration, drift, or batch error; mitigated by the robustness gate in Step 1.
- **Undistinguishable hypotheses**: Competing mechanisms predict identical signatures; mitigated by redesigning probes or intermediate variables.
- **Confounding dominance**: An extrinsic variable mimics the target mechanism; mitigated by strong controls and ablation.
- **Overfitting**: Complex models fit noise; mitigated by parsimony criteria and cross-validation.
- **Premature convergence**: Stopping after a single supporting dataset; mitigated by mandatory multi-channel convergence.
- **Unsafe extrapolation**: Generalizing beyond tested boundaries; mitigated by explicit boundary statements.

# Validity Checks

- Are all candidate mechanisms explicitly listed with falsifiable predictions?
- Does every claim cite its supporting control and independent observable?
- Have background and instrumental alternatives been ruled out before advancing the target mechanism?
- Are uncertainty, sample variance, and model sensitivity reported?
- Is the evidence graded and separated from analogy-based speculation?
- Have stop conditions been applied before resource limits or safety boundaries are crossed?

# Provenance

- Synthesized from cluster 135 (subcluster 135.0) mechanism-discovery skills.
- Source skill references: hydrogen-bond-quantum-dynamics-exploration (3d0aa0e6897f6960), halide-perovskite-carrier-localization-research (89cf88ba7a8777eb), spin-phonon-research-pattern (bf20710e7db0d72f), surface-structure-phase-transition-exploration (477c376ad9ec58a2), kagome-magnet-exchange-bias-workflow (b1bc314ac12fe109), rashba-magneto-optical-research-pattern (83ca2d2b71bbcdf7), oxide-magnetic-semiconductor-exploration (7c15a65eec2dbf57), iontronic-interface-doping-workflow (arxiv-cmoat__2606.14402).
- No specific material parameters, numerical results, or operational protocols from source papers are retained in the reusable workflow body.
