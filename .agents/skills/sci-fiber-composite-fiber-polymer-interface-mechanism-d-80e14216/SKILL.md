---
name: sci-fiber-composite-fiber-polymer-interface-mechanism-d-80e14216
description: Reusable end-to-end workflow for discovering and validating dominant mechanisms in composite, fiber, and polymer interface systems through controlled observation, multiscale triangulation, and iterative hypothesis refinement.
scienceevolve-title: "Fiber composites and battery materials · composite fiber polymer interface mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to transform a materials performance gap into a falsifiable mechanism-discovery program for composite, fiber-reinforced, or polymer systems where interfaces, architecture, and processing govern behavior. The workflow emphasizes observable-driven inference: generate competing mechanism hypotheses, design minimal validation studies with strong controls, triangulate across experiments and models, and iterate until the dominant mechanism is either supported, excluded, or bounded.

# When to use

Use when the user asks to:
- Explore why a composite, fiber, or polymer system behaves as it does (strength, toughness, creep, fatigue, impact, delamination, damage).
- Generate research questions and hypotheses about interface, microstructure, or architecture-driven mechanisms.
- Design non-operational validation plans that combine mechanical testing, imaging, and simulation.
- Interpret multiscale or multimodal data to discriminate between competing failure or deformation mechanisms.
- Iterate a study based on partial, ambiguous, or conflicting evidence.

Do not use to provide executable lab recipes, hazardous procedures, material fabrication parameters, or safety-critical certification.

# Inputs required

Before executing the workflow, collect or infer:
- **System scope**: material classes (fiber, matrix, interface), architecture, and non-operational processing context.
- **Performance bottleneck**: the macroscopic anomaly, gap, or failure mode driving the inquiry.
- **Candidate mechanisms**: competing hypotheses for the bottleneck (e.g., interfacial debonding, matrix cracking, fiber pull-out, viscoelastic relaxation, crack deflection).
- **Evidence inventory**: available or accessible data types (mechanical response, microscopy, spectroscopy, scattering, simulation, literature benchmarks).
- **Constraints**: safety boundaries, reproducibility needs, environmental limits, and institutional review context.
- **Comparator baseline**: the untreated, standard, or reference system against which changes are judged.

# Core Workflow

An ordered, end-to-end route with decision gates and iteration/stop conditions.

## Stage 1: Frame and Taxonomize
1. **Anchor on a performance mismatch** — Start from an observable macroscopic gap (stiffness loss, premature failure, rate dependence, environmental sensitivity) rather than a material label.
2. **Build a mechanism taxonomy** — List competing candidate mechanisms. Define each by its physical cause, expected observable signature, and failure consequence. Distinguish initiation from propagation phenomena where relevant.
3. **Map to normalized variables** — Identify dimensionless or structural variables (geometry ratios, loading rates, environmental exposure, architecture parameters) expected to shift the balance between mechanisms.
4. **Gate 1 (Stop/Refine):** If the bottleneck cannot be linked to at least two distinguishable candidate mechanisms, stop and gather more observational context before proceeding.

## Stage 2: Generate Ranked Hypotheses
1. **State mechanism-first hypotheses** — For each candidate, specify: design lever → microstructural mechanism → measurable performance effect → boundary condition where the effect should appear.
2. **Assign evidence strength** — Label each hypothesis as strong, moderate, or weak based on prior support, mechanistic plausibility, and system similarity.
3. **List assumptions and failure modes** — Document key assumptions (interface quality, uniformity, environmental state) and explicit failure modes (hidden defects, confounding variables, measurement artifacts).
4. **Gate 2 (Stop/Refine):** If no hypothesis can be falsified by available or obtainable evidence, redesign the study scope or measurement package.

## Stage 3: Design Minimal Validation
1. **Define a minimal viable experiment** — Select the smallest set of comparisons needed to discriminate the top hypotheses from process artifacts.
2. **Establish controls** — Include a baseline, a negative control (mechanism suppressed or absent), and a positive/benchmark control where feasible. Match mass, thickness, architecture, and boundary conditions across groups.
3. **Select orthogonal protocols** — Choose measurement families that stress different time scales or length scales (e.g., monotonic, cyclic, creep; macroscopic response, full-field strain, post-mortem morphology).
4. **Pre-register metrics and stop conditions** — Define primary and secondary endpoints, failure criteria (no performance gain, indistinguishable controls, new damage mode), and safety/compliance stop conditions before data collection.
5. **Gate 3 (Stop/Refine):** If controls cannot be matched or the mechanism cannot be isolated from confounders, pause and redesign the comparison matrix.

## Stage 4: Execute and Triangulate Evidence
1. **Collect multimodal data** — Gather mechanical response, imaging/morphology, and environmental metadata under consistent conditions.
2. **Check data integrity** — Confirm specimen identity, calibration, alignment, boundary conditions, and unit consistency before interpretation.
3. **Normalize and classify** — Adjust for geometry, mass, or thickness differences. Classify dominant damage/failure modes from morphology independent of performance rankings.
4. **Cross-scale linkage** — Connect macroscopic performance trends to microstructural signatures. Require agreement across at least two independent evidence types before advancing a mechanism claim.
5. **Gate 4 (Iterate/Stop):** If independent evidence types disagree (e.g., simulation predicts a different failure mode than microscopy), flag the mechanism as unresolved and recalibrate models or measurements.

