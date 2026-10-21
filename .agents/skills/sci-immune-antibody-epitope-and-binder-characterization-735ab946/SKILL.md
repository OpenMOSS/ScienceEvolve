---
name: sci-immune-antibody-epitope-and-binder-characterization-735ab946
description: A reusable end-to-end workflow for generating research questions, hypotheses, and validation plans around antibody-antigen recognition, epitope mapping, and binder specificity characterization.
scienceevolve-title: "Antibody and immune recognition · antibody epitope and binder characterization workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents to transform antibody, epitope, or binder recognition problems into reusable research workflows. The goal is to map recognition regions, validate specificity, and connect binding to function through controlled, iterative hypothesis testing—without reproducing source-specific systems or conclusions.

## When to use

Use this skill when the task involves:

- Mapping antibody or binder recognition regions on a protein, peptide, or macromolecular target.
- Designing validation plans for candidate binders, antibody fragments, engineered variants, or modular affinity reagents.
- Connecting sequence or structure perturbations to binding specificity and functional relevance.
- Comparing reconstructed, recovered, or engineered binders against source-derived activity.
- Generating new research questions in epitope characterization, affinity reagent development, or antigen recognition.

Do not use this skill for clinical recommendations, diagnostic interpretations, therapeutic dosing, executable wet-lab protocols, or claims that one study represents field-wide consensus.

## Inputs required

Before generating a plan, ask for or locate:

- **Target and target form:** intended antigen, domain, hapten, or macromolecular target, plus relevant alternative forms and known off-targets.
- **Candidate binder information:** modular architecture, pairing confidence, available variants, and uncertainty.
- **Recognition gap:** whether the main uncertainty is epitope location, binder specificity, conformational dependence, target accessibility, or functional relevance.
- **Assay readouts:** binding, competition, functional modulation, structural, or orthogonal confirmation approaches.
- **Constraints:** biosafety, ethics, sample availability, reproducibility standards, and institutional oversight requirements.
- **Evidence boundary:** which claims are directly supported by source evidence versus inferred by the agent for a new question.

If any required input is missing, state the assumption and mark the resulting hypothesis as lower evidence strength.

## Core Workflow

1. **Frame the recognition gap and scope**
   - Define whether the uncertainty is epitope location, binder specificity, conformational dependence, accessibility, or functional relevance.
   - *Decision gate:* If the gap is undefined or too broad, stop and refine the question before proceeding.

2. **Generate competing, falsifiable hypotheses**
   - Formulate hypotheses about recognition modules, epitope classes, specificity determinants, or structural perturbation effects.
   - Label evidence strength (high / moderate / low / speculative), key assumptions, predicted outcomes, and failure modes.
   - *Decision gate:* If no hypothesis can be falsified with the available readouts, redesign the assay portfolio.

3. **Design a conceptual validation ladder**
   - Define minimal viable validation: the smallest set of target forms and binder variants that can distinguish linear, conformational, and nonspecific recognition.
   - Specify controls: positive, negative, baseline, specificity, orthogonal, and mechanism-disabled.
   - Predefine independent variables, dependent variables, and stop conditions.
   - *Decision gate:* If controls are inadequate or safety/ethics constraints are unmet, halt.

4. **Compare candidates across contexts (if applicable)**
   - Evaluate whether recovered, engineered, or modular binders preserve target specificity and functional activity relative to source-derived comparators.
   - Include format or platform controls to detect presentation-dependent effects.
   - *Decision gate:* If source-derived and reconstructed forms diverge without an explainable mechanism, stop and diagnose context.

5. **Collect orthogonal evidence layers**
   - Sequence and architecture plausibility.
   - Binding specificity (intended target versus irrelevant targets and background).
   - Functional relevance (binding translates to the intended biological outcome).
   - Structural interpretation (supportive only, not primary evidence).
   - *Decision gate:* If only one evidence layer is positive, treat the claim as provisional and seek orthogonal confirmation before continuing.

6. **Analyze as an evidence matrix**
   - Construct a binder-by-target-form matrix with qualitative or quantitative readouts.
   - Normalize variant effects to parent or reference where appropriate.
   - Classify recognition mode: linear, conformational, oligomer-dependent, or artifact.
   - *Decision gate:* If controls fail, signals are irreproducible, or negative controls mimic test conditions, stop and redesign.

