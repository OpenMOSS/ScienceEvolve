---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-50feeb54
description: A reusable end-to-end workflow for turning anomalous or incomplete observations into discriminating mechanism hypotheses, validating them through controlled multiparametric experiments, and iterating until claims are bounded by evidence.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 11"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent design disciplined research programs that move from observable gaps, anomalies, or under-sampled regions to validated mechanism claims. The workflow emphasizes generating competing hypotheses, isolating variables through controlled comparisons, triangulating evidence across multiple observables, and explicitly bounding claims by their supporting evidence.

## When to use

Use this skill when the user asks to propose new research questions, hypotheses, or validation plans for systems where the controlling mechanism is unclear, particularly when:

- observations are indirect, multiparametric, or drawn from complex matrices;
- classical descriptions may miss interface, confinement, transport, or collective effects;
- the goal is to distinguish hidden mechanisms from artifacts, confounders, or sample-specific behavior;
- a confirmed mechanism sample or catalog is intended for downstream secondary use.

Do not use this skill as a source of field-wide consensus, operational laboratory instructions, or domain-specific recipes. Treat all paper-derived content as abstracted methodological patterns that require independent validation in each target system.

## Inputs required

Before generating a plan, collect or infer:

- Target system and the observable phenomenon, gap, or anomaly to be explained.
- Why direct observation is insufficient and what evidence is missing.
- Candidate mechanisms or latent classes, plus the physical or logical assumptions that make them distinguishable.
- Available measurement modalities and their limitations (spatial, temporal, spectral, statistical).
- Baseline, reference, or control systems that can isolate or enrich specific mechanisms.
- Known confounders: heterogeneity, preparation variability, environmental drift, contact or setup effects, and preprocessing artifacts.
- Constraints: safety boundaries, resource limits, data quality, and intended depth of validation.
- Desired output: hypothesis set, minimal validation experiment, full experimental design, analysis plan, or iteration roadmap.

## Core Workflow

Follow this ordered route from gap definition to bounded claim. Treat each numbered step as a stage with an explicit decision gate.

1. **Frame the gap or anomaly**
   - Define the observation that is unexplained, under-sampled, or anomalous.
   - State why existing explanations are insufficient and identify the scientific leverage of filling the gap.
   - *Gate:* If the observation is not reproducible across independent samples, regions, or acquisition sessions, stop here and refine the measurement protocol.

2. **Build a mechanism map**
   - List candidate mechanisms that could produce the observed signature.
   - For each, specify predicted observable patterns across at least two independent measurement dimensions (e.g., spatial, temporal, spectral, statistical).
   - Distinguish transferable mechanistic principles from system-specific facts.
   - *Gate:* If only one mechanism is conceivable, treat it as untested and generate at least one alternative explanation (e.g., artifact, confounder, or conventional limit).

3. **Generate competing hypotheses**
   - Structure each candidate as a falsifiable causal claim with: concise statement, rationale, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observables, likely failure modes, and a minimal discriminating test.
   - Include at least one hypothesis that the observable readout may track an unintended proxy rather than the target mechanism.
   - *Gate:* If no hypothesis can be falsified with available tools, redesign the measurement approach or add orthogonal probes before proceeding.

4. **Design minimal viable validation**
   - Select the smallest experiment that can distinguish the top two hypotheses.
   - Define independent variables (the perturbation or selection), dependent variables (signatures and metrics), and a control set: baseline, negative, positive/contrastive, and proxy-validation when applicable.
   - Pre-register the primary metric, boundary-detection rule, and excluded regions before data collection.
   - *Gate:* If no control can isolate the proposed mechanism from preparation artifacts, environmental drift, or setup effects, pause and add reference anchors or blind checks.

5. **Execute and analyze with mechanism-first triangulation**
   - Audit data for missing values, duplicates, metadata consistency, and independence of observations.
   - Preprocess transparently; document every transformation, normalization, and feature selection choice.
   - Identify inactive, threshold, linear, and saturated regimes before fitting empirical relations.
   - Quantify uncertainty from spatial heterogeneity, repeated measurements, and batch variability.
   - Require consistency across multiple observables before strengthening a mechanism claim.
   - *Gate:* If data quality is too low to separate signal from artifact, or if confounders are unmeasured, stop and improve controls or instrumentation.

6. **Update evidence and rank mechanisms**
   - Classify each hypothesis as: supported, weakened, unresolved, or confounded.
   - Revise the smallest assumption needed; prefer revising contact, geometry, or environmental assumptions before adding new collective mechanisms.
   - *Decision branch:*
     - **If supported:** the leading mechanism is consistent across kinetic trends, endpoint validation, and contrastive controls. Proceed to strong validation.
     - **If ambiguous:** refine the mechanism map, add a complementary candidate source, or collect more reference data.
     - **If contradicted:** abandon or pivot when strong controls fail, the anomaly tracks setup geometry, or parameters become mutually inconsistent.

7. **Strong validation and boundary testing**
   - Test the supported mechanism on comparable systems, held-out conditions, or orthogonal probes to separate general patterns from system-specific behavior.
   - Define boundary conditions (material family, environmental range, geometric regime) where the mechanism should plausibly apply or fail.
   - *Gate:* If the mechanism fails boundary tests or requires mutually inconsistent parameters, downgrade it to a local or conditional claim.

