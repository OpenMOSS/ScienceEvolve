---
name: sci-fiber-fiber-composite-interface-sensing-mechanism-d-0b02d7e2
description: Reusable end-to-end workflow for hypothesis generation, controlled validation, and mechanism discovery in fiber-composite, interface-dominated, and sensing material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface sensing mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Transform an observable performance gap in fiber-reinforced composites, mixed-matrix systems, interface-dominated materials, or sensing architectures into a structured mechanism-discovery and validation workflow. The goal is to generate testable hypotheses, design minimum viable experiments with strong controls, analyze converging multi-scale evidence, and iterate until the mechanism is supported, bounded, or falsified—without treating any single source system as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions or hypotheses for fiber-reinforced composites, mixed-matrix membranes, polymer electrolytes, responsive fillers, or wearable/structural sensing materials.
- Design controlled experiments that distinguish true mechanism improvement from artifacts, normalization errors, or confounding.
- Interpret multi-modal data linking structure, interface, transport, mechanical, or electrochemical observables to function.
- Iterate a research plan after partial support, contradiction, or inconclusive results.
- Evaluate whether indirect structural or computational proxies predict direct functional output.

Do not use this skill for clinical research, therapeutic recommendations, directly executable hazardous protocols, or as a substitute for domain-specific safety review.

# Inputs required

Ask for or infer the following before producing a plan:

- Target application and dominant bottleneck (e.g., transport limitation, mechanical integrity, sensing sensitivity, interfacial stability, or processability).
- Candidate material classes and the proposed mechanism linking structure or interface to function.
- Available observables and characterization constraints.
- Baseline or benchmark comparator for controlled comparison.
- Safety, ethics, and compliance boundaries relevant to the lab or institution.

If inputs are missing, state assumptions explicitly and mark dependent hypotheses as lower evidence strength.

# Core Workflow

## Phase 1: Bottleneck decomposition & mechanism mapping

1. Decompose the observable bottleneck into coupled constraints (e.g., transport vs. robustness, sensitivity vs. stability, conductivity vs. mechanical integrity).
2. Build a mechanism map linking design variables → structure/interface → mediator (loading, dispersion, contact, alignment) → primary function → output.
3. Label each link as **verified**, **inferred**, or **speculative**.

**Decision Gate 1:** Is the bottleneck specific, measurable, and testable? If not, refine the question or stop.

## Phase 2: Hypothesis portfolio generation

1. Generate 3–5 competing hypotheses per research question:
   - **Conservative extension:** applies a known pattern to a closely related system.
   - **Boundary-stress hypothesis:** tests where the current model or mechanism breaks under changed length, stiffness, loading, or environmental conditions.
   - **Mechanism-divergent hypothesis:** proposes the same perturbation acts through a different pathway.
2. For each hypothesis record:
   - Mechanistic basis and predicted observable signature.
   - Evidence strength: high / medium / low / speculative.
   - Key assumptions and transferability boundary.
   - Likely failure modes and a falsifying pattern.
3. Explicitly separate source-supported patterns from new agent inferences.

**Decision Gate 2:** Are hypotheses falsifiable and do they include negative predictions? If not, reformulate before proceeding.

## Phase 3: Minimum viable validation design

1. Select **one primary design variable** per experiment to preserve interpretability.
2. Define staged controls:
   - **Baseline control:** system without the proposed feature.
   - **Negative control:** condition expected to disable or minimize the proposed mechanism.
   - **Positive / benchmark control:** known reference behavior, used for relative comparison only.
   - **Process control:** repeated preparation or measurement to detect drift and batch effects.
   - **Orthogonal cross-check:** independent route to estimate the same bridge variable or outcome.
3. Choose converging evidence categories:
   - Structural / morphological
   - Chemical / interfacial
   - Functional / transport / electromechanical
   - Robustness / stability / reversibility
4. Define metrics:
   - Primary: functional output normalized by measured input, geometry, or loading state.
   - Secondary: mechanism-specific diagnostics (impedance, contact maps, dispersion, fracture morphology).
   - Reproducibility: variance across independent samples, cycles, or runs.
5. Pre-register the analysis plan and stop conditions before data collection.

**Decision Gate 3:** Do controls isolate the proposed mechanism from geometry, contact, processing, and measurement artifacts? If not, redesign.

## Phase 4: Evidence collection & multi-scale analysis

1. Collect data across the causal chain; do not rely on a single metric.
2. Separate intrinsic material response from composite or device-level response.
3. Audit formulas, units, and normalization terms; correct dimensional inconsistencies before comparing variants.
4. Compare global and local diagnostics to localize the mechanism.
5. Inspect response curves over time and load to detect saturation, drift, impedance mismatch, or instability.
6. Require agreement across independent runs before treating small differences as meaningful.

**Decision Gate 4:** Does structural/chemical evidence converge with functional evidence? If discordant, diagnose artifacts or alternative mechanisms before advancing claims.

## Phase 5: Decision, iteration, and stop

Classify the outcome for each hypothesis:

