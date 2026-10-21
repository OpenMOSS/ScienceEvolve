---
name: sci-dft-catalytic-mechanism-discovery-validation-workfl-1c134003
description: A reusable end-to-end workflow for proposing, validating, and bounding mechanistic claims in catalytic method development through hypothesis-driven experimentation and iterative refinement.
scienceevolve-title: "Organometallic catalysis and DFT · catalytic mechanism discovery validation workflow 2"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

Guide an agent to transform an observational gap or reactivity anomaly in catalysis into a bounded, testable research program. The workflow covers hypothesis generation, minimal validation design, layered analysis, iterative redesign, and explicit claim limitation—without transferring specific substrates, reagents, or operational protocols from any single source study.

## When to use

Use this skill when:
- A user needs to design or evaluate a new catalytic transformation where mechanism, selectivity, or scope is unresolved.
- The task involves proposing research questions, competing hypotheses, control strategies, or analysis plans rather than executing known procedures.
- An observed activity, selectivity, or pathway shift across close analogues requires mechanistic explanation.
- The goal is to distinguish catalyst-dependent outcomes from background reactivity, competing pathways, or artifact.

Do not use this skill to provide executable wet-lab procedures, hazardous handling instructions, reaction conditions, scale-up guidance, or therapeutic or industrial claims.

## Inputs required

Before starting, obtain or infer:
- Target transformation class and the synthetic or mechanistic gap.
- Candidate catalyst or activation concepts, described mechanistically rather than as operational protocols.
- Candidate substrate and partner classes with structural axes to test (electronic, steric, coordinating).
- Expected product and plausible competing product classes.
- Available analytical readouts for identity, selectivity, conversion, and stereochemical integrity.
- Prior literature or preliminary observations that define the gap.
- Safety, regulatory, and facility constraints.
- User-defined success criteria, reproducibility standards, and stop conditions.

## Core Workflow

1. **Frame the Gap**  
   Define the target transformation and the specific observational gap: an unresolved selectivity, an unexpected reactivity shift across analogues, or an underdeveloped catalytic intersection. State the anomaly as a falsifiable comparison.  
   > **Gate 1 — Reproducibility:** If the trend is not reproducible or is explained by an uncontrolled variable (impurity, decomposition, analytical bias), stop and refine the observation.

2. **Generate Competing Hypotheses**  
   Propose at least two mechanistic branches or selectivity hypotheses. For each, specify the proposed controlling state or intermediate, predicted diagnostic observation, evidence strength (strong / moderate / weak / speculative), key assumption, and most likely failure mode. Rank by discriminability and information gain.  
   > **Gate 2 — Discriminability:** If no feasible experiment can distinguish the hypotheses, reformulate before proceeding.

3. **Design Minimal Validation**  
   Choose a representative model system and a control matrix (no-catalyst, no-activation, partner-free, positive/negative substrate, competition, and analytical controls). Define variable axes (catalyst concept, substrate electronics/sterics/coordination, environment class) and vary one mechanistic factor at a time. Pre-register metrics (product formation above background, selectivity ratio, mass balance, mechanistic consistency) and stop/revision criteria.  
   > **Gate 3 — Rigor:** If controls cannot separate the desired pathway from background or competing pathways, redesign.

4. **Collect and Classify Outcomes**  
   Record conversion, product identity, side-product distribution, and mass balance. Classify each outcome as target product, competing-pathway product, decomposition, or unassigned. Document negative and ambiguous results.  
   > **Gate 4 — Safety/Ethics:** If the design violates institutional, regulatory, or waste constraints, stop and redesign.

5. **Analyze with Mechanistic Consistency**  
   - **Control audit:** Confirm catalyst and activation necessity.  
   - **Trend analysis:** Group outcomes by structural features to isolate electronic, steric, and coordination effects.  
   - **Pathway comparison:** Evaluate whether the product distribution supports, weakens, or contradicts each hypothesis.  
   - **Uncertainty labeling:** Tag conclusions as directly observed, trend-supported, analogy-based, or speculative.  
   > **Gate 5 — Convergence:** If multiple mechanisms remain equally plausible, require orthogonal evidence (competition, labeling, kinetic, or computational comparison) before advancing.

6. **Iterate or Stop**  
   - **Supported:** Refine the model and proceed to a boundary test (challenging substrate, alternative catalyst, or mechanistic probe).  
   - **Contradicted:** Revise or discard the hypothesis; test alternative pathways or resting-state/off-cycle models.  
   - **Ambiguous:** Add an orthogonal evidence stream rather than increasing parameter complexity.  
   - **Failed:** Treat the result as a boundary condition; update the competition map.  
   > **Gate 6 — Advancement:** Expand scope or claim utility only after the core hypothesis survives controls and at least one boundary test.

