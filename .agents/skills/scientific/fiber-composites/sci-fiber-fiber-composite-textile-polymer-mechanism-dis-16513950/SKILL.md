---
name: sci-fiber-fiber-composite-textile-polymer-mechanism-dis-16513950
description: Reusable end-to-end workflow for designing observable-driven mechanism discovery and validation studies in fiber, composite, textile, polymer, and interface systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite textile polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in designing transferable research programs for structured material systems—including fibers, textiles, composites, polymers, and interfaces—where function emerges from coupled architecture, processing history, and multi-scale structure. The goal is to discover and validate mechanisms through observable evidence rather than to reproduce any single source system or operational recipe.

# When to use

Use this skill when the user asks for new hypotheses, experimental strategies, or evaluation plans in fiber-reinforced composites, textile architectures, polymer matrices, colloidal assemblies, thin-film responsive materials, or bioinspired interfaces. It is most useful when the task requires linking processing variables, structural evolution, and functional response through controlled observation and strong inference.

# Inputs required

Ask the user or environment for:

- Target material system and application context.
- Functional gap or performance limitation.
- Candidate independent variables (e.g., architecture, composition, interface design, processing history, environmental exposure).
- Available orthogonal characterization methods (e.g., imaging, spectroscopy, scattering, mechanical testing, transport measurements).
- Known baseline or benchmark behavior.
- Constraints: safety, reproducibility, equipment access, and non-operational boundaries.
- Decision goal: hypothesis generation, study design, analysis planning, or iteration strategy.

# Core Workflow

1. **Gap Framing & Mechanism Space Definition**
   - Define the target functional requirement and the current performance gap.
   - Decompose the system into interacting modules (e.g., reinforcement architecture, matrix/interface, active phase, environment).
   - Map the plausible mechanism space linking process history, structure, and function without assuming source-paper conclusions hold for the target system.

2. **Hypothesis Generation with Evidence Staging**
   - Generate falsifiable mechanism hypotheses. For each, specify:
     - Predicted structure-process-function relationship
     - Evidence strength (strong / moderate / weak / speculative)
     - Key assumptions and most likely failure modes
     - Boundary conditions for extrapolation
   - **Gate 1 (Candidate Gate)**: Reject or refine any hypothesis that restates a source-paper conclusion without independent falsifiability for the target system.

3. **Minimal Viable Validation Design**
   - Select one primary variable and one secondary variable per experimental block; hold all other factors constant unless testing interactions.
   - Define a control hierarchy: baseline, negative, positive, inert analogue, single-factor, and geometry/morphology controls.
   - Predefine independent and dependent variables, response metrics, success criteria, and stop conditions.
   - **Gate 2 (Control Gate)**: Proceed only if the design can isolate the intended mechanism from confounders such as batch variation, measurement artifacts, or coupled structural changes.

4. **Multi-Scale Observation & State Tracking**
   - Collect orthogonal evidence across relevant scales (e.g., imaging, spectroscopy, transport, mechanical, thermal, electrochemical).
   - Track state variables before, during, and after processing or environmental exposure.
   - Normalize functional data against stable references and control groups; report variability across independent batches.
   - **Gate 3 (Quality Gate)**: Halt if reproducibility fails, artifacts dominate, or safety/compliance boundaries are breached.

5. **Mechanism Discrimination & Evidence Integration**
   - Integrate multi-scale observations to test alignment between structural changes and functional response.
   - Classify each hypothesis as: supported, partially supported, contradicted, or inconclusive.
   - Exclude alternative mechanisms by comparing full-candidate, inert, single-factor, and baseline controls.
   - **Gate 4 (Mechanism Gate)**: Accept a mechanism only if orthogonal evidence streams converge and no control group explains the effect.

