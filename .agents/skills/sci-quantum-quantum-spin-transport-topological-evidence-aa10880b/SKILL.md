---
name: sci-quantum-quantum-spin-transport-topological-evidence-aa10880b
description: End-to-end evidence analysis and claim audit workflow for quantum, spin, transport, and topological research, emphasizing falsifiable hypothesis generation, controlled minimal validation, multi-indicator triangulation, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum spin transport topological evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This workflow skill enables an agent to conduct rigorous end-to-end evidence analysis and claim auditing in quantum, spin, transport, and topological research. It translates ambiguous observations into falsifiable mechanism hypotheses, designs controlled minimal validation, analyzes multi-source data through decomposition and triangulation, and iteratively bounds claims—without replicating paper-specific conditions or operational protocols.

# When to use

- When proposing new research questions or mechanisms in quantum, spin, transport, topological, or related domains where direct observation is difficult.
- When migrating a methodological pattern from one platform or model to another.
- When comparing theoretical, numerical, and experimental indicators to determine whether a signal originates from a target mechanism or from artifacts, noise, finite-size effects, or platform idiosyncrasies.
- When designing minimal viable validation, strong controls, and stop conditions.

Do not use when the task is limited to paper summarization, concept explanation, or when falsifiable mechanisms cannot be formulated.

# Inputs required

- Target platform or abstract model: degrees of freedom, symmetries, accessible observables, and known constraints.
- Phenomenon and counterfactual baseline: what is expected if the target mechanism is absent.
- Candidate control parameters and readout channels.
- Available validation tiers: analytical, numerical, experimental, or existing data.
- Known noise sources and limitations: decoherence, drift, finite-size effects, boundary conditions, readout infidelity.
- Evidence map: what is verified, inferred, or analogical from prior work.

# Core Workflow

1. **Frame the mechanism gap and baseline**
   - Formulate the research question as a falsifiable mechanism problem rather than a phenomenon slogan.
   - Define the counterfactual baseline: the expected behavior if the target mechanism is absent (e.g., thermalization, decoherence, trivial periodic response).
   - **Decision gate**: Is the gap addressable with available observables and resources? If no, refine the question or stop.

2. **Construct falsifiable mechanism hypotheses**
   - Build causal chains: control variables → state/trajectory selection → interaction → observable response.
   - For each hypothesis record: core claim, evidence strength (high/medium/low/speculative), key assumptions, falsifiable predictions, and principal failure modes.
   - Ensure hypotheses are mutually distinguishable by at least one differential observable.
   - **Decision gate**: Can the hypotheses be discriminated by a minimal viable validation? If no, decompose or redesign.

3. **Design minimal viable validation (MVV) and controls**
   - Define the smallest experiment or simulation that tests the most fragile link in the causal chain.
   - Include:
     - *Positive control*: confirms the readout/analytics pipeline can detect the expected response class.
     - *Negative control*: removes the target mechanism or symmetry; expects null or baseline behavior.
     - *Strong control*: holds geometric/dynamic conditions fixed while varying the topological/mechanistic condition, or vice versa, to isolate the target contribution.
     - *Artifact control*: checks for drift, calibration bias, history dependence, and platform crosstalk.
   - Pre-register primary metrics, exclusion criteria, and stop conditions.
   - **Decision gate**: Does the MVV include a differential/relative observable and explicit failure criteria? If no, revise.

4. **Align variables and multi-indicator metrics**
   - Independent variables: control knobs that modulate the mechanism (e.g., coupling strength, symmetry class, path topology, initial state).
   - Dependent variables: readouts mapped across time domain, frequency domain, structural domain, and coherence/entropy domain.
   - Covariates: noise, decoherence, finite-size effects, boundary conditions, readout infidelity.
   - **Decision gate**: Can theory, simulation, and experiment share or map to the same observable definitions? If misaligned, build explicit mapping functions or stop.

5. **Execute analysis with decomposition and triangulation**
   - **Baseline subtraction**: quantify and subtract the no-mechanism baseline; inspect residuals for systematic structure.
   - **Response decomposition**: separate the signal into mechanism-related, geometric/dynamic, and artifact-related components where possible.
   - **Multi-indicator triangulation**: demand that at least two independent observables point to the same mechanism before elevating confidence.
   - **Model comparison**: fit the target mechanism and at least one alternative model; compare using pre-registered metrics, report uncertainties, parameter identifiability, and residual structure.
   - **Robustness checks**: vary boundary conditions, system size, noise levels, and approximation validity.
   - **Decision gate**: Do multiple indicators converge on the same mechanism with quantified uncertainty? If only one indicator supports, downgrade evidence and iterate.

6. **Audit validation gates**
   - Apply the checkpoints defined in **Validation Gates** (baseline, control, triangulation, model-discrimination, reproducibility, boundary).
   - **Decision gate**: Does the evidence survive all gate checks? If any gate fails, flag the failure mode and return to Step 3 or 5.

