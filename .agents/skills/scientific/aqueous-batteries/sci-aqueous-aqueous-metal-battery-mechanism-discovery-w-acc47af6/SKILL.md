---
name: sci-aqueous-aqueous-metal-battery-mechanism-discovery-w-acc47af6
description: A reusable end-to-end workflow for generating, testing, and iterating mechanism hypotheses in aqueous metal battery research through controlled observation and causal validation.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

This skill provides an end-to-end scientific workflow for transforming observed performance gaps in aqueous metal batteries into validated mechanistic hypotheses. It guides the user through failure-mode decomposition, falsifiable hypothesis generation, control-rich experimental design, layered evidence analysis, and bounded iteration—without prescribing operational recipes, material-specific parameters, or unsafe procedures.

# When to use

Use this skill when you need to:
- Propose new research questions or hypotheses for aqueous metal battery electrolytes, electrodes, or interfaces.
- Design non-operational experiments that distinguish bulk, interfacial, and interphase mechanisms.
- Evaluate whether a material or chemical design concept has a plausible structure-to-mechanism-to-performance chain.
- Plan diagnostic studies for dendrite suppression, side-reaction mitigation, dissolution control, transport limitation, or interfacial instability.
- Iterate on ambiguous or contradictory results by identifying the weakest causal link.

Do not use this skill for:
- Operational synthesis recipes, cell assembly instructions, or hazardous experimental protocols.
- Commercialization, deployment, or field-wide consensus claims.
- Unrelated materials design workflows outside aqueous electrochemical energy storage.

# Inputs required

Before entering the workflow, define or infer:
- **Target system**: metal anode family, electrolyte class, cathode or counter electrode type, and intended device context.
- **Performance gap**: the specific failure mode or bottleneck (e.g., nonuniform deposition, capacity fade, impedance growth, mechanical degradation).
- **Candidate design lever**: abstract class of modification (e.g., additive concept, solvent regulator, interphase precursor, host perturbation, protective architecture).
- **Baseline comparator**: the unmodified or standard reference system.
- **Available evidence**: prior literature, preliminary data, or modeling constraints.
- **Diagnostic access**: which structural, chemical, kinetic, electrochemical, or mechanical probes are available.
- **Constraints**: safety, environmental, regulatory, cost, and scalability boundaries.
- **Desired output**: hypothesis set, experiment schema, analysis plan, or iteration strategy.

If any input is missing, state the assumption explicitly and label downstream claims as exploratory.

# Core Workflow

Execute the following stages in order. Do not skip decision gates.

## 1. Failure-mode framing and mechanism decomposition
Define the system-level performance gap. Decompose it into candidate mechanisms across at least three spatial or functional regions:
- Bulk electrolyte / active material (solvation, speciation, transport, phase stability).
- Near-interface layer (adsorption, electric field, concentration gradient, desolvation).
- Interphase / electrode surface (film formation, passivation, corrosion, deposition morphology).
- Cell-level coupling (cross-electrode effects, separator, inventory, geometry).

**Decision gate**: Is the failure mode defined and decomposed into at least two competing mechanism classes?  
- **No**: Stop. Refine the problem statement and collect more context.  
- **Yes**: Proceed to hypothesis generation.

## 2. Hypothesis generation
For each candidate mechanism, generate at least one falsifiable hypothesis using the causal template:  
> If [design lever] modifies [target mechanism], then [diagnostic observable] will change in [predicted direction], leading to [performance outcome], provided that [boundary condition] holds.

For every hypothesis, record:
- **Evidence strength**: exploratory, weak, moderate, or strong.
- **Key assumptions**: what must be true for the causal chain to hold.
- **Alternative explanations**: at least two competing mechanisms that could produce the same observable.
- **Likely failure modes**: how the hypothesis could fail even if nominal performance improves.
- **Falsification criterion**: the specific observation that would reject or revise the hypothesis.

**Decision gate**: Are hypotheses linked to specific regions, falsifiable, and accompanied by alternative explanations?  
- **No**: Return to decomposition.  
- **Yes**: Proceed to experimental design.

