---
name: sci-fiber-composite-fiber-interface-mechanism-discovery-0000c31b
description: A reusable end-to-end workflow for discovering and validating interfacial mechanisms in composite, fiber, or electrochemical material systems through bottleneck-driven hypotheses, orthogonal controls, and iterative evidence convergence.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface mechanism discovery workflow 5"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to transform an interfacial materials research question into a mechanism-based discovery and validation plan. It guides an agent to identify coupled failure modes in composites, fibers, or energy-storage interfaces; generate falsifiable hypotheses; design minimal validations with strong controls; and iterate until evidence converges or the hypothesis is rejected—without copying source-specific recipes or treating single studies as consensus.

## When to use

Trigger this skill when the user asks to explore new interfacial components, coatings, binders, separators, hosts, or functional films in composite or fiber-reinforced systems, electrochemical energy materials, or related architectures where multiple failure modes (mechanical, transport, chemical, kinetic) are coupled. It is appropriate for hypothesis generation, controlled experiment design, mechanism discrimination, and model-informed iteration.

## Inputs required

- **Target bottleneck:** The dominant failure mode or performance limit (e.g., adhesion loss, intermediate migration, transport penalty, mechanical degradation, sluggish conversion, damping deficit).
- **Candidate architecture:** A conceptual interfacial component or network design, stated at a non-recipe level.
- **Available evidence:** Literature context, preliminary characterization, computational hypotheses, failure observations, or processing constraints.
- **Evaluation priorities:** Performance metrics, mechanism metrics, and practicality metrics relevant to the target system.
- **Constraints:** Safety boundaries, measurement access, reproducibility expectations, specimen or cell-format limits, and acceptable stop conditions.

## Core Workflow

1. **Bottleneck and mechanism mapping**  
   Define the dominant practical bottleneck and decompose it into candidate mechanisms (physical, chemical, transport, mechanical, interfacial).  
   **Gate:** If the bottleneck cannot be linked to at least two observable mechanism categories, pause and gather more evidence before proceeding.

2. **Hypothesis generation**  
   For each candidate mechanism, formulate a falsifiable hypothesis that links a design lever to an observable change. Tag evidence strength (strong / moderate / weak / speculative), key assumptions, predicted diagnostic signatures, and likely failure modes. Prioritize hypotheses that couple multiple failure modes and predict both mechanism-specific signals and system-level consequences.  
   **Gate:** Reject hypotheses that lack a plausible negative control or cannot be tested with available diagnostics.

3. **Minimal viable validation (MVV) design**  
   Define a small design matrix that varies one dominant mechanism at a time. Specify controls: baseline, inactive/background, single-function (decoupled), negative (mechanism-weakened), and positive benchmark if available. Predefine primary metrics (performance, mechanism, practicality), failure criteria, and stop conditions.  
   **Gate:** If the MVV cannot isolate the proposed mechanism from confounders (e.g., loading, thickness, network changes), redesign before any data collection.

4. **Orthogonal evidence collection**  
   Collect at least two independent measurement types for each claimed mechanism (e.g., structural, transport, electrochemical, mechanical, or post-operation). Record covariates such as loading, porosity, environmental state, and processing history.  
   **Gate:** If a mechanism claim rests on a single metric, flag it as tentative and require a second diagnostic before acceptance.

5. **Mechanism-first analysis**  
   Normalize comparisons across matched conditions. Separate supported functions from unverified ones. Diagnose tradeoffs (e.g., improved binding versus slower transport). Update the mechanism model by labeling each observation as supporting, weakening, or refuting the claim.  
   **Gate:** If performance improves but mechanism diagnostics do not, treat the claim as weak and search for confounders such as contact changes, wetting, or normalization errors.