7. **Bound the Claims**  
   State the validated catalyst concept, substrate class, and analytical limits. Separate observed outcomes from inferred mechanisms and speculative extensions. Explicitly note which substrate classes, functional groups, and structural regimes remain untested.  
   > **Gate 7 — Claim Readiness:** Do not present a single-system result as consensus for the broader field.

## Output Format

When using this skill, return:

1. **Research question** — Concise statement of the target transformation, gap, and proposed concept.
2. **Evidence map** — Separation of prior-supported reasoning, analogy-based inference, and speculation.
3. **Ranked hypotheses** — For each: claim, evidence strength, key assumption, predicted observation, failure mode, and discriminating test.
4. **Minimal validation plan** — Model system rationale, control matrix, variable axes, metrics, and stop conditions.
5. **Analysis plan** — Control interpretation, trend clustering, mechanistic consistency rules, and uncertainty labeling scheme.
6. **Iteration roadmap** — Decision rules for support, contradiction, ambiguity, and failure; next boundary test if supported.
7. **Bounded claim statement** — Explicit limits on generality, validated substrate scope, and unresolved uncertainties.
8. **Validity and safety review** — Confounders, reproducibility requirements, and non-operational safety constraints.

## Validation Gates

- **Gate 1 — Reproducibility:** The observational anomaly must be specific and not attributable to uncontrolled variables.
- **Gate 2 — Discriminability:** Competing hypotheses must be distinguishable by a feasible experimental comparison.
- **Gate 3 — Rigor:** The control matrix must separate the desired mechanism from background, substrate bias, and artifact.
- **Gate 4 — Safety/Ethics:** The proposed design must satisfy institutional, regulatory, and waste-management constraints.
- **Gate 5 — Convergence:** A single mechanistic interpretation must be strongly favored before scope expansion.
- **Gate 6 — Advancement:** Generality or utility claims require that the core hypothesis survives controls and at least one boundary test.
- **Gate 7 — Claim Readiness:** Claims must be bounded to the tested catalyst, substrate, and analytical space.

## Claim Boundaries

- **Observed claims** are limited to directly measured outcomes in the tested system.
- **Inferred claims** are supported by converging controls and trends but explicitly labeled as indirect.
- **Speculative claims** are clearly marked and must not be presented as validated.
- Do not extrapolate from a single substrate or catalyst to an entire reaction class or field consensus.
- Distinguish catalyst-dependent outcomes from background, additive-only, or substrate-bias effects.
- State steric, electronic, coordinating, and functional-group limits explicitly.

## Failure Modes

- **Background dominance:** Product forms without the catalyst or activation concept, indicating a non-catalytic pathway.
- **Decomposition dominance:** Low mass balance or complex mixtures suggest incompatible activation or unstable intermediates.
- **Analytical ambiguity:** Inability to distinguish regioisomers, stereoisomers, or side products halts mechanistic interpretation.
- **Hidden substrate dependence:** Success relies on an uncontrolled structural feature rather than the proposed mechanistic lever.
- **Catalyst deactivation or aggregation:** Loss of activity or dependence on ill-defined speciation undermines reproducibility.
- **Overgeneralization:** Claiming broad scope from a narrow, matched substrate set without boundary tests.
- **Safety or regulatory barrier:** Inability to meet waste, exposure, or compliance constraints for the proposed chemistry.

## Validity Checks

- **Catalytic validity:** Controls demonstrate necessity of the catalyst and activation concept.
- **Selectivity validity:** Competing sites or pathways are tested in the same reaction context, not inferred from separate reactions.
- **Analytical validity:** Product identity and ratios are confirmed by orthogonal characterization logic.
- **Reproducibility validity:** Key observations are repeated or supported by matched tests sufficient to distinguish trend from noise.
- **Mechanistic validity:** Alternative mechanisms are considered and excluded where possible; resting-state and off-pathway alternatives are evaluated.
- **Confounding validity:** Impurities, moisture sensitivity, product instability, isolation bias, and analytical overlap are assessed.
- **Boundary validity:** Steric, electronic, coordinating, and functional-group limits are explicitly stated.
- **Evidence validity:** Source-paper-supported observations are separated from new inferences and speculative extensions.

## Provenance

- Synthesized from cluster 2, subcluster 2.0 (observable-driven mechanism discovery and validation).
- Source skills: test1592, test0932, test1896, test1669, test1544, test1369, test1371, test1720.
- Workflow archetype: observable-driven mechanism discovery and validation.
