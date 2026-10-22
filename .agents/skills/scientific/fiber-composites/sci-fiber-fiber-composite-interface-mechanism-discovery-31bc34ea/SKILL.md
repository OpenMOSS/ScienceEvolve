---
name: sci-fiber-fiber-composite-interface-mechanism-discovery-31bc34ea
description: A reusable workflow for generating hypotheses, designing controlled experiments, and validating interface- or architecture-driven mechanisms in fiber-reinforced composite and fibrous material systems through orthogonal evidence and iterative discrimination.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent to discover and validate interface- or architecture-driven mechanisms in fiber-reinforced composites and fibrous material systems. The workflow transfers a reusable pattern: frame a performance gap as a multiscale mechanistic question, generate evidence-graded hypotheses, design minimal controlled validations with orthogonal measurements, and iterate until claims are bounded or rejected.

# When to use

Use this skill when a user asks to explore new fiber-reinforced composites, protective or responsive fibrous materials, natural-fiber architectures, or microstructure-sensitive systems where performance is governed by interfaces, reinforcement geometry, multiscale interactions, or coupled functional layers. It is most useful for moving from an initial observation or literature pattern to a new material system, research question, or validation plan.

# Inputs required

- **Target performance gap:** the application-centered limitation (e.g., load transfer, transport barrier, signal stability, defect recovery) and intended deployment context.
- **Candidate material classes:** reinforcement/fiber family, matrix/substrate family, and any functional coating or interlayer categories at a non-operational level.
- **Suspected mechanism variables:** interface quality, architecture type, dispersion state, porosity, orientation, or microstructural heterogeneity.
- **Available evidence:** prior data, imaging, mechanical or thermal measurements, literature context, or preliminary observations.
- **Constraints:** safety boundaries, measurement access, reproducibility expectations, scalability, and acceptable stopping conditions.

# Core Workflow

1. **Frame the gap and mechanism space**
   - Define the bottleneck as a mismatch between a required function and a practical failure mode (e.g., stress transfer, environmental robustness, transport selectivity, signal drift).
   - Separate function from material: treat the system as interacting layers (reinforcement, matrix, interface, protective shell, responsive layer) rather than a single material.
   - Identify the dominant mechanism class (interfacial load transfer, architecture-driven transport, microstructural heterogeneity, defect evolution, or coupled functional response).

2. **Generate candidate hypotheses**
   - For each candidate mechanism, produce a hypothesis table containing: claim, expected observation, key assumption, evidence strength (strong / moderate / weak / speculative), and likely failure mode.
   - Label evidence origin: directly observed, source-paper-supported pattern, domain-informed inference, or speculative extension.
   - Avoid overgeneralization: do not treat a single demonstrated system as field-wide consensus.

3. **Design minimal viable validation**  
   *[Decision Gate: Are the hypothesis, controls, and metrics defined? If not, return to Step 2.]*
   - Select one dominant mechanism variable to vary while matching non-target variables (e.g., comparable fiber volume, thickness, processing route, or loading direction).
   - Define essential controls:
     - **Baseline:** unmodified system or neat matrix.
     - **Negative control:** a condition expected to weaken the target mechanism.
     - **Positive benchmark:** an established comparator with documented behavior, if available.
     - **Process/sham control:** fabrication, handling, or environmental exposure without the target stimulus or modification.
   - Choose orthogonal metrics: at least one structural or morphological measurement and one performance measurement.
   - Predefine failure criteria and stop conditions (e.g., inconsistent fabrication, control failure, excessive variability, unresolved overlapping signals).

4. **Collect and preprocess evidence**
   - Record data provenance, sample origin, preprocessing choices, and normalization basis.
   - Normalize comparisons (e.g., by density, fiber volume fraction, areal density, thickness, or loading direction) before attributing differences to the target mechanism.
   - Flag artifacts, boundary effects, anisotropy, segmentation bias, or measurement drift.

5. **Discriminate mechanisms**  
   *[Decision Gate: Do at least two independent evidence streams converge? If not, classify as inconclusive.]*
   - Cross-match signals: do not assign a mechanism from a single metric alone.
   - Separate component effects from interaction effects (e.g., compare neat matrix versus composite, or protected versus unprotected architecture).
   - Diagnose trade-offs: if one metric improves while another degrades, identify the coupling mechanism rather than optimizing in isolation.
   - Classify each result as supports, weakly supports, contradicts, or inconclusive.