## 3. Experimental design
Design a controlled evidence-building plan, not a procedural recipe.

### Variables
- **Independent**: design lever class and level.
- **Dependent**: primary performance metric, mechanism-specific diagnostic, and trade-off metric.
- **Context**: cell format, electrode state, environmental conditions, and measurement protocol category.

### Controls (required)
- **Baseline**: unmodified system under matched conditions.
- **Negative / inactive analogue**: lacks the proposed functional feature to test mechanism specificity.
- **Mechanism control**: isolates the targeted interaction from secondary effects.
- **Positive control**: known stabilizing comparator, if available.
- **Practicality control**: tests survival under more realistic constraints (e.g., higher loading, full cell, mechanical stress).

### Minimum viable validation
The smallest acceptable plan must include:
1. Baseline versus candidate comparison under matched conditions.
2. One mechanism-specific diagnostic.
3. One performance outcome metric.
4. A predefined stop condition.

### Stop conditions (define before execution)
- Primary metric fails to improve over baseline.
- Improvement appears only under non-representative conditions.
- Mechanism evidence contradicts the proposed causal chain.
- Safety, compliance, or ethical boundaries are reached.
- Effect is indistinguishable from background variation after controls.

**Decision gate**: Does the design isolate the proposed mechanism from confounders?  
- **No**: Redesign controls or narrow the hypothesis.  
- **Yes**: Proceed to evidence collection.

## 4. Evidence collection and layered analysis
Analyze results in ordered tiers:

1. **Material / structure layer**: Did the intended modification occur without creating a dominant unintended phase?
2. **Property layer**: Did transport, mechanical, or interface properties change as predicted?
3. **Performance layer**: Did the target metric improve relative to the matched baseline?
4. **Mechanism discrimination layer**: Do controls rule out nonspecific effects, side reactions, measurement artifacts, and alternative mechanisms?

**Decision gate**: Is the evidence convergent across tiers?  
- **Convergent**: Proceed to mechanism discrimination and claim bounding.  
- **Contradictory**: Flag the weakest causal link and proceed to iteration.  
- **Incomplete**: Stop and collect the missing diagnostic before claiming mechanism.

## 5. Mechanism discrimination and claim bounding
Map the evidence onto the causal chain:
- **Confirmed mechanism**: performance improvement co-occurs with mechanism-specific evidence and controls exclude alternatives.
- **Ambiguous mechanism**: performance improves but mechanism evidence is mixed or controls are insufficient.
- **Rejected mechanism**: controls contradict the causal link or the diagnostic observable fails to change as predicted.
- **Boundary-limited**: mechanism operates only under a narrow condition window.

Bound all claims:
- State the exact system class, stressor range, and cell configuration tested.
- Distinguish half-cell from full-cell, material-level from device-level.
- Label evidence strength and attach boundary conditions.

**Decision gate**: Does the evidence support the hypothesis at the stated strength level?  
- **Yes**: Proceed to iteration for escalation or generalization.  
- **No / Ambiguous**: Proceed to iteration for revision or rejection.

## 6. Iteration or redesign
Based on the weakest evidence link, select the next action:

| Evidence state | Action |
|---|---|
| Convergent support | **Promote**: test under more realistic constraints or broader conditions. |
| Condition-specific gains | **Narrow**: bound the claim and probe boundary limits. |
| Mixed or incomplete | **Revise**: change one design variable, add discriminating controls, and re-run minimum viable validation. |
| Controls contradict hypothesis | **Reject**: abandon the hypothesis and return to stage 2 to generate alternatives. |
| Safety / ethics boundary reached | **Terminate**: document residual risk and stop. |

**Decision gate**: Is the next planned experiment the smallest test that resolves the leading ambiguity?  
- **No**: Prune the plan to the minimum discriminating measurement.  
- **Yes**: Execute and return to stage 4.

## 7. Workflow termination
Terminate when one of the following is met:
- A mechanism is validated with strong controls and bounded applicability.
- The hypothesis is falsified and no viable alternative remains.
- Further progress requires operational details or hazardous protocols outside the scope of research design.
- Safety, regulatory, or ethical constraints block continuation.

