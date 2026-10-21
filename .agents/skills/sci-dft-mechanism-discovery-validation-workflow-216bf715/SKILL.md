---
name: sci-dft-mechanism-discovery-validation-workflow-216bf715
description: A reusable end-to-end workflow for generating mechanistic hypotheses, designing minimal validation studies, and iterating competing-pathway models in catalysis and reaction mechanism research.
scienceevolve-title: "Organometallic catalysis and DFT · mechanism discovery validation workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

This skill helps an agent turn an ambiguous reaction outcome into a structured mechanistic research plan. It emphasizes reusable reasoning patterns from computational and conceptual studies of competing pathways: decompose the reaction network, separate rate control from selectivity control, enumerate productive and competing branches, and use matched structural or environmental perturbations to test causal descriptors. The goal is transferable research design, not reproduction of any single system.

# When to use

Use this skill when the user asks for:

- A new research question in catalysis, stereoselectivity, multicomponent coupling, strained-intermediate methodology, or related mechanistic chemistry.
- Hypotheses explaining how catalyst, ligand, substrate, or medium structure affects selectivity, activity, or product distribution.
- A computational or conceptual validation plan for competing mechanistic pathways.
- A non-operational study design that identifies variables, controls, metrics, and iteration rules.

Do not use this skill as a laboratory protocol, safety procedure, recipe for executing chemical reactions, or yield-optimization guide.

# Inputs required

Before generating a plan, request or identify:

- Reaction class, transformation type, and target outcome (e.g., selectivity, new bond formation, or intermediate access).
- Observed or expected anomalies: byproducts, regio/stereoselectivity changes, low conversion, or condition sensitivity.
- Candidate catalyst, ligand, reagent, or activation concept classes at a non-operational level.
- Substrate or component families available for comparison.
- Available experimental or computational benchmarks, if any.
- Intended output: research questions, hypothesis table, validation design, or iteration plan.
- Constraints: safety boundaries, compliance requirements, and acceptable risk levels.

If any input is missing, state the assumption explicitly and mark resulting hypotheses as lower confidence.

# Core Workflow

## 1. Frame the mechanistic puzzle
Define the observation that needs explanation (e.g., unexpected selectivity, byproduct dominance, or substrate-dependent failure). Frame the research question around a branching network rather than a single pathway.

**Decision Gate 1 — Ambiguity check:**  
If the outcome is already explained by a single, well-supported pathway with no competing branches, stop and report the established mechanism. Otherwise, proceed.

## 2. Decompose the reaction network
Map the system into plausible stages:

- Active species formation or resting state.
- Substrate/component association.
- Key intermediate or branching state.
- Product-forming elementary steps.
- Catalyst regeneration, product release, or off-cycle trapping.

Explicitly identify which stage could control rate and which could control selectivity or structure.

## 3. Generate competing hypotheses
Enumerate at least two plausible pathways:

- **Productive pathway:** yields the desired outcome.
- **Competing pathway(s):** explain byproducts, failure modes, or alternative selectivity.
- **Off-cycle / sequestration pathway:** explains catalyst deactivation or intermediate trapping.

For each hypothesis, specify:

- Mechanistic basis and branching state.
- Descriptor expected to correlate with outcome (electronic, steric, conformational, coordination, or medium effect).
- Expected trend if the hypothesis holds.
- Evidence strength: Weak / Moderate / Strong / Robust.
- Key assumptions.
- Failure modes and minimum discriminating observation.

**Decision Gate 2 — Falsifiability check:**  
If hypotheses cannot be distinguished by any feasible conceptual control or metric, refine the branching state or descriptors until they are. Otherwise, proceed.

## 4. Design minimal viable validation
Define the smallest study that can support or weaken the leading hypotheses.

**Variables (conceptual classes only):**

- Catalyst or activation class.
- Ligand or regulatory module features.
- Substrate electronic, steric, or conformational classes.
- Medium, solvent polarity, or additive roles.
- Alternative active-species models.

**Controls:**

- **Baseline control:** minimal system expected to reproduce the reference behavior.
- **Positive control:** known case that validates the detection logic.
- **Negative control:** variant expected to remove the proposed interaction or pathway.
- **Matched-pair control:** two systems differing mainly in the variable under test.
- **Orthogonality control:** changes one descriptor while holding others approximately constant.
- **Alternative-species / component control:** tests whether a different active form or omitted component explains the result.

**Metrics:**

- Primary: relative pathway preference, predicted major product, selectivity trend, rate-control assignment.
- Secondary: structural/electronic descriptors, sensitivity to model assumptions, reproducibility.

**Stop conditions (hard):**

- The assumed active species is implausible.
- The selectivity-determining step cannot be identified.
- Competing pathways are indistinguishable within uncertainty.
- A descriptor trend reverses under reasonable alternative models.
- The plan requires system-specific parameters, hazardous execution details, or unsupported extrapolation.

**Decision Gate 3 — Safety and generality check:**  
If the validation plan relies on operational recipes, numerical parameters from a source paper, or unsafe procedural detail, redesign it at the conceptual level. Otherwise, proceed.

## 5. Execute conceptual validation
Compare predicted against observed outcomes:

- Confirm that all compared pathways are chemically connected to the same starting materials and products.
- Verify that controls behave as predicted.
- Separate raw observations from mechanistic inferences.

## 6. Analyze and classify evidence
For each hypothesis:

