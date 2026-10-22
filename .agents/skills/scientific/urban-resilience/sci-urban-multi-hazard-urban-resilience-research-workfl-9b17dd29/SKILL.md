---
name: sci-urban-multi-hazard-urban-resilience-research-workfl-9b17dd29
description: A reusable end-to-end scientific workflow for generating mechanism-based hypotheses and designing controlled validation studies across seismic, flood, and multi-hazard urban resilience research.
scienceevolve-title: "Urban hazard resilience · multi hazard urban resilience research workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Synthesize a transferable research workflow that moves from domain-gap identification to mechanism-based hypothesis generation, minimum-viable validation design, and iterative evidence updating for urban infrastructure resilience under single or sequential hazards. This skill teaches methodological structure—gap definition, evidence triangulation, controlled comparison, and uncertainty-aware iteration—not domain-specific conclusions.

# When to use

- The user needs to propose new research questions in urban resilience, structural engineering, or socio-technical infrastructure systems facing natural hazards.
- The system involves multiple hazards, sequential events, or coupled physical-social mechanisms where single-hazard or static assumptions may be insufficient.
- The user needs to design non-operational research schemes (numerical, statistical, or mixed-method) with explicit controls, stop conditions, and claim boundaries.
- The user requires hypothesis cards, evidence grading, and failure-mode analysis rather than direct design recommendations.

Do not use this skill for:
- Direct engineering design, safety certification, construction instructions, or emergency operational decisions.
- Single-hazard, single-material, or routine component checks with no coupling or sequence mechanism.
- Tasks lacking a defined system, hazard context, or evaluative metric.

# Inputs required

- **Target system class and boundaries**: structural, infrastructural, or socio-technical system and its key subsystems.
- **Hazard context**: single, multi-hazard, or sequential event types, scales, and temporal relationships.
- **Available evidence**: literature, data, models, monitoring records, stakeholder inputs, or historical events.
- **Performance or loss dimensions**: safety, serviceability, recovery time, economic loss, equity, or functional continuity.
- **Constraints**: data gaps, ethical limits, safety boundaries, computational resources, and regulatory scope.

If inputs are insufficient, output an information-gap checklist before proposing hypotheses.

# Core Workflow

## 1. Reframe the domain gap
- Decompose the system into a causal chain: hazard input → system response → local damage → functional consequence → recovery or organizational feedback.
- Identify whether the gap concerns co-occurrence probability, sequential degradation, response coupling, indicator mismatch, or governance/feedback loops.
- **Decision gate / Stop**: If the gap cannot be expressed as a falsifiable mechanism, halt and refine the research question.

## 2. Generate mechanism-based hypotheses
- Produce candidate hypotheses (e.g., simultaneous coupling, sequential degradation, amplification, indicator decoupling, socio-technical mediation).
- For each hypothesis, draft an evidence card containing: research question, evidence strength (high/medium/low), key assumptions, observable signals, plausible failure modes, and a discriminating experiment.
- **Decision gate**: If a hypothesis lacks an observable signal or a plausible failure mode, discard or reformulate before proceeding.

## 3. Design minimum viable validation (MVV)
- Prioritize hypotheses by impact, gap clarity, data accessibility, and feasibility.
- Select one reference system, one baseline state, one perturbed state, and one primary response indicator.
- Establish controls:
  - **Baseline**: unperturbed system under reference conditions.
  - **Strong**: vary only one scientific variable; hold hazard and model family constant.
  - **Positive**: a configuration expected to exhibit the target effect, confirming methodological sensitivity.
  - **Negative**: a configuration expected to suppress the target effect, guarding against false positives.
- Define stop conditions: data quality insufficient to separate signal from noise; baseline model fails validation; safety or ethical boundaries reached.
- **Decision gate**: If MVV cannot isolate the mechanism with available resources, reduce scope or collect missing data.

## 4. Execute analysis with uncertainty propagation
- Audit data provenance, resolution, missingness, and spatial/temporal alignment.
- Validate baseline behavior against known benchmarks before interpreting deviations.
- Compare scenarios via paired or stratified analysis; report both central tendency and dispersion.
- Link patterns to mechanisms; avoid correlation-only claims.
- Propagate uncertainty from inputs, model structure, threshold definitions, and recovery assumptions.
- **Stop condition**: If baseline validation fails, numerical instability occurs, or uncalibrated parameters dominate outcomes, halt and revisit assumptions.

