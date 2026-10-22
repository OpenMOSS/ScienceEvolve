---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-68f5b4cd
description: A reusable end-to-end workflow for generating mechanism-linked hypotheses, designing minimal validation experiments with strong controls, and iterating on multi-modal evidence to discover and validate causal mechanisms in complex physical systems.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide agents through a transferable, end-to-end scientific workflow that turns ambiguous system behavior into testable mechanism hypotheses, validates them with controlled experiments, and iterates based on multi-modal evidence without treating any single study as field consensus.

## When to use

Use this skill when:
- A field contains conflicting reports about a phenomenon, failure mode, or intervention efficacy.
- The user asks for new research questions, hypotheses, or experiment designs in complex physical systems where hidden confounders may bias interpretation.
- The goal is to distinguish intrinsic behavior from artifacts caused by components, measurement protocols, or environmental factors.
- The task requires translating observations into causal mechanisms rather than optimizing a single performance metric.

Do not use this skill as a substitute for domain-specific safety review, operational protocols, or device qualification.

## Inputs required

Before generating a plan, collect or infer:
- Target phenomenon, system, or failure mode to investigate.
- Known or suspected competing processes, hidden confounders, or measurement artifacts.
- Available observational modalities (e.g., spectroscopic, imaging, transport, structural, thermal).
- Baseline configuration and which components must remain fixed.
- Constraints on reproducibility, safety, and acceptable risk.
- Decision criteria for advancing, revising, or terminating a candidate hypothesis.

If inputs are incomplete, state assumptions explicitly and label downstream conclusions as conditional.

## Core Workflow

1. **System Decomposition & Gap Definition**
   - Map the target phenomenon and define the specific performance gap or observational conflict.
   - Decompose system-level behavior into coupled sub-processes (e.g., transport, interfacial, chemical, mechanical).
   - Identify the smallest direct precursor or observable signature that would support or falsify a proposed mechanism.
   - Flag hidden assumptions that treat components as passive when they may be active confounders.

2. **Hypothesis Generation & Ranking**
   - Generate mechanism-linked hypotheses that specify a causal chain from intervention to intermediate signal to system-level outcome.
   - For each hypothesis record: key assumptions, predicted observations, evidence strength (preliminary / plausible / supported), and likely failure modes.
   - Include at least one alternative, non-mechanistic explanation (e.g., bulk property change, measurement artifact, assembly variability).
   - Rank hypotheses by diagnostic distinguishability, testability with available controls, and safety compatibility.

3. **Minimal Validation Design**
   - Define independent variables, primary dependent variables (performance/endpoints), and mechanism-dependent variables (precursor/intermediate signals).
   - Construct a control hierarchy: baseline, negative control, positive or stress control, specificity/isolation control, and procedural/replicate control.
   - Predefine evaluation endpoints and failure criteria: what observation would falsify the hypothesis or trigger redesign.
   - Establish stop conditions before data collection begins (e.g., no precursor signal, control divergence, unresolvable confounding, safety boundary reached).

4. **Evidence Collection**
   - Acquire multi-modal data across causal layers (bulk, surface, interface, system/device).
   - Maintain matched handling, architecture, and protocol across all arms.
   - Document unexpected observations as potential new hypotheses rather than noise.

5. **Causal-Layer Analysis**
   - Separate raw observations from mechanistic inferences.
   - Triangulate evidence: require that performance, precursor, structural, and interfacial signals move coherently before accepting a mechanism.
   - Verify control consistency; reject the hypothesis if negative, positive, or specificity controls move in the wrong direction.
   - Map regime boundaries where the phenomenon is negligible, transitional, or dominant.
   - Quantify uncertainty, replicate variability, and outlier influence.

6. **Decision Gate: Iterate, Escalate, or Stop**
   - **If** primary and mechanism metrics converge and controls hold: escalate to broader boundary testing, longer-term validation, or translation to more complex system formats.
   - **If** performance improves but mechanism evidence is weak: halt strong claims; redesign specificity controls to isolate the causal intermediate.
   - **If** mechanism evidence exists but performance is unchanged: investigate downstream bottlenecks, coupling mismatches, or transport penalties.
   - **If** controls fail or results contradict the hypothesis: revise the causal model or abandon the branch; archive negative results.
   - **Stop** when the mechanism is unsupported after minimal validation, a superior alternative is identified, or practical/safety constraints are violated.