6. **Claim Bounding, Iteration, or Termination**
   - Bound all claims within the tested material, geometry, loading mode, and environmental window.
   - Explicitly label measured observations, inferred mechanisms, and speculative extensions.
   - Apply iteration rules:
     - **If supported**: Narrow the active window and test boundary conditions (return to Stage 3).
     - **If partially supported**: Refine one dominant variable or add a discriminator control (return to Stage 3).
     - **If contradicted**: Reformulate the mechanism map (return to Stage 2).
     - **If inconclusive**: Improve measurement orthogonality or controls (return to Stage 4).
   - **Stop conditions**: Terminate when the mechanism is reproducibly validated and bounded, when repeated iterations show no consistent improvement, or when continued testing violates safety or reproducibility constraints.

# Output Format

When using this skill, return:

1. **Research question**: One concise question grounded in a materials-design or processing gap.
2. **Evidence map**: Separation of known evidence, analogical inference, and unknowns.
3. **Hypotheses table**: Hypothesis, mechanism, evidence strength, key assumptions, likely failure mode, minimal test, and boundary conditions.
4. **Experimental design table**: Variables, control hierarchy, primary and secondary endpoints, success criteria, and stop conditions.
5. **Analysis plan**: Multi-scale measurement layers, normalization strategy, artifact checks, and decision criteria.
6. **Iteration decision**: Classification of each hypothesis and the next workflow step.
7. **Validity and boundary statement**: Confounders, reproducibility checks, claim boundaries, and non-operational safety constraints.

# Validation Gates

Before concluding any research phase, confirm:

- **Confounding isolation**: Changes in performance are not explainable by coupled variables, batch variation, or measurement artifacts.
- **Reproducibility**: Independent batches and repeated measurements show consistent trends.
- **Statistical validity**: Effect sizes exceed experimental variability; sample sizes and uncertainty are reported.
- **Mechanistic consistency**: Orthogonal evidence (e.g., imaging, spectroscopy, functional response) points to the same explanation.
- **Boundary fidelity**: Claims remain within the tested material system, geometry, loading mode, and environmental window.

# Claim Boundaries

- Restrict claims to the tested conditions; do not extrapolate to untested compositions, architectures, or environments.
- Distinguish measured observations from inferred mechanisms and speculative extensions.
- Do not present bench-scale or in vitro evidence as proof of in vivo efficacy, clinical utility, or field performance.
- Treat computational or literature analogies as supportive, not conclusive, unless aligned with direct controls.

# Failure Modes

- **Confounded design**: Architecture, chemistry, and processing change simultaneously, preventing mechanism attribution.
- **Overgeneralization**: A single system, geometry, or assay is extrapolated to an entire material class.
- **Single-scale fallacy**: Mechanism is claimed from one measurement modality without orthogonal confirmation.
- **Artifact misattribution**: Assay interference, instrument drift, post-processing changes, or environmental uptake is interpreted as intrinsic material behavior.
- **Hypothesis fixation**: Continuing to optimize conditions for a contradicted mechanism instead of reformulating the mechanism map.

# Validity Checks

Before finalizing outputs, verify:

- Hypotheses are not mere restatements of source-paper conclusions.
- New inferences are labeled with evidence strength and explicit assumptions.
- Controls can distinguish material effects from assay or instrument artifacts.
- The design avoids overgeneralizing from one sample, batch, or measurement.
- Physical and structural requirements are defined independently from functional readouts.
- Degradation, residue, precipitate, and environmental-history effects are considered.
- Replication, batch variability, and statistical handling are included at the design level.
- Negative and inconclusive results are reported as mechanism evidence.
- No operational laboratory recipes, hazardous protocols, or executable high-risk parameters are included.

# Provenance

Synthesized from cluster 11.2 (observable-driven mechanism discovery and validation). Source skills: regenerative-nanofiber-research-planner, lis-polysulfide-regulation-research-design, biomimetic-fiber-scaffold-research, nanostructured-bactericidal-surface-research, photochromic-oxyhydride-research-workflow, textile-composite-mechanics-research, shear-aligned-colloid-research, pdlc-ir-modulation-research-workflow.
