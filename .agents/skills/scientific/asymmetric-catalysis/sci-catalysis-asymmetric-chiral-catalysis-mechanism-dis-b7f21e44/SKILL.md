---
name: sci-catalysis-asymmetric-chiral-catalysis-mechanism-dis-b7f21e44
description: A reusable end-to-end workflow for discovering and validating mechanisms in asymmetric chiral catalysis through hypothesis generation, non-operational study design, iterative validation, and conservative claim bounding.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis mechanism discovery workflow 2"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide agents through a systematic, mechanism-first research workflow for asymmetric chiral catalysis. The skill covers gap identification, discriminating hypothesis generation, staged validation planning, coupled data analysis, iterative redesign, and explicit claim bounding—without prescribing specific chemical systems, operational procedures, or paper-specific conclusions.

# When to use

Use this skill when the user needs to:

- Propose new research questions or mechanistic hypotheses in asymmetric catalysis, stereoselective synthesis, or chiral ligand/method development.
- Design non-operational validation studies to distinguish activation, organization, and stereocontrol mechanisms.
- Plan iterative experiments, controls, and analysis strategies for chiral catalytic systems.
- Evaluate whether a stereocontrol model is supported by evidence or bounded by limitations.

Do not use this skill to provide executable laboratory protocols, hazardous operational parameters, scale-up instructions, or direct synthetic recipes.

# Inputs required

Before executing the workflow, identify or request:

- Target transformation class and desired stereochemical outcome.
- Candidate catalyst/ligand families and proposed chiral control elements.
- Known benchmark systems and literature precedents (as references, not consensus).
- Available analytical readouts for conversion, selectivity, stereochemical assignment, and structural confirmation.
- Candidate substrate/electrophile classes for scope and boundary testing.
- Safety, regulatory, and institutional constraints relevant to the chemistry.

# Core Workflow

1. **Gap Framing & Evidence Audit**
   - Define the target product class and stereochemical challenge.
   - Audit literature precedents to identify unsupported elements: activation mode, enantiodetermining step, scope boundary, or downstream utility.
   - **Gate:** If the gap is purely operational (e.g., needing a recipe), stop and redirect. If the gap is mechanistic or methodological, proceed.

2. **Hypothesis Generation**
   - Propose 2–4 competing, falsifiable hypotheses that assign functional roles to catalyst, ligand, substrate, and medium.
   - For each hypothesis, specify: mechanistic rationale, key assumptions, predicted discriminating observation, and likely failure mode.
   - Rank by evidence strength (strong / moderate / weak / speculative) and falsifiability.
   - **Gate:** If hypotheses cannot be distinguished by any feasible experiment, reformulate before proceeding.

3. **Study Design & Control Architecture**
   - Design a minimal viable validation plan using conceptual variables only (no operational parameters).
   - Define variable axes: activation, chiral environment, recognition/substrate, additive/medium, and downstream stability.
   - Specify controls: negative (omit chiral element), positive (benchmark), orthogonal (vary one mechanistic feature), mechanistic (probe intermediate), and analytical (stereochemical assignment).
   - Predefine coupled metrics: realization, activity, selectivity, robustness, and mechanistic clarity.
   - **Gate:** If controls are inadequate to isolate the proposed mechanism, redesign before execution.

4. **Data Collection & Layered Analysis**
   - Collect outcomes grouped by variable class.
   - Layer 1 — Candidate-level check: confirm identity and unambiguous stereochemical assignment.
   - Layer 2 — Within-probe comparison: determine which variable changes activity versus selectivity.
   - Layer 3 — Across-probe comparison: assess whether the stereocontrol model generalizes or collapses.
   - Layer 4 — Mechanistic interpretation: distinguish activation failure from poor stereochemical organization.
   - **Gate:** If product identity or stereochemical assignment is ambiguous, stop analysis until resolved.

5. **Mechanism Discrimination & Evidence Grading**
   - Compare results against the hypothesis prediction matrix.
   - Label each conclusion as: observed, control-supported, literature-supported, or agent-inferred.
   - Exclude mechanisms inconsistent with negative controls or orthogonal probes.
   - **Gate:** If no hypothesis survives control scrutiny, return to Step 2 (redesign) or Step 1 (reframe gap).

