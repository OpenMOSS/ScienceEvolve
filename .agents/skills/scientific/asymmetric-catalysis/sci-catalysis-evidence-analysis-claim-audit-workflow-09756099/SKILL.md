---
name: sci-catalysis-evidence-analysis-claim-audit-workflow-09756099
description: An end-to-end workflow for generating falsifiable hypotheses, designing controlled multi-modal validation, and auditing scientific claims across complex materials and catalysis domains.
scienceevolve-title: "Asymmetric catalysis · evidence analysis claim audit workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

To guide agents through a reusable research workflow that transforms an unresolved structure–property gap into testable hypotheses, validates them through controlled multi-modal evidence, and audits resulting claims against confounders, reproducibility boundaries, and inferential limits. The workflow emphasizes isolating mechanism variables from artifacts, cross-validating independent evidence streams, and enforcing explicit decision gates for iteration or termination.

## When to use

- When proposing new research questions in materials chemistry, catalysis, oxides, superconductors, or energy materials where structure–property mechanisms remain unresolved.
- When designing validation schemes that must separate intrinsic material effects from extrinsic artifacts (e.g., interface effects, measurement bias, computational approximations).
- When auditing claims that rely on multi-modal or cross-scale evidence (spectroscopy, transport, imaging, computation).
- When iterative cycles between hypothesis generation, minimal validation, and model refinement are required.

## Inputs required

- Target system or reaction context and its known stable phases or baseline behaviors.
- A defined performance gap or anomalous observation requiring mechanistic explanation.
- Available evidence streams (experimental or computational) and their resolution or uncertainty limits.
- Constraints: safety boundaries, reproducibility requirements, and resource limits.

## Core Workflow

1. **Gap Framing & Mechanism Mapping**
   - Define the specific structure–property or performance gap.
   - Decompose candidate mechanisms into independent, testable categories (electronic, geometric, interfacial, transport, artifact).
   - *Decision Gate 1*: Is the gap falsifiable and separable from known instrumental or computational limits? If no, refine scope or stop.

2. **Hypothesis Generation with Evidence Grading**
   - Formulate 2–4 falsifiable mechanism hypotheses.
   - Grade each: **Strong** (direct analog + multi-source support), **Medium** (analogous system or single-source support), **Weak** (model-dependent or inferential).
   - Attach key assumptions, predicted observables, and explicit failure modes to each.
   - *Decision Gate 2*: Do the top hypotheses predict distinct signatures under a feasible validation scheme? If no, return to Step 1.

3. **Minimal Viable Validation Design**
   - Design the smallest experiment or calculation capable of discriminating between leading hypotheses.
   - Define independent variables (composition, structure, dimensionality), intermediate descriptors (electronic state, local coordination, transport coefficient), and outcome metrics.
   - Institute a control matrix:
     - **Strong control**: baseline isolating one variable.
     - **Negative control**: system expected to lack the target mechanism.
     - **Positive control**: system known to exhibit the target behavior.
   - Pre-register stop conditions (control failure, signal below detection limit, safety boundary breach).
   - *Decision Gate 3*: Is the validation plan ethically compliant and resolvable within available non-operational constraints? If no, redesign or stop.

4. **Multi-Modal Evidence Acquisition**
   - Collect data from at least two independent evidence streams (e.g., structural + spectroscopic, or computational + transport).
   - Log null results, failed measurements, and sensitivity parameters.
   - *Decision Gate 4*: Do the data meet quality thresholds (reproducibility, control integrity, resolution)? If no, troubleshoot or stop.

5. **Cross-Validation & Mechanism Attribution**
   - Compare evidence streams; attribute effects to a mechanism only when independent streams agree.
   - For every major claim, generate at least one competitive alternative explanation.
   - *Decision Gate 5*: Is there convergent evidence for one hypothesis, or do streams conflict? If conflict, flag for iteration.

6. **Claim Grading & Boundary Setting**
   - Classify each claim:
     - **Supported**: multi-modal convergence with passed controls.
     - **Partially supported**: single-stream or model-dependent.
     - **Inferred**: extrapolation beyond tested conditions.
     - **Falsified**: control failure or contradictory evidence.
   - State explicit boundary conditions (temperature, composition, strain, measurement window, computational approximation) where the claim holds.