7. **Iterate, pivot, or terminate**
   - **If supported**: Elevate evidence strength; design stricter controls, expand parameter space, or test cross-platform portability.
   - **If partially supported**: Split the hypothesis into smaller falsifiable units; add differential controls or new readout channels.
   - **If unsupported**: Determine whether the failure stems from experimental conditions (return to Step 3 with revised controls) or mechanism absence (pivot to alternative hypotheses or stop).
   - **If uncertain**: Require additional data, simulation convergence, or independent replication before stronger claims.
   - **Stop conditions**:
     - Negative controls reproduce the target signal.
     - Signal disappears with changes in system size, readout channel, or initial state that should not affect the mechanism.
     - A noise or artifact model explains all observations without invoking the target mechanism.
     - Theory, simulation, and experiment cannot be aligned on common metrics.
     - Safety, compliance, or resource boundaries are reached.

8. **Synthesize and bound the claim**
   - Assemble the final report (see **Output Format**).
   - Label every conclusion as verified observation, supported inference, suggestive correlation, or speculative extrapolation.
   - State the exact parameter regime and platform assumptions under which the claim holds.

# Output Format

The agent should produce a structured report containing:

1. **Research question** — One sentence defining the target phenomenon, platform/model boundary, and mechanism gap.
2. **Gap and baseline** — Domain gap, counterfactual baseline, and why the gap matters.
3. **Hypothesis matrix** — Table of candidate hypotheses with claim, evidence strength, key assumptions, falsifiable predictions, and failure modes.
4. **Validation design** — MVV description, variable classes, control suite (positive/negative/strong/artifact), primary metrics, and stop conditions.
5. **Analysis plan** — Baseline subtraction, response decomposition, multi-indicator triangulation, model comparison, robustness checks, and uncertainty reporting.
6. **Iteration roadmap** — Rules for support, partial support, negation, and uncertainty.
7. **Claim boundary and validity summary** — Confounders, extrapolation limits, evidence-level labels, and safety/compliance boundaries.

# Validation Gates

- **Baseline gate**: The no-mechanism baseline is quantified and subtracted; the residual exhibits non-trivial structure consistent with the target mechanism.
- **Control gate**: Negative controls yield null/baseline signals; positive controls confirm pipeline sensitivity; strong controls isolate the mechanism from geometric/dynamic alternatives.
- **Triangulation gate**: At least two independent observables or analysis windows support the same directional trend with consistent magnitude order.
- **Model-discrimination gate**: The target model outperforms alternative explanations on pre-registered metrics, not merely by achieving a better fit to a single curve.
- **Reproducibility gate**: The result persists across independent repetitions, samples, analysis pipelines, or blinded re-analysis.
- **Boundary gate**: All approximations (finite size, weak coupling, ideal symmetry, adiabaticity, etc.) are listed and confirmed to hold in the tested regime.

# Claim Boundaries

- Use evidence-level labels: “verified observation” for direct data; “supported inference” for model-based conclusions with strong controls; “suggestive correlation” for consistent but incompletely controlled trends; “speculative extrapolation” for predictions beyond the tested regime.
- Do not present single-study or single-platform results as field consensus.
- State platform-specific assumptions (symmetry, dimensionality, coherence, readout) explicitly; migration to new platforms requires re-validation.
- Restrict causal claims to the tested parameter range; avoid universal quantification.

# Failure Modes

- **Baseline ambiguity**: Target signal is indistinguishable from the counterfactual baseline.
- **Control leakage**: Negative or artifact controls reproduce the target signal, indicating unaccounted platform biases.
- **Single-indicator fallacy**: A conclusion rests on only one observable or one data window.
- **Model non-identifiability**: Competing mechanisms produce equivalent fits or predictions.
- **Overfitting**: Excessive model complexity explains noise rather than physics; parameters lack independent constraints.
- **Extrapolation error**: Claims extend beyond validated symmetry, scale, temperature, coupling, or coherence regimes.
- **Irreproducibility**: Signal depends on unrecorded history, single-sample idiosyncrasy, or post-hoc selection criteria.

# Validity Checks

- **Confounders**: Screen for finite-size echoes, initial-state bias, boundary effects, readout crosstalk, calibration drift, environmental noise, numerical truncation, and history dependence.
- **Reproducibility**: Require independent repeats, cross-sample checks, versioned data/code, and pre-registered analysis plans.
- **Statistical validity**: Use pre-registered primary metrics, propagate uncertainties, correct for multiple comparisons where applicable, and report null or negative results.
- **Model validity**: Verify that effective models, approximations, truncation limits, and noise models apply in the target regime.
- **Extrapolation validity**: Mark conclusions tied to the specific system versus those conditionally portable to analogous systems; re-validate when platform, scale, or symmetry changes.

# Provenance

- Methodological pattern synthesized from cluster `161.0` (`quantum-spin-transport-topological-evidence-analysis-workflow`).
- Derived from source skills: `arxiv-cmoat__2412.13141`, `62a87d7fe1bdcc03`, `987483ac4a7f5ab8`, `eba78c1534e1c120`, `7d6f4f4ae812cda4`, `f7651e42e0ed32ba`, `ffe0d23af0fcb3e7`, `abbd4f0dfe9aae8e`.
- No paper-specific conclusions, numerical parameters, material systems, or operational protocols are retained.