Document unresolved links and residual risks in the final output.

# Output Format

Produce the following structured deliverables:

1. **Research question** – system, performance gap, and practical relevance.
2. **Mechanism map** – candidate mechanisms by region with initial evidence strength.
3. **Hypothesis portfolio** – 2–5 hypotheses with causal template, assumptions, alternatives, and falsification criteria.
4. **Experimental design schema** – variables, controls, minimum viable validation, and stop conditions.
5. **Analysis plan** – tiered analysis rules and interpretation criteria.
6. **Iteration plan** – decision rules for promote, narrow, revise, reject, and terminate.
7. **Validity and safety statement** – confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Confidence statement** – clear separation of paper-supported methodological patterns from agent-inferred proposals for the new system.

# Validation Gates

Before advancing past each stage, confirm:
- **Stage 1**: The failure mode is observable and decomposed into multiple mechanism classes.
- **Stage 2**: Every hypothesis is falsifiable and includes a falsification criterion.
- **Stage 3**: Controls are sufficient to isolate the proposed mechanism from confounders; stop conditions are predefined.
- **Stage 4**: Data are normalized to the baseline; uncertainty is estimated; alternative mechanisms are actively tested.
- **Stage 5**: Claims are bounded by tested conditions and labeled with evidence strength.
- **Stage 6**: The next experiment is the smallest discriminating test, not an indiscriminate expansion.

# Claim Boundaries

- Distinguish **material-level** evidence from **device-level** conclusions.
- Distinguish **half-cell** observations from **full-cell** relevance.
- Distinguish **benign-condition** results from **stressed-condition** behavior.
- Label all claims with evidence strength: exploratory, weak, moderate, or strong.
- Do not generalize findings from a single study to the entire field.
- Separate **prior evidence** (literature-supported patterns) from **new inference** (agent-generated proposals for the target system).

# Failure Modes

This workflow can lead to invalid conclusions if:
- **Confounding dominates**: uncontrolled variables (electrode history, impurities, geometry, environmental exposure) masquerade as mechanism effects.
- **Single-metric over-interpretation**: a performance improvement is claimed as mechanism validation without diagnostic evidence.
- **Artifact misattribution**: measurement noise, post-test redistribution, or ex situ changes are interpreted as intrinsic behavior.
- **Boundary violation**: conclusions are extrapolated beyond the tested electrolyte family, electrode type, or operating window.
- **Trade-off blindness**: a primary metric improves while a hidden penalty (impedance, safety, stability) is ignored.
- **Non-reproducible trends**: results from a single sample or narrow condition are treated as robust.

# Validity Checks

Before finalizing any output, verify:
- **Causal clarity**: every design variable links to a mechanism and a measurable outcome.
- **Control adequacy**: baseline, negative, mechanism, and practicality controls are specified.
- **Metric validity**: primary, mechanism, robustness, and trade-off metrics are separated.
- **Confounding risk**: impurities, side reactions, cell format, loading, and measurement artifacts are addressed.
- **Reproducibility**: repeated measurements, independent samples, and uncertainty reporting are planned.
- **Boundary conditions**: the plan states where the hypothesis may fail.
- **Evidence discipline**: paper-derived ideas are labeled as prior evidence, not consensus; new hypotheses are labeled as inference.
- **Transferability**: the plan uses reusable method logic rather than copying specific materials, parameters, or numerical targets from source studies.

# Provenance

Derived from cluster `14.0` (observable-driven mechanism discovery and validation) and the following source skills:
- `aqueous-zinc-interfacial-research-design`
- `aqueous-zn-organic-electrode-design`
- `azib-gel-polymer-electrolyte-research`
- `protected-soft-ionic-conductor-research`
- `zinc-ion-host-electronic-structure-exploration`
- `mechanism-partitioned-electrolyte-design`
- `electrowinning-impurity-mechanism-design`
- `azib-electrolyte-research-workflow`

No paper-specific conclusions, numerical results, or operational protocols are reproduced.
