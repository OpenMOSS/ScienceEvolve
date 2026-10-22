---
name: sci-dft-activation-functionalization-selectivity-mechan-256e4078
description: A reusable end-to-end workflow for designing, validating, and iterating mechanistic hypotheses in catalytic activation and functionalization research through observable-driven discovery and control-rich discrimination.
scienceevolve-title: "Organometallic catalysis and DFT · activation functionalization selectivity mechanism discovery"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

Help an agent transform a catalytic activation or functionalization observation into a rigorous, reusable research program. This workflow emphasizes mechanism-first reasoning, layered hypothesis testing, and claim bounding to distinguish genuine catalytic effects from artifacts, background reactivity, or overgeneralized precedent.

## When to use

Use this skill when the user asks to:
- Propose new catalytic transformations involving bond activation, cross-coupling, C–H functionalization, annulation, or cooperative catalysis.
- Design hypothesis-driven screening and validation plans for selectivity, mechanism, or scope.
- Convert mechanistic observations into testable catalytic-cycle hypotheses.
- Build control-rich experiments to discriminate between competing pathways.
- Iterate on failed or ambiguous results without treating a single precedent as field consensus.

Do **not** use this skill for safety-critical process scale-up, direct execution of hazardous procedures, clinical decision-making, or operational laboratory protocols.

## Inputs required

Before generating a plan, collect or infer:
- Target transformation, bond change, or functionalization gap.
- Candidate catalyst platform, activation mode, or cooperative design feature.
- Known precedent, competing mechanisms, and reported limitations.
- Desired selectivity challenge (chemo-, regio-, or stereoselectivity).
- Available analytical readouts (product identity, conversion, selectivity, byproducts, intermediate probes).
- Practical constraints (reagent availability, safety boundaries, analytical access).

If inputs are missing, state assumptions and label conclusions as conditional.

## Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

1. **Frame the gap and mechanistic bottleneck**
   - Define the transformation gap and why existing approaches are insufficient.
   - Identify the activation or selectivity bottleneck.
   - Distinguish verified literature facts from agent extrapolations.

2. **Generate ranked mechanistic hypotheses**
   - Propose the primary activation mode and at least one competing mechanism.
   - Assign evidence strength (`low` / `medium` / `high`) to each hypothesis.
   - State key assumptions, discriminating predictions, and likely failure modes.
   - **Decision gate:** Proceed only if hypotheses are falsifiable by feasible controls.

3. **Design minimal viable validation**
   - Define the smallest experiment set that can test the core idea.
   - Include positive, negative, ablation, background, and analytical controls.
   - Specify evaluation metrics (product formation, selectivity, mass balance, reproducibility).
   - **Stop condition:** Halt if the target signal is indistinguishable from background or if safety constraints are violated.

4. **Execute staged evidence collection**
   - **Layer 1 – Feasibility:** Confirm product identity and reproducible signal.
   - **Layer 2 – Mechanistic discrimination:** Run controls, probes, and kinetic signatures.
   - **Layer 3 – Scope mapping:** Vary electronic, steric, and functional-group features.
   - **Layer 4 – Robustness:** Test reproducibility and small justified variations.
   - **Iteration gate:** After each layer, update the hypothesis table before advancing.

5. **Analyze through control-first reasoning**
   - Confirm product/byproduct identity with orthogonal methods before interpreting yield.
   - Compare outcomes against all controls.
   - Cluster results by mechanistic implication (catalyst, ligand, solvent, substrate effects).
   - Grade each conclusion as `supported`, `plausible`, `ambiguous`, or `contradicted`.

6. **Discriminate mechanisms and bound claims**
   - Eliminate alternative pathways that fail discriminating controls.
   - Update the catalytic-cycle model conditionally.
   - Define the claim boundary: what is observed, inferred, or proposed for future systems.
   - **Decision gate:** Do not expand scope until mechanism discrimination and reproducibility are established.

