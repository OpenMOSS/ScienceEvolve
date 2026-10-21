---
name: sci-urban-observable-driven-resilience-evidence-analysi-b74b64ef
description: A reusable end-to-end workflow for designing, validating, and auditing evidence-based research plans in infrastructure and environmental resilience, emphasizing observable-driven claim bounding and uncertainty-aware iteration.
scienceevolve-title: "Urban hazard resilience · observable driven resilience evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Help an agent convert complex infrastructure or environmental resilience questions into rigorous, reusable research plans. The workflow centers on defining a decision-relevant target, building a layered causal evidence chain, generating falsifiable hypotheses with explicit uncertainty, designing controlled comparisons, and auditing claims before they are reported. It is designed for studies where dynamic processes, hidden states, multi-source uncertainty, and coupled system behavior matter.

## When to use

Use this skill when the user asks to:

- Design a new research question, model, experiment, or validation plan for infrastructure or environmental systems exposed to hazards or dynamic forcing.
- Turn a coupled physical problem into a modular, observable-driven evidence chain.
- Propose hypotheses about how hazard, exposure, vulnerability, system topology, or recovery strategy affects response, damage, recovery trajectory, or risk.
- Plan controlled computational, observational, or simulation experiments with explicit uncertainty propagation.
- Audit whether a claim is supported by evidence, transferable by mechanism, or speculative extrapolation.
- Compare dynamic or complex models against simpler baselines to justify added complexity.

Do not use this skill for operational emergency response, real-time safety directives, evacuation instructions, or executable hazardous procedures. Do not use it as a substitute for certified engineering assessment or domain-specific licensed judgment.

## Inputs required

- Target system boundary, assets, users, and service or decision outputs.
- Decision variable: the quantity that matters for the research question (e.g., damage state, recovery trajectory, risk ranking, loss proxy).
- Hazard or process description: external driver family, spatial/temporal scale, and relevant environmental or operational conditions.
- Available evidence: observed records, simulations, sensor streams, expert judgment, proxy data, or literature benchmarks.
- System topology or dependency graph: components, redundancy, critical paths, and interdependencies.
- Candidate interventions, strategies, or model structures to compare.
- Performance metrics: functionality, restoration, demand, loss, uncertainty spread, equity, or robustness.
- Validation options: historical cases, independent observations, stress tests, sensitivity analysis, or expert review.
- Constraints: data access, privacy, computational budget, safety review, and reproducibility requirements.

## Core Workflow

1. **Frame the decision variable and system boundary**
   - State the precise research question and the decision variable it serves.
   - Bound the system, spatial and temporal scales, and the hazard or process regime.
   - Diagnose the evidence gap: what existing approaches miss and why the question matters.
   - *Decision gate*: Stop if the decision variable is undefined or outside the agent's scope.

2. **Map the layered causal evidence chain**
   - Construct a dependency graph linking source/hazard variables to response/exposure, then to damage/vulnerability or recovery state, and finally to impact or decision variables.
   - Identify observable evidence, hidden states, and proxy variables at each layer.
   - Document uncertainty sources (aleatory, epistemic, measurement) and their interfaces.
   - *Decision gate*: Stop if a layer lacks any observable proxy or defensible prior and cannot be identified from available evidence.

3. **Generate bounded hypotheses**
   - Produce at least three mechanism-grounded hypotheses about how the process, topology, uncertainty, or intervention affects the decision variable.
   - For each hypothesis specify: concise causal claim, mechanism, evidence strength (strong/moderate/weak/speculative), key assumptions, possible failure modes, and minimal viable validation.
   - Prioritize falsifiable hypotheses that would change downstream conclusions if supported or rejected.
   - *Iteration*: If hypotheses are purely descriptive, reformulate them as causal claims before proceeding.

4. **Design controlled evidence generation**
   - Define independent, mediating, and dependent variables aligned with the causal chain.
   - Establish controls: baseline (no intervention or simplest model), negative control (hypothesized driver absent), positive control (known response expected), sensitivity controls (alternative assumptions), and fidelity controls (higher-fidelity benchmark where feasible).
   - Specify minimum viable validation (smallest comparison that can falsify a hypothesis) and strong validation (independent data, stress tests, or cross-system replication).
   - Define stop conditions before execution: e.g., if the model cannot distinguish strategy differences from noise, if hidden states are unidentifiable, or if conclusions reverse under plausible alternatives.

5. **Execute layered analysis with uncertainty propagation**
   - Harmonize data across sources; document provenance, normalization, and transformations without embedding case-specific parameters.
   - Validate each layer independently before coupling: check hazard/process fit, exposure alignment, and vulnerability plausibility.
   - Propagate uncertainty through the chain explicitly; do not append uncertainty only at the final step.
   - Compare the proposed model or intervention against static, parametric, or simplified baselines to justify added complexity.
   - *Decision gate*: Stop if a layer fails independent validation or if added complexity does not improve decision-relevant validity.

