---
name: sci-catalysis-chiral-asymmetric-catalysis-surface-mecha-c6def7c8
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanistic hypotheses in chiral, asymmetric, catalytic, and surface-interface systems using observable-driven discrimination and convergent evidence.
scienceevolve-title: "Asymmetric catalysis · chiral asymmetric catalysis surface mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to guide research planning when an observed anomaly, selectivity trend, or structure-formation pattern in a chiral, asymmetric, catalytic, or surface-interface system suggests a non-obvious mechanism. The goal is to generate falsifiable hypotheses, design minimal validation studies with appropriate controls, integrate multi-modal evidence, and iterate until the mechanism is provisionally accepted, revised, or rejected.

## When to use

- A catalytic, surface-mediated, or interfacial transformation produces unexpected selectivity, reactivity, rate behavior, or morphology trend.
- A conventional mechanism cannot explain observed kinetic, spectroscopic, imaging, or computational signatures.
- A research team wants to propose new reactions, catalysts, surfaces, or network nodes based on a mechanistic pattern rather than screening alone.
- An agent must design minimal, non-operational validation studies for a proposed hypothesis before expanding scope.

## Inputs required

Provide as much of the following as possible:

- Target system class: catalytic cycle, surface phase, interfacial region, or reactive network node.
- Observed outcomes and anomalies: selectivity, yield, rate, product distribution, structural signature, or growth metric.
- Known or assumed baseline mechanisms for the system class.
- Available analytical readouts: spectroscopic monitoring, kinetic data, isotope labeling, imaging, product distribution, or computational modeling.
- Candidate conceptual variables: substrate/surface electronics, sterics, coordination geometry, morphology, defect state, energy/mobility regime, solvent/medium class, temperature regime.
- Constraints: safety boundaries, feasibility, analytical limits, and environmental compatibility.

## Core Workflow

Follow this ordered route from anomaly to validated or rejected mechanism. Each gate is a hard stop-or-redesign checkpoint.

1. **Gap Framing and Anomaly Detection**
   - Define the access problem or observable anomaly relative to the baseline mechanism.
   - Identify the specific deviation and its analytical confidence.
   - **Gate 1 — Anomaly specificity:** If the observation falls within expected variance or lacks independent confirmation, stop. Improve measurement or replicate before hypothesizing.

2. **Mechanistic Hypothesis Generation**
   - Propose at least three competing mechanisms:
     - A conventional pathway consistent with prior literature.
     - A directed or surface/interface-mediated pathway enabled by a specific interaction, morphology, or dynamic speciation.
     - An alternative pathway involving resting-state formation, ion-pair organization, defect capture, or unexpected intermediate stabilization.
   - For each candidate, define the key intermediate, rate-determining step, selectivity-determining step, and observable predictions.
   - Annotate evidence strength (weak / moderate / strong), key assumptions, and likely failure modes.
   - **Gate 2 — Falsifiability:** If hypotheses lack discriminating predictions or cannot be contradicted by data, reformulate before proceeding.

3. **Minimal Viable Validation Design**
   - Define the smallest comparison set that can confirm or reject the key mechanistic feature.
   - Include:
     - Baseline substrate/surface lacking the proposed directing or mediating feature.
     - Matched variant preserving the core scaffold while removing or blocking the proposed interaction.
     - Positive control (known benchmark) and negative control (no catalyst/surface, achiral counterpart, or missing node).
     - Mechanism-negative control predicted to fail if the proposed pathway is required.
   - Define conceptual variable classes only (e.g., electronic class, steric class, coordination geometry, morphology class, energy regime); omit operational parameters.
   - Define primary metrics (outcome/selectivity/structure) and mechanistic metrics (order, isotope effect, shift, lifetime, distribution).
   - **Gate 3 — Control sufficiency:** If controls cannot separate the proposed mechanism from artifacts, background, or competing pathways, redesign.

4. **Pre-registration and Evidence Integration Plan**
   - Write expected signs for kinetics, selectivity, spectroscopic shifts, imaging features, or computational trends before interpreting data.
   - Plan orthogonal observables from at least two independent methods (e.g., kinetic + spectroscopic, or imaging + computation).
   - **Gate 4 — Observable linkage:** If the validation plan relies on a single analytical method, add orthogonal readouts before execution.

5. **Data Collection and Integrity Monitoring**
   - Collect data under matched, documented conditions.
   - Monitor for confounders: decomposition, impurity effects, phase changes, exchange broadening, workup artifacts, environmental drift, or detection limits.
   - **Gate 5 — Data integrity:** If controls behave unexpectedly, reproducibility fails, or confounders dominate, stop and diagnose.

