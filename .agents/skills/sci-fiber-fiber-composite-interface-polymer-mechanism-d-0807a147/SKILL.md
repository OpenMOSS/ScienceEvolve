---
name: sci-fiber-fiber-composite-interface-polymer-mechanism-d-0807a147
description: A reusable end-to-end workflow for generating, discriminating, and validating structure-property mechanisms in fiber, composite, interface, and polymer systems using controlled experiments, orthogonal probes, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface polymer mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides an agent through observable-driven mechanism discovery and validation in fiber-reinforced composites, polymer matrices, interfacial systems, and related hybrid or porous architectures. The goal is to turn a performance gap or anomalous observation into a testable mechanistic understanding, not to reproduce a specific paper or optimize a single endpoint.

# When to use

Use this skill when the user asks to:
- Generate research questions around structure-property mechanisms in composites, polymers, fibers, gels, or interfacial assemblies.
- Design experiments that discriminate between competing microstructural, interfacial, or transport mechanisms.
- Interpret multi-modal data linking composition, processing, or environment to macroscopic behavior.
- Iterate or redesign after unexpected, contradictory, or confounded results.

Do not use this skill for operational laboratory execution instructions, safety-critical deployment claims, or as a substitute for domain-specific regulatory or safety review.

# Inputs required

Before proposing a plan, identify or request:
- Target system class and application boundary.
- Performance gap or observable anomaly to be explained.
- Candidate components and their nominal roles (e.g., matrix, reinforcement, filler, interface modifier).
- Suspected interaction mechanisms (e.g., interfacial bonding, percolation, phase separation, transport limitation, environmental coupling).
- Available measurement modalities and experimental constraints.
- Baseline or comparator systems.
- Safety, environmental, and reproducibility constraints.

If inputs are missing, state assumptions explicitly and downgrade evidence strength accordingly.

# Core Workflow

1. **Frame the mechanism problem**
   - Define the performance gap or observable anomaly as a structure-property question.
   - Identify the microstructural or interfacial feature most plausibly responsible.
   - *Stop if the gap cannot be linked to a falsifiable microstructural or interfacial hypothesis.*

2. **Generate ranked competing hypotheses**
   - Produce at least three mechanistic hypotheses that predict different observable outcomes.
   - For each: state rationale, key assumptions, predicted observables, evidence strength, and failure modes.
   - *Gate: Reject if hypotheses are not mutually discriminable by available measurements.*

3. **Design discriminating experiments**
   - Select independent variables that isolate a single mechanism (e.g., relative composition, interface treatment, environmental coupling).
   - Define matched controls: baseline, negative, positive, and confounder controls.
   - Choose one orthogonal proxy whose direction differs between competing hypotheses.
   - Preset success criteria, minimal viable validation, and stop conditions.
   - *Gate: Redesign if no orthogonal probe exists or if variables are inherently confounded.*

4. **Normalize and collect evidence**
   - Normalize by coupled variables (loading, environment, processing history, geometry).
   - Measure the primary property and orthogonal proxy under controlled conditions.
   - Quantify replicate scatter and preparation variability independently of fit uncertainty.
   - *Gate: Halt if control samples fail, replicate scatter exceeds effect size, or normalization reveals hidden dependencies.*

5. **Discriminate mechanisms**
   - Compare candidates against matched controls before interpreting trends.
   - Test whether relative or normalized variables explain behavior better than absolute ones.
   - Inspect residuals; test regime-specific scaling or data collapse.
   - Classify each finding as observed, inferred, hypothesized, or extrapolated.
   - *Gate: If the orthogonal proxy contradicts the leading hypothesis, return to Step 2.*

6. **Iterate or redesign**
   - **Supported:** Densify sampling near boundaries; add stressors or environmental checks; narrow the claim.
   - **Contradicted:** Document failure mode; update the mechanism map; generate alternative hypotheses.
   - **Absent/Confounded:** Revisit variable definitions; test history or environmental dominance; stop if the mechanism cannot be isolated.
   - *Gate: Proceed to validation only when a coherent mechanism survives all controls.*