- **Supported:** predicted signature appears with adequate controls and reproducibility. Narrow the mechanism and test boundary conditions.
- **Partially supported:** one signature appears but a key control is ambiguous. Identify the newly revealed bottleneck and redesign targeting the weakest link.
- **Contradicted:** controls explain the signal or the mechanism-specific diagnostic fails. Revise or discard the hypothesis; test an alternative from the portfolio.
- **Inconclusive:** variability, missing normalization, or confounding prevents interpretation. Improve controls or replication before changing variables.

**Stop conditions:**
- Safety or compliance constraints cannot be satisfied.
- Apparent improvement disappears after corrected normalization or geometry control.
- Control samples match test samples, indicating artifact dominance.
- The mechanism-specific control behaves opposite to prediction.
- Reversible response is lost after cycling without explanatory model.
- Variability prevents distinguishing mechanism from preparation noise.

**Decision Gate 5:** Have stop conditions been triggered? If yes, halt or pivot before optimization.

## Phase 6: Claim bounding & knowledge capture

1. State exact conditions under which claims hold (material class, geometry, loading, environment, measurement window).
2. Separate **verified observations** from **inferences** and **speculations**.
3. Document failure modes, boundary conditions, and residual risks.
4. Archive a decision log with hypothesis, tested variable, controls, evidence, and next step.

**Decision Gate 6:** Are claims limited to tested boundaries and free of overgeneralization? If not, revise.

# Output Format

When using this skill, produce:

1. **Research question** — bottleneck, significance, and claim boundary.
2. **Mechanism map** — causal chain with evidence labels (verified / inferred / speculative).
3. **Hypothesis portfolio** — table with hypothesis, evidence strength, key assumptions, predicted signatures, failure modes, and transferability boundaries.
4. **Experimental design** — primary variable, controls, converging evidence categories, metrics, minimum viable validation, and stop conditions.
5. **Analysis plan** — normalization rules, global vs. local diagnostics, artifact checks, reproducibility requirements, and benchmarking discipline.
6. **Iteration decision log** — rules for supported, partially supported, contradicted, and inconclusive outcomes.
7. **Validity and safety statement** — confounders, reproducibility checks, external-validity limits, and non-operational safety boundaries.

# Validation Gates

- **Gate 1 — Bottleneck specificity:** The performance gap is decomposed into measurable, coupled constraints.
- **Gate 2 — Hypothesis falsifiability:** Every hypothesis includes a predicted supporting signature and a falsifying pattern.
- **Gate 3 — Control adequacy:** Baseline, negative, positive/benchmark, process, and orthogonal controls are present and matched.
- **Gate 4 — Evidence convergence:** Structural, chemical, functional, and robustness evidence are compared; discordance is resolved before claim formation.
- **Gate 5 — Iteration discipline:** Outcomes are classified into supported / partially supported / contradicted / inconclusive; stop conditions are enforced.
- **Gate 6 — Claim boundedness:** Conclusions are tagged with applicability limits and separated from speculation.

# Claim Boundaries

- Claims are restricted to tested material classes, geometries, processing routes, and environmental conditions.
- Mechanism patterns may be transferable; response directionality and magnitude are context-dependent.
- Single-source or single-system results are not treated as field-wide consensus.
- Indirect structural or computational proxies do not constitute direct functional proof.
- Performance gains must be reported with explicit normalization terms, uncertainty estimates, and boundary conditions.

# Failure Modes

- Apparent improvement disappears after corrected normalization or geometry control.
- Control samples produce comparable signals, indicating setup artifact or confounding.
- Structural evidence and functional evidence conflict without an explanatory model.
- High variability or poor repeatability prevents mechanism discrimination.
- Mechanism-specific control behaves opposite to prediction, invalidating the causal chain.
- Reversible response is lost after repeated cycling, suggesting drift, degradation, or irreversible rearrangement.
- Safety, environmental, or compliance constraints are unresolved.

# Validity Checks

Before finalizing a plan or interpretation, verify:

- Does the hypothesis specify a causal mechanism rather than only a desired outcome?
- Are baseline, negative, positive/benchmark, and process controls included and matched?
- Are structure and interface properties measured before functional claims are made?
- Are geometry, contact quality, temperature, loading state, and batch effects controlled?
- Are mechanical, thermal, and stability properties evaluated alongside the primary function?
- Are new hypotheses clearly separated from mechanisms supported by prior work?
- Are limitations and extrapolation boundaries stated explicitly?
- Are stop conditions defined before selecting an optimal candidate?
- Is the plan reproducible without relying on a single reported composition or parameter set?
- Are competing explanations (e.g., fouling, leaching, contact resistance, aggregation, measurement drift) acknowledged or ruled out?

# Provenance

- Synthesized from cluster 32.1 (observable-driven mechanism discovery and validation).
- Source-skill references: porous-host-ionogel-electrolyte-exploration; coiled-coil-ph-research-exploration; piezoelectric-composite-exploration; stimulus-responsive-mmm-membrane-exploration; solid-state-lis-cathode-research-pattern; rheology-process-fiber-spinning-skill; fiber-piezoelectric-research-explorer; interface-engineered-nanofiller-composites.
- Paper-specific systems, materials, parameters, and conclusions have been abstracted into a domain-agnostic workflow.
