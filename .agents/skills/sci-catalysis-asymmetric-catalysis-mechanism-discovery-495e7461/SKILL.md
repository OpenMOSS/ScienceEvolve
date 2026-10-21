---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-495e7461
description: A reusable end-to-end workflow for hypothesis-driven mechanism discovery and validation in asymmetric catalysis, covering gap definition, controlled study design, evidence analysis, claim bounding, and iteration.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 12"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent generate and evaluate research plans for asymmetric catalysis and stereoselective synthesis through an observable-driven mechanism discovery and validation workflow. The skill guides the user from synthetic gap definition and mechanistic hypothesis generation to controlled validation design, evidence analysis, claim bounding, and iteration—without providing operational recipes or treating single-paper results as universal truth.

## When to use

Use this skill when the user asks to propose new research questions, hypotheses, or experiment plans in asymmetric catalysis, stereodivergent synthesis, stereoselective bond formation, kinetic resolution, or target-oriented catalytic route design. It is especially appropriate when the target problem involves:

- a valuable structural motif that currently requires inefficient or multistep synthesis;
- a known reaction manifold with incomplete enantioselectivity, diastereoselectivity, regioselectivity, or stereodivergence;
- a chiral catalyst or ligand architecture that could bias an intermediate geometry;
- a substrate feature that may act as a programmable stereochemical input;
- a reactive intermediate that could support downstream derivatization.

Do not use this skill as a general chemistry assistant, literature consensus generator, protocol generator, or for clinical or biological efficacy claims.

## Inputs required

Before drafting a research plan, ask for or infer:

- Target product family, motif, or transformation and its synthetic utility.
- Existing routes to the motif and their bottlenecks, such as step count, chiral starting material dependence, limited divergence, or weak selectivity.
- Candidate bond-forming manifolds that create the same skeleton or a related intermediate.
- Candidate catalyst families, ligand architectures, or stereochemical control elements.
- Candidate stereochemical programming inputs, such as substrate geometry, catalyst stereoisomer, ligand scaffold, or reaction pathway.
- Available analytical methods for product identity, regioisomer ratio, diastereomer ratio, geometric ratio, and enantiomeric excess.
- Known safety, regulatory, environmental, and waste constraints for the chemical classes involved.
- Whether the requested output is a hypothesis set, an experimental design, a validation plan, or an iteration strategy.

## Core Workflow

1. **Frame the gap and control problem**
   - Define the target motif or transformation family by synthetic utility.
   - Identify the missing control element: enantioselectivity, diastereodivergence, regioselectivity, chemoselectivity, or platform utility.
   - Map existing approaches and state why they are insufficient.
   - *Decision gate:* Stop if the gap cannot be expressed as a testable control problem or if safety/compliance boundaries preclude the chemistry class.

2. **Generate ranked mechanistic hypotheses**
   - Produce at least three falsifiable hypotheses (e.g., missing-manifold, ligand-pocket, geometry-programmed stereodivergence, intermediate-platform, boundary).
   - For each: state the causal claim, rationale, evidence strength (strong / moderate / weak / speculative), key assumptions, minimal validation test, and likely failure modes.
   - Distinguish paper-supported patterns, agent inferences, and unverified extrapolations.
   - *Decision gate:* Stop if no hypothesis can be falsified by a feasible control, or if all hypotheses share the same untested assumption.

3. **Design minimal validation study**
   - Select independent variables (catalyst/ligand architecture, substrate geometry, recognition features, activation mode).
   - Select dependent variables (conversion, regio/diastereo/enantioselectivity, structural assignment confidence).
   - Specify controls: background/blank, achiral or mismatched catalyst, substrate lacking the proposed key feature, pathway diagnostic, and analytical positive control.
   - Predefine metrics and stop conditions before evidence collection.
   - *Decision gate:* Stop if the plan lacks a no-catalyst baseline, a chiral-catalyst comparison, or an orthogonal method for stereochemical assignment.

4. **Collect conceptual evidence**
   - Execute the conceptual comparison: directed vs. non-directed, chiral vs. achiral, mechanistic probes.
   - Record conversion, yield, stereochemical outcomes, control comparisons, and negative results.
   - *Decision gate:* Stop if product formation is indistinguishable from background, stereochemical measurements are ambiguous, or results are irreproducible.

5. **Analyze outcomes and discriminate mechanisms**
   - Separate claims about conversion, yield, regio/diastereo/enantioselectivity, and downstream utility.
   - Compare each result to its matched control; group substrate-scope results by structural class.
   - Map trends to the predicted stereodetermining step; use probe results to exclude alternative pathways.
   - Update evidence strength: upgrade only when identity, selectivity, controls, and mechanism align; downgrade when a single substrate or analytical method drives the conclusion.
   - *Decision gate:* If controls contradict the proposed activation/recognition model, proceed to Redesign (Step 7). If consistent, proceed to Claim bounding (Step 6).

