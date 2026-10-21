---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-28e17b74
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research programs in asymmetric catalysis without operational protocols or paper-specific conditions.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 2"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to guide agents through an end-to-end mechanism discovery and validation workflow for asymmetric catalysis research. It supports gap identification, mechanistic hypothesis generation, non-operational experimental design, convergent analysis, and disciplined iteration—while keeping all claims bounded and source-specific conditions abstracted.

## When to use

Trigger when the user asks to:

- Propose new asymmetric catalytic transformations or stereocontrolled bond-forming reactions.
- Design non-operational validation plans with controls, metrics, and stop conditions.
- Discriminate competing mechanistic hypotheses using minimal diagnostic experiments.
- Evaluate catalyst-controlled selectivity claims, substrate scope boundaries, or stereochemical integrity.
- Translate a literature-inspired methodological pattern into a new research question.

Do not use for executable laboratory recipes, hazardous operational parameters, clinical or toxicological claims, or treating a single paper as field-wide consensus.

## Inputs required

Before starting the workflow, identify or request:

- **Target transformation**: bond class, stereocenter type, and product motif.
- **Known gap**: limitation in existing methods (reactivity, selectivity, scope, or mechanism).
- **Candidate catalytic manifolds**: activation modes, catalyst families, and proposed intermediate types.
- **Stereocontrol model**: how chirality is expected to be communicated (ligand, cooperative pair, organocatalyst, etc.).
- **Substrate classes**: diagnostic, electronic, steric, and functional-group variation axes.
- **Analytical capabilities**: identity, conversion, yield, enantioselectivity/diastereoselectivity, and mechanistic probes.
- **Constraints**: safety boundaries, reproducibility requirements, and evidence-strength expectations.

## Core Workflow

An ordered end-to-end route. Each phase ends with a decision gate.

1. **Frame the mechanistic gap**
   - Define the missing capability by comparing known route classes against the target bond/stereocenter.
   - Identify the bottleneck: activation, selectivity (site/regio/enantio), overreaction, or mechanistic ambiguity.
   - *Gate 1*: Is the gap distinct from known precedent? If no, stop or redefine.

2. **Generate competing mechanistic hypotheses**
   - Produce at least three hypotheses per research question:
     - Productive catalytic pathway.
     - Background or non-selective pathway.
     - Alternative activation/quenching pathway (if photochemical/redox).
   - For each hypothesis, specify: concise claim, mechanistic rationale, evidence strength (strong/moderate/weak/speculative), key assumptions, likely failure modes, and a discriminating observation that would support or falsify it.
   - Label all claims as paper-supported, literature-supported, or agent-inferred.
   - *Gate 2*: Are hypotheses falsifiable and bounded? If no, refine before proceeding.

3. **Design minimal viable validation (MVV)**
   - Select one representative model system that tests the stereochemical relay or selectivity-determining step.
   - Define comparison arms: full candidate, catalyst-only, no-catalyst, achiral variant, and mechanistic probe.
   - Specify conceptual variable classes (catalyst identity, ligand environment, substrate electronics/sterics, additive role) without operational parameters.
   - Define primary metrics (product formation, selectivity) and secondary metrics (mass balance, functional-group tolerance).
   - *Gate 3*: Does the MVV directly test the core hypothesis? If no, redesign.

4. **Define controls and stop conditions**
   - **Negative controls**: omission of catalyst, ligand, or activation component; achiral variant; non-engaging substrate analogue.
   - **Positive controls**: known related transformation or analytical standard, if available.
   - **Mechanistic probes**: isotope effects, radical traps, intermediate reactivity tests, spectroscopic diagnostics, or computational transition-state comparisons.
   - **Stop conditions**: product forms without catalyst; selectivity is indistinguishable from background; mechanism is contradicted by probes; safety/reproducibility concerns arise.
   - *Gate 4*: Are controls sufficient to distinguish background from catalytic pathways? If no, add diagnostics.

5. **Execute conceptual validation (evidence generation)**
   - Run or propose the MVV and control matrix.
   - Record observed outcomes (conversion, yield, selectivity, identity) separately from interpretation.
   - Document failed substrates and anomalous results as boundary evidence.
   - *Gate 5*: Is product identity and stereochemical assignment secure? If no, pause for analytical validation.

6. **Convergent analysis by mechanistic axes**
   - **Feasibility**: Is the target product formed above background?
   - **Selectivity**: Is stereochemical outcome catalyst-dependent and reproducible?
   - **Mechanistic consistency**: Do kinetic, spectroscopic, and probe data converge on one hypothesis?
   - **Boundary mapping**: Cluster substrate results by electronics, sterics, heteroatoms, and topology; treat outliers as mechanistic signals.
   - **Evidence classification**: Label each conclusion as observed, inferred, or speculative.
   - *Gate 6*: Do results support the productive pathway over alternatives? If ambiguous, proceed to orthogonal diagnostics before optimization.

