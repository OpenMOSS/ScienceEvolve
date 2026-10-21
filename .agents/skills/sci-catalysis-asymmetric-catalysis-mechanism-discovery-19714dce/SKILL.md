---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-19714dce
description: A reusable end-to-end workflow for generating hypotheses, designing non-operational validation plans, and iterating mechanistic models in asymmetric catalysis and chiral methodology research.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 13"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent generate evidence-grounded research questions, design non-operational validation plans, and iteratively refine mechanistic models for asymmetric catalysis and chiral methodology. The workflow separates reactivity, stereocontrol, and mechanism into testable modules, treats failures as boundary evidence, and bounds all claims by evidence strength.

# When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, organocatalysis, transition-metal catalysis, dynamic resolution, or stereocontrolled synthesis.
- Reframe a bottleneck where reactivity exists but stereocontrol, scope, or mechanistic understanding is lacking.
- Design conceptual validation plans with controls, metrics, and stop conditions.
- Iterate hypotheses after ambiguous, partial, or negative results.
- Map applicability boundaries without extrapolating a single system to field-wide consensus.

Do not use this skill to provide operational laboratory protocols, executable reaction conditions, hazardous handling instructions, clinical advice, or unsupported generalizations.

# Inputs required

Ask the user or infer from context:

- **Target transformation class**: bond-forming event and desired stereochemical outcome (central, axial, planar, or helical).
- **Bottleneck diagnosis**: whether the gap is reactivity, selectivity, scope, mechanism, or compatibility.
- **Candidate components**: catalyst families, ligand classes, substrates, additives, or cooperative partners described conceptually.
- **Mechanistic hypotheses**: proposed activation modes, stereochemistry-setting steps, and competing pathways.
- **Analytical readouts**: available methods for identity, conversion, stereochemical ratio, intermediate detection, and phase-resolved analysis.
- **Prior art**: baseline reactions that can serve as conceptual positive or negative controls.
- **Constraints**: facility-level safety, regulatory, waste, and equipment boundaries.

# Core Workflow

Follow this ordered route. Treat each numbered step as a phase with defined entry/exit criteria.

