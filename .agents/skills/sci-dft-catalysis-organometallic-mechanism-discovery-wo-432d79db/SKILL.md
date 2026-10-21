---
name: sci-dft-catalysis-organometallic-mechanism-discovery-wo-432d79db
description: An end-to-end workflow for generating, discriminating, and validating competing mechanistic hypotheses in organometallic and homogeneous catalysis using evidence-anchored reasoning and non-operational study design.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis organometallic mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

Enable an agent to turn mechanistic ambiguity in organometallic or homogeneous catalysis into a structured research program. The workflow guides hypothesis generation, competing-pathway enumeration, descriptor-based discrimination, benchmark anchoring, and iterative validation planning without relying on source-specific conclusions or operational protocols.

## When to use

Use this skill when the user asks to:
- Explore or rank competing catalytic mechanisms for a reaction family.
- Design non-operational validation studies (computational or conceptual) to discriminate pathway families.
- Explain divergent selectivity, activity, or stability across related catalysts or substrates.
- Generate conditional design rules anchored to electronic-structure or mechanistic descriptors.
- Iterate on hypotheses after initial evidence proves ambiguous or contradictory.

Do not use this skill for:
- Executable laboratory synthesis, catalysis, or hazardous-material handling instructions.
- Clinical, biomedical, or non-catalysis research unless explicitly reframed as an analogous mechanistic problem.
- Substituting domain-expert judgment or institutional safety review.

## Inputs required

Before executing the workflow, request or infer:
- Target reaction class and desired transformation.
- Candidate catalyst family, metal center, ligand class, and relevant additives.
- Known benchmark systems with established behavior.
- Available evidence: experimental trends, computed data, spectroscopic signatures, or literature precedents.
- Substrate scope and representative features (electronic, steric, coordinating).
- Constraints: safety boundaries, regulatory limits, computational resources, and validation depth.
- Desired output: hypothesis ranking, validation plan, research question, or mechanistic design rule.

If key inputs are missing, state assumptions explicitly and downgrade evidence strength accordingly.

## Core Workflow

1. **Frame the mechanistic question as pathway discrimination**
   - Convert the observed gap—unexpected selectivity, anomalous activity, or ambiguous intermediate identity—into a choice among at least two distinct mechanism families.
   - **Decision Gate:** Is the question framed as a comparison of competing pathway families rather than confirmation of a single route? If not, reframe before proceeding.

2. **Assemble evidence and anchor benchmarks**
   - Collect known experimental trends, literature precedents, and benchmark systems that share the core scaffold or reaction family.
   - Document what is observed, what is inferred, and what is missing.
   - **Decision Gate:** Are benchmarks available to sanity-check descriptors? If missing, flag all downstream claims as lower evidence strength.

3. **Enumerate competing mechanism families**
   - Map all chemically plausible manifolds: inner-sphere, outer-sphere, concerted, stepwise, redox-cycling, ligand-assisted, off-cycle, and decomposition pathways.
   - **Decision Gate:** Have all plausible route families been considered? If a major alternative is omitted, return to expansion.

4. **Build comparable pathway graphs**
   - For each family, define reactant complexes, key intermediates, transition states, branching points, product release, and catalyst regeneration.
   - Include plausible spin states, binding modes, and ion-pairing configurations where relevant.
   - **Decision Gate:** Does each graph connect to observed products without requiring unsupported species? If not, prune the route.

5. **Generate and standardize mechanistic descriptors**
   - Evaluate descriptors consistently across all candidates: electronic structure, coordination geometry, frontier-orbital patterns, spin-state ordering, charge distribution, steric environment, and thermodynamic/kinetic feasibility indicators.
   - **Decision Gate:** Are descriptors assessed on a common reference state and comparable model level? If inconsistent, standardize before ranking.

6. **Rank hypotheses and assign evidence strength**
   - Classify each pathway:
     - **Strong:** multiple independent descriptors agree and benchmarks are rationalized.
     - **Moderate:** one descriptor class is persuasive but competing mechanisms remain plausible.
     - **Weak:** the claim depends on a single model choice or unvalidated assumption.
     - **Speculative:** based mainly on analogy.
   - **Decision Gate:** Is the leading hypothesis separated from the strongest alternative by multiple independent indicators? If not, label the ranking as unresolved.

7. **Design minimal viable validation**
   - Define the smallest set of non-operational comparisons that can falsify at least one leading mechanism.
   - Specify variables (substrate electronics/sterics, catalyst identity, ligand environment, solvent/coordination model) and controls (positive, negative, orthogonal, mechanistic, model-sensitivity).
   - **Decision Gate:** Can the planned comparison produce a discriminating observation? If not, redesign before execution.

8. **Analyze and compare pathways**
   - Construct descriptor matrices, compare relative trends, test sensitivity to model assumptions, and validate against benchmarks.
   - Treat relative trends as primary; treat absolute numerical values as conditional.
   - **Decision Gate:** Do benchmarks reproduce under the current model? If benchmarks fail, pause and revise descriptors or model assumptions.

