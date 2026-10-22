---
name: sci-quantum-observable-driven-mechanism-discovery-workf-3c18775b
description: Guide research design and validation when an observable anomaly or regime transition requires discriminating among competing mechanisms across quantum, transport, interface, plasma, or dynamical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 16"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to convert an observable anomaly, unexpected regime transition, or ambiguous dynamical signature into a falsifiable research plan. The workflow ranks competing mechanisms, maps each to predicted multi-diagnostic signatures, and iterates through staged controls and converging evidence until claims are bounded, supported, or excluded.

# When to use

Use when the user needs to:

- Propose or discriminate mechanisms behind a new phase, critical regime, transport anomaly, or collective instability.
- Design non-operational experiments or simulations that test whether a hypothesized structural feature, interaction geometry, or hidden channel produces observable consequences.
- Validate that a signature is mechanism-driven rather than an artifact, finite-size effect, boundary effect, or alternative background process.

Do not use for routine data analysis without a mechanism-discrimination goal, pure literature synthesis, or direct operational execution.

# Inputs required

Before producing a plan, request or infer:

- **Target system abstraction**: degrees of freedom, boundary assumptions, relevant limiting regimes, and known dynamical baselines.
- **Observable anomaly**: the unexpected signature, its detection channel, and why existing models fail to explain it.
- **Candidate mechanisms**: the structural, interaction, or dynamical features proposed to generate the anomaly.
- **Available observables**: independent measurement or simulation families that can distinguish regimes (e.g., spectral, spatial, temporal, transport).
- **Baseline comparisons**: known limiting behaviors or reference conditions for the same abstraction.
- **Constraints**: platform or computational limits, safety review boundaries, and what cannot be implemented.
- **Research objective**: discovery, transition mapping, mechanism discrimination, robustness testing, or hypothesis refinement.

# Core Workflow

1. **Define the Observable Gap**  
   State the anomaly, the expected behavior under current models, and the specific insufficiency of existing diagnostics or explanations.

2. **Generate Competing Mechanisms**  
   For each candidate mechanism:
   - Predict signatures across at least two independent observable families.
   - Identify the nearest alternative explanation that could mimic the target signature.
   - Assign evidence strength: **Strong** (explicit mechanism, multiple diagnostics, controls against confounders), **Moderate** (primary diagnostic plus qualitative agreement), **Weak** (analogy-driven without clear falsification), or **Speculative** (extension beyond validated model class).
   - List key assumptions and likely failure modes.

3. **Design Minimal Validation**  
   Define variables by role, not by copying source-specific settings:
   - **Mechanism variables**: parameters that control the proposed source of the anomaly.
   - **Contrast variables**: parameters expected to move the system between known limiting regimes.
   - **Boundary variables**: conditions that reveal whether signatures are edge or artifact effects.
   - **Sampling variables**: initial conditions, excitation patterns, windows, or ensemble configurations.
   - **Observation variables**: quantities needed to classify regime behavior.

   Include controls:
   - **Negative control**: suppress or remove the proposed mechanism.
   - **Positive control**: reproduce a known limiting behavior under the same diagnostic pipeline.
   - **Robustness control**: vary size, boundary, initial condition, or sampling window.
   - **Model control**: compare data to the same abstract model used to generate the prediction.
   - **Artifact control**: check whether noise, drift, loss, or platform effects reproduce the signature.

   Define a priori stop conditions (e.g., signature disappears under robustness checks, controls are indistinguishable, uncertainty dominates).

4. **Collect Multi-Diagnostic Evidence**  
   Gather data from independent observable families. Avoid relying on a single metric or channel.

5. **Execute Staged Analysis**  
   - Preprocess consistently across all conditions.
   - Quantify uncertainty and check convergence.
   - Decompose signals to detect coexistence, hidden channels, or mixed-phase behavior rather than relying on global averages.
   - Compare observed trends to mechanism predictions under the same abstraction.
   - **Decision Gate 1 — Control Check**: If controls fail or the baseline is unstable, halt and audit before interpreting the target condition.

6. **Discriminate Mechanisms**  
   - Score each hypothesis against the observed multi-diagnostic pattern.
   - Require independent diagnostics to converge before strengthening a claim.
   - **Decision Gate 2 — Convergence Check**: If diagnostics conflict, do not average them away. Identify the most likely confounder, design one targeted control, and return to Step 3. If they converge, proceed.