1. **Frame the Research Gap**
   - Define the target scaffold or transformation and its synthetic or mechanistic value.
   - State the specific limitation as a testable question (e.g., \"Can a cooperative system separate activation from stereocontrol?\").
   - Label the gap as paper-supported, method-inferred, or agent-inferred.

2. **Map the Mechanistic Coordinate**
   - Decompose the transformation into discrete stages: precursor activation, reactive intermediate formation, stereochemistry-setting event, product release/regeneration.
   - Identify all points where stereochemical information can be created, erased, scrambled, or enriched downstream.
   - Note competing background, uncatalyzed, or decomposition pathways.

3. **Generate Ranked Hypotheses**
   - Produce at least three hypotheses that explain how stereocontrol could arise (e.g., activation, stereocontrol, cooperation, dynamic resolution, enrichment, substrate-control).
   - For each hypothesis record:
     - **Claim**: concise causal statement.
     - **Evidence strength**: strong, moderate, weak, or speculative.
     - **Key assumptions**: structural, mechanistic, and analytical prerequisites.
     - **Likely failure mode**: how the hypothesis could fail.
     - **Falsification signal**: the result that would weaken or refute the claim.
   - Rank by mechanistic clarity, discriminability, and feasibility of minimal validation.

4. **Design Minimal Validation**
   - Select the simplest model system that can distinguish the core hypothesis from background and alternative pathways.
   - Define independent variables (catalyst class, substrate feature, environment class) and dependent variables (conversion, selectivity, identity, stability).
   - **Decision gate**: If no model substrate can test the core assumption without confounding, stop and redefine the gap.

5. **Define Controls and Decision Criteria**
   - Include positive, negative, mechanistic, orthogonality, and boundary controls.
   - Set evaluation metrics and explicit stop conditions before data interpretation.
   - **Decision gate**: If the plan lacks a control capable of falsifying the hypothesis, redesign before proceeding.

6. **Gather Module-Level Evidence**
   - Collect crude-mixture, phase-resolved, or time-course data as appropriate.
   - When applicable, test equilibration and sequestration modules separately before integration.
   - Record failed, partial, and successful outcomes with equal rigor.
   - **Decision gate**: If product formation is indistinguishable from background controls, stop or pivot to a revised activation hypothesis.

7. **Analyze by Separating Axes**
   - Separate claims about reactivity, selectivity, mechanism, and downstream stability.
   - Compare the full system against each control condition.
   - Use orthogonal structural and stereochemical evidence before claiming enantioselectivity or diastereoselectivity.
   - **Decision gate**: If structural or stereochemical assignment remains ambiguous, halt scope claims and require independent validation.

8. **Iterate the Mechanistic Model**
   - Update each hypothesis based on evidence: strengthen, narrow, refute, or leave unresolved.
   - Change only one major variable at a time when expanding scope.
   - Return to Step 4 or 5 with a revised hypothesis if results are partial or contradictory.
   - **Iteration condition**: Continue only if the limiting factor is identified and a revised, testable hypothesis remains.

9. **Map Applicability Boundaries**
   - Classify substrate or catalyst classes as verified, failed, or untested.
   - Document boundary conditions (steric, electronic, coordination, stability, compatibility).
   - **Stop condition**: Stop expanding when additional analogues would not test a new mechanistic assumption.

10. **Package and Bound Claims**
    - Assemble outputs with explicit evidence-strength labels.
    - Separate paper-supported observations, method-inferred principles, and agent-inferred extensions.
    - State unresolved risks and next decision points.

# Output Format

When using this skill, produce:

1. **Research question**
   - One concise question, its scientific utility, and the gap it addresses.

2. **Hypothesis table**
   - At least three hypotheses.
   - For each: claim, evidence strength, key assumptions, likely failure mode, minimal validation, and falsification criterion.

3. **Minimal validation plan**
   - Model system logic.
   - Variables and mechanistic roles.
   - Positive, negative, mechanistic, and boundary controls.
   - Evaluation metrics.
   - Stop conditions.

4. **Analysis and iteration plan**
   - How to separate reactivity, selectivity, mechanism, and stability.
   - How to compare controls and detect artifacts.
   - Outcome-specific update rules (strengthen, narrow, pivot, abandon).
   - Boundary conditions and unresolved risks.

5. **Validity statement**
   - What is directly supported by the design.
   - What remains inferred or speculative.
   - What additional evidence is needed before claiming generality.

# Validation Gates

- **Feasibility gate**: A model system must be capable of testing the core assumption without unresolvable confounding.
- **Falsifiability gate**: Every hypothesis must have at least one control or predicted outcome that can weaken or refute it.
- **Background gate**: Product formation must exceed background, uncatalyzed, or decomposition pathways before selectivity claims are made.
- **Analytical gate**: Structural and stereochemical assignments must rest on orthogonal evidence, not a single readout.
- **Module gate**: When equilibration and sequestration (or activation and stereocontrol) are conceptually separable, each must show preliminary function before integrated claims.
- **Scope gate**: Substrate scope expansion is permitted only after the minimal system yields reproducible identity and selectivity evidence.
- **Stability gate**: Stereochemical outcomes must be shown to survive analysis, purification, and representative handling before downstream utility is evaluated.

# Claim Boundaries

- **Paper-supported**: Directly observed in a source study; label as such and do not generalize beyond the reported system.
- **Method-inferred**: A reusable principle abstracted from multiple studies; label as moderate confidence and bound to analogous reaction classes.
- **Agent-inferred**: A new hypothesis for an untested system; label as weak or speculative and require explicit validation.
- Never treat a single successful substrate, catalyst, or intermediate as proof of universal applicability.
- Distinguish reaction selectivity (crude mixture) from isolation effects (purified product).
- Distinguish asymmetric induction during formation from post-formation enrichment or resolution.

# Failure Modes

- **Background dominance**: Product forms without the proposed catalytic or chiral component.
- **Decomposition or instability**: Substrate or intermediate degrades before productive turnover.
- **Stereochemical erosion**: Selectivity is created but lost before detection, during workup, or upon storage.
- **Purification bias**: Apparent selectivity arises from selective loss of one stereoisomer during isolation.
- **Mechanistic ambiguity**: Multiple hypotheses explain the same outcome; no discriminating control exists.
- **Cooperative incompatibility**: Activation and stereocontrol components function independently but interfere when combined.
- **Narrow scope without boundary explanation**: Success is limited to one substrate class and failures are not mechanistically classified.
- **Analytical artifact**: Coelution, isomer overlap, decomposition, or enrichment artifacts mimic successful selectivity.

# Validity Checks

Before presenting a plan or conclusion, verify:

- **Confounding**: Could the result arise from side products, stereoisomer overlap, decomposition, enrichment artifacts, or medium effects?
- **Reproducibility**: Are key observations repeated or supported by consistent independent readouts?
- **Boundary conditions**: Which substrate classes, catalyst families, mechanisms, and conditions are tested, failed, or untested?
- **Statistical validity**: Are claims supported by representative data rather than isolated examples?
- **Mechanistic validity**: Do controls, probes, and structural outcomes converge on the same interpretation?
- **External validity**: Is a single study treated as one methodological example rather than field-wide consensus?
- **Safety validity**: Does the plan remain non-operational, facility-appropriate, and compliant with chemical safety and waste requirements?

# Provenance

- **Cluster**: 15
- **Subcluster**: 15.0
- **Workflow archetype**: end-to-end mechanism discovery and validation
- **Source skills**: inherent-chirality-medium-ring-exploration, stereocontrolled-organophosphorus-discovery, cooperative-catalysis-asymmetric-ph-insertion-workflow, chiral-amine-dynamic-resolution-workflow, asymmetric-c-h-method-discovery, vqm-atropisomer-research-planning, biomimetic-enantioselective-catalysis-workflow, nickel-asymmetric-allylation-methodology
