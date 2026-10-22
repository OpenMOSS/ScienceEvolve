---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-723d1b0a
description: A reusable end-to-end workflow for generating mechanism-grounded hypotheses, designing staged non-operational validation studies, and iterating toward bounded claims in asymmetric catalysis and chiral methodology research.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 5"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide an agent in transforming a stereochemical or reactivity bottleneck into a structured research program. This workflow provides a domain-agnostic pattern for hypothesis generation, staged experimental design, mechanism discrimination, and iterative redesign in asymmetric catalysis and chiral methodology, without reproducing any single paper's conditions or conclusions.

# When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, stereodivergent synthesis, or chiral methodology.
- Design non-operational validation plans for catalyst-controlled selectivity, substrate scope, or mechanistic hypotheses.
- Translate a published methodological advance into a reusable hypothesis-generation and decision framework.
- Evaluate whether a proposed catalyst, ligand, or substrate strategy is mechanistically justified and experimentally testable.

Do not use this skill for executable laboratory protocols, hazardous procedural details, clinical recommendations, or field-wide consensus statements.

# Inputs required

Collect or infer before starting:

- Target transformation class and desired stereochemical outcome.
- Identified bottleneck (e.g., selectivity, scope, robustness, step economy).
- Candidate catalyst/ligand families and their proposed mechanistic roles.
- Candidate substrate classes and structural features expected to influence selectivity.
- Available analytical readouts for conversion, yield, identity, and stereochemical assignment.
- Relevant baseline literature or benchmark systems for comparison.
- Facility-level safety, regulatory, waste, and equipment constraints.

If inputs are missing, state assumptions explicitly and label resulting evidence strength as low or moderate.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## Stage 1: Frame the Gap and Bottleneck

- Map which chiral architectures or selectivity challenges are underdeveloped relative to existing methods.
- Define the bottleneck as a discrimination problem: why are the desired and competing pathways difficult to differentiate?
- Identify adjacent precedents that provide mechanistic clues, not recipes.
- **Decision Gate 1:** If the gap cannot be framed as a testable mechanistic design problem, stop and reformulate the research question.

## Stage 2: Generate Competing Mechanism-Grounded Hypotheses

- Produce at least three candidate hypotheses that explain how the proposed system could overcome the bottleneck.
- For each hypothesis, specify:
  - Claim and predicted observable.
  - Evidence strength (high / moderate / low / exploratory).
  - Key assumptions that must hold.
  - Likely failure modes.
  - Boundary conditions where the hypothesis should not generalize.
  - A discriminating test that separates it from alternatives.
- Label evidence as paper-verified, field-informed, or agent inference.
- **Decision Gate 2:** If hypotheses cannot be falsified by available or feasible experiments, redesign them before proceeding.

## Stage 3: Design Minimal Viable Validation

- Select a representative model system that exposes the central stereochemical or reactivity challenge.
- Define a non-operational experimental schema including:
  - Conceptual variables (catalyst/ligand class, substrate class, environment category).
  - Control set: baseline, negative (no catalyst, achiral analogue, component omission), positive (known benchmark), and orthogonality controls.
  - Paired evaluation metrics: both activity and selectivity must be assessed together.
  - Success criteria and stop conditions defined before testing.
- **Decision Gate 3:** If the plan includes operational recipes, hazardous parameters, or violates facility constraints, halt and revise to a non-operational design.

## Stage 4: Baseline Comparison and Reproducibility Check

- Compare the proposed system against the most relevant baseline, not against an arbitrary or weak control.
- Quantify background formation under catalyst-omission and achiral conditions.
- Require consistent qualitative outcomes across independent preparations before claiming improvement.
- **Stop Condition:** If product formation is indistinguishable from background, or if stereochemical assignment is ambiguous, stop and redesign.

## Stage 5: Mechanism Discrimination and Intermediate Probing

- Add controls that distinguish the proposed mechanism from direct addition, over-reduction, background pathways, or alternative catalytic cycles.
- Test necessity: determine whether each proposed component (catalyst, ligand, additive, substrate feature) is required for the observed outcome.
- Use converging evidence only: combine control comparisons, structural trends, and intermediate-trapping concepts.
- **Decision Gate 4:** If controls contradict the proposed mechanism or if a simpler explanation remains unexcluded, add discriminating tests before scope expansion.

## Stage 6: Scope and Boundary Mapping

- Expand to a substrate or catalyst panel that tests specific mechanistic predictions, not random diversity.
- Include cases expected to fail in order to define boundaries.
- Group results by electronic, steric, conformational, or functional-group features rather than listing examples.
- **Stop Condition:** If improvement appears only in an uninformative or overly narrow case, narrow the claim and do not generalize.

## Stage 7: Iterative Redesign or Pivot

