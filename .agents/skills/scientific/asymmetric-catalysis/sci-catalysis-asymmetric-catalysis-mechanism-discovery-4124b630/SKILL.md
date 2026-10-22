---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-4124b630
description: A reusable end-to-end workflow for generating, validating, and iterating mechanism-grounded hypotheses in asymmetric catalysis and chiral method development, from gap identification through controlled experimentation to claim bounding.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 7"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Helps an agent convert an unresolved asymmetric catalysis or stereochemical transformation problem into a structured, mechanism-led research plan. The workflow emphasizes falsifiable hypothesis generation, minimal validation design, evidence-layered analysis, and disciplined claim bounding without prescribing operational laboratory procedures.

# When to use

Use this skill when the user asks to:

- Propose new asymmetric catalytic reactions or stereodivergent methodologies.
- Design validation plans for chiral catalysts, ligands, or organocatalytic systems.
- Evaluate mechanistic hypotheses involving stereocontrol, cooperative activation, or coupled transformations.
- Iterate on partial or failed catalytic outcomes to refine models.
- Plan substrate scope, control experiments, or boundary tests for method development.

Do not use for clinical recommendations, executable hazardous synthesis instructions, field-wide consensus statements, or unrelated literature summarization.

# Inputs required

Before generating a plan, request or infer:

- Target transformation class and desired stereochemical outcome (enantio-, diastereo-, regioselectivity).
- Candidate catalyst or activation concept and proposed mechanistic handle.
- Known limitations of existing approaches.
- Substrate classes to test, including benchmark and stress-test candidates.
- Available analytical readouts for identity, conversion, selectivity, and stereochemical assignment.
- Safety, regulatory, and facility constraints.
- Whether the goal is exploratory hypothesis generation, minimal validation, or confirmatory evidence.

If inputs are missing, state assumptions explicitly and downgrade evidence strength.

# Core Workflow

1. **Frame the Gap and Mechanistic Handle**
   - Define the synthetic bottleneck (selectivity, activity, scope, or step economy).
   - Identify a substrate feature, catalyst architecture, or coupled process that could plausibly bias the reaction pathway.
   - **Decision gate:** If no falsifiable mechanistic handle can be articulated, stop and reformulate the research question.

2. **Generate Falsifiable Hypotheses**
   - Draft a primary hypothesis and at least two alternatives.
   - For each, specify: key assumption, predicted observation, most likely failure mode, and boundary condition.
   - Label evidence strength: `High`, `Medium`, `Low`, or `Speculative`.
   - **Decision gate:** If a hypothesis cannot be weakened or supported by accessible controls, redesign the hypothesis or analytical plan.

3. **Design Minimal Validation**
   - Select a representative substrate set that varies electronic, steric, and functional-group features relevant to the model.
   - Define independent variables (catalyst class, activation mode, substrate handle, environment).
   - Establish a control hierarchy:
     - Background / no-catalyst control.
     - Negative substrate control (handle removed or masked).
     - Positive or benchmark control.
     - Ablation control (remove one proposed activation/stereocontrol element).
     - Matched/mismatched or enantiomer-pair control when chiral cooperation is hypothesized.
   - Pre-register success criteria (e.g., reproducible selectivity above background) and stop conditions.
   - **Decision gate:** If controls are incomplete or safety review is pending, pause before proceeding.

4. **Execute Conceptual Observations**
   - Record conversion, yield proxy, selectivity metrics, and side-product profiles.
   - Verify that analytical methods resolve all relevant stereoisomers and impurities.
   - Repeat representative cases to check reproducibility.
   - **Decision gate:** If negative controls match the target signal, or if stereochemical assignment is ambiguous, stop and troubleshoot.

5. **Analyze and Classify Evidence**
   - Compare target conditions against the full control hierarchy.
   - Separate observation from mechanistic inference.
   - Classify evidence strength:
     - `High`: independent readouts and controls align.
     - `Medium`: primary readout positive, but reversibility, quantitative balance, or orthogonal confirmation is incomplete.
     - `Low`: only one readout is positive or controls are weak.
     - `Speculative`: inference rests on analogy or computation.
   - Map substrate trends to the hypothesized model.
   - **Decision gate:** If the data contradict the primary hypothesis, proceed to pivot. If inconclusive, refine analytics.

