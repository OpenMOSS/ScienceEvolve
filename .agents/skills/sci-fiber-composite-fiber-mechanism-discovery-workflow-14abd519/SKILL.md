---
name: sci-fiber-composite-fiber-mechanism-discovery-workflow-14abd519
description: A reusable end-to-end workflow for discovering and validating mechanisms in composite, fiber, and multi-component systems through modular decomposition, hypothesis generation, tiered validation, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to transform an observed performance gap or system behavior into a testable mechanistic understanding. The workflow decomposes complex composite or multi-component systems into interacting layers, generates ranked hypotheses with explicit assumptions and failure modes, designs minimal tiered validation with strong controls, and iterates based on mechanism-performance alignment.

# When to use

Use this skill when a user asks to:

- Explain a performance gap, unexpected stability, or functional tradeoff in composites, fibers, hybrid materials, or multi-phase systems.
- Generate mechanism-based hypotheses for new material combinations, architectures, or environmental interactions.
- Design controlled validation plans that separate component effects from emergent coupling effects.
- Iterate after a mechanism-performance mismatch or anomalous result.

Do not use this skill for operational deployment guidance, safety-critical engineering certification, hazardous procedural instructions, or as a substitute for domain-specific regulatory review.

# Inputs required

Before generating a plan, collect or infer:

- **Target system class and application context:** the functional domain and service environment.
- **Observed performance gap or behavior puzzle:** what is insufficient, anomalous, or unexplained.
- **Candidate interacting layers:** functional phase, structural scaffold, interface, surrounding medium, or life-stage classes.
- **Available evidence:** literature findings, preliminary data, simulation outputs, or conceptual analogies.
- **Constraints:** safety, environmental, regulatory, resource, or manufacturability limits.
- **Evaluation access:** experimental, computational, observational, or mixed validation modes available.

If any input is missing, state assumptions and mark resulting hypotheses as lower evidence strength.

# Core Workflow

Follow this ordered route from gap to bounded claim. Apply decision gates and iteration/stop conditions at each stage.

## 1. Gap framing and system decomposition

- Define the performance tension or behavioral puzzle in mechanism-coupling terms, not as a request to copy a reported system.
- Decompose the system into distinct interacting layers (e.g., active phase, scaffold, interface, environment).
- Identify which layer interactions are hypothesized to control the gap.
- **Decision gate:** If the gap cannot be framed as a testable interaction between layers, stop and refine the research question.

## 2. Hypothesis generation

- Generate 2–4 mechanism-linked hypotheses that change one dominant interaction at a time.
- For each hypothesis, record:
  - **Mechanism statement:** what should change under load, stimulus, or exposure.
  - **Design lever:** which layer variable tunes the mechanism.
  - **Expected metric signature:** the observable improvement if the mechanism is active.
  - **Evidence strength:** direct, indirect, analogy-based, or speculative.
  - **Key assumption:** what must be true for the hypothesis to hold.
  - **Likely failure mode:** how the hypothesis could fail (e.g., decoupling, degradation, confounding).
  - **Extrapolation boundary:** where the hypothesis should not be assumed valid.
- **Decision gate:** If no hypothesis can be falsified with available resources, stop and expand evaluation access or narrow the scope.

## 3. Validation ladder design

- Design a tiered validation plan that proceeds from component behavior to interface coupling to integrated performance to robustness:
  1. Confirm the active layer retains its intended function in isolation or simplified form.
  2. Confirm the interface or coupling layer participates in load, signal, or mass transfer.
  3. Confirm the integrated system improves the target endpoint relative to relevant controls.
  4. Probe robustness across boundary conditions (environment, reuse, substrate generality, or stage variation).
- Define independent variables by layer and fixed variables to be held constant.
- Define controls:
  - **Baseline:** unmodified system or no-pressure condition.
  - **Component-only:** each major layer evaluated separately.
  - **Weak-coupling:** layers present but not functionally integrated.
  - **Strong-coupling:** intended integrated configuration.
  - **Negative control:** a variant expected to suppress the proposed mechanism.
  - **Positive benchmark:** a literature-supported comparator when available.
- Define primary and secondary metrics spanning mechanism activation, coupling evidence, final performance, and trade-offs.
- Define stopping conditions: component failure, coupling failure, unacceptable trade-off, irreproducibility, or safety/ethical boundary violation.
- **Decision gate:** If controls cannot isolate the intended mechanism from confounders (mass, thickness, geometry, environment), redesign before proceeding.

## 4. Execution and data collection

- Collect data at three linked levels:
  - **Mechanism level:** activation, transition, or behavioral response signatures.
  - **Structure level:** morphology, distribution, retention, or mode-shape evidence.
  - **Performance level:** final functional metrics and trade-offs.
- Maintain replication, batch independence, and uncertainty quantification.
- Record deviations from the planned protocol and treat them as potential confounders.

## 5. Mechanism-performance alignment analysis

- Compare mechanism-level evidence against final performance using these interpretation rules:
  - **Mechanism improves but performance does not:** inspect interface coupling, distribution, load-path integration, or environmental masking.
  - **Performance improves but mechanism evidence is absent:** search for secondary mechanisms before claiming causality.
  - **Component-only controls explain most improvement:** downgrade the coupling or synergy claim.
  - **Environmental variation explains differences:** treat robustness as a primary research question, not a nuisance.