- Classify the outcome: hit, partial hit, ambiguous, failure, or boundary-defining.
- Update the hypothesis table with revised evidence strength, assumptions, and failure modes.
- Choose the next axis based on the dominant unresolved bottleneck:
  - Low selectivity → redesign chiral environment or suppress background.
  - Low activity → examine catalyst stability or activation mode.
  - Inconsistent stereodivergence → test catalyst independence and off-cycle reactions.
  - Narrow scope → map which substrate feature predicts success.
- Loop back to Stage 2 or Stage 3 with a revised model.
- **Stop Condition:** If the mechanistic model is contradicted by reproducible evidence, or if safety/regulatory constraints are unresolved, abandon the current axis and pivot.

## Stage 8: Final Claim Calibration and Documentation

- State the final claim as a bounded mechanism-supported observation, not a universal method.
- Document:
  - Verified substrate/catalyst boundaries.
  - Untested classes and extrapolation risks.
  - Confounders that remain uncontrolled.
  - Reproducibility status.
  - Separation of paper-verified facts, field-informed analogies, and agent-generated inferences.

# Output Format

When using this skill, produce:

1. **Research Question** — One concise question, the synthetic gap, and why it matters.
2. **Hypothesis Table** — Competing hypotheses with evidence strength, key assumptions, predicted observables, failure modes, boundary conditions, and discriminating tests.
3. **Non-Operational Validation Plan** — Model system rationale, conceptual variables, control set, paired metrics, success criteria, and stop conditions.
4. **Analysis Plan** — Structure for outcome classification, baseline comparison, trend mapping, mechanism discrimination, and evidence-strength assignment.
5. **Iteration Plan** — Rules for updating hypotheses after each result pattern, next diagnostic experiment, and criteria for scope expansion versus pivot.
6. **Validity and Boundary Statement** — Confounders, reproducibility risks, untested classes, safety limits, and explicit separation of paper-verified evidence from agent inference.

# Validation Gates

Before advancing past each decision gate, confirm:

- **Gate 1 (Gap framing):** The bottleneck is expressed as a mechanistic discrimination problem, not merely a terminology gap.
- **Gate 2 (Hypothesis quality):** Hypotheses are falsifiable, labeled by evidence strength, and include explicit failure modes.
- **Gate 3 (Plan safety and scope):** The experimental design is non-operational, facility-appropriate, and free of executable hazardous parameters.
- **Gate 4 (Mechanistic rigor):** Controls rule out background, over-reduction, direct addition, and simpler alternative explanations.
- **Gate 5 (Claim proportionality):** Scope claims are supported by representative data and explicit negative results, not isolated examples.

# Claim Boundaries

- Do not treat a single successful catalyst system or substrate class as proof of universal scope.
- Do not generalize from one paper, one ligand family, or one reaction type to all of asymmetric catalysis.
- Do not present field-informed analogies or agent inferences as paper-verified facts.
- Do not claim synthetic utility, biological relevance, or industrial readiness without independent downstream validation.
- Keep all claims within the tested or explicitly hypothesized chemical space.

# Failure Modes

Common patterns that should trigger redesign or stop:

- **Background dominance:** Product profile is reproduced without the proposed chiral or catalytic component.
- **Activity–selectivity tradeoff:** Improvement in one metric destroys the other without mechanistic justification.
- **Ambiguous stereochemistry:** Product identity or enantiomeric/diastereomeric assignment is uncertain.
- **Irreproducible enhancement:** Results vary across independent preparations or analytical methods.
- **Narrow scope collapse:** The system works only for a single unrepresentative case.
- **Control contradiction:** Omission, achiral, or blocked-functional-group controls contradict the proposed sequence.
- **Catalyst incompatibility:** Multiple catalyst permutations produce inconsistent or non-interpretable stereodivergence.
- **Safety block:** Hazardous intermediates, incompatible reagents, or unresolved regulatory constraints prevent responsible testing.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Could impurities, decomposition, isomer overlap, analytical artifacts, or work-up effects explain the result?
- **Baseline validity:** Is the comparison against the most relevant known method or control?
- **Control adequacy:** Do negative, positive, component, and orthogonality controls test the actual claim?
- **Reproducibility:** Are key observations repeated with consistent independent readouts and documented exclusion criteria?
- **Statistical validity:** Are scope and selectivity claims supported by representative data rather than isolated examples?
- **Mechanistic validity:** Do controls, structural outcomes, and intermediate evidence converge on the same interpretation?
- **Analytical validity:** Are product identity and stereochemical assignment confirmed by validated methods?
- **External validity:** Is the source treated as methodological inspiration rather than field-wide consensus?
- **Safety validity:** Are proposed plans non-operational and compliant with institutional chemical safety and waste requirements?

# Provenance

- Cluster: 4 / Subcluster: 4.0
- Workflow archetype: observable-driven mechanism discovery and validation
- Synthesized from source skills: 10.1038_s41467-019-13529-z, 10.3390_molecules17021617, 10.1021_acs.accounts.9b00209, 10.1002_anie.201500907, 10.1021_ol990858x, 10.1021_acs.joc.4c00522, 10.1002_anie.202217954, 10.1021_jacs.6c02392
