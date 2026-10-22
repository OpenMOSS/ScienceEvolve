---
name: sci-fiber-composite-fiber-interface-battery-mechanism-d-6d5f718f
description: Reusable end-to-end research workflow for observable-driven mechanism discovery and validation in composite, fiber, interface, and battery systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface battery mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides the design of transferable research plans for systems where an observable failure, degradation, or property limitation is driven by a hidden structural, interfacial, or transport mechanism. It emphasizes mechanism-first hypothesis generation, discriminating controls, multi-modal evidence triangulation, iterative claim bounding, and explicit trade-off analysis rather than copying any specific material system or paper conclusion.

# When to use

Use this skill when the user asks to:
- Propose new research questions or hypotheses for composite, fibrous, porous, or interfacial material systems.
- Design non-operational experimental plans to connect structure, interface chemistry, or architecture to electrochemical, mechanical, optical, or separation performance.
- Validate a proposed mechanism across multiple measurement families.
- Iterate on a candidate design after initial results.

Applicable domains include, but are not limited to, energy-storage interfaces, absorbent membranes, anisotropic porous architectures, soft interfacial materials, and hybrid biomaterial scaffolds.

Do not use this skill as a protocol for assembling devices, executing fabrication recipes, operating hazardous equipment, or providing clinical or manufacturing instructions.

# Inputs required

Before generating a plan, obtain or infer:

- **Target system and dominant observable failure mode**: the degradation symptom or performance gap to be explained.
- **Candidate variable(s)**: the structural, chemical, or architectural factor expected to alter the mechanism.
- **Suspected bottleneck**: the intermediate, interface, transport pathway, or microstructural feature believed to couple the variable to the observation.
- **Available measurement families**: electrochemical, spectroscopic, microscopic, mechanical, transport, computational, or other orthogonal readouts.
- **Reference systems**: stable baseline, unstable or positive reference, and negative-control options.
- **Constraints**: safety, environmental, materials availability, measurement access, and regulatory boundaries.

If any input is missing, state assumptions explicitly and ask the user to confirm them before producing a final design.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Failure mode characterization
- Define the observable degradation or limitation in reproducible terms.
- Separate the symptom from the putative root cause.
- **Gate**: If the failure mode is not observable or reproducible under baseline conditions, stop and refine the observation protocol before hypothesizing.

## 2. Mechanism mapping
- Construct a causal chain: candidate variable → molecular/interfacial/structural change → intermediate or local behavior → macroscopic observable.
- Identify the weakest link and the boundary beyond which the chain may break.
- **Gate**: If any link lacks physical plausibility or cannot be probed with available measurements, return to Step 1 or request additional capabilities.

## 3. Hypothesis generation
- Generate at least three ranked hypotheses using a structured template:
  - **Hypothesis**: concise causal claim.
  - **Evidence strength**: high, medium, or low.
  - **Key assumption**: condition that must hold.
  - **Predicted signatures**: expected trends in at least two independent measurement families.
  - **Possible failure mode**: alternative explanation or breakdown condition.
  - **Discriminating observation**: the specific result that would distinguish this hypothesis from its nearest competitor.
- Prioritize hypotheses that are falsifiable, explain multiple measurement families, and do not rely on copying source-specific chemistries or conditions.
- **Gate**: If no hypothesis can be tested with feasible controls, redesign the variable set or stop.

## 4. Minimum viable validation design
- **Independent variables**: change one dominant factor at a time; if factors are coupled, label outcomes as system-level observations rather than mechanism-specific proofs.
- **Dependent variables**: span structure, interface, transport, and performance domains.
- **Controls**:
  - Stable reference (expected robust behavior).
  - Unstable or positive reference (confirms metric sensitivity to the failure mode).
  - Negative control (removes or minimizes the suspected driver).
  - Process-matched control (isolates processing or geometry artifacts).
  - Component-isolation control (isolates scaffold, matrix, filler, or active-layer effects).
- Predefine success criteria, failure criteria, and stop conditions before data collection.
- **Gate**: If the control set cannot isolate the proposed mechanism, redesign before proceeding.

## 5. Multi-modal evidence collection
- Gather orthogonal data aligned with each link in the causal chain.
- Collect structural or interfacial evidence before attributing performance changes to mechanism.
- **Gate**: If a critical measurement family is missing, flag all downstream mechanism claims as conditional.

## 6. Triangulated analysis
- Confirm data quality, metadata, and replicate identity.
- Normalize comparisons against common references and definitions.
- Separate mechanism evidence from performance evidence:
  - Do not infer interfacial chemistry solely from performance trends.
  - Do not infer structural stability solely from cycling or durability data.
- Require convergence across at least two independent measurement families to strengthen a claim.
- Quantify uncertainty and explicitly test competing explanations.
- **Gate**: If orthogonal readouts contradict the proposed mechanism, pause to investigate confounders, measurement artifacts, or alternative causes.