7. **Validate and bound claims**
   - Test robustness across batches, boundary compositions, and relevant environments.
   - Confirm that model parameters are physically interpretable and do not vary arbitrarily.
   - Restrict claims to the tested material class, geometry, and operating regime.
   - *Gate: Do not generalize beyond the evidence boundary.*

# Output Format

When using this skill, produce:

1. **Research question** — One concise structure-property mechanism question.
2. **Ranked hypotheses table** — At least three hypotheses with evidence strength, key assumptions, predicted observables, and failure modes.
3. **Minimum viable experiment design** — Variables, matched controls, orthogonal proxy, success criteria, and stop conditions.
4. **Analysis plan** — Regime assignment, model choices, scaling or collapse tests, residual inspection, and evidence classification.
5. **Iteration plan** — Decision rules for supported, contradicted, absent, and confounded outcomes.
6. **Claim boundary statement** — Explicit limits on material class, geometry, environment, and evidence strength.
7. **Validity and safety constraints** — Confounders, reproducibility checks, and non-operational safety boundaries.

# Validation Gates

- **Falsifiability:** Each hypothesis must have at least one discriminating observable.
- **Orthogonality:** At least one proxy must be capable of falsifying the proposed mechanism.
- **Control integrity:** Baseline, negative, positive, and matched confounder controls must be defined before data collection.
- **Normalization:** Coupled variables (loading, environment, processing history) must be reported or controlled.
- **Reproducibility:** Replicate variability must be quantified and smaller than the claimed effect size.
- **Mechanistic consistency:** Structural, chemical, thermal, mechanical, and transport evidence must converge before accepting a mechanism.

# Claim Boundaries

- Distinguish observed data from inferred mechanism, analogy to prior systems, and extrapolation.
- Limit claims to the tested composition range, processing route, and environmental conditions.
- Do not treat single-system observations as field-wide consensus.
- Separate validated evidence from agent-inferred hypotheses.
- Avoid application-readiness, regulatory compliance, or safety-critical claims without independent validation.

# Failure Modes

- **Confounded variables:** The intended mechanism cannot be isolated because composition, chemistry, and processing changed together.
- **Missing orthogonal probe:** A primary endpoint improves while the discriminating proxy is absent or contradictory.
- **Control failure:** Baseline or matched controls behave unexpectedly, invalidating comparisons.
- **Reproducibility collapse:** Replicate scatter exceeds effect size; apparent trends are indistinguishable from noise.
- **Mechanism misattribution:** Property changes stem from artifacts (moisture, residual solvent, degradation, unreported environmental variation) rather than the proposed microstructural mechanism.
- **Overgeneralization:** Extending conclusions beyond tested material classes, geometries, or operating regimes.

# Validity Checks

- Does the relative or normalized variable capture the hypothesized competition?
- Can at least one orthogonal proxy falsify the leading mechanism?
- Are controls sufficient to separate interfacial bonding, percolation, phase separation, transport effects, and environmental artifacts?
- Are boundary-adjacent conditions repeated and reproducible?
- Are preparation history, environmental state, and calibration considered?
- Do model parameters have physically interpretable trends across regimes?
- Are conclusions classified by evidence strength and bounded by tested conditions?
- Are safety, environmental, and regulatory constraints documented?

# Provenance

- Synthesized from cluster 44.0 (observable-driven mechanism discovery and validation).
- Source skills: soft-matter-phase-mapping (10.1021_acs.macromol.2c02068), coupled-environment-lithium-sulfur-battery-research (10.1149_2.106311jes), polysaccharide-ester-material-exploration (fiber__10.1007_s10965-017-1333-1), layered-acoustic-material-research (fiber__10.1177_15280837231157270), dopamine-zwitterion-antifouling-research (10.1039_d1cs00658d), biofiller-composite-exploration (fiber__10.1007_s12221-024-00829-5), stimulus-responsive-fiber-separation-workflow (fiber__10.1002_app.56248), waste-derived-flame-retardant-composite-research (fiber__10.1002_app.56166).
