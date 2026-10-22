---
name: sci-aqueous-aqueous-metal-electrolyte-mechanism-discove-5f043110
description: Reusable end-to-end workflow for observable-driven mechanism discovery and validation in aqueous metal-electrolyte battery systems.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide research design for aqueous metal-electrolyte interfaces by converting observed failure modes into testable mechanistic hypotheses, discriminating experiments, and iterative validation loops. The goal is to build causal chains from molecular-scale interfacial events to cell-level behavior without relying on single-study conclusions or prescriptive material recipes.

# When to use

Trigger this skill when the user asks to:
- Propose new research questions for aqueous metal batteries or related electrochemical systems where interfacial reactions limit performance.
- Design experiments to test how an electrolyte, additive, coating, separator, or electrode modification changes interfacial mechanisms.
- Evaluate whether a proposed mechanism is supported by orthogonal evidence and adequate controls.
- Convert a mechanism-first materials study into a reusable hypothesis-generation and validation workflow.

Do not use this skill as a recipe for specific electrolyte formulations, cell assembly protocols, or operational procedures.

# Inputs required

Before generating a plan, collect:
- **Target system**: electrode and electrolyte classes, cell architecture, and known failure modes (e.g., nonuniform deposition, side reactions, transport loss).
- **Observable gap**: the mismatch between expected and actual behavior that motivates mechanism discovery.
- **Candidate design levers**: possible interfacial agents, solvation modifiers, host materials, or architectural changes under consideration.
- **Available characterization**: electrochemical, spectroscopic, microscopic, transport, diffraction, or computational methods accessible for validation.
- **Control materials**: baseline, single-component variants, inert analogues, and benchmark systems.
- **Constraints**: safety boundaries, facility limits, environmental considerations, and acceptable validation scope.
- **Boundary conditions**: temperature, geometry, pretreatment, and operating regimes that limit generalization.

# Core Workflow

1. **Failure-mode framing and gap definition**
   - Define the cell-level performance limitation and trace it to candidate interfacial or transport bottlenecks.
   - *Decision gate*: If the limitation cannot be plausibly linked to an interfacial or transport process, stop and restate the research scope.

2. **Mechanism mapping and hypothesis generation**
   - Map each failure mode to an interfacial state variable (e.g., local charge distribution, adsorption strength, ion coordination, water activity).
   - Generate 3–5 competing, testable hypotheses that link design levers to state variables and to observable outcomes.
   - For each hypothesis record: evidence strength (high/medium/low), key assumptions, discriminating observations, likely failure modes, and boundary conditions.
   - *Decision gate*: If no hypothesis is falsifiable with available or accessible measurements, return to Step 1 to refine the gap or expand characterization access.

3. **Control architecture and experimental design**
   - Define comparison groups: baseline (untreated), active candidate, single-component isolations, inert/negative analog, positive/benchmark (if available), and full-cell attribution.
   - Select independent variables (mechanism-relevant modifications) and dependent variables (interfacial signatures and performance metrics).
   - Specify minimum viable validation: baseline vs. candidate, at least one direct interfacial signature, one macroscopic electrochemical metric, and one post-test surface or chemical analysis.
   - Specify strong validation: multiple candidate gradients, orthogonal in situ or operando channels, half-cell and full-cell consistency, and independent replication.
   - *Stop conditions*: severe incompatibility, transport collapse, uncontrolled side reactions, inability to reproduce baseline behavior, or safety constraints.

4. **Evidence collection and quality assurance**
   - Gather orthogonal observations across at least two independent channels.
   - Document covariates, replicate identity, preprocessing, and calibration status.
   - *Decision gate*: If raw data fail quality checks (drift, misalignment, missing metadata), halt interpretation and resolve data integrity before proceeding.

5. **Layered analysis and mechanism triangulation**
   - Align all signals in time or process stage.
   - Build a causal-chain evidence matrix for each hypothesis: list supporting, contradictory, missing, and alternative explanations.
   - Promote a hypothesis only when at least two independent evidence types converge and controls exclude artifactual explanations.
   - *Decision gate*: If mechanism evidence contradicts performance trends, prioritize direct interfacial measurements over post-hoc rationalizations. If contradictions persist, flag the hypothesis as unsupported and return to Step 2.