6. **Audit claims and classify evidence**
   - Label every major claim as:
     - *Paper-validated*: directly supported by a source case study.
     - *Transfer-supported*: supported by the method and plausible in the new domain.
     - *Agent-inferred*: proposed for the new problem but not yet validated.
     - *Assumption-only*: required for model feasibility but currently untested.
   - Check for confounding, overgeneralization, and mechanistic plausibility.
   - Verify that conclusions survive sensitivity tests, alternative priors, and boundary condition variations.
   - *Iteration*: If evidence is weaker than assumed, narrow the claim or lower the evidence strength rating.

7. **Iterate or terminate**
   - Inspect residuals and systematic errors by time, location, and process layer.
   - Add or refine the layer that explains the largest systematic discrepancy.
   - Re-test whether the revised model improves validity or interpretability.
   - *Stop conditions*:
     - Added complexity does not materially improve the research conclusion.
     - Results are dominated by unresolvable uncertainty or unidentifiable hidden states.
     - Conclusions reverse under plausible alternative assumptions.
     - The recommended scope exceeds validated boundaries or safety limits.
   - Update hypotheses and evidence strength based on observed patterns.

## Output Format

When using this skill, return:

1. **Research question framing**: target system, process or hazard, decision variable, and rationale.
2. **Gap diagnosis**: what existing approaches miss and why it matters.
3. **Causal evidence chain**: layered dependency graph with observable and hidden states.
4. **Candidate hypotheses**: at least three hypotheses with mechanism, evidence strength, key assumptions, failure modes, and minimal validation.
5. **Experimental design**: variables, controls, minimum viable validation, strong validation, and stop conditions.
6. **Analysis plan**: data harmonization, layer-by-layer validation, uncertainty propagation, metrics, and baseline comparisons.
7. **Iteration plan**: how results update hypotheses and what triggers redesign.
8. **Validity and boundary statement**: confounders, reproducibility requirements, extrapolation limits, and safety constraints.
9. **Evidence classification**: mark each major claim as paper-validated, transfer-supported, agent-inferred, or assumption-only.

## Validation Gates

- **Gate 1 — Decision clarity**: The decision variable and system boundary are defined and within scope.
- **Gate 2 — Layer plausibility**: Each causal layer has observable proxies or defensible priors; hidden states are identifiable.
- **Gate 3 — Experimental rigor**: Controls are sufficient to isolate the hypothesized mechanism; stop conditions are preset.
- **Gate 4 — Baseline superiority**: The proposed approach outperforms or is justified against simpler baselines for the stated question.
- **Gate 5 — Claim audit**: Every claim is classified by evidence strength; no case-study finding is presented as universal law.

## Claim Boundaries

- Distinguish demonstrated results from new inferences and from required modeling assumptions.
- Do not present single-study or single-system findings as field-wide consensus.
- State the structure class, hazard regime, environmental context, and data resolution for which a claim is plausible.
- Require local calibration or independent validation before transferring conclusions to a new system, city, or watershed.
- Separate screening-level rankings from final safety or operational decisions.

## Failure Modes

- **Unidentifiable hidden states**: Latent variables lack observable proxies, making inference unstable or prior-dominated.
- **Unmeasured confounding**: Terrain, land use, operational state, sensor placement, or missing drivers bias causal interpretation.
- **Data leakage**: Future information enters features, normalization, imputation, or split construction.
- **Spurious correlation**: Correlated sensor errors or redundant observations appear informative.
- **Model inadequacy**: The chosen model omits the mechanism needed to link the hazard to the decision variable.
- **Overfitting to case specifics**: Conclusions depend on narrow parameter settings that do not generalize.
- **Uncertainty dominance**: Uncertainty intervals are too wide to support the intended decision or ranking.
- **Baseline failure**: Added process complexity does not improve upon static or parametric alternatives.

## Validity Checks

Before finalizing a research plan or result, verify:

- **Confounding**: Hazard, exposure, vulnerability, and context effects are separable enough to interpret.
- **Data provenance**: Every input is labeled as observed, simulated, expert-elicited, literature-derived, or assumed.
- **Reproducibility**: Data versions, preprocessing steps, model configuration, random seeds, and scenario definitions are documented.
- **Statistical validity**: Uncertainty intervals, sensitivity analyses, convergence behavior, and parameter identifiability limits are reported.
- **Boundary conditions**: Applicable system types, hazard regimes, spatial/temporal scales, and decision contexts are stated.
- **Baseline necessity**: The dynamic or complex model outperforms simpler alternatives for the stated research question.
- **Privacy and governance**: Sensitive infrastructure data, mobility data, and exposure data are handled with appropriate aggregation and access controls.
- **Mechanism consistency**: Patterns align with a plausible physical or operational mechanism, not just statistical fit.

## Provenance

- Derived from cluster 18, subcluster 18.1: observable-driven evidence analysis and claim audit.
- Synthesized from source skills: uncertainty-aware-infrastructure-resilience-research (10.1002_eqe.70126), building-wind-pressure-research-workflow (10.2172_6168005), seismic-tank-risk-workflow-research (10.1002_eqe.3903), rapid-seismic-shm-research-workflow (10.1177_1475921721996218), sensor-time-series-flood-forecasting-research (10.1007_s00521-015-1930-z), coupled-hazard-vulnerability-research (10.7712_120115.3664.491), urban-flood-climate-research-workflow (10.5194_piahs-386-133-2024), and dynamic-flood-road-impact-research (10.1007_s11069-019-03630-3).