7. **Stress-Test Robustness**  
   - Vary system size, boundary placement, disorder level, or imperfection strength.
   - Test scaling behavior and sensitivity to analysis choices.
   - **Decision Gate 3 — Stability Check**: If the signature disappears, is better explained by finite artifacts, or depends on a single implementation detail, downgrade or abandon the mechanism claim.

8. **Bound Claims**  
   - Classify each conclusion as **Verified** (supported by matched controls and converging diagnostics), **Plausible** (consistent but incomplete controls), or **Speculative** (dependent on untested assumptions).
   - Restrict claims to the tested abstraction, platform class, and parameter regime.

9. **Iterate or Expand**  
   - If supported, propose a sharper transition test, broader parameter map, or downstream application check.
   - If ambiguous, return to Step 2 with refined hypotheses.
   - If refuted, archive failure modes and reformulate.

   **Stop Conditions**
   - The target signature disappears under a robustness control.
   - The apparent regime boundary is unstable across adjacent parameter cuts or diagnostics.
   - The anomaly is better explained by finite-size, boundary, or platform artifacts.
   - Mixed or critical behavior appears only in an averaged metric without regional or spectral decomposition.
   - Uncertainty or variability is comparable to the claimed effect.
   - Safety, ethical, or compliance boundaries are reached.

# Output Format

Return a structured research plan containing:

1. **Research question** — Target regime or anomaly and why existing diagnostics are insufficient.
2. **Mechanism-to-signature map** — Proposed mechanisms, predicted multi-diagnostic signatures, and nearest alternatives.
3. **Ranked hypotheses** — Evidence strength, key assumptions, and likely failure modes for each.
4. **Validation design** — Variables by role, minimal viable validation, controls, and stop conditions.
5. **Analysis plan** — Metrics, decomposition checks, scale-dependent tests, and model-data comparison rules.
6. **Iteration plan** — How to update hypotheses after agreement, conflict, or ambiguity; next targeted control.
7. **Validity and ethics statement** — Confounders checked, reproducibility requirements, extrapolation limits, and non-operational safety boundaries.

# Validation Gates

- **Control Adequacy**: Negative, positive, robustness, model, and artifact controls must be defined before data collection.
- **Diagnostic Convergence**: At least two independent observable families must agree before a mechanism is favored.
- **Robustness**: The signature must survive reasonable variation of size, boundary, sampling, or disorder.
- **Reproducibility**: Key features must appear in independent runs, samples, or simulation ensembles.
- **Model Validity**: Simulations and experiments must share the same abstraction; assumptions must be stated and tested.

# Claim Boundaries

- **Verified observation**: Directly supported by baseline, controls, and converging diagnostics.
- **Model-supported inference**: A plausible explanation consistent with the abstraction, but not uniquely proven.
- **Speculative extrapolation**: Proposed extension to broader systems, regimes, or platforms beyond the tested class.
- Never present a single study or model result as field-wide consensus.

# Failure Modes

- **Unstable baseline**: The reference condition drifts or is irreproducible.
- **Diagnostic cross-talk**: Apparent target signal is contamination from a strong neighboring channel or region.
- **Finite artifacts**: The anomaly arises from size effects, boundary effects, or limited sampling rather than the proposed mechanism.
- **Single-metric reliance**: A claim rests on one diagnostic that is not independently confirmed.
- **Confounding variables**: An uncontrolled parameter covaries with the mechanism variable.
- **Model misspecification**: The abstract model omits a dominant physical effect present in the target system.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounders**: finite size, boundary placement, initial bias, noise, drift, loss, disorder, and platform-specific imperfections.
- **Reproducibility**: repeated runs, adjacent parameter cuts, independent diagnostics, and documented analysis pipelines.
- **Statistical validity**: uncertainty estimates, sufficient sampling, and stable classification under reasonable analysis choices.
- **Boundary conditions**: claims are restricted to the tested model family, platform abstraction, dimensionality, and regime.
- **Evidence independence**: mechanism claims are supported by at least two independent observable families.
- **Data integrity**: raw data, preprocessing choices, failed fits, negative results, and control outcomes are documented.

# Provenance

Synthesized from cluster 182.0 (observable-driven mechanism discovery and validation). Derived from source skills: `floquet-localization-phase-discovery`, `vibropolaritonic-dark-mode-research`, `emergent-geometry-quantum-simulation-workflow`, `sf-qed-field-amplified-exploration`, `laser-plasma-multispeckle-coupling-exploration`, `pulsed-helicity-plasma-exploration`, `glass-dynamics-fragility-research-pattern`, `plasma-wakefield-phase-structured-beam-design`.