- Map observations to pathway predictions (supported / contradicted / untested).
- Check descriptor consistency across matched pairs.
- Evaluate sensitivity to solvent, entropy, conformational sampling, alternative active species, or method choices.
- Update evidence strength and classify as supported, weakened, falsified, or unresolved.

**Decision Gate 4 — Robustness check:**  
If negative controls produce the diagnostic signal, or if pathway rankings reverse under reasonable alternative models, flag the result as ambiguous and return to Step 3. Otherwise, proceed.

## 7. Iterate or bound the claim
- **If supported:** Test boundary conditions with diagnostic perturbations (broader substrate classes, alternative catalyst families, or medium changes). Expand scope only after the minimal mechanism is interpretable.
- **If ambiguous:** Identify the weakest assumption (product assignment, active species, mechanism, or selectivity origin) and design the next discriminating experiment.
- **If contradicted:** Revise the active-species model, branching state, or descriptor before changing the perturbation strategy. Reject hypotheses that require ad hoc explanations.

**Stop conditions (iteration):**

- New experiments no longer discriminate among remaining mechanisms.
- Results depend on ambiguous assignments or uncontrolled background reactivity.
- Further expansion would exceed the validated applicability domain.

**Decision Gate 5 — Scope discipline:**  
Before generalizing, confirm that claims are bounded by the tested substrate/catalyst/condition classes and that negative or low-selectivity cases are reported.

# Output Format

When using this skill, return the following structure:

1. **Mechanistic problem statement**
   - Target outcome and observed anomaly.
   - Key uncertainty.

2. **Competing pathway map**
   - Active species / resting state candidates.
   - Shared intermediate or branching state.
   - Productive branch.
   - Competing / byproduct branches.
   - Off-cycle or sequestration branches.

3. **Hypothesis table**
   - Hypothesis, mechanistic basis, descriptor, expected trend, evidence strength, key assumptions, failure mode.

4. **Minimal viable validation design**
   - Conceptual variables.
   - Baseline, positive, negative, matched-pair, orthogonality, and alternative-species controls.
   - Primary and secondary metrics.
   - Stop conditions.

5. **Analysis and iteration plan**
   - How results update the mechanism.
   - What findings strengthen, weaken, or falsify each hypothesis.
   - Next discriminating perturbation for each major outcome.

6. **Validity and safety statement**
   - Confounders and extrapolation boundaries.
   - Evidence labeling (paper-supported vs. agent-inferred).
   - Non-operational safety and ethics constraints.

# Validation Gates

- **Gate 1 — Ambiguity:** Confirm the outcome is not already explained by a single, uncontested pathway.
- **Gate 2 — Falsifiability:** Confirm hypotheses are distinguishable by feasible controls and metrics.
- **Gate 3 — Conceptual safety:** Confirm the plan contains no operational recipes, hazardous parameters, or paper-specific numerical conditions.
- **Gate 4 — Robustness:** Confirm results survive negative controls and reasonable alternative models.
- **Gate 5 — Scope discipline:** Confirm claims are bounded and negative cases are included before generalization.

# Claim Boundaries

- Distinguish **paper-supported patterns**, **analogical inferences**, and **new agent-generated hypotheses**; label each explicitly.
- Limit mechanistic claims to the tested substrate class, catalyst family, and validation scope.
- Do not treat a single-system result as field-wide consensus.
- Avoid clinical, therapeutic, safety-efficacy, or environmental-compatibility claims without domain-specific evidence.
- Report numerical or parameter-specific details only when supplied by the user and only in a non-operational planning context.

# Failure Modes

- **Indistinguishable pathways:** Competing mechanisms overlap within experimental or computational uncertainty.
- **Implausible active species:** The assumed catalyst or intermediate form is unsupported.
- **Reversing descriptors:** A proposed structural or electronic descriptor trend inverts under alternative reasonable models.
- **Control ambiguity:** Negative or positive controls fail to behave as predicted, leaving the mechanism unresolved.
- **Assignment uncertainty:** Product, intermediate, or structural identity is ambiguous or relies on single-method inference.
- **Unsupported extrapolation:** Claims extend beyond the validated domain without independent evidence.
- **Background reactivity:** The observed outcome arises from uncontrolled non-catalytic processes.

# Validity Checks

Before finalizing a recommendation, verify:

- Rate control and selectivity control are explicitly separated.
- Productive, competing, and off-cycle pathways are all represented.
- Controls include baseline, positive, negative, matched-pair, orthogonality, and alternative-species variants where relevant.
- Confounders are addressed (counterion effects, Brønsted acidity, impurities, aggregation, preparation history).
- Each hypothesis is labeled with evidence strength, key assumptions, and failure modes.
- Paper-specific numbers, parameters, and operational details are excluded from the reusable workflow.
- The plan would remain useful for a different but related catalytic or reactive system.
- Safety, ethics, and compliance boundaries are included without becoming operational instructions.

# Provenance

- Synthesized from cluster 12, subcluster 12.1 (end-to-end mechanism discovery and validation).
- Source skills: `asymmetric-catalysis-mechanistic-design`, `mechanism-competition-research-design`, `mechanism-anchored-multicomponent-catalysis-exploration`, `organosilicon-strained-intermediate-research-design`, `directional-motif-hybrid-self-assembly`, `catalytic-selectivity-mechanism-exploration`, `metal-carbene-selectivity-exploration`, `lewis-acid-promoted-catalysis-exploration`.
- Represents the shared workflow route: hypothesis generation → mechanism discrimination → study design → simulation/validation → data analysis → iteration/redesign.