6. **Iteration and refinement**
   - **Converging evidence**: Narrow the design rule, test boundary conditions, or advance to robustness checks.
   - **Ambiguous evidence**: Add an independent observation channel, reduce mechanism scope, or refine controls.
   - **Contradictory evidence**: Archive the failure mode, generate a competing-pathway hypothesis, and return to Step 2.
   - **Full-cell without half-cell support**: Perform failure attribution before claiming interfacial protection.
   - *Stop conditions*: hypothesis is supported, refuted, or blocked by safety/validity limits.

7. **Synthesis and boundary setting**
   - Separate directly supported claims from inferred extrapolations.
   - Explicitly state boundary conditions beyond which the mechanism should not be generalized.

# Output Format

When using this skill, produce:
1. `Research scope`: target system, failure modes, and boundary conditions.
2. `Mechanistic framing`: mapped failure modes, design levers, and causal chain.
3. `Candidate hypotheses`: table with observation, hypothesis, evidence strength, key assumptions, failure modes, and boundary conditions.
4. `Experimental design`: comparison groups, variables, minimum viable validation, strong validation, and stop conditions.
5. `Analysis plan`: evidence hierarchy, data-quality checks, mechanism scoring, and interpretation rules.
6. `Iteration plan`: update rules, decisive follow-up measurements, and discard/reframe criteria.
7. `Validity and safety notes`: confounders, reproducibility checks, external-validity limits, and non-operational safety boundaries.

# Validation Gates

- **Gate 1 (Problem scope)**: Failure mode is traceable to an interfacial or transport process.
- **Gate 2 (Hypothesis testability)**: At least one hypothesis is falsifiable with available or accessible measurements.
- **Gate 3 (Control adequacy)**: Baseline, negative, and mechanism-isolating controls are defined before data interpretation.
- **Gate 4 (Evidence convergence)**: Mechanism claim requires two or more independent observation channels.
- **Gate 5 (Attribution clarity)**: Full-cell improvements are linked to the proposed interfacial mechanism via half-cell or diagnostic controls.

# Claim Boundaries

- Limit mechanism claims to the tested chemistry, cell format, and operating context.
- Do not claim synergy unless the combined condition outperforms the best single-component control under matched conditions.
- Do not claim field consensus from single-study observations.
- Distinguish "directly observed," "hypothesis-consistent," and "agent-inferred" claims.
- Avoid extrapolating beyond validated boundary conditions without labeling as speculative.

# Failure Modes

- Incompatibility or transport collapse upon introducing the candidate modification.
- Apparent performance improvement caused by cathode limitation, separator wetting, electrolyte volume, or measurement artifacts rather than the proposed interfacial mechanism.
- Misleading morphology or single-signal evidence unsupported by orthogonal data.
- Confounding from counterion effects, impurities, pH drift, or electrode pretreatment.
- Single-cell outliers or irreproducible batches driving false mechanism support.
- Model-experiment mismatch where computational predictions assume idealized interfacial structures.

# Validity Checks

- **Confounding**: Could uncontrolled variables (electrode loading, separator properties, electrolyte inventory, environmental history) explain the result?
- **Control adequacy**: Are baseline, single-component, inert-analogue, and attribution controls sufficient to isolate the mechanism?
- **Statistical validity**: Are independent replicates, variability, effect size, and uncertainty reported or planned?
- **Reproducibility**: Are sample preparation, measurement definitions, and failure criteria documented enough to repeat?
- **Measurement artifacts**: Could impedance fitting, peak assignment, sampling bias, or normalization choices mislead interpretation?
- **Temporal alignment**: Are operando or time-resolved signals synchronized with the process stage?
- **Boundary conditions**: Are claims restricted to the tested material class and operating window?
- **External validity**: Are claims framed as hypotheses for the target system rather than universal rules?

# Provenance

- Derived from cluster 36.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: aqueous-zinc-interface-solvation-design (5ac5bdeb5520a02f), aqueous-metal-battery-interface-additive-discovery (d00f802fd5332e38), operando-battery-research-workflow (d1059366b5f46343), aqueous-zinc-sulfur-interface-research (066f6f140cc6dbc3), polymer-electrolyte-exploration (75b586df259e1ab9), aqueous-metal-battery-interface-exploration (de36f91f4735ceea), decoupled-aqueous-zinc-iodine-battery-exploration (8a500c3e54a9bb24), biopolymer-electrolyte-research-pattern (f1dba7d229a2a9d6).
- Paper-specific conclusions, material systems, and operational parameters have been removed to produce a reusable workflow archetype.