9. **Iterate or stop based on evidence**
   - **Strengthen:** if descriptors converge and benchmarks hold, narrow the hypothesis to explicit boundary conditions.
   - **Split:** if evidence is mixed by substrate or catalyst class, partition the hypothesis into scope-specific sub-hypotheses.
   - **Discard:** if a competing pathway is consistently favored across sensitivity checks or if controls contradict the hypothesis.
   - **Reframe:** if the active species or mechanism family was misassigned.
   - **Stop Conditions:**
     1. A required intermediate is inaccessible and no credible alternative exists.
     2. The preferred mechanism changes under minor model perturbations.
     3. Benchmark systems are not reproduced.
     4. Descriptors conflict irreconcilably.
     5. The hypothesis depends on a single unvalidated computational or experimental assumption.
     6. Safety or compliance constraints prevent meaningful validation.
   - **Iteration Trigger:** If evidence remains ambiguous after Step 8, return to Step 6 with narrowed variables, or to Step 4 with revised pathway graphs.

10. **Define boundary conditions and transferability**
    - State the catalyst family, substrate class, reaction environment, and evidence level where the conclusion is valid.
    - Identify which variables, if changed, would invalidate the rule.
    - **Decision Gate:** Are all claims explicitly scoped? If not, add boundary warnings before output.

## Output Format

Produce the following structured deliverables:

1. **Research question** — Target reaction family, mechanistic ambiguity, and why it matters.
2. **Gap and benchmark map** — Known systems, missing knowledge, and comparability rationale.
3. **Competing pathway map** — Mechanism families, key intermediates, branch points, and off-cycle possibilities.
4. **Hypothesis table** — For each candidate: predicted pathway, key descriptors, evidence strength, assumptions, and failure modes.
5. **Validation design** — Minimal viable validation, variables, controls, evaluation metrics, and stop conditions (non-operational).
6. **Analysis plan** — Descriptor matrix, competing-pathway comparison, benchmark validation, sensitivity checks, and visualization logic.
7. **Iteration plan** — Triggers for strengthening, splitting, discarding, or reframing each hypothesis.
8. **Boundary and validity notes** — Confounders, reproducibility requirements, external-validity limits, and safety/compliance constraints.
9. **Final recommendation** — Ranked research directions or conditional design rules with explicit evidence strength and non-transferable assumptions.

## Validation Gates

Before finalizing any output, confirm:
- At least two plausible mechanism families are compared.
- Positive, negative, and orthogonal controls are defined.
- Kinetic and thermodynamic interpretations are separated.
- Benchmarks are used as consistency checks, not as automatic proof for new candidates.
- Evidence strength is tiered (Strong/Moderate/Weak/Speculative).
- Failure criteria and stop conditions are explicit.
- Boundary conditions for extrapolation are stated.
- Claims are limited to the studied system family and evidence level.
- No single source is treated as field-wide consensus.

## Claim Boundaries

- Outputs are conditional design rules, not guarantees of catalytic performance.
- Computational predictions and conceptual models are hypotheses requiring independent experimental validation.
- Benchmark reproduction is required before extrapolating to untested candidates.
- Selectivity, activity, and stability claims apply only within the stated scaffold, substrate class, and reaction environment.
- Economic, sustainability, or scalability implications must be treated as speculative unless supported by dedicated evidence.

## Failure Modes

- **Overfitting:** A mechanism explains one substrate or catalyst but fails on closely related variants.
- **Confounding:** Multiple design variables change simultaneously, obscuring the true mechanistic driver.
- **Missing off-cycle pathways:** Unmodeled resting states, decomposition routes, or catalyst deactivation invalidate the apparent cycle.
- **Model artifact:** A pathway ranking depends on a single unvalidated computational choice, basis set, solvation treatment, or spin-state assumption.
- **Active-species misassignment:** The proposed reactive intermediate is not competitive with alternatives.
- **Background artifact:** Apparent selectivity or activity arises from acid/base chemistry, impurities, or non-catalytic processes.
- **Unsupported extrapolation:** Design rules are applied outside the validated scaffold or reaction family.

## Validity Checks

### Confounding factors
- Does the candidate vary more than one design variable at a time?
- Could ligand simplification, omitted solvent, counterions, or aggregation alter the mechanism?
- Are metal identity, oxidation state, and coordination geometry independently assessable?

### Reproducibility checks
- Are descriptors computed consistently across all candidates?
- Are transition-state or pathway connections validated by continuity or equivalent consistency checks?
- Are conclusions stable under reasonable alternative electronic states, model assumptions, or conformational sampling?

### Statistical and modeling checks
- Are relative trends prioritized over absolute numerical values?
- Are uncertainty ranges or sensitivity analyses reported for close alternatives?
- Are model limitations stated before making design recommendations?

### Boundary checks
- Does the hypothesis apply only to the same scaffold and reaction family?
- Would changing substrate electronics, steric bulk, ligand set, solvent, or metal identity invalidate the rule?
- Are new hypotheses clearly labeled as inferred rather than verified?

## Provenance

Derived from cluster `9.0` (catalysis-organometallic-mechanistic-computational-mechanism-discovery-workflow) and synthesized from source skills: `test0658`, `test1261`, `test0711`, `test1839`, `test1700`, `test1501`, `test0863`, `test0614`. Specific systems, numerical parameters, and paper conclusions from individual sources have been excluded to preserve reusability.