## Stage 5: Discriminate and Bound Claims
1. **Compare against predictions** — Evaluate whether observed signatures match the pre-registered predictions of each hypothesis.
2. **Exclude or downgrade** — Reject hypotheses contradicted by controls or morphology. Downgrade confidence where evidence is ambiguous.
3. **Bound the claim** — State the precise conditions (material class, architecture, loading mode, environment) under which the supported mechanism applies. Avoid universal generalization.
4. **Gate 5 (Iterate/Stop):** If all hypotheses remain ambiguous after triangulation, return to Stage 2 to refine the mechanism taxonomy or add discriminating controls.

## Stage 6: Iterate or Redesign
1. **Update the mechanism map** — Add, split, or merge mechanisms based on new evidence.
2. **Target transition boundaries** — If a mechanism is supported, test near its expected boundary to find where it loses dominance.
3. **Broaden or narrow scope** — Decide whether the next cycle should vary material, geometry, environment, or modeling assumptions.
4. **Stop condition:** Terminate when the dominant mechanism is reproducibly identified and bounded, when the bottleneck is resolved, or when further iteration is blocked by safety, resource, or feasibility limits.

# Output Format

When using this workflow, produce:
1. **Research question** — One sentence linking the performance bottleneck to a mechanism-sensitive inquiry.
2. **Mechanism taxonomy** — Candidate mechanisms with expected signatures and possible failure modes.
3. **Ranked hypotheses table** — Hypothesis, evidence strength, key assumptions, predicted observations, likely failure modes, and minimal validation tests.
4. **Study design plan** — Baseline, controls, independent/controlled variables, orthogonal protocols, metrics, and stop conditions.
5. **Analysis plan** — Data integrity checks, normalization rules, mechanism classification, cross-scale linkage logic, and uncertainty handling.
6. **Iteration decision log** — Evidence summary, hypothesis update, next experiment, and stop/continue rationale for each cycle.
7. **Validity and boundary statement** — Confounding checks, reproducibility requirements, extrapolation limits, and evidence-strength labels.

# Validation Gates

- **Mechanism distinguishability**: Each candidate must have a unique observable signature or protocol response.
- **Control stability**: Baseline and negative controls must behave plausibly before interpreting modified designs.
- **Cross-scale agreement**: Mechanism claims require concordance between at least two of {mechanical response, morphology/imaging, simulation, environmental probe}.
- **Statistical adequacy**: Variability, replication, and uncertainty must be reported; avoid claiming optima or boundaries from unreplicated data.
- **Model validity**: Simulation or theoretical predictions must be checked against independent experimental observations, not just training data.

# Claim Boundaries

- Limit conclusions to the tested material family, fiber architecture, matrix class, interface state, loading mode, and environmental conditions.
- Do not certify systems for protective, structural, or safety-critical use without domain-specific standards review.
- Distinguish `source-supported` (directly validated in referenced skills), `literature-supported`, and `agent-inferred` claims.
- Avoid transferring exact numerical results, processing recipes, or parameter sets across material systems.

# Failure Modes

- **Confounded comparison**: Apparent mechanism effect is actually due to mass, thickness, void content, moisture, processing history, or geometry differences.
- **Single-scale fallacy**: Performance improvement is claimed without microstructural evidence linking it to the proposed mechanism.
- **Overgeneralization**: A mechanism supported in one architecture or loading mode is assumed universal.
- **Model-experiment mismatch**: Simulation supports the hypothesis but fails on independent validation; parameters may be overfit.
- **Control failure**: Negative or baseline controls show unexpected behavior, invalidating the comparison.
- **Hidden damage mode**: A new failure pathway (e.g., delamination, agglomeration, environmental degradation) emerges and masks the target mechanism.

# Validity Checks

Before finalizing any output:
- **Confounding**: Did the design lever unintentionally alter density, volume fraction, alignment, or boundary conditions?
- **Representativeness**: Is the loading scenario and specimen architecture justified for the research question?
- **Reproducibility**: Are replicates, batch variation, and measurement consistency documented?
- **Measurement validity**: Do endpoints directly address the hypothesized mechanism?
- **Extrapolation**: Are claims restricted to the tested regime, with explicit boundaries for rate, temperature, humidity, and scale?
- **Safety and ethics**: Is the plan limited to non-operational research design, with hazardous or certification-bound details excluded?

# Provenance

- Derived from cluster 35.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `hybrid-composite-ballistic-exploration`, `aramid-wrapped-yarn-structure-optimization`, `natural-fiber-composite-creep-exploration`, `mechanism-map-experimental-design`, `colloidal-chain-research-exploration`, `supramolecular-nanotribology-research-pattern`, `natural-fiber-composite-fatigue-research`, and `composite-mode-ii-delamination-research`.
- Paper-specific material systems, numerical results, and operational protocols have been abstracted into reusable workflow logic.