## 7. Mechanism classification and claim bounding
- Label each claim:
  - **Verified**: supported by direct measurements and appropriate controls in the current system.
  - **Inferred**: plausible and supported by multiple indirect readouts.
  - **Speculative**: proposed for a new system or condition and not yet validated.
  - **Unsupported**: contradicted by evidence or lacking any supporting readout.
- State boundary conditions for extrapolation (chemistry, architecture, loading, environment).
- **Gate**: If evidence is single-modal, downgrade the claim strength accordingly.

## 8. Iteration or redesign
- Compare predicted signatures with observed signatures.
- **If supported**: escalate to harder boundary conditions (e.g., higher loading, longer duration, broader environment).
- **If partially supported**: add discriminating controls or refine the hypothesis.
- **If unsupported**: reject the hypothesis and return to Step 3.
- **Stop conditions**:
  - Controls show the same trend as the candidate (no specific effect).
  - Trade-off penalties dominate benefits.
  - Replicate variability prevents interpretation.
  - Safety or reproducibility thresholds are breached.
  - Orthogonal measurements repeatedly contradict the proposed mechanism.

# Output Format

When using this skill, return the following sections:

1. **Research question**: one-sentence problem definition and target failure mode.
2. **Mechanism map**: causal chain from candidate variable to interfacial/structural behavior to system-level outcome.
3. **Hypotheses table**: for each hypothesis, evidence strength, key assumption, predicted signatures across measurement families, possible failure mode, and discriminating observation.
4. **Experimental design**: minimum viable validation, variable structure, control set, evaluation metrics, and predefined stop conditions.
5. **Analysis plan**: data-quality checks, triangulation strategy, uncertainty treatment, and alternative-explanation tests.
6. **Iteration plan**: rules for promoting, revising, or stopping hypotheses based on outcome patterns.
7. **Claim boundary statement**: classification of each claim (verified, inferred, speculative, unsupported) and extrapolation limits.
8. **Validity and safety notes**: confounder checks, reproducibility expectations, boundary conditions, and non-operational safety boundaries.

# Validation Gates

Before advancing between stages or presenting conclusions, confirm:

- **Reproducibility gate**: baseline and reference behaviors are consistent across replicates.
- **Control gate**: the control set can falsify the primary hypothesis.
- **Triangulation gate**: at least two independent measurement families are available to probe the mechanism.
- **Confounder gate**: known nuisance variables (processing, geometry, loading, impurities, handling history) are identified and either controlled or reported.
- **Safety gate**: the next step does not require unapproved hazardous operations, executable high-risk parameters, or bypassing institutional review.

# Claim Boundaries

- Distinguish **verified** (direct evidence + proper controls in the tested system), **inferred** (indirect but convergent evidence), **speculative** (plausible but untested in the target system), and **unsupported** claims.
- Do not generalize beyond tested chemistry, architecture, loading, format, or environment without independent validation.
- Do not present single-study findings as field consensus.
- Use computational or theoretical descriptors only as mechanistic support, not as proof of device-level behavior.

# Failure Modes

Ways the workflow or its outputs can fail or mislead:

- **Confounding**: uncontrolled processing, geometry, thickness, loading, or environmental variables mimic or mask the intended mechanism.
- **Single-modal attribution**: interpreting a performance gain as mechanism proof without orthogonal structural, interfacial, or transport evidence.
- **Trade-off blindness**: optimizing one metric while ignoring degradation of another essential property.
- **Premature extrapolation**: extending low-stress or short-duration results to practical systems without boundary testing.
- **Control failure**: continuing after controls behave identically to candidates or after negative controls fail to suppress the suspected driver.
- **Variability neglect**: ignoring replicate inconsistency or batch effects, leading to false mechanism attribution.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- Are stable, unstable, and negative controls interpretable?
- Are candidate and reference systems comparable except for the intended variable?
- Could processing history, loading, thickness, impurity, temperature, or handling explain the result?
- Are post-test assignments consistent with in-situ or time-resolved evolution?
- Are computational descriptors used only as support, not proof?
- Are claims limited to the tested system unless independent validation supports extrapolation?
- Are limitations, ambiguous results, and failed hypotheses reported rather than omitted?

# Provenance

Synthesized from cluster 60.0 (composite-fiber-interface-battery-mechanism-discovery-workflow) source skills: `li-sulfur-battery-interface-research`, `metal-sulfur-soluble-intermediate-control`, `li-o2-cathode-research-pattern`, `fibrous-oil-absorbent-research-workflow`, `thz-anisotropic-aerogel-research-design`, `reversible-interfacial-soft-materials-research`, `hybrid-biomaterial-scaffold-research-design`, `li-s-battery-binder-exploration`.