6. **Bound claims and map scope**
   - Label conclusions as observed, inferred, or speculative.
   - Define substrate-scope boundaries using failed analogues and untested classes.
   - State whether mechanistic claims are provisional or supported by converging evidence.
   - *Decision gate:* Stop if scope claims exceed tested structural classes, or if mechanistic claims lack converging evidence.

7. **Iterate or redesign**
   - Use the decision tree:
     - Low conversion, high selectivity → revisit activation or catalyst-substrate compatibility.
     - High conversion, low selectivity → revisit chiral environment or background suppression.
     - Model success fails in route-relevant system → treat sequence compatibility as the new variable.
     - Mechanistic ambiguity persists → prioritize discriminating controls over scope expansion.
     - Repeated contradiction → abandon the hypothesis and reframe the gap.
   - Return to Step 2 with revised assumptions.
   - *Terminal stop:* End when the hypothesis is supported by converging evidence, falsified, or safety/compliance constraints block further pursuit.

## Output Format

When using this skill, respond with:

1. **Research question and gap statement**
   - Target motif or product family.
   - Why current access is inefficient.
   - What selectivity or divergence is missing.

2. **Ranked hypotheses**
   - At least three hypotheses.
   - For each: causal claim, rationale, evidence strength, key assumptions, likely failure modes, and minimal validation.

3. **Minimal validation plan**
   - Variables.
   - Controls.
   - Evaluation metrics.
   - Stop conditions.

4. **Mechanistic rationale**
   - Qualitative model linking activation mode and substrate organization to stereochemical outcome.

5. **Analysis plan**
   - Comparisons to make.
   - Interpretation rules.
   - Recommended visualizations.

6. **Iteration decision tree**
   - Conditions for strengthening, narrowing, simplifying, abandoning, or redesigning.

7. **Validity and safety notes**
   - Confounders, reproducibility checks, extrapolation limits, and non-operational safety constraints.

## Validation Gates

Before presenting a research plan, confirm:

- **Confounding:** The design changes only one major variable at a time in diagnostic comparisons.
- **Baseline:** Nonselective, achiral, and pathway controls are included.
- **Metrics predefined:** Success, ambiguity, and stop criteria are set before evidence collection.
- **Structural assignment:** Orthogonal evidence is planned for stereochemical or regiochemical claims.
- **Scope discipline:** Tested substrate classes are separated from extrapolated claims.
- **Mechanism discipline:** Catalytic-cycle claims are marked provisional until multiple observations converge.
- **Transferability:** Paper-derived patterns are distinguished from new-system inferences.
- **Safety bounded:** Outputs remain at the research-design level; institutional review is required for execution.

## Claim Boundaries

- Label every conclusion as observed, inferred, or speculative.
- Separate paper-supported patterns from agent-generated hypotheses.
- Do not treat single-paper, single-substrate, or narrow-scope success as field-wide consensus.
- Limit substrate-scope claims to tested structural classes; mark all extrapolations explicitly.
- Do not infer clinical, biological, or therapeutic utility from synthetic accessibility or stereochemical success alone.
- Do not reuse exact numerical results, operational conditions, or material choices from source papers as design targets for new systems.

## Failure Modes

- No desired product forms beyond background.
- Selectivity is insensitive to catalyst chirality or programmed stereochemical input.
- Product identity or stereochemical configuration remains ambiguous after orthogonal checks.
- Key controls contradict the proposed activation or recognition model.
- Recognition or directing feature causes catalyst inhibition or substrate decomposition.
- Results are irreproducible or driven by uncontrolled impurities.
- Model-substrate success fails to transfer to route-relevant intermediates or full sequences.
- Safety, environmental, or compliance constraints prevent responsible execution.

## Validity Checks

Before updating confidence or presenting conclusions, verify:

- **Analytical confidence:** Product identity and stereochemistry are supported by independent evidence.
- **Reproducibility:** Lead results are repeated or include variability estimates.
- **Mechanistic consistency:** Observed trends align with the proposed model, or the mechanism is explicitly marked speculative.
- **Background separation:** Product formation is shown to depend on the chiral catalyst or proposed recognition feature.
- **Stereochemical integrity:** Work-up, purification, or analysis do not alter stereochemical ratios.
- **Confounding:** Catalyst, substrate, medium, and temperature effects are separated in the design.
- **Evidence labeling:** Paper-supported observations are distinguished from new-system inferences.
- **Boundary clarity:** Failed analogues and untested classes are explicitly reported.

## Provenance

- Derived from cluster 16.2 (observable-driven mechanism discovery and validation).
- Synthesized from representative source skills: 10.1021_jacs.3c07697, 10.1021_acs.joc.4c00623, 10.1021_ja0305407, 10.1002_chem.201303307, 10.1002_anie.202111137, 10.1002_adsc.70236, 10.1002_ejoc.202401000, 10.1021_ja205891m.
