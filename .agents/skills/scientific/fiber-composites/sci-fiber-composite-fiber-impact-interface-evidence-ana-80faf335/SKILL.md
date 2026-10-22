---
name: sci-fiber-composite-fiber-impact-interface-evidence-ana-80faf335
description: Observable-driven evidence analysis and claim audit for composite, fiber, and multiscale material systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber impact interface evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to design and execute reusable end-to-end research workflows for composite, fiber-reinforced, and multiscale material systems. The workflow emphasizes starting from observable anomalies or functional gaps, generating mechanism-driven hypotheses, validating structure before physics, and auditing claims against multi-modal evidence with strict boundary conditions.

# When to use

Use when the user asks to propose new research questions, validate mechanisms, audit claims, or design experiments and simulations for composite, fibrous, architected, or heterogeneous material systems where microstructure, interface, geometry, or processing state may control performance. Applicable across domains including textile composites, lattice structures, hybrid sustainable composites, battery separators, and nanostructured materials, provided the core task is evidence analysis and claim audit rather than operational fabrication or recipe execution.

# Inputs required

Before producing a plan, collect or infer:

- **Observable anomaly or functional gap:** the mismatch, failure mode, or unexpected behavior to explain.
- **Material and architecture class:** target system family and relevant length scales.
- **Current model or baseline:** accepted assumptions and known limitations.
- **Available evidence types:** imaging, tomography, simulation, mechanical testing, transport measurements, spectroscopy, or thermal analysis.
- **Candidate mechanisms:** structural, interfacial, defect-driven, or measurement-artifact explanations.
- **Constraints:** safety boundaries, ethics, measurement access, non-operational scope, and acceptable evidence strength.

# Core Workflow

Execute the following ordered route. Do not skip a gate; if a gate fails, iterate or stop.

1. **Anomaly Framing & Gap Definition**
   - State the observable mismatch as a relationship between a structural or process variable and a measurable response.
   - Separate symptoms from candidate mechanisms.
   - **Gate:** Is the anomaly tied to at least one measurable observable? If not, stop and refine the question.

2. **Mechanism Hypothesis Generation**
   - Generate 3–5 falsifiable mechanism hypotheses.
   - For each hypothesis record: evidence strength (strong/moderate/weak/speculative), key assumptions, discriminating prediction, likely failure mode, and transferability boundary.
   - Rank hypotheses by their ability to explain the anomaly and their testability with available evidence.
   - **Gate:** Are the top hypotheses distinguishable by at least one planned observable? If not, redesign the evidence strategy before proceeding.

3. **Structural / Observable Validation (Geometry-First Gate)**
   - Validate geometry, microstructure, or observable features before interpreting downstream properties.
   - Check fidelity, reproducibility, continuity, defects, segmentation uncertainty, and representative-unit adequacy.
   - **Gate:** Does the observable evidence support the structural premise with acceptable uncertainty? If no, iterate reconstruction, improve measurement, or stop.

4. **Minimal Viable Validation Design**
   - Design a staged experiment or simulation matrix around the leading hypothesis.
   - Define: baseline condition, negative control, positive control, and mechanism-isolation controls (e.g., structure-only, chemistry-only, component-ablation, idealized-geometry).
   - Specify independent variables, response variables, nuisance variables, primary metrics, mechanistic metrics, and evaluation criteria.
   - **Stop conditions:** geometry is irreproducible; controls fail; the mechanism is not identifiable; safety or compliance boundaries would be violated.

5. **Multi-Modal Evidence Collection**
   - Collect evidence across scales and modalities (e.g., imaging, simulation, transport, mechanical, spectroscopic).
   - Maintain independence between calibration evidence and validation evidence where possible.
   - Document sample identity, preparation history, measurement configuration, and uncertainty sources.

6. **Cross-Probe Analysis & Mechanism Discrimination**
   - Compare results against controls first; avoid ranking by absolute performance alone.
   - Build a structure-property-performance map and identify whether trends track morphology, chemistry, or their interaction.
   - Require consistency between global response and local signatures (damage sequence, morphology, internal fields, transport pathways).
   - Perform sensitivity or robustness analysis on uncertain parameters.
   - **Gate:** Does evidence from multiple modalities converge on one mechanism while excluding alternatives? If ambiguous, flag residual confounding and proceed to targeted iteration.

