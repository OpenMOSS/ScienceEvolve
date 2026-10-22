---
name: sci-catalysis-oxide-catalyst-metal-materials-mechanism-6bd5eeca
description: Guide observable-driven mechanism discovery and validation across oxides, metals, catalysts, and interfaces using converging evidence, controlled comparisons, and iterative claim bounding.
scienceevolve-title: "Asymmetric catalysis · oxide catalyst metal materials mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide agents through an end-to-end, observable-driven workflow for discovering and validating structure-function mechanisms in materials systems. The workflow emphasizes converging multi-modal evidence, controlled comparison designs, descriptor-linked hypotheses, and iterative claim bounding rather than reproducing single-paper results.

# When to use

Use this skill when designing new research questions or non-operational plans for materials where performance is limited by unclear structure-function relationships, including oxides, metals, catalysts, films, interfaces, and nanostructures. Trigger it for mechanism-driven hypothesis generation, controlled experiment design, multi-modal characterization planning, and iterative interpretation.

# Inputs required

Before producing a plan, collect or infer:

- **Target material class** and application context.
- **Observable bottleneck** or property gap (e.g., transport, charge transfer, adsorption, selectivity, stability).
- **Candidate design levers** (e.g., composition, dopant, defect, phase, interface, ligand, morphology).
- **Available characterization and simulation resources** (structural, chemical, spectroscopic, imaging, transport, modeling).
- **Baseline data and known comparators**, if any.
- **Constraints**: safety, regulatory, environmental, resource, and time boundaries.

# Core Workflow

Follow this ordered route with explicit decision gates and stop conditions.

## 1. Frame the observable gap and bottleneck map
- Identify the dominant loss pathway and split it into internal and interfacial contributors.
- Define the primary metric that would indicate success.
- **Gate:** If the bottleneck cannot be linked to a measurable material descriptor, stop and reformulate the question.

## 2. Generate descriptor-linked hypotheses
- State each hypothesis as a causal chain: design lever → structural/chemical change → descriptor change → functional change.
- Assign evidence strength (speculative, plausible, supported, validated).
- List key assumptions, likely failure modes, and minimal validation tests.
- **Gate:** If hypotheses are not falsifiable with available resources, simplify scope or defer.

## 3. Design controlled validation plan
- Define material variants: unmodified baseline, single-factor modifications, combined modifications, and orthogonal controls.
- Specify independent variables (lever presence, intensity, spatial organization), dependent variables (primary function, mechanistic proxy, robustness), and context variables (morphology, substrate, medium).
- Include negative controls (lacking predicted mechanism), positive benchmarks (when available), and artifact controls (leaching, adsorption, background, drift).
- Define primary and secondary metrics before testing.
- Define stop conditions: unobservable motif, failed controls, noncomparable morphology, safety block, or contradictory trends without mechanism evidence.
- **Gate:** If the plan cannot isolate the proposed mechanism from confounders, add controls or reduce complexity.

## 4. Collect converging evidence
- **Structure first:** confirm phase identity, morphology, interface quality, defect state, and dispersion.
- **Chemistry second:** verify composition, oxidation state, bonding, incorporation, and absence of unintended secondary phases.
- **Function third:** measure performance under matched conditions.
- Run artifact controls in parallel.
- **Gate:** Do not interpret function until structural and chemical prerequisites are confirmed. If prerequisites fail, pause and diagnose.

## 5. Integrate and discriminate mechanisms
- Link descriptors to function using the causal chain.
- Compare baseline, single-factor, and combined groups; test for synergy only when combined outperforms both singles and confounders are excluded.
- Use mechanistic proxies (carrier behavior, adsorption, transfer resistance, optical signatures) to support the same explanation.
- Exclude alternatives using control data.
- **Gate:** If structural, chemical, and functional evidence do not converge, flag ambiguity and do not advance the claim.

## 6. Normalize and check confounders
- Normalize apparent activity by loading, geometric area, surface-area proxy, or site count where justified.
- Verify that improvements survive background subtraction, blank correction, and comparable measurement geometry.
- **Gate:** If the effect disappears after normalization or correction, reject the hypothesis or revise the descriptor model.

## 7. Assess robustness and reproducibility
- Require independent preparations, repeated measurements, and post-test structural/chemical checks.
- Evaluate stability under operational exposure.
- **Gate:** If results are irreproducible or unstable, diagnose batch control, measurement quality, or sample degradation before mechanism claims.