7. **Iterate or redesign**
   - **If positive:** Strengthen the hypothesis and test boundary conditions.
   - **If ambiguous:** Prioritize mechanistic probes over optimization.
   - **If negative:** Classify the failure mode (activation failure, intermediate instability, off-cycle sequestration, analytical artifact) and revise the model.
   - **Stop condition:** Abandon if the hypothesis is contradicted by multiple independent controls or if further work depends on unsafe or non-generalizable practices.

8. **Finalize research plan and documentation**
   - Compile the hypothesis table, evidence ladder, control outcomes, and boundary statement.
   - Document negative results and unresolved alternatives.
   - Archive provenance and assumptions for reproducibility.

## Output Format

When using this skill, produce:

1. **Research question** – Target transformation and the gap it addresses.
2. **Mechanistic framing** – Proposed activation mode, competing mechanisms, and cycle-closure logic.
3. **Hypothesis table** – Ranked hypotheses with evidence strength, key assumptions, minimal tests, and likely failure modes.
4. **Validation plan** – Minimal viable experiments, control matrix, evaluation metrics, and stop conditions.
5. **Analysis plan** – Product-confirmation rules, mechanistic-interpretation logic, and evidence grading.
6. **Iteration plan** – Actions for positive, ambiguous, or negative outcomes.
7. **Validity and safety check** – Confounding factors, reproducibility requirements, boundary conditions, and non-operational safety guardrails.
8. **Claim boundary statement** – Observed vs. inferred vs. proposed claims.

## Validation Gates

- **Gate 1 (Feasibility):** Product identity is confirmed and the signal is reproducible above background.
- **Gate 2 (Specificity):** Target formation depends on the proposed catalytic feature; ablation controls are negative.
- **Gate 3 (Mechanism):** At least two independent evidence streams support the proposed pathway over alternatives.
- **Gate 4 (Scope):** Substrate variation tests electronic, steric, and functional-group diversity without overfitting.
- **Gate 5 (Robustness):** Results are reproducible across independent runs and small, justified condition variations.

## Claim Boundaries

- **Observed:** Directly demonstrated in the tested system with orthogonal confirmation.
- **Inferred:** Supported by mechanism-consistent controls and probes, but not directly observed.
- **Proposed:** Hypothesized for future systems or extensions beyond the tested boundary.
- **Excluded:** Never present a single study’s scope as field-wide consensus.

## Failure Modes

- **Activation failure:** No productive bond cleavage or catalyst turnover.
- **Selectivity collapse:** Competing self-reaction, homocoupling, or off-target activation dominates.
- **Intermediate instability:** Proposed intermediate decomposes or diverts to side products.
- **Background artifact:** Target product forms without the proposed catalyst or mechanism.
- **Analytical misassignment:** Product or byproduct identity is incorrect or unconfirmed.
- **Overgeneralization:** Scope claims exceed the tested substrate or condition space.
- **Safety blocker:** Unreviewed hazards prevent conceptual advancement.

## Validity Checks

- Are product and byproduct identities confirmed by orthogonal methods?
- Do controls rule out background, noncatalytic, and alternative pathways?
- Are variables varied independently rather than through coupled changes?
- Are replicates and uncertainty estimates sufficient for the claim?
- Are mechanistic claims labeled as plausible models rather than proven cycles?
- Are substrate-scope claims limited to tested classes with boundary conditions stated?
- Are source-paper findings separated from new hypotheses and agent inferences?
- Are safety, waste, and compliance constraints addressed at a non-operational level?

## Provenance

- Synthesized from cluster **15.0** (observable-driven mechanism discovery and validation).
- Source skill references: `test1585`, `test1766`, `test1756`, `test1337`, `test0439`, `test1692`, `test1411`, `test1792`.
- Preserves the shared research pattern of mechanism-first hypothesis generation, control-rich discrimination, and iterative claim bounding across organometallic catalysis, C–H functionalization, cross-coupling, and annulation domains.