## 5. Iterate based on evidence
- **Support**: If results robustly support the hypothesis, test boundary cases and assess transferability to other system classes or hazard regimes.
- **Partial support**: If effects are inconsistent, check for omitted variables, scale mismatches, or insensitive indicators; redesign controls.
- **Refutation**: If results contradict the hypothesis, distinguish "mechanism absent" from "measurement error" or "design flaw"; record negative evidence.
- Update evidence strength, key assumptions, and failure modes.
- **Decision gate**: If conclusions depend on a single input set, single metric, or unverified model, do not elevate evidence strength; return to Step 3 or 4.

## 6. Package artifacts and bound claims
- Assemble the research plan, evidence map, hypothesis table, experimental log, and analysis record.
- Label each conclusion as verified, inferred from analogy, or exploratory conjecture.
- State extrapolation boundaries: applicable system classes, hazard types, geographic or climatic conditions, and governance contexts.

# Output Format

Produce a structured research package containing:

1. **Research question definition** — system, hazard, gap, and falsifiable proposition.
2. **Evidence map** — known, unknown, conflicting, and non-transferable evidence.
3. **Hypothesis table** — mechanism, evidence strength, key assumptions, observable signals, and failure modes.
4. **Experimental design** — MVV, variables, controls, indicators, and stop conditions.
5. **Analysis plan** — data audit, baseline validation, comparison logic, and uncertainty reporting.
6. **Iteration log** — support, partial support, or refutation paths and updated evidence strength.
7. **Validity and safety boundaries** — confounders, reproducibility needs, extrapolation limits, and ethical or safety constraints.

# Validation Gates

- **Mechanism falsifiability**: The hypothesis can be rejected by observable data.
- **Baseline fidelity**: The baseline model reproduces known behavior under reference conditions.
- **Control separation**: Controls isolate the target mechanism from nuisance variables.
- **Indicator sensitivity**: The chosen metric discriminates between competing explanations.
- **Uncertainty characterization**: Confidence bounds, sensitivity ranges, or probability distributions are reported.

# Claim Boundaries

- Distinguish between: (a) facts supported by independent data, (b) inferences drawn from analogous systems, and (c) exploratory conjectures.
- State explicitly that outputs are research designs, not engineering certifications, operational directives, or safety assurances.
- Restrict claims to the validated system class, hazard regime, and data coverage; prohibit cross-domain, cross-material, or cross-regime generalization without new validation.

# Failure Modes

- **Indicator insensitivity**: The metric cannot resolve the target mechanism from background variation.
- **Confounding by unmodeled variables**: Geography, material variability, maintenance history, governance structure, or event selection bias drives apparent effects.
- **Model calibration failure**: Baseline response is inconsistent with known behavior or literature benchmarks.
- **Data leakage or autocorrelation**: Validation strategy inflates apparent performance through temporal, spatial, or information leakage.
- **Over-extrapolation**: Conclusions are applied beyond the validated system class, hazard range, or geographic context.
- **Selective reporting**: Only favorable scenarios, subsets, or metrics are reported, masking contradictory evidence.

# Validity Checks

- **Confounders**: Account for site conditions, geometric irregularity, material degradation, event selection bias, and socio-economic heterogeneity.
- **Reproducibility**: Document data sources, model versions, input files, boundary conditions, scripts, random seeds, and screening rules.
- **Statistical validity**: Report sample size, distribution assumptions, confidence intervals, sensitivity analyses, and missing-data strategies.
- **Mechanistic consistency**: Ensure numerical or statistical results align with physical or organizational theory.
- **Boundary conditions**: Limit conclusions to similar structures, hazard environments, and evaluation metrics.
- **Evidence grading**: Tag conclusions as verified, inferred, or unverified.

# Provenance

- Synthesized from cluster 2 / subcluster 2.0 (seismic-resilience-urban-flood-hypothesis-workflow).
- Source skill references: multi-hazard-tall-building-exploration; sequential-seismic-structural-exploration; urban-flood-resilience-research-workflow; seismic-sequence-structural-capacity-exploration; sequence-seismic-vulnerability-exploration; urban-flood-risk-exploration; corrosion-seismic-resilience-exploration; urban-flood-ai-iot-research-workflow.