7. **Claim Audit & Bounding**
   - Classify each hypothesis as supported, partially supported, rejected, or unresolved.
   - Bound claims to the tested material family, architecture, scale, loading mode, and measurement context.
   - Explicitly separate verified observations, field-supported claims, model-inferred results, and agent-proposed extrapolations.
   - **Gate:** Are all claims limited to the validated boundary? If not, trim or downgrade the claim.

8. **Iteration or Redesign**
   - **If supported:** test transferability by expanding one boundary at a time (new geometry, material, loading mode, scale, or environment).
   - **If ambiguous:** add one targeted control or diagnostic measurement to resolve the dominant uncertainty.
   - **If rejected:** return to Step 2 with a revised mechanism map.
   - **Stop conditions:** repeated control failure; mechanism remains non-identifiable after targeted iteration; resource or safety limits reached; the anomaly is attributable to measurement artifact.

# Output Format

When using this skill, produce:

1. **Research question and anomaly framing** — one concise sentence tied to a measurable mismatch.
2. **Mechanism map** — candidate mechanisms, expected effects, and likely confounders.
3. **Ranked hypotheses table** — hypothesis, evidence strength, key assumptions, discriminating prediction, likely failure mode, and boundary.
4. **Validation plan** — groups, controls, variables, metrics, minimal viable validation steps, and stop conditions.
5. **Analysis plan** — control-first comparison rules, cross-probe consistency checks, sensitivity analysis, and decision criteria.
6. **Claim boundary statement** — what is verified, what is inferred, and what limits transferability.
7. **Iteration path** — decision rules for supported, ambiguous, and rejected outcomes.
8. **Validity and safety notes** — confounders, reproducibility requirements, non-operational scope, and compliance boundaries.

# Validation Gates

- Observable-to-anomaly linkage confirmed.
- Hypotheses are mutually distinguishable by planned evidence.
- Geometry / microstructure / observable fidelity verified before physics interpretation.
- Control set includes negative, positive, and mechanism-isolation conditions.
- Calibration and validation evidence are independent where feasible.
- Cross-probe consistency required for mechanism acceptance.
- Claims are strictly bounded to tested conditions.

# Claim Boundaries

- Limit conclusions to the tested material class, architecture family, length scale, loading regime, and environmental context.
- Do not treat single-study or single-sample results as field-wide consensus.
- Distinguish four evidence tiers: verified by source observation, supported by broader literature, inferred from model or simulation, and agent-proposed for the new system.
- Performance claims must be accompanied by mechanism evidence; correlation alone is insufficient.
- Do not extrapolate to safety-critical deployment, certification, or commercial readiness without component-scale validation and professional review.

# Failure Modes

- Visual or morphological resemblance mistaken for functional equivalence.
- Geometry or microstructure is irreproducible, unrepresentative, or dominated by artifacts.
- Confounding by processing history, defects, boundary conditions, measurement artifacts, or uncontrolled variables.
- Over-interpretation of simulation or model output without independent physical validation.
- Single-metric improvement masking detrimental trade-offs in durability, safety, or other properties.
- Mechanism non-identifiability due to missing isolation controls.
- Unsafe or non-compliant operational recommendations introduced despite non-operational scope.

# Validity Checks

- **Confounding:** Are composition, processing, geometry, boundary conditions, and history controlled or explicitly reported?
- **Reproducibility:** Are observations repeated across samples, batches, instruments, or analysis pipelines?
- **Statistical validity:** Are variability, uncertainty, sample size, and effect size addressed rather than hidden behind a single curve or image?
- **Mechanistic validity:** Is the claim supported by multi-modal mechanism evidence, not only by global response fit?
- **Boundary validity:** Are conclusions restricted to the domain actually tested?
- **Safety and ethics:** Are outputs maintained at the research-design level without executable hazardous protocols, and are institutional safety and compliance requirements flagged?

# Provenance

- Synthesized from cluster 35.0 (`composite-fiber-impact-interface-evidence-analysis-workflow`).
- Source skills: `biomimetic-voronoi-lattice-exploration`, `fibrous-preform-process-structure-property`, `fiber-composite-mesostructure-exploration`, `multiscale-composite-failure-exploration`, `sustainable-hybrid-composite-exploration`, `melt-blown-fiber-attenuation-research`, `nanostructured-materials-research-workflow`, `lithium-metal-separator-research-design`.
- Workflow archetype: observable-driven evidence analysis and claim audit.
