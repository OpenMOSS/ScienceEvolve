---
name: sci-aqueous-aqueous-metal-electrolyte-interface-mechani-7a7ddab0
description: Reusable end-to-end workflow for generating, testing, and iterating mechanistic hypotheses about electrolyte-electrode interfacial behavior in aqueous metal batteries, using staged validation, orthogonal evidence, and explicit claim boundaries.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to discover and validate interfacial mechanisms in aqueous metal battery electrolytes by moving from observable failure modes to falsifiable hypotheses, staged experiments with strong controls, and evidence-ranked conclusions. The workflow emphasizes methodological transfer across material systems rather than reproduction of any single reported formulation.

# When to use

Use this skill when a user asks to:

- Generate research questions or mechanistic hypotheses for electrolyte-electrode interfaces in aqueous metal batteries.
- Design validation studies that connect molecular-scale interactions to cell-level performance.
- Evaluate whether an observed performance change is plausibly caused by a proposed interfacial mechanism.
- Iterate or pivot after preliminary electrochemical, structural, or imaging data.

Do not use this skill as a substitute for operational laboratory protocols, certified safety review, manufacturing scale-up, or field-wide consensus statements.

# Inputs required

Before starting, collect or infer:

- **Target system**: electrode classes, electrolyte matrix family, separator, and cell format.
- **Primary failure mode**: nonuniform deposition, parasitic reaction, interphase instability, transport limitation, or mechanical degradation.
- **Candidate intervention space**: additive, solvent modifier, interphase former, matrix architecture, or surface modification.
- **Known constraints**: safety limits, compatibility, measurement access, computational resources, and environmental boundaries.
- **Available data**: prior cycling, spectroscopy, microscopy, impedance, simulation, or literature benchmarks.
- **Decision goal**: hypothesis generation, screening plan, mechanism test, or iteration after data.

# Core Workflow

1. **Frame the failure mode and mechanistic gap**
   - Define the observable interfacial failure and the specific kinetic or transport bottleneck.
   - Map the dynamic sequence from bulk electrolyte to interface to electrode response.
   - *Decision gate*: Stop if the failure mode is not observable with available diagnostics or if the gap is outside the intervention space.

2. **Generate falsifiable hypotheses**
   - For each candidate mechanism, specify:
     - **Mechanistic claim**: what interfacial process is altered.
     - **Predicted signature**: measurable outputs that must shift if the claim is true.
     - **Alternative explanation**: other factors that could produce the same signature.
     - **Evidence strength**: high, medium, or low.
     - **Key assumption**: condition required for plausibility.
     - **Likely failure mode**: incompatibility, transport penalty, side reaction, or measurement artifact.
   - Prioritize hypotheses that are falsifiable with minimal validation and that separate interfacial effects from bulk properties.
   - *Decision gate*: Reject hypotheses that lack a discriminating prediction or a plausible control.

3. **Design staged validation with controls**
   - Define a **baseline** matched to the target system.
   - Select **independent variables** (intervention, system, operation, mechanistic).
   - Build a **control hierarchy**:
     - Baseline (unmodified).
     - Ionic-strength or matrix-matched control.
     - Negative control (mechanistically inactive analog).
     - Positive or decoupling control (isolates anode, cathode, or interface).
   - Predefine **evaluation metrics** across scales:
     - Material/structure: coordination, network order, transport descriptors.
     - Interface/electrode: morphology, impedance, side-reaction proxies, reversibility.
     - System/device: cycling stability, efficiency, retention, robustness.
   - Set **stop conditions**: safety-relevant instability, inconsistent replicates, confounded controls, or missing mechanistic signatures.
   - *Decision gate*: Proceed only if the design can distinguish the proposed mechanism from generic conductivity, concentration, or geometry effects.

4. **Execute minimal viable validation**
   - **Stage A – Structure/Property**: Test whether the intervention changes the intended molecular or mesoscale feature without unacceptable transport penalty.
   - **Stage B – Interface/Electrode**: Test plating/stripping behavior, interfacial resistance, morphology, and side-reaction suppression.
   - **Stage C – System/Device**: Test full-cell or application-relevant performance and robustness under matched boundary conditions.
   - After each stage, apply the *validation gate* (see Validation Gates). If the gate fails, stop or redesign before escalating.

5. **Analyze through causal chain and orthogonal evidence**
   - Quality-control data for replicate consistency, baseline drift, and artifacts.
   - Map the causal chain: structure → transport → interface → performance.
   - Require **orthogonal evidence** before claiming a mechanism (e.g., electrochemical + imaging + spectroscopic or modeling support).
   - Compare all results against controls to rule out confounders.
   - Classify evidence strength:
     - **Strong**: multiple controls, reproducible improvement, consistent mechanistic diagnostics.
     - **Moderate**: improvement plus one plausible mechanism, but unresolved alternatives.
     - **Weak/Insufficient**: isolated metric gain, no control, or single-cell observation.

