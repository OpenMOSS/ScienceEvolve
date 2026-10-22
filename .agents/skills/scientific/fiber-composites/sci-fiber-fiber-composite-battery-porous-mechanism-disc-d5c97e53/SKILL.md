---
name: sci-fiber-fiber-composite-battery-porous-mechanism-disc-d5c97e53
description: Observable-driven mechanism discovery and validation workflow for fiber, composite, battery, porous, and interfacial material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite battery porous mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an observed performance gap or failure mode in fiber, composite, battery, porous, or interfacial material systems into a structured, testable research program. It guides hypothesis generation, staged experimental validation, mechanism discrimination, and iterative redesign without relying on source-specific recipes, numerical parameters, or single-paper conclusions.

# When to use

Use this skill when:
- A user asks to explain why a material or device underperforms, degrades, or behaves unexpectedly.
- Proposing a new architecture, interface, coating, scaffold, or composite and needing to validate the governing mechanism.
- Designing experiments that must separate intrinsic material behavior from architecture, processing, or device-level effects.
- Benchmarking requires fair normalization and control hierarchies across coupled metrics such as transport, stability, mechanical integrity, or adsorption.

Do not use for clinical or biological systems, operational laboratory recipes, or field-deployment engineering without independent safety validation.

# Inputs required

Before generating a plan, collect or infer:
- **Target system class and application boundary.**
- **Observable gap or failure mode:** capacity loss, impedance growth, mechanical failure, adsorption limitation, selectivity drop, etc.
- **Candidate design:** architecture, interface, coating, composite, porous scaffold, or dynamic network.
- **Baseline comparator** and available characterization toolkit.
- **Constraints:** safety, reproducibility, environmental, and institutional limits.
- **Success criteria** and pre-registered stop conditions.

# Core Workflow

Follow this ordered route. Do not skip stages or collapse mechanism claims into a single experiment.

## 1. Gap Decomposition and Mechanism Mapping
- Reframe the bottleneck as a **coupled-metric problem** (e.g., transport versus stability versus mechanics).
- Decompose the system into interacting parameter families: structure, chemistry, interface, and environment.
- **Gate:** If the gap is not observable with available diagnostics, stop and refine the research question.

## 2. Hypothesis Generation and Ranking
- Generate **mechanism-based hypotheses**, not recipe extensions. For each hypothesis specify:
  - Claim, mechanistic bridge, key assumption, predicted signature, likely failure mode, and evidence strength (weak/moderate/strong).
- Rank candidates by falsifiability, diagnostic accessibility, and contrast with the baseline.
- **Gate:** If hypotheses cannot be distinguished by a controlled comparison, redesign the variable matrix before proceeding.

## 3. Staged Validation Design
- **Stage A — Minimum viable verification:** Confirm the candidate forms a coherent structure, exhibits basic function, and shows a targeted change relative to a simple baseline.
- **Stage B — Strong controls:** Include component-separated, single-factor, negative, positive, process, and exposure controls to isolate the proposed mechanism from morphology, loading, and processing artifacts.
- **Stage C — Stress and translation tests:** Apply durability, environmental perturbation, scaled geometry, or device-level relevance tests.
- Define primary and secondary metrics and **normalization rules** (mass, area, volume, loading) upfront.
- **Gate:** If controls are not matched or normalization is inconsistent, redesign before execution.

## 4. Evidence Collection and Orthogonal Triangulation
- Collect relevant data across electrochemical, spectroscopic, microscopic, structural, transport, and mechanical domains.
- **Require at least two independent diagnostic directions** before assigning a mechanism.
- **Gate:** If evidence converges, proceed to discrimination. If evidence conflicts, flag hidden variables, add controls, and pause mechanism claims.

## 5. Mechanism Discrimination and Trade-off Analysis
- Separate activation from degradation, bulk from interfacial effects, and intrinsic from extrinsic contributions.
- Attribute gains **only when the candidate outperforms component-separated controls** under comparable conditions.
- Map results as **trade-offs** rather than single-number rankings.
- **Gate:** If the dominant limiting mechanism cannot be identified, add a targeted discriminating test before claiming causality.

## 6. Iteration or Redesign
- **Supported mechanism:** Refine design levers (composition, architecture, processing) while preserving the validated principle.
- **Partial support:** Identify the weakest evidence link and redesign the next experiment to target it.
- **Rejected or confounded:** Stop, archive the negative result, and reformulate the hypothesis.
- **Translation failure:** If performance does not translate across scales or environments, revisit architecture, interface coupling, or environmental matching.
- **Gate:** Evaluate against pre-registered stop conditions. If met, stop or pivot.

## 7. Claim Bounding and Documentation
- State boundary conditions (chemistry, geometry, environment, loading class).
- Label evidence strength for each claim.
- Document failure modes, confounders, and residual risks.

# Output Format

When using this skill, return:

1. **Research question** and gap statement.
2. **Mechanism map** with interacting parameter families.
3. **Ranked hypotheses table:** claim, mechanism, evidence strength, key assumption, predicted signature, likely failure mode, minimal validation.
4. **Experimental design matrix:** stages, controls, variables, metrics, and stop conditions.
5. **Analysis plan:** normalization rules, triangulation protocol, trade-off visualization, and inference rules.
6. **Iteration rules:** continue, pivot, or stop conditions.
7. **Validity and safety notes:** confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Evidence classification:** label each claim as source-paper evidence, literature-supported inference, agent-inferred, or speculative.

# Validation Gates

Before executing or finalizing a plan, confirm:
- **Confounding:** Loading, thickness, normalization basis, processing history, and environmental exposure are matched across comparisons.
- **Control adequacy:** Inactive, single-component, negative, positive, and process controls are included where feasible.
- **Mechanism specificity:** At least two orthogonal diagnostics support the proposed mechanism.
- **Reproducibility:** Batch-to-batch variation and repeated measurements are addressed.
- **Normalization consistency:** Gravimetric, areal, volumetric, and loading-normalized metrics are defined and applied uniformly.
- **Boundary conditions:** Claims are limited to the tested chemistry, architecture, and operating window.

# Claim Boundaries

- Treat every source paper as a single evidence point, not field consensus.
- Distinguish observed correlation from inferred causation.
- Limit generalization to the validated parameter envelope.
- Do not present single-system demonstrations as universal design rules.

# Failure Modes

- The proposed mechanism is masked by a stronger confounder such as unintended morphology, loading differences, or uncontrolled interface chemistry.
- Improvement in one metric degrades safety-relevant stability, reproducibility, or another critical function.
- Performance depends on non-reproducible processing variation or uncontrolled surface/interface states.
- Mechanism evidence is consistent but performance does not translate to the target device scale or service environment.
- Early-cycle activation or transient behavior is mistaken for stable, reproducible improvement.

# Validity Checks

- Before finalizing: Verify confounding, normalization, controls, reproducibility, mechanism support, boundary conditions, single-paper caution, and safety relevance.
- After analysis: Verify that trends align across electrochemical, structural, spectroscopic, and mechanical evidence; ensure full-system behavior is not misattributed to a subsystem.

# Provenance

- Synthesized from cluster **57.0** (observable-driven mechanism discovery and validation).
- Source skills: flexible-lis-cathode-exploration, li-ion-s-anode-design-workflow, li-s-battery-coating-exploration, solid-state-li-s-cellulose-electrolyte-research, porous-adsorbent-exploration, intrinsic-self-healing-polymer-research, pemfc-catalyst-exploration, porous-biopolymer-gel-adsorbent-research.