8. **Bound claims and document failure modes**
   - State explicit claim boundaries, residual uncertainties, and conditions under which the mechanism would fail.
   - Label every claim as: paper-derived pattern, agent inference, or experimentally supported for the target system.
   - *Stop condition:* Do not generalize beyond the tested boundary without contrastive evidence; do not treat fitted coefficients as universal outside their calibration domain.

## Output Format

When using this skill, return a structured research plan containing:

1. **Research question and gap definition**
   - Target system, observable anomaly or gap, and scientific motivation.
   - What is known from abstracted patterns versus what is inferred for the new system.

2. **Mechanism map**
   - Candidate mechanisms, predicted cross-modal signatures, assumed causal links, and likely confounders.

3. **Ranked hypotheses**
   - At least three competing hypotheses.
   - For each: causal claim, evidence strength, key assumptions, predicted observables, likely failure modes, and minimal discriminating test.

4. **Experimental design**
   - Independent and dependent variables.
   - Control set (baseline, negative, positive/contrastive, proxy-validation).
   - Minimum viable validation and strong validation steps.
   - Stop conditions.

5. **Analysis plan**
   - Preprocessing and feature extraction rules.
   - Regime identification, uncertainty handling, and triangulation logic.
   - Criteria for accepting, weakening, or rejecting hypotheses.

6. **Iteration plan**
   - How each possible outcome updates the mechanism map.
   - Redesign directions for selectivity, stability, reproducibility, or matrix-effect failures.
   - Criteria for advancing, pivoting, or stopping.

7. **Validity and claim-boundary statement**
   - Confounders, reproducibility checks, statistical cautions.
   - External validity boundary and evidence-labeling scheme.
   - Safety and decision-use boundaries.

## Validation Gates

Before advancing past each stage, confirm:

- **Reproducibility gate:** The core observation is detectable across independent samples, regions, or batches.
- **Control gate:** At least one negative and one baseline control are defined and feasible.
- **Triangulation gate:** Mechanism confidence requires agreement across at least two independent observables or measurement modalities.
- **Confounder gate:** Known structural, environmental, instrumental, or preprocessing confounders are measured or modeled.
- **Regime gate:** Thresholds, saturation, or phase boundaries are identified before empirical fitting.
- **Boundary gate:** Transfer limits and scope of applicability are stated before generalizing to new systems or conditions.

## Claim Boundaries

- Do not treat single-system, single-material, or single-dataset observations as field-wide consensus.
- Do not extrapolate fitted coefficients, thresholds, or rate laws beyond the domain in which they were calibrated.
- Distinguish abstracted methodological patterns from agent inferences and from experimentally validated claims for the target system.
- Mark mechanistic claims as conditional on the tested boundary conditions and explicitly note where the mechanism is expected to fail.
- Avoid presenting catalog, clustering, or model outputs as standalone proof of safety, reliability, or fitness-for-use.

## Failure Modes

Common ways this workflow fails or produces unreliable conclusions:

- The anomaly or cluster tracks contact geometry, setup artifacts, preprocessing choices, or detector drift rather than an intrinsic mechanism.
- Competing hypotheses are underdetermined: multiple mechanisms produce indistinguishable observable patterns with current probes.
- Controls behave identically to the test condition, indicating unmodeled confounders.
- Observable regimes (e.g., threshold, saturation) are ignored, leading to overfitted global models.
- The chosen proxy readout tracks damage, quenching, roughening, or background rather than the intended transformation.
- Clusters or signatures disappear under perturbation, subsampling, or replication.
- Yield or selectivity improvements are offset by unreported stability, reproducibility, or safety degradation.

## Validity Checks

Before finalizing any research plan or claim, verify:

- **Gap clarity:** The plan addresses a defined measurement or mechanistic failure, not a generic desire for better performance.
- **Mechanism clarity:** Each design choice has a plausible causal role linked to predicted observables.
- **Control adequacy:** Blank, negative, positive, matrix-matched, baseline, and reproducibility controls are included where relevant.
- **Confounding control:** Structural, environmental, instrumental, and sampling covariates cannot explain the expected conclusion.
- **Proxy validity:** The indirect readout is validated against the intended chemical, physical, or structural transformation.
- **Statistical validity:** Uncertainty, replication, regime-aware fitting, and separation of exploratory from confirmatory analyses are specified.
- **Reproducibility:** Independent preparation, repeated regions, or batch effects are considered when variability matters.
- **Boundary conditions:** The scope of applicability is explicitly defined and excluded regimes are stated.
- **Evidence labeling:** Source-derived patterns, analogies, and agent-generated hypotheses are clearly distinguished.
- **No overgeneralization:** One paper, one platform, or one matrix result is not treated as universal.

## Provenance

- Synthesized from cluster 74.1 (observable-driven mechanism discovery and validation).
- Source skills: low-dimensional-semiconductor-oxidation-kinetics-research, electrochemical-heavy-metal-sensing-workflow, chemical-strain-engineering-research-workflow, low-latitude-background-probe-research, textile-waste-catalytic-pyrolysis-exploration, condensed-matter-anomaly-to-mechanism-workflow, ae-composite-damage-discovery, exciton-energy-landscape-research-design.
- Paper-derived methodological patterns have been abstracted into a domain-agnostic workflow. No specific material system, numerical result, fabrication parameter, or operational protocol from the source papers is endorsed or preserved as a universal claim.