## 8. Bound claims and decide iteration
- Classify the outcome:
  - **Supported:** converging evidence, robust controls, reproducible.
  - **Partially supported:** some evidence aligns; add discriminating tests.
  - **Rejected:** controls explain the effect or the motif is absent.
  - **Unresolved:** ambiguous evidence; redesign the smallest discriminating experiment.
- Document boundary conditions and transfer limits.
- Choose the next perturbation: change one design variable, add orthogonal characterization, or test a different substrate/condition.
- **Gate:** If claim strength exceeds evidence, downgrade before outputting.

# Output Format

Produce the following for each research cycle:

1. **Research question** and bottleneck map.
2. **Ranked hypotheses table** with causal chains, evidence strength, key assumptions, and likely failure modes.
3. **Validation plan** listing material variants, controls, metrics, and stop conditions.
4. **Evidence integration summary** showing convergence or divergence across structural, chemical, and functional probes.
5. **Normalized performance and confounder check** with correction details.
6. **Robustness and reproducibility statement**.
7. **Iteration decision** (support / revise / reject / defer) and the next smallest discriminating experiment.
8. **Claim boundaries and validity notes**.

# Validation Gates

- **Structural prerequisite gate:** Confirm phase, morphology, and modification presence before functional claims.
- **Control validity gate:** Baseline and negative controls must behave plausibly; positive benchmarks must be appropriate.
- **Convergence gate:** At least two independent evidence streams must agree before mechanism attribution.
- **Normalization gate:** Apparent effects must survive appropriate normalization and background correction.
- **Reproducibility gate:** Independent preparations or repeated measurements are required for causal claims.
- **Safety and ethics gate:** Research design stays non-operational; hazardous protocols are excluded.

# Claim Boundaries

- Limit claims to the tested material class, composition, morphology, and operating conditions.
- Distinguish paper-supported observations from agent-inferred hypotheses requiring validation.
- Do not generalize from screening-level results to device performance, field deployment, or commercial readiness.
- Label unobserved intermediates, inferred active sites, and speculative mechanisms as such.
- Avoid treating a single demonstrated system as field-wide consensus.

# Failure Modes

- Modifier fails to alter the intended descriptor.
- Desired phase, site, or interface motif is unobservable or relaxes during operation.
- Performance improvement disappears after background subtraction or normalization.
- Controls match the target sample, showing no meaningful separation.
- Structural and functional data imply different mechanisms.
- Apparent improvement arises from confounders (surface area, loading, roughness, leaching, adsorption, mass transport).
- Reproducibility failure across independent batches or instruments.
- Antagonistic coupling in combined designs obscuring causality.
- Measurement artifacts, instrument drift, or calibration errors.
- Safety or compliance constraints prevent valid interpretation.

# Validity Checks

- **Confounding:** Verify that morphology, surface area, loading, substrate, thickness, precursor quality, and measurement geometry do not vary unintentionally across groups.
- **Causality:** Ensure the proposed active feature precedes the performance change and is absent or inactive in negative controls.
- **Representativeness:** Treat thin-film, powder, or screening results as distinct from device or field performance.
- **Statistical validity:** Report variability, replicate counts, calibration, and matched comparisons; handle outliers transparently.
- **Mechanistic validity:** Do not infer mechanism from a single probe or metric; require converging structural, chemical, and functional evidence.
- **Boundary conditions:** State the applicable material family, reaction medium, potential regime, and environmental window.
- **External validity:** Treat a single system as one evidence point; require broader replication for generalization.

# Provenance

- Synthesized from cluster 20.0 (observable-driven mechanism discovery and validation).
- Source skills: perovskite-composition-bandgap-exploration; photo-driven-materials-synergistic-design; phase-site-coupled-electrocatalyst-exploration; doped-oxide-catalyst-workflow; carbon-nanomaterial-synthesis-characterization-adsorption; coherent-metal-oxide-interface-research; spo-ligand-nanoparticle-catalysis-discovery; directional-molecular-nanostructure-exploration.
- Preserves shared patterns: converging multi-modal evidence, controlled comparison matrices, descriptor-function causal chains, iterative claim bounding, and non-operational safety guardrails.