7. **Iteration decision**
   - **If feasibility fails**: Revisit activation mode, catalyst speciation, or precursor compatibility.
   - **If selectivity fails**: Revisit chiral environment, cooperative interactions, or background suppression.
   - **If mechanism is ambiguous**: Design a discriminating probe; do not force-fit data.
   - **If scope is narrow**: Define the structural boundary and avoid broad claims.
   - **If convergent success**: Advance to catalytic asymmetric operation and broader scope mapping.
   - *Gate 7*: After iteration, return to Gate 3 with revised hypotheses.

8. **Final claim assembly and uncertainty audit**
   - State what is demonstrated, what is inferred, and what remains speculative.
   - Define the outer boundary of the claim (substrate classes, catalyst families, conditions).
   - Confirm that no clinical, therapeutic, or scalability claims are attached to synthetic feasibility alone.
   - *Gate 8*: Are all claims proportionate to evidence and clearly bounded? If no, trim or qualify.

## Output Format

Return the following structured sections:

1. **Research question**: The unmet gap, target motif, and why it is non-trivial.
2. **Evidence map**: Table of claims with evidence strength, key assumptions, and main failure modes.
3. **Hypotheses**: Competing hypotheses with mechanistic rationale, discriminating observations, and falsification criteria.
4. **Validation plan**: MVV design, control matrix, conceptual variables, metrics, and stop conditions.
5. **Analysis plan**: How feasibility, selectivity, mechanism, and boundaries will be interpreted.
6. **Iteration plan**: Decision rules for continue, pivot, or stop under each failure mode.
7. **Validity and boundary check**: Confounders, reproducibility requirements, safety constraints, and evidence-labeling caveats.

## Validation Gates

Explicit checkpoints before advancing:

- **Gap validity**: The question must be distinct from known precedent and not solvable by simpler methods.
- **Hypothesis falsifiability**: Each hypothesis must have a defined observation that would weaken or reject it.
- **Control adequacy**: The plan must include negative, positive, and mechanistic controls sufficient to exclude background pathways.
- **Stereochemical assignment**: Identity and stereochemistry must be supported by orthogonal evidence before selectivity claims.
- **Mechanistic consistency**: Conclusions require converging lines (kinetic, spectroscopic, computational, product data); single-probe claims are insufficient.
- **Reproducibility**: Key comparisons must be repeatable; best-case-only reporting is disallowed.
- **Safety and ethics**: Hazardous chemistry remains a non-operational boundary pending expert review.

## Claim Boundaries

- **Demonstrated**: Directly observed in the proposed or source experiment with appropriate controls.
- **Literature-supported**: Consistent with related precedent but not directly shown here.
- **Inferred**: Logically follows from multiple observations; requires further validation.
- **Speculative**: Plausible but unconstrained by current evidence.
- **Excluded**: Do not claim broad generality from narrow substrate success, clinical utility from synthetic feasibility, or field consensus from a single study.

## Failure Modes

Common ways the workflow or underlying hypothesis can fail:

- **Background dominance**: Product forms without the proposed catalytic or chiral component.
- **Substrate bias**: Selectivity arises from intrinsic substrate preference rather than catalyst control.
- **Analytical artifact**: Apparent selectivity or identity is distorted by purification bias, decomposition, or misassignment.
- **Mechanistic ambiguity**: Probes are consistent with multiple pathways; no discriminating observation exists.
- **Narrow scope without rationale**: Only one substrate class succeeds and no structural principle explains the boundary.
- **Stereochemical erosion**: Product racemizes or epimerizes after formation, conflating formation selectivity with stability.
- **Cooperative artifact**: Apparent synergy is explained by solubility, aggregation, or measurement bias rather than mechanism.
- **Non-productive quenching** (photochemical/redox): Fast excited-state deactivation yields no product.

## Validity Checks

Before finalizing any plan or claim:

- **Confounders**: Are catalyst sequestration, additive artifacts, impurity effects, and analytical bias addressed?
- **Dynamic vs. static**: If dynamic kinetic resolution is proposed, is configurational lability demonstrated independently?
- **Formation vs. retention**: Is low stereochemical purity traced to poor formation or post-formation erosion?
- **Scope discipline**: Are substrate-scope claims limited to tested axes and separated from untested extrapolations?
- **Statistical rigor**: Are representative panels used rather than cherry-picked examples? Are failures recorded?
- **Computational proportionality**: Are transition-state models treated as supportive, not conclusive, without experimental convergence?
- **Evidence labeling**: Are paper-validated observations, literature precedent, and agent-generated hypotheses clearly distinguished?
- **Safety boundary**: Are operational hazards, waste, scale-up, and regulatory compliance treated as requiring qualified review?

## Provenance

Derived from cluster 5 / subcluster 5.0 (asymmetric-chiral-catalysis-method-mechanism-discovery-workflow), synthesized from the following source skills: `chiral-cascade-synthesis-research-design`, `asymmetric-catalysis-research-pattern`, `acyl-transfer-catalyst-design`, `asymmetric-ch-oxygenation-workflow-design`, `chiral-helicene-catalysis-research-design`, `asymmetric-photochemistry-triplet-discovery`, `sequential-dual-catalysis-research-design`, `p-stereogenic-dkr-research-design`. No paper-specific conclusions, conditions, or operational protocols are carried into the reusable workflow body.