6. **Iterate, Pivot, or Stop**
   - **Continue:** Core mechanism is supported; expand to boundary substrates or downstream utility with explicit scope limits.
   - **Refine:** Selectivity or conversion is partial; revise one variable class at a time (catalyst pocket, activation mode, substrate electronics).
   - **Pivot:** Hypothesis is contradicted; reformulate the mechanistic model or target transformation.
   - **Stop:** No target formation beyond background, irreproducible results, unsupported mechanism, or unresolved safety constraints.
   - **Iteration rule:** Change only one mechanistic assumption per cycle and maintain a traceable hypothesis log.

7. **Bound Claims and Archive**
   - State the validated substrate class, catalyst family, and mechanistic scope.
   - Label each conclusion as directly observed, inferred from analogy, or speculative.
   - Define explicit boundary conditions where the method should weaken or fail.
   - Archive the provenance of source assumptions separately from new findings.

# Output Format

Return the following structure:

1. **Research Question** — One concise, falsifiable question.
2. **Mechanistic Framing** — Bottleneck, proposed handle, activation model, and expected transformation.
3. **Hypotheses Table** — Columns: hypothesis, evidence strength, key assumption, predicted observation, likely failure mode, boundary condition.
4. **Minimal Validation Plan** — Representative substrates, variable groups, control hierarchy, success/failure criteria, and stop conditions.
5. **Analysis Plan** — Readouts, evidence classification rules, mechanism validation logic, and uncertainty handling.
6. **Iteration Plan** — Decision rules for continue, refine, pivot, or stop under different result patterns.
7. **Validity and Safety Statement** — Confounders, reproducibility requirements, claim boundaries, and non-operational safety constraints.

# Validation Gates

- **Assay Integrity:** Analytical methods must resolve product, stereoisomers, and likely impurities before interpretation.
- **Control Hierarchy:** Background, negative, positive, and ablation controls must be defined before testing.
- **Mechanistic Discrimination:** The plan must distinguish the proposed mechanism from background, uncatalyzed, or alternative catalytic pathways.
- **Reproducibility:** Representative results must be repeatable or supported by independent confirmation.
- **Pre-registration:** Success, failure, and stop criteria must be stated before data collection.

# Claim Boundaries

- Distinguish directly observed results from mechanistic inferences and speculative extensions.
- Do not treat a single validated substrate or condition as proof of broad generality.
- Do not present one literature precedent as field-wide consensus.
- Separate catalyst performance from downstream utility, scalability, or safety conclusions.
- Limit claims to the tested substrate class, catalyst architecture, and reaction environment.

# Failure Modes

- **Background Dominance:** Non-catalytic or racemic pathways obscure selective signals.
- **Catalyst Deactivation or Sequestration:** Product, intermediate, or substrate binds the catalyst and shuts down turnover.
- **Ambiguous Stereochemistry:** Inability to assign configuration reliably invalidates selectivity claims.
- **Irreproducible Selectivity:** Results vary across runs due to uncontrolled impurities or analytical drift.
- **Narrow Scope Without Mechanistic Rationale:** Success limited to a single substrate class with no predictive model.
- **Unsupported Mechanism:** The proposed handle is not required to explain the outcome.
- **Safety or Resource Barriers:** Uncontrolled hazards or insufficient analytical resolution prevent valid interpretation.

# Validity Checks

- **Confounding:** Could impurities, substrate conformation, purification artifacts, or detector drift explain the outcome?
- **Analytical Validity:** Can the readout distinguish all relevant stereoisomers and side products?
- **Control Adequacy:** Are baseline, negative, positive, ablation, and orthogonal controls included?
- **Metric Balance:** Are conversion, selectivity, and reproducibility evaluated together rather than conflated?
- **Boundary Conditions:** Are failures and non-generalizable cases reported as informative boundaries?
- **Evidence Labeling:** Are conclusions tagged as observed, inferred, or speculative?
- **External Validity:** Is the target transformation close enough to the evidence base to justify analogy?

# Provenance

Synthesized from cluster 21, subcluster 21.0. Derived from source skills: reversible-sink-catalysis-exploration, asymmetric-catalysis-stereodivergence-workflow, chiral-bronsted-acid-oxidation-method-design, chiral-bifunctional-catalyst-discovery, asymmetric-lactone-synthesis-research, asymmetric-cp-cross-coupling-research-workflow, modular-organocatalysis-research-pattern, asymmetric-stereocontrol-research-design.