6. **Decision and iteration**  
   - **Confirm and deepen:** If orthogonal diagnostics align, escalate to a more demanding boundary or test a second variant that changes one design lever.  
   - **Revise mechanism:** If system-level improvement lacks mechanism evidence, reformulate the causal model and add discriminating controls.  
   - **Revise architecture:** If one mechanism improves while another degrades, redesign the interface to rebalance tradeoffs.  
   - **Stop or pivot:** If negative/inert controls match the full design, or if post-test evidence contradicts the proposed mechanism, archive the hypothesis and return to Step 2.  
   **Gate:** Escalate to system-level demonstrations only after mechanism-specific advantages are reproducible under stress conditions.

7. **Boundary and safety framing**  
   State explicit applicability boundaries (tested classes, regimes, environments, formats). Confirm all recommendations remain at the research-design level with no operational recipes or hazardous protocols.  
   **Gate:** If safety or ethics boundaries are unclear, halt and require institutional review.

## Output Format

Return the following:

1. **Research question:** Bottleneck, target architecture, and why it matters.  
2. **Mechanism map:** Candidate pathways and their proposed causal links.  
3. **Hypothesis table:** Hypothesis, evidence strength, key assumptions, minimal validation, likely failure mode, and boundary.  
4. **MVV plan:** Design matrix, controls, metrics, failure criteria, and stop conditions.  
5. **Analysis plan:** Orthogonal evidence to collect, normalization rules, tradeoff diagnosis, and mechanism-update rules.  
6. **Iteration plan:** Decision rules for confirming, revising, stopping, or escalating.  
7. **Validity and safety notes:** Confounders, reproducibility checks, boundary conditions, and non-operational constraints.

## Validation Gates

- **Mechanism isolation gate:** The proposed mechanism must be distinguishable from background, baseline, and single-component controls.  
- **Convergence gate:** At least two independent diagnostics must agree before accepting a mechanism claim.  
- **Reproducibility gate:** Repeated measurements or specimens are required for central claims.  
- **Stress gate:** Conclusions must be checked under at least one condition that intensifies the targeted bottleneck.  
- **Control integrity gate:** Positive and negative controls must behave as expected; otherwise, candidate differences are not interpretable.

## Claim Boundaries

- Label every conclusion as observed, inferred, hypothesized, or speculative.  
- Do not extrapolate beyond the tested component class, architecture, loading regime, or environmental condition.  
- Treat single-source evidence as a precedent, not field consensus.  
- Separate intrinsic interfacial activity from system-level transport, contact, or format effects.

## Failure Modes

- **False synergy:** The full architecture performs no better than its individual components or an inert control.  
- **Confounded attribution:** Performance changes arise from loading, wetting, contact pressure, environmental drift, or normalization errors rather than the proposed mechanism.  
- **Overfitted mechanism:** The model explains one dataset but fails on independent validation modes or stress conditions.  
- **Tradeoff blindness:** A gain in one metric masks a loss in another (e.g., stiffness versus damping, binding versus transport).  
- **Premature escalation:** Advancing to device-level claims before mechanism-level evidence is reproducible.

## Validity Checks

- **Confounding factors:** composition, processing history, loading, thickness, porosity, conductive network, environmental state, contact/pressure, and measurement baseline.  
- **Metric validity:** report normalized and application-relevant metrics; avoid inferring mechanism from a single performance number.  
- **Mechanistic validity:** require orthogonal evidence chains before assigning a mechanism.  
- **Statistical validity:** quantify variability and predefine acceptance criteria.  
- **Boundary validity:** state limits of chemistry, architecture, scale, and operating regime.  
- **Consensus discipline:** distinguish source-paper precedent from new inference.  
- **Safety validity:** maintain non-operational, research-design-level guidance; require institutional safety review for hazardous materials.

## Provenance

- Synthesized from cluster 17.2 (observable-driven mechanism discovery and validation).  
- Source skill references: `lithium-sulfur-multifunctional-binder-research`; `lis-s-catalytic-separator-exploration`; `composite-film-research-design`; `cdc-c-o-bond-discovery-planning`; `composite-electrode-exploration`; `hybrid-active-site-electrocatalyst-research`; `wearable-electrochemical-sensing-workflow`; `composite-damping-exploration`.  
- Paper-derived patterns are abstracted; no source-specific materials, parameters, or conclusions are preserved in the reusable workflow body.