7. **Iterate based on evidence patterns**
   - **Concordant binding and specificity** → strengthen epitope or specificity claim; proceed to functional relevance or broader robustness testing.
   - **Binding without function** → investigate assay context, target form, or indirect effects; do not escalate claims.
   - **Weak or nonspecific signal** → strengthen off-target controls and assess assay interference before claiming recognition.
   - **Divergent results across formats** → examine reconstruction context, folding, or presentation; separate recognition from production effects.
   - *Decision gate:* If mechanism attribution fails after iteration, stop and define what new measurement capability is needed.

8. **Bound claims and finalize**
   - State what is directly validated versus inferred.
   - Define boundary conditions (target form, assay context, binder format, species).
   - *Final stop:* If required biosafety, ethics, or data-quality conditions are not met, do not proceed to application claims.

## Output Format

When using this skill, produce:

1. **Research question and gap statement**
   - One clear question framed around preserving, mapping, or improving recognition and function.

2. **Hypothesis table**
   - Claim.
   - Evidence strength.
   - Key assumptions.
   - Failure modes.
   - Minimal viable validation.

3. **Conceptual experimental design**
   - Experimental arms.
   - Independent and dependent variables.
   - Controls.
   - Evaluation criteria.
   - Stop conditions.

4. **Analysis plan**
   - Evidence matrix logic.
   - Classification rules for recognition modes.
   - Uncertainty handling.
   - Evidence grading.

5. **Iteration decision tree**
   - Rules for continue, narrow, redesign, or stop based on result patterns.

6. **Validity and safety statement**
   - Main confounders.
   - Boundary conditions.
   - Required ethics or biosafety oversight.
   - Explicit separation of source-supported evidence from agent inference.

## Validation Gates

- **Specificity gate:** The binder distinguishes the intended target from related targets and background.
- **Conformation gate:** Results are consistent across folded, denatured, native, and engineered target forms.
- **Orthogonality gate:** Epitope or specificity claims are supported by at least two independent readout types.
- **Control gate:** Positive, negative, baseline, and specificity controls behave as expected.
- **Reproducibility gate:** Trends are consistent across independent preparations, batches, or assay runs.
- **Mechanism gate:** The proposed mechanism is distinguishable from plausible alternatives.

## Claim Boundaries

- Treat mapped epitopes and specificity profiles as candidate design principles, not proof of clinical safety or efficacy.
- Limit claims to the tested target forms, assay contexts, binder formats, and species.
- Separate source-verified observations from agent-generated inferences; label evidence strength explicitly.
- Do not generalize from a single binder-target pair to field-wide consensus or universal behavior.

## Failure Modes

- Candidate sequence or pairing is not credible.
- Controls fail to validate specificity or sensitivity.
- Reconstructed or modular candidates show only non-specific signal.
- Source-derived and reconstructed forms diverge without an explainable mechanism.
- Binding is preserved but function is absent due to assay or context mismatch.
- Artifact binding dominates over target-directed signal.
- Matrix, carrier, or presentation effects prevent interpretable results.
- Structural modeling is treated as definitive proof rather than hypothesis generation.

## Validity Checks

- **Confounding:** Assess expression, folding, aggregation, purification bias, assay interference, matrix effects, and batch variation.
- **Sample integrity:** Check for degradation, target preparation differences, and storage artifacts.
- **Statistical validity:** Use predefined endpoints, appropriate replication, uncertainty estimates, and correct for multiple comparisons.
- **Reproducibility:** Require independent reagents, constructs, or assay formats before accepting mechanistic claims.
- **Boundary conditions:** State whether conclusions apply only to the tested source, target form, or reconstruction format.

## Provenance

- Synthesized from cluster 41 / subcluster 41.0.split0.
- Derived from source skills: antibody-variable-domain-recovery-workflow (cc2c1cc1e0622b63), antibody-fc-effector-research-design (a12aae391cc0ddd8), peptide-antigen-epitope-exploration (1ff9a6e55c285206), antibody-epitope-research-workflow (02b7e74baea03cad), fish-endocrine-biomarker-binder-discovery (ad908a99ffde9777), affinity-reagent-research-design (29df65584c575008), antibody-assembly-disulfide-workflow (29f3a7e9f0d2f1fd), hapten-antibody-affinity-exploration (1a25d208fdbf6781).