6. **Iterate or redesign**
   - **If evidence supports the hypothesis:** escalate to broader validation (durability, environmental exposure, application-like conditions) or refine the next most uncertain variable.
   - **If evidence is inconclusive:** inspect confounders (moisture, voids, orientation, resolution, connector artifacts, threshold bias) and redesign with tighter controls or additional orthogonal measurements.
   - **If evidence contradicts the hypothesis:** return to Step 2 to revise the mechanism map or abandon the branch.
   - *[Stop Condition]* Stop when safety boundaries are exceeded, reproducibility is poor, baseline controls fail, the mechanism remains unsupported after redesign, or boundary effects dominate the sampled volume.

7. **Bound claims and plan transfer**
   - Label each claim as directly observed, source-paper-supported, transferable inference, or speculative extension.
   - State non-extrapolation boundaries: material class, architecture family, processing route, environmental range, loading mode, and measurement regime.
   - Define what additional evidence would be required to generalize beyond the tested boundary.

# Output Format

Return a research plan with the following structure:

1. **Research question and gap diagnosis:** the bottleneck and why it matters.
2. **Mechanism model and hypothesis table:** claims, expected observations, evidence strengths, assumptions, and failure modes.
3. **Experimental design matrix:** variables, essential controls, orthogonal metrics, and predefined stop/failure conditions.
4. **Analysis and normalization plan:** preprocessing rules, cross-method matching, trade-off diagnosis, and uncertainty handling.
5. **Iteration decision tree:** how supportive, ambiguous, or contradictory results update the hypothesis and trigger redesign or escalation.
6. **Validity, safety, and claim-boundary notes:** confounders, reproducibility requirements, ethical constraints, and limits of generalization.

# Validation Gates

- **Control adequacy:** Every hypothesis must be paired with a baseline, a negative or weakened-mechanism control, and a relevant benchmark or positive control where available.
- **Orthogonality:** Mechanism claims require at least two independent measurement types (e.g., morphology + performance, or volumetric + calorimetric + microstructural).
- **Normalization:** Comparisons must be performed on matched bases (fiber volume, thickness, density, loading direction, resolution, or field of view).
- **Reproducibility:** Replicate counts and variability must be reported; best-case traces alone are insufficient.
- **Stop criteria:** Failure and stop conditions must be predefined before data collection begins.

# Claim Boundaries

- Do not convert single-system observations into field-wide consensus.
- Do not propose clinical, structural-safety, autonomous-alert, or regulatory-certification conclusions without independent validation and qualified oversight.
- Distinguish prototype demonstrations from certified monitoring or application-ready materials.
- Limit performance claims to the tested material class, architecture, processing route, and environmental window.
- Treat source-paper-supported patterns as evidence for their original context only; extensions to new chemistries, substrates, or hazards are hypotheses.

# Failure Modes

- **Confounded variables:** Uncontrolled changes in density, orientation, void content, moisture, processing history, sample geometry, or thermal history simultaneously with the intended factor.
- **Single-metric inference:** Assigning a mechanism from one measurement alone (e.g., inferring interface quality from modulus only, or barrier performance from contact angle only).
- **Overgeneralization:** Extending a successful material pairing or architecture to all polymers, fillers, fiber families, geometries, or environments.
- **Control failure:** Baseline or benchmark systems behaving unexpectedly, invalidating comparative claims.
- **Imaging or segmentation artifact:** Boundary truncation, insufficient resolution, noise, threshold bias, or non-representative sampling in microstructure studies.
- **Overlapping signals:** Unresolved stages in thermal, mechanical, or transport measurements leading to ambiguous mechanism assignment.
- **Trade-off neglect:** Optimizing one metric while ignoring degradation of another required property.

# Validity Checks

- **Confounding factors:** Explicitly list and control for moisture, fiber length distribution, void fraction, porosity, anisotropy, processing route, sample geometry, and environmental conditioning.
- **Replication and variability:** Use multiple independently prepared samples and report variation; avoid cherry-picked regions or best-case traces.
- **Statistical validity:** Use predefined metrics, uncertainty estimates, effect sizes, and independent test splits for models.
- **Mechanism consistency:** Ensure the proposed mechanism explains observations across scales (yarn → fabric → composite, or processing → morphology → performance).
- **Boundary conditions:** Document intended strain, stimulus frequency, environmental range, loading mode, and deployment context before claiming usefulness.
- **Negative evidence:** Record failed hypotheses, unsupported conditions, and contradictory results to define the boundary of transferability.
- **External validity:** State whether conclusions apply only to the tested material system, imaging regime, or processing route.

# Provenance

- Synthesized from cluster 5.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: `bioinspired-fiber-strain-sensor-exploration`, `hybrid-fiber-composite-research-design`, `natural-fiber-reinforcement-exploration`, `flame-retardant-fiber-exploration`, `biobased-fiber-composite-research-design`, `microstructure-microct-research-workflow`, `breathable-protective-fiber-exploration`, `spd-ufg-defect-annealing-exploration`.
