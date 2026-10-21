---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-4ec87dd7
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and stereoselective synthesis without operational protocols.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 4"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent translate a stereoselective synthesis challenge into a structured, non-operational research program. The workflow guides gap identification, mechanistic hypothesis generation, minimal validation design, evidence-based analysis, mechanism discrimination, scope boundary mapping, and disciplined iteration—while keeping all outputs at the research-design level.

## When to use

Use when the user asks to:
- Propose new research questions in asymmetric catalysis, organocatalysis, phase-transfer catalysis, or stereoconvergent/divergent synthesis.
- Design validation logic and control strategies for enantio-, diastereo-, site-, or chemoselective transformations.
- Interpret results from method-development campaigns and decide whether to accept, revise, reject, or defer a hypothesis.
- Map scope boundaries, downstream platform utility, or mechanistic limits of a catalytic system.

Do not use for executable laboratory protocols, hazardous operating parameters, clinical recommendations, or as a substitute for expert safety review.

## Inputs required

- Target transformation class and desired stereochemical outcome(s).
- Candidate substrate and reagent/partner classes with known limitations.
- Proposed catalytic or recognition platform and stereocontrol logic.
- Known literature precedents, failed analogies, and unresolved bottlenecks.
- Available analytical readouts for conversion, identity, and stereochemical purity.
- Safety, regulatory, and compliance constraints relevant to the chemistry.

## Core Workflow

An ordered, end-to-end route from question framing to claim bounding. At each stage, pass the decision gate before proceeding.

1. **Gap Definition & Bottleneck Framing**
   - Convert the synthetic target into a concrete selectivity or scope limitation.
   - Identify whether the bottleneck is stereochemical control, intermediate stability, competing pathways, precursor access, or downstream utility.
   - **Decision Gate (G1):** Is the gap falsifiable and grounded in a stated limitation rather than novelty alone? If not, reformulate.

2. **Mechanistic Hypothesis Portfolio Generation**
   - Generate 3–5 ranked hypotheses that explain how stereochemistry could be set (e.g., catalyst-controlled intermediate, substrate-directed recognition, dynamic kinetic resolution, additive-switched activation).
   - For each hypothesis, label: evidence strength (strong/moderate/weak/speculative), key assumptions, predicted diagnostic observation, likely failure modes, and extrapolation boundary.
   - **Decision Gate (G2):** Does each hypothesis include a clear negative control that would falsify it? If not, redesign.

3. **Minimal Viable Validation Design**
   - Select a representative model substrate/partner pair that isolates the core selectivity challenge.
   - Define conceptual variables (catalyst class, substrate electronics/sterics, recognition elements, sequence order) to vary one axis at a time.
   - Specify strong controls: no-catalyst/achiral, no-directing-group, component-removal, positive benchmark, and boundary substrate.
   - Define evaluation metrics: product identity confidence, conversion, selectivity ratios (enantio-, diastereo-, site-, chemo-), side-product profile, and reproducibility.
   - State stop conditions before execution.
   - **Decision Gate (G3):** Can the plan distinguish the proposed mechanism from background, additive-only, or substrate-bias pathways? If not, add controls.

4. **Evidence Collection & Primary Analysis**
   - Confirm product identity and stereochemical assignment with orthogonal evidence before interpreting efficiency.
   - Quantify all selectivity dimensions together; do not interpret yield in isolation from stereochemical outcomes.
   - Record negative results, ambiguous assignments, and failed substrates alongside successes.
   - **Decision Gate (G4):** Are observations separated from mechanistic inferences? If conflated, re-analyze.

5. **Mechanism Discrimination**
   - Compare control outcomes: if selectivity disappears without the chiral/recognition element, strengthen the catalyst-control model; if it persists, seek alternative explanations.
   - Map structure–reactivity trends by grouping substrates according to electronic, steric, conformational, and functional features.
   - Use mechanistic probes (kinetic, spectroscopic, computational, isotopic, crossover) only when they can distinguish competing pathways.
   - **Decision Gate (G5):** Is there a single best-supported mechanism, or are alternatives still viable? If alternatives remain, design a discriminating test.

6. **Scope Boundary Mapping**
   - Expand to representative substrate/reagent classes only after the core mechanism is credible.
   - Treat outliers and failures as boundary-defining evidence, not optimization noise.
   - Classify successful cases by shared structural features and state the generality boundary explicitly.
   - **Decision Gate (G6):** Are claims limited to the tested chemical space? If broad generality is claimed without evidence, bound the claim.

7. **Platform & Downstream Utility Validation (if applicable)**
   - For platform designs, validate the common intermediate before claiming divergence value.
   - Test at least two conceptually different downstream transformations.
   - Assess whether stereochemical integrity is preserved or intentionally edited.
   - **Decision Gate (G7):** Does the intermediate support multiple products without erasing the strategic advantage? If not, narrow the platform claim.