6. **Iteration or Redesign**
   - Apply decision rules based on outcome patterns:
     - High activity + low selectivity → redesign chiral environment / enantiodetermining-step model.
     - Low activity + high selectivity → probe activation, catalyst stability, and substrate compatibility.
     - Narrow scope → define boundary conditions rather than claim generality.
     - Inconsistent controls → investigate confounders (purity, decomposition, analytical artifacts).
   - **Gate:** After two iteration cycles without mechanistic clarity, stop and require a new hypothesis framework.

7. **Claim Bounding & Validation Output**
   - State demonstrated boundaries explicitly: catalyst class, substrate scope, analytical methods, and evidence strength.
   - Separate feasibility from generality, and observed facts from inferred mechanisms.
   - Compile failure modes and residual risks.
   - **Final Stop Condition:** Claims must not exceed the validated evidence envelope.

# Output Format

When this skill completes, deliver:

1. **Research Question** — focused, mechanism-grounded question.
2. **Ranked Hypotheses** — with functional roles, evidence strength, assumptions, failure modes, and discriminating observations.
3. **Study Plan** — minimal validation design with conceptual variables, controls, and stop conditions.
4. **Control Table** — mapping each control to the mechanism question it answers.
5. **Analysis Plan** — layered analysis logic for activity, selectivity, robustness, and mechanism.
6. **Iteration Rules** — decision matrix for continue, pivot, narrow, or stop.
7. **Claim Boundary** — explicit limits on extrapolation and evidence classification.
8. **Failure Modes** — catalog of plausible failure modes and how they were tested.

# Validation Gates

- **Trigger Fit:** Task is research design, not procedure execution.
- **Mechanistic Grounding:** Hypotheses tied to activation, organization, or stereochemical validation.
- **Control Adequacy:** Positive, negative, orthogonal, mechanistic, and analytical controls specified.
- **Endpoint Clarity:** Activity, selectivity, realization, robustness, and mechanism evaluated separately.
- **Reproducibility:** Plans include replication, orthogonal readouts, and outlier handling.
- **Safety Boundary:** No operational chemical parameters, hazardous handling, or executable high-risk steps included.

# Claim Boundaries

- Treat single-study or single-system observations as local evidence, not field-wide consensus.
- Distinguish paper-supported facts, cross-study analogies, and agent-inferred extrapolations.
- Limit mechanistic claims to the tested catalyst/substrate/medium classes.
- Do not extrapolate from feasibility to scalability, clinical utility, or commercial viability.
- Mark stereochemical claims as provisional until supported by orthogonal analytical confirmation and configurational stability evidence.

# Failure Modes

- **Activation Failure:** Catalyst does not generate the reactive intermediate; distinguished by no-catalyst controls and precursor validation.
- **Organization Failure:** Chiral environment fails to bias the transition state; distinguished by achiral or racemizing controls.
- **Substrate Incompatibility:** Electronic, steric, or functional-group mismatch suppresses reactivity or selectivity.
- **Stereochemical Erosion:** Product racemizes, epimerizes, or rearranges after formation.
- **Analytical Artifact:** Misassigned configuration, assay bias, or separation artifact mimics selectivity.
- **Confounding by Impurities/Decomposition:** Background reactivity or catalyst decomposition dominates observed outcomes.
- **Scope Collapse:** Model fails outside a narrow substrate class; indicates boundary-limited validity.

# Validity Checks

- **Confounding Check:** Could purity, moisture, decomposition, or workup losses explain the result?
- **Reproducibility Check:** Are independent runs consistent? Are orthogonal analytical methods used?
- **Statistical Validity:** Are replicates sufficient and outliers reported?
- **Boundary Check:** Are steric, electronic, functional-group, and scale limitations stated?
- **Mechanistic Validity:** Do controls and trends support the proposed intermediate or transition-state model?
- **External Validity:** Is the source treated as one precedent among many?
- **Evidence Labeling:** Is every conclusion tagged by its evidence strength and source class?

# Provenance

- Synthesized from cluster 17 / subcluster 17.0 (asymmetric chiral catalysis mechanism discovery and validation).
- Derived from source skills: hydrogen-bond-directed-asymmetric-catalysis-exploration, asymmetric-phosphine-boronate-research, chiral-metal-schiff-base-asymmetric-synthesis, atropisomer-cascade-research-design, organocatalysis-aldol-research-design, ferrocenyl-phosphine-oxide-catalyst-exploration, asymmetric-ch-catalysis-research-workflow, asymmetric-catalysis-research-planning.
- Preserves no paper-specific compounds, conditions, numerical results, or operational protocols.