6. **Bound claims and document negative evidence**
   - State what is demonstrated, what is inferred, and what remains untested.
   - Report failed hypotheses, ambiguous diagnostics, and conditions where the intervention did not help.
   - *Decision gate*: Do not generalize beyond tested boundary conditions.

7. **Iterate, pivot, or exit**
   - **If mechanism is supported**: design a harder boundary test (different current, loading, temperature, or cell format).
   - **If partially supported**: refine one mechanistic axis at a time (mobility, solvation, adsorption, interphase chemistry) and add discriminating controls.
   - **If falsified or unsafe**: pivot to an alternative hypothesis or stop the design branch.
   - **Exit conditions**: persistent irreproducibility, unacceptable tradeoffs, safety concerns, or mechanism unsupported by evidence after two iteration cycles.

# Output Format

Return results in this structure:

1. **Research question** – target system, failure mode, and decision goal.
2. **Evidence map** – directly supported, inferred, and unknown.
3. **Hypothesis table** – mechanistic claim, predicted signature, evidence strength, key assumption, likely failure mode.
4. **Experimental design schema** – baseline, variables, control hierarchy, staged validation sequence, metrics, and stop conditions.
5. **Analysis plan** – causal-chain mapping, orthogonal evidence requirements, evidence-strength classification, and uncertainty handling.
6. **Iteration plan** – update rules, next discriminating experiment, and pivot/stop criteria.
7. **Validity and safety notes** – confounders, reproducibility requirements, boundary conditions, and safety constraints.

# Validation Gates

Explicit pass/fail criteria for staged progression:

- **Gate A (Structure/Property)**: Pass if the intervention produces the intended structural signature without collapsing transport or stability. Fail if structural evidence is absent or contradicts the hypothesis.
- **Gate B (Interface/Electrode)**: Pass if electrochemical improvement is accompanied by matching interfacial or morphological evidence. Fail if performance improves without mechanistic signature, or if controls show identical improvement.
- **Gate C (System/Device)**: Pass if full-cell or robustness data align with lower-scale evidence. Fail if device gains are decoupled from electrolyte/interface indicators or if safety limits are breached.
- **Gate D (Reproducibility)**: Pass if independent replicates or batches confirm the pattern. Fail if variability exceeds predefined thresholds or if negative results are omitted.

# Claim Boundaries

- Distinguish findings demonstrated in the source evidence from analogical inferences for new systems.
- Do not present single-system results as field-wide consensus.
- Limit claims to the tested electrolyte class, electrode pairing, cell format, and operating envelope.
- Mechanism claims require specificity: show that the proposed interfacial feature is necessary for the observed performance, not merely correlated.

# Failure Modes

- **Mechanism misattribution**: performance gain caused by uncontrolled conductivity, concentration, wetting, or geometry rather than the proposed interfacial mechanism.
- **Confounded controls**: failure to include ionic-strength-matched, negative, or decoupling controls.
- **Tradeoff blindness**: improvement in one metric masks degradation in side reactions, mechanical integrity, or cathode stability.
- **Irreproducibility**: single-cell or single-batch results treated as general.
- **Diagnostic artifacts**: post-mortem changes, imaging preparation effects, or model overfitting mistaken for mechanism evidence.
- **Unsafe extrapolation**: extending designs beyond tested temperature, current, or compositional boundaries without validation.

# Validity Checks

Before finalizing conclusions, verify:

- **Confounding factors**: ionic strength, pH, water activity, impurity level, electrode surface state, separator, temperature, geometry, and measurement drift.
- **Control adequacy**: baseline, matched-background, negative, decoupled, and relevant positive comparators.
- **Reproducibility**: independent replicates, batch-level analysis, transparent exclusion rules, and reporting of variability.
- **Statistical validity**: predefined metrics, uncertainty estimates, effect sizes, and separation of confirmatory and exploratory analyses.
- **Boundary conditions**: compatibility with different metals, cathodes, separators, temperatures, current regimes, and cell formats.
- **Mechanism specificity**: structural or interfacial evidence supports the claimed mechanism and is not only compositionally correlated.
- **Evidence labeling**: clearly mark demonstrated, inferred, and speculative claims.

# Provenance

- Derived from cluster **60**, subcluster **60.1**, workflow archetype *observable-driven mechanism discovery and validation*.
- Synthesized from source skills:
  - `2b53426da4058663` (azib-electrolyte-additive-exploration)
  - `db2f102f3c65439d` (cement-zinc-interphase-exploration)
  - `cc689a8caae64376` (zinc-electrolyte-exploration)
  - `b6543abce5ea33b7` (des-zinc-electrolyte-research-pattern)
  - `c2b4b0c9060fabf0` (entropy-driven-antifreeze-electrolyte-research)
  - `1c67b988c36a23a7` (aqueous-metal-battery-interface-exploration)
  - `3a2a631e11b09a89` (hydrated-eutectic-electrolyte-research)
  - `2e213ac4604f803b` (wide-temperature-zinc-gel-electrolyte-exploration)