7. **Boundary Mapping & Claim Calibration**
   - State the operating window, material context, and measurement limits for which conclusions hold.
   - Label each claim as directly observed, agent inference, or extrapolation.
   - Archive boundary conditions and negative results as explicit constraints on future design space.

## Output Format

When using this skill, return:
1. **Research question** — One concise question tied to a specific degradation mode or observational conflict.
2. **Hypothesis table** — Ranked hypotheses with mechanism, evidence strength, key assumptions, predicted observations, and likely failure modes.
3. **Minimal validation plan** — Variables, control hierarchy, metrics, and stop conditions.
4. **Analysis plan** — How observations from each causal layer will be integrated and how artifacts will be detected.
5. **Iteration rules** — Decision criteria for support, revision, expansion, or rejection after each validation round.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, extrapolation limits, and non-operational safety constraints.
7. **Evidence boundary statement** — What is directly supported versus what remains inference for the new problem.

## Validation Gates

Before advancing past the minimal validation stage, confirm:
- **Confounding balance**: All arms are matched for handling, geometry, environmental conditions, and assembly variability.
- **Specificity**: The intervention isolates the suspected mechanism rather than broadly altering the system.
- **Reproducibility**: The plan includes independent replicates and explicit variability reporting.
- **Statistical validity**: Metrics and endpoints were predefined; outliers and failures will be handled transparently.
- **Mechanistic sufficiency**: At least two independent evidence types support the same causal interpretation.

## Claim Boundaries

- Distinguish direct observation from mechanistic inference.
- Do not generalize beyond the tested operating regime, material class, or system format.
- Require direct precursor evidence before attributing system-level performance changes to a specific interface or bulk mechanism.
- Treat single-study success as a boundary-limited hypothesis, not field consensus.

## Failure Modes

- **Confounding misattribution**: A hidden variable (e.g., component artifact, measurement bias) is mistaken for the target mechanism.
- **Single-point optimization**: An apparent improvement at one unsupported condition is treated as a robust trend.
- **Artifact-driven gains**: Performance changes arise from normalization errors, contact changes, or protocol differences rather than the intervention.
- **Overgeneralization**: Laboratory-scale or narrow-regime observations are extrapolated to untested systems or deployment contexts.
- **Mechanistic overreach**: Correlation between one metric and one precursor is treated as sufficient causation without control consistency.

## Validity Checks

Before finalizing any research plan, verify:
- Are hardware, environment, and protocol variability balanced across cells/arms?
- Does the design include negative, positive, baseline, specificity, and replicate controls?
- Are primary metrics paired with mechanism-specific metrics?
- Are conclusions limited to the tested regime, format, and measurement context?
- Are uncertainty, replicate variability, and outlier handling stated explicitly?
- Are interfacial or structural changes interpreted as causes only when supported by temporal or perturbation evidence?
- Is source-paper evidence separated from new inferences and labeled accordingly?

## Provenance

- Synthesized from cluster **43.0** (observable-driven mechanism discovery and validation).
- Derived from source skills:
  - `aqueous-zinc-cell-confound-design` (d7ca17a4057b4c05)
  - `battery-dendrite-boundary-remediation` (dc1d0cc770b99a59)
  - `gel-polymer-electrolyte-exploration` (b95f26cce223b2ab)
  - `aqueous-zinc-manganese-cathode-research-pattern` (205ad6210619ab40)
  - `aqueous-metal-battery-interface-exploration` (192e78335405913e)
  - `flexible-zinc-storage-research-pattern` (e77f5b967996e448)
  - `aqueous-zn-interface-research-flow` (0123d145fad5fd92)
  - `gel-electrolyte-research-exploration` (cc9e8a3ba6d34e3e)