6. **Mechanism Discrimination and Evidence Integration**
   - Compare results against pre-registered predictions.
   - Accept a mechanism provisionally only when independent evidence converges.
   - Prefer the simplest mechanism that explains kinetics, selectivity, spectroscopic observations, and structural/product distribution.
   - If evidence conflicts, generate a revised mechanism rather than forcing one model.
   - **Gate 6 — Convergence:** If independent methods conflict or the mechanism remains underdetermined, flag ambiguity and return to Step 2 with revised hypotheses.

7. **Iteration or Scope Expansion**
   - **Supported:** Narrow the claim to the tested boundary; propose the next discriminator or limited scope expansion.
   - **Partially supported:** Redesign the comparison to isolate the mechanism family.
   - **Contradicted:** Reject or revise the hypothesis; test the next competing hypothesis from Step 2.
   - **Inconclusive:** Improve controls, observables, or model constraints.
   - **Gate 7 — Extrapolation guard:** Expand substrate, surface, or environmental scope only after the mechanistic feature is validated. Stop if the mechanism remains ambiguous and additional work would only add descriptive results.

8. **Forward Research Question Generation**
   - Convert validated mechanistic features into new questions for adjacent substrate classes, catalyst/surface geometries, or network nodes.
   - Label each new question as inferred, not established consensus, and state boundary conditions.

## Output Format

Produce a structured research plan containing:

1. **Target question** — One concise question and why it matters.
2. **Competing mechanisms** — Conventional, proposed, and alternative pathways with discriminating predictions.
3. **Validation plan** — Minimal viable comparison set, conceptual variables, controls, primary and mechanistic metrics, and stop conditions.
4. **Analysis and integration strategy** — Pre-registered expectations, orthogonal evidence plan, decision rules, and falsification criteria.
5. **Iteration path** — Next steps for supported, partial, contradicted, or inconclusive outcomes.
6. **Validity and boundary notes** — Confounding factors, reproducibility checks, extrapolation limits, and non-operational safety constraints.

## Validation Gates

Summarized hard checkpoints from Core Workflow:

- **Gate 1: Anomaly specificity** — Confirmed deviation from baseline, not noise or artifact.
- **Gate 2: Falsifiability** — Hypotheses yield mutually exclusive predictions.
- **Gate 3: Control sufficiency** — Controls can separate mechanism from background and artifacts.
- **Gate 4: Observable linkage** — At least two independent analytical methods are planned.
- **Gate 5: Data integrity** — Reproducible, confounder-monitored, control-validated data.
- **Gate 6: Convergence** — Independent evidence streams agree before provisional acceptance.
- **Gate 7: Extrapolation guard** — Scope expansion blocked until mechanistic feature is validated.

## Claim Boundaries

- Distinguish observed evidence from agent-generated inference.
- Label all new hypotheses as inferred design hypotheses, not field-wide consensus.
- Limit claims to the tested environment, substrate/surface class, mechanism family, and analytical window.
- Do not generalize from a single successful system to universal behavior, platform readiness, or broad applicability.

## Failure Modes

- The anomaly is an artifact of measurement error, decomposition, impurity, or workup.
- Controls fail to separate the proposed mechanism from background or competing pathways.
- A single observation is overinterpreted without orthogonal confirmation.
- Confounding by medium effects, phase changes, environmental drift, or detection limits.
- The mechanism remains underdetermined despite iterative testing.
- Scope expansion proceeds before mechanistic validation, producing descriptive but non-discriminative data.

## Validity Checks

Before finalizing a research plan, verify:

- **Mechanistic specificity:** The plan tests a mechanism, not only optimizes an outcome.
- **Control completeness:** Positive, negative, missing-feature, benchmark, and mechanism-negative controls are included.
- **Confounding factors:** Solubility, stability, impurity, catalyst/surface precipitation, product decomposition, analytical bias, and environmental drift are considered.
- **Reproducibility:** Replicates, batch variation, and independent characterization are planned.
- **Statistical validity:** Trends are supported by sufficient data points, uncertainty estimates, and pre-defined metrics.
- **Evidence hierarchy:** Single observations are separated from convergent evidence.
- **Negative-result value:** The plan specifies what result would falsify each hypothesis.
- **Safety and ethics:** Hazardous chemistry remains at the research-design level; operational protocols require institutional safety review and qualified supervision.

## Provenance

- Synthesized from cluster 18, subcluster 18.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: `asymmetric-phosphinylation-mechanism-driven-discovery`, `p-chiral-phosphorus-synthesis-exploration`, `chiral-nmr-research-exploration`, `acetylene-astrochemistry-research-workflow`, `surface-growth-md-research-workflow`, `asymmetric-catalyst-exploration`, `chiral-counterion-catalysis-research`, `haspo-preligand-crosscoupling-exploration`.
