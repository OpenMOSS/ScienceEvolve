---
name: sci-fiber-fiber-composite-interface-mechanism-discovery-31148fd3
description: Design and validate mechanism-driven research for hierarchical fiber, composite, and bioactive interface systems by linking structure to function through controlled hypothesis generation, minimal validation, and iterative evidence chaining.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to plan end-to-end mechanism-discovery research for structured material systems—such as fiber-reinforced composites, functional interfaces, bioactive scaffolds, and hierarchical assemblies—where performance depends on coupling between architecture, interfacial behavior, and multi-scale transport or mechanical response. The goal is to move from an observed performance gap to a bounded, evidence-supported mechanism claim through hypothesis generation, minimal controlled validation, and iterative refinement, without copying source-specific recipes or parameters.

# When to use

Use when the user asks to design, evaluate, or iterate on research questions involving fiber-based materials, polymer composites, bioactive or natural interfaces, adaptive binders, porous or hierarchical architectures, or capture-and-recovery systems. It applies whenever the core challenge is explaining how a structural or interfacial feature produces a functional outcome, especially when multiple scales must be aligned.

# Inputs required

- **Target system class and application context**: e.g., composite, textile, electrode, hydrogel, or capture system.
- **Observed performance gap or functional bottleneck**: the specific mismatch between required and current capability.
- **Candidate mechanism categories**: e.g., interfacial adhesion, network formation, transport, capture/recovery, thermal/mechanical coupling.
- **Available characterization and functional assay access**: structural, chemical, mechanical, biological, or environmental measurement capabilities.
- **Baseline or reference system**: a known or conventional comparator appropriate to the matrix, fiber, or medium.
- **Constraints**: safety, ethics, environmental boundaries, reproducibility standards, and extrapolation limits.

# Core Workflow

Follow this ordered route from gap identification to bounded mechanism claim. At each gate, stop and redesign if the criterion is not met.

1. **Frame the bottleneck and mechanism space**
   - Define the performance conflict as a mismatch between required function and current capability.
   - Identify the dominant failure mode or limiting step (e.g., interfacial debonding, network disruption, transport blockage, capture without recovery).
   - **Decision gate**: If the bottleneck cannot be tied to a measurable structural or interfacial variable, stop and refine the research question.

2. **Generate ranked mechanism hypotheses**
   - For each candidate, state the causal chain: design variable → structural mediator → local interaction → macroscopic functional outcome.
   - Label evidence strength (high / medium / low / speculative).
   - Identify key assumptions, alternative explanations, and predicted observations.
   - **Decision gate**: If no hypothesis yields a falsifiable prediction, return to Step 1.

3. **Design minimal viable validation**
   - Select independent variables that target one primary mechanism at a time.
   - Define a control set: baseline, negative, positive, process-only, component-ablation, and matched-composition controls.
   - Choose primary metrics (functional endpoint) and secondary metrics (structural mediator).
   - Pre-register stopping conditions and success criteria before data collection.
   - **Stop/Go gate**: If the experiment lacks a control that isolates the mechanism from confounders, redesign before proceeding.

4. **Execute structure-function analysis**
   - Characterize structural mediators before interpreting functional data.
   - Compare the candidate system against all controls under matched conditions.
   - Normalize metrics by geometry, mass, area, or volume when ranking systems.
   - Check mass balance, artifacts, and batch variability.
   - **Decision gate**: If structural evidence and functional evidence diverge, flag the weakest link and pause generalization.

5. **Classify evidence and iterate**
   - **Supported**: structural and functional links align across controls.
   - **Partially supported**: one link is indirect or missing; isolate the missing link and revise only that module.
   - **Contradicted**: controls explain the effect; return to Step 2 with revised assumptions or reject the mechanism.
   - **Inconclusive**: measurement or control gaps prevent interpretation; improve controls before changing the hypothesis.
   - **Iteration rule**: Do not escalate to complex media, long-term durability, or application claims until the minimal mechanism is validated.
   - **Stop condition**: Halt if safety, environmental compatibility, or reproducibility standards are violated.

6. **Boundary test and claim bounding**
   - Test at least one boundary condition (material variant, stress level, environmental exposure, or target class).
   - Document where the mechanism is expected to hold versus where it remains speculative.
   - **Stop condition**: If the mechanism fails at the first boundary, narrow the claim rather than adding complexity.

7. **Package outputs and provenance**
   - Assemble the research question, hypothesis table, experimental plan, analysis summary, and iteration log.
   - Mark all source-paper evidence as distinct from agent inferences.

# Output Format

Produce the following deliverables:

1. **Research question**
   - Concise question, gap addressed, and why it is nontrivial.

2. **Candidate hypotheses table**
   - Mechanism statement, evidence strength, key assumptions, predicted observations, and failure modes.

3. **Minimal experimental plan**
   - Sample groups, independent variables, control matrix, primary and secondary metrics, and stopping conditions.

4. **Analysis plan**
   - Structure-function links, normalization approach, artifact checks, and statistical approach.

5. **Iteration log**
   - Evidence classification, updated assumptions, and next decision rule.

6. **Boundary statement**
   - Tested limits, extrapolation risks, and unresolved links.

# Validation Gates

- **Confounder isolation**: Can treatment effects be separated from processing history, geometry, density, or measurement artifacts?
- **Control adequacy**: Does the design include baseline, process-only, component-ablation, negative, and positive controls?
- **Mechanistic consistency**: Do structural observations and functional measurements support the same causal chain?
- **Reproducibility**: Are batch effects, sample history, and replication documented?
- **Metric validity**: Are comparisons normalized and measured under aligned conditions?

# Claim Boundaries

- Distinguish model-system mechanism from robustness across variants.
- Separate laboratory proof-of-concept from deployment readiness or field consensus.
- Mark source-paper evidence as distinct from agent-inferred extensions.
- Limit conclusions to tested material classes, architectures, environments, and measurement scales.
- Do not present prototype feasibility as clinical, environmental, or application-ready performance.

# Failure Modes

- **Mechanism misattribution**: Conflating composition effects with architecture effects, or processing artifacts with true interfacial phenomena.
- **Missing link**: Structural mediator changes but functional endpoint does not, or vice versa.
- **Control failure**: Process-only or component-ablation controls replicate the apparent effect.
- **Overgeneralization**: Extending a mechanism beyond tested boundary conditions without transfer controls.
- **Premature escalation**: Advancing to complex media or long-term studies before minimal validation is complete.
- **Artifact blindness**: Ignoring wall adhesion, sedimentation, residual support, contact resistance, sampling bias, or background signal.

# Validity Checks

- Are independent variables changed one at a time initially?
- Is there a pre-registered causal chain from design variable to structure to function?
- Are mass-balance or equivalent accounting plans included where fractions must sum?
- Are negative results and failed controls reported?
- Are statistics appropriate to the sample structure and variability?
- Are application-level claims deferred until independent safety and durability validation is demonstrated?

# Provenance

- Synthesized from cluster 62 (subcluster 62.0): observable-driven mechanism discovery and validation.
- Source skills: active-contaminant-capture-recovery-research; layered-multifunctional-film-research; fiber-grafting-exploration-workflow; adaptive-bio-binder-electrode-research; controllable-click-hydrogel-research; thermal-hollow-yarn-research-design; natural-fiber-composite-research; oriented-polymer-fiber-research-pattern.
- Preserves only transferable workflow structure; excludes paper-specific materials, parameters, numerical results, and operational protocols.