- Check data adequacy, replication consistency, and outlier influence before ranking.
- **Decision gate:** If data adequacy is insufficient (missing confounders, poor replication, ambiguous controls), return to step 4 or stop and redesign.

## 6. Iteration and update

- Classify the result into one of the following outcome classes:
  - **Mechanism supported:** layer and coupling evidence align with performance across controls.
  - **Interface-limited:** function exists but weakens after integration; vary coupling strategy (linker, orientation, density) without changing core components.
  - **Scaffold-limited:** function is promising but structural retention, distribution, or durability fails; vary structural phase or attachment.
  - **Measurement-limited:** controls or variability prevent interpretation; improve replication, calibration, or endpoint definitions.
  - **Application-limited:** performance improves but trade-offs violate target requirements; redefine the use case or prioritize a different functional layer.
- Choose the next move:
  - If supported, probe boundaries (broader substrates, durability, environmental relevance).
  - If limited, redesign the weakest layer and return to step 3.
  - If measurement-limited, return to step 4.
- **Stop condition:** If after two iteration cycles the mechanism remains unsupported, stop and reformulate hypotheses in step 2.

## 7. Claim bounding and documentation

- Limit claims to tested substrates, conditions, endpoints, and validation depth.
- Label each conclusion by evidence class: **paper-validated**, **model-supported**, or **agent-proposed**.
- Document residual risks, boundary conditions, and untested extrapolations.
- **Decision gate:** If claims cannot be bounded to tested conditions, stop and remove generalizations before output.

# Output Format

When using this skill, produce:

1. **Research question:** one-sentence, mechanism-focused question.
2. **System decomposition map:** layers, interactions, and suspected controlling pathways.
3. **Ranked hypotheses:** 2–4 hypotheses with evidence strength, key assumptions, likely failure modes, and extrapolation boundaries.
4. **Validation ladder:** tiered plan with variables, controls, primary/secondary metrics, and stopping conditions.
5. **Analysis plan:** rules for linking mechanism, structure, and performance evidence, including mismatch patterns.
6. **Iteration rules:** decision tree for each outcome class (supported, interface-limited, scaffold-limited, measurement-limited, application-limited).
7. **Validity and safety notes:** main confounders, boundary conditions, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

Before presenting conclusions, verify:

- The research question is framed as a testable mechanism, not as copying a reported system.
- Each hypothesis has a falsifiable prediction, evidence strength label, and stated boundary.
- Controls can separate component effects from coupling effects and from mass/geometry/artifacts.
- Metrics span mechanism activation, coupling, final performance, and trade-offs.
- Replication and uncertainty are sufficient to distinguish mechanism effects from noise.
- Environmental, boundary-condition, and stage-specific confounders are identified.
- Surface or morphological characterization is connected causally to performance rather than listed as decoration.
- New hypotheses are labeled by evidence strength and not treated as field consensus.

# Claim Boundaries

- Do not generalize from a single system, substrate, or condition to an entire material class or ecological domain.
- Do not present exploratory numerical, bench, or observational results as certified design capacity, code-compliant performance, or management prescription.
- Distinguish transferable methodological principles from system-specific observations.
- Treat the source literature as review-level evidence, not as universal consensus.
- Avoid claiming sustainability, safety, or clinical/environmental readiness without lifecycle, toxicity, leaching, durability, and regulatory evidence.

# Failure Modes

- **Mechanism falsification:** The proposed interaction does not occur under tested conditions.
- **Coupling failure:** Component functions exist but do not translate into integrated performance due to poor load-path, slip, or decoupling.
- **Measurement confounding:** Controls, variability, batch artifacts, or geometry differences prevent causal interpretation.
- **Trade-off violation:** Improvement in one required metric causes unacceptable degradation in another (e.g., stiffness vs. toughness, activity vs. durability).
- **Extrapolation failure:** Results depend on untested boundary conditions such as environment, life stage, loading regime, or substrate chemistry.
- **Replication failure:** Effects disappear across independent batches, specimens, preparations, or model parameter choices.

# Validity Checks

- **Confounders:** Document geometry, thickness, boundary conditions, material source, processing history, moisture, temperature, and environmental exposure.
- **Model and statistical validity:** Check convergence, mesh sensitivity, replication, pre-specified endpoints, effect size, and sensitivity ranges.
- **Mechanism consistency:** Ensure that mechanism trends, structure evidence, damage maps, and performance metrics tell a coherent story.
- **Reproducibility:** Provide input definitions, versioned assumptions, convergence criteria, and output metrics sufficient for independent reproduction.
- **Boundary conditions:** State the domain of applicability for material class, geometry, loading, environment, and life-stage structure.

# Provenance

- Synthesized from cluster 49.2 (composite-fiber-radical-natural-mechanism-discovery-workflow), count 61.
- Source skills: bioinspired-antifreeze-surface-exploration; stf-fiber-impact-research-design; composite-thin-wall-stability-explorer; natural-fiber-composite-research-exploration; indirect-ecology-dynamics-exploration; recoverable-photocatalytic-water-treatment-workflow; natural-fiber-composite-research-workflow; bio-fiber-fff-composite-research-design.
- Represents a semantic merge of end-to-end mechanism discovery and validation patterns across material and ecological domains, abstracting shared workflow structure without retaining paper-specific systems, parameters, or conclusions.