8. **Iteration, Pivot, or Termination**
   - **Iterate** if results support the hypothesis but efficiency or scope needs refinement; change one design lever at a time.
   - **Pivot** if controls contradict the leading hypothesis or if a different bottleneck is revealed.
   - **Stop** if:
     - Product identity is unconfirmed.
     - Selectivity is not reproducible under locked conceptual variables.
     - The negative/achiral control matches the catalytic outcome.
     - Results depend on an unexplained additive artifact.
     - Safety or compliance boundaries are breached.
   - **Decision Gate (G8):** Does the updated evidence strength justify continued investment, or should the hypothesis be rejected/deferred?

## Output Format

When using this skill, return:

1. `Research question` — concise, falsifiable question.
2. `Gap and rationale` — concrete limitation and why it matters.
3. `Hypothesis portfolio` — ranked hypotheses with evidence strength, assumptions, diagnostics, failure modes, and boundaries.
4. `Minimal validation plan` — model system, conceptual variables, strong/negative controls, metrics, and stop conditions.
5. `Analysis plan` — identity confirmation, selectivity accounting, control interpretation, and mechanism discrimination.
6. `Scope boundary statement` — tested substrate/reagent classes and explicit generality limits.
7. `Iteration rules` — conditions for refine, pivot, or stop.
8. `Validity and safety review` — confounders, reproducibility checks, claim boundaries, and non-operational safety constraints.

## Validation Gates

- **Gap validity:** The question addresses a real selectivity, scope, or mechanism limitation, not just novelty.
- **Control validity:** The plan includes no-catalyst/achiral, component-removal, positive benchmark, and boundary controls sufficient to falsify the leading hypothesis.
- **Analytical validity:** Product identity and stereochemical assignment are supported by orthogonal evidence.
- **Mechanistic validity:** Proposed pathways are consistent with observed control outcomes and structure–reactivity trends.
- **Reproducibility validity:** Key observations are repeatable under locked conceptual variables; single-run exceptions are flagged.
- **Boundary validity:** Claims are explicitly limited to tested substrate classes, catalyst platforms, and reaction conditions.

## Claim Boundaries

- Distinguish **paper-supported**, **literature-supported**, **analogy-supported**, and **speculative** claims.
- Do not extrapolate a single successful substrate to broad scope.
- Do not present one paper's system as field-wide consensus.
- Limit stereochemical claims to the analytical methods and reference standards used.
- Separate catalytic stereocontrol from substrate-inherent bias or background reaction.
- Define platform utility only after validating the common intermediate and representative downstream transformations.

## Failure Modes

- **Background dominance:** The reaction proceeds without the proposed chiral/recognition element, making mechanism attribution impossible.
- **Analytical artifact:** Apparent selectivity arises from misassigned stereochemistry, impurity overlap, or calibration error.
- **Additive artifact:** High selectivity depends on an unexplained co-reagent rather than a general catalytic principle.
- **Narrow-scope trap:** The method works only for a single substrate feature that contradicts the stated research goal.
- **Intermediate instability:** The proposed stereochemically enriched intermediate decomposes or racemizes before product formation.
- **Irreproducibility:** Results vary across batches or trials due to uncontrolled variables.
- **Overgeneralization:** Success on a model system is treated as proof of generality without boundary testing.

## Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Could impurities, product instability, solubility, or handling explain the outcome?
- **Selectivity accounting:** Are all relevant selectivity dimensions (enantio-, diastereo-, site-, chemo-) reported together?
- **Control sufficiency:** Does every major claim have a corresponding falsifying control?
- **Evidence labeling:** Are source-paper observations, literature precedents, and new inferences clearly separated?
- **Mechanistic caution:** Are transition-state drawings and postulated intermediates treated as models unless supported by kinetic, spectroscopic, or isolation evidence?
- **Safety and ethics:** Does the plan remain non-operational and defer execution to qualified personnel under approved institutional procedures?

## Provenance

- Derived from cluster 16 / subcluster 16.1 ("observable-driven mechanism discovery and validation").
- Synthesized from representative source skills:
  - `ch-activation-research-design` (10.1002/ange.202008952)
  - `asymmetric-catalysis-method-discovery` (10.1002/anie.202112860)
  - `phosphorus-platform-catalysis-exploration` (10.1038/s41557-025-02025-1)
  - `amide-allylic-alcohol-reaction-design` (10.1039/c4cc08797f)
  - `dynamic-kinetic-atroposelective-catalysis-research` (10.1021/acscatal.5c03243)
  - `p-stereogenic-organocatalytic-research-design` (10.1002/ejoc.201600100)
  - `asymmetric-ptc-research-design` (10.3389/fchem.2023.1205661)
  - `asymmetric-catalysis-stereodivergent-platform-design` (10.1021/jacs.5c07358)