7. **Iteration or Redesign**
   - **If supported**: Expand to adjacent variables or scale validation; return to Step 2 with refined questions.
   - **If conflicting**: Audit confounders, reformulate hypotheses, or redesign controls; return to Step 1 or 3.
   - **If insufficient**: Increase resolution, reduce complexity, or acquire orthogonal data; return to Step 4.
   - *Stop Condition*: After two full iteration cycles without convergence, halt and document limiting factors.

## Output Format

Each invocation must produce:

1. **Research question and gap statement**.
2. **Mechanism map**: candidate hypotheses with evidence grades and failure modes.
3. **Validation protocol**: variables, control matrix, and pre-registered stop conditions.
4. **Evidence matrix**: cross-stream observations and consistency assessment.
5. **Claim audit**: graded conclusions with explicit boundary conditions.
6. **Iteration log**: decisions at each gate and rationale for continuation, redesign, or stop.
7. **Risk and ethics summary**: non-operational safety boundaries and compliance notes.

## Validation Gates

- **Gate 1 (Problem Framing)**: The gap is specific, falsifiable, and not an artifact of known limitations.
- **Gate 2 (Hypothesis Discrimination)**: Hypotheses generate distinct, observable signatures under the proposed validation scheme.
- **Gate 3 (Protocol Integrity)**: The plan is non-operational, compliant, and feasible within constraints.
- **Gate 4 (Data Quality)**: Controls behave as expected; signal exceeds noise; reproducibility is demonstrated.
- **Gate 5 (Cross-Modal Agreement)**: At least two independent evidence streams support the mechanism attribution; alternative explanations are ranked and addressed.

## Claim Boundaries

- Distinguish verified observations (directly from this validation), literature-supported analogies, and agent-inferred extrapolations.
- State the exact parameter window (composition, structure, thermodynamic conditions, computational approximations) where claims hold.
- Prohibit presenting single-source or single-scale evidence as domain consensus.
- Flag any claim that relies on out-of-distribution extrapolation or untested structural analogies.

## Failure Modes

- **Hypothesis under-determination**: Multiple mechanisms produce indistinguishable signatures under the chosen validation scheme.
- **Control failure**: Negative or positive controls behave unexpectedly, invalidating the experimental logic.
- **Confounding dominance**: Extrinsic factors (interface effects, measurement drift, computational approximations) overwhelm the intrinsic signal.
- **Single-stream over-reliance**: A claim is built on one evidence type without orthogonal confirmation.
- **Boundary violation**: Claims are extrapolated beyond the validated parameter space without being downgraded to inference.
- **Iteration deadlock**: Repeated cycles fail to resolve conflicts due to insufficient resolution or fundamentally flawed framing.

## Validity Checks

- **Confounder audit**: List all extrinsic variables (preparation history, measurement conditions, environmental factors, model approximations) and assess their potential impact.
- **Reproducibility**: Require independent replication, sensitivity analysis, or cross-method verification for all strong claims.
- **Statistical rigor**: Report uncertainty, sample size, outlier treatment, and distinguish exploratory from confirmatory findings.
- **Mechanistic separability**: Verify that geometric, electronic, and transport contributions can be disentangled through the control matrix.
- **Scale consistency**: Ensure macroscopic performance claims are consistent with microscopic/local evidence, or explicitly note discrepancies.

## Provenance

- Workflow synthesized from cluster 2.2 (end-to-end evidence analysis and claim audit).
- Source skills referenced: reducible-oxide-surface-exploration, catalyst-dos-cnn-volcano-exploration, structured-catalyst-gas-solid-exploration, perovskite-band-edge-orbital-design, complex-oxide-thinfilm-phase-exploration, tetrahedrite-ion-dynamics-research-skill, flexible-tandem-photovoltaics-research-workflow, spo-derived-p-ligand-electronic-exploration.
- Represents a semantic merge of hypothesis generation, multi-modal validation, and iterative claim auditing patterns across heterogeneous materials domains.
