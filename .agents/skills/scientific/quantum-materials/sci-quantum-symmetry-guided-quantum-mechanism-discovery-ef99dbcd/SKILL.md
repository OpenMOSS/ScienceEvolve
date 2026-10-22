---
name: sci-quantum-symmetry-guided-quantum-mechanism-discovery-ef99dbcd
description: A reusable end-to-end workflow for generating, validating, and iterating mechanism-level hypotheses in quantum, topological, and spintronic materials using symmetry-aware multi-probe convergence and conservative claim updating.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided quantum mechanism discovery workflow 8"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to transform open questions in quantum, topological, correlated, and spin-dependent materials into structured mechanism-discovery programs. The workflow emphasizes symmetry-aware hypothesis generation, contrastive multi-probe validation, and iterative claim refinement while keeping conclusions bounded by evidence.

## When to use

Use this skill when the task involves:

- Explaining why related systems differ in transport, magnetic, optical, or phase-boundary behavior despite similar structure.
- Designing validation plans for subtle, hidden, or symmetry-broken transitions.
- Linking external tuning knobs to microscopic interaction changes through controlled measurements or modeling.
- Evaluating whether anomalous signatures are intrinsic, extrinsic, or artifactual.
- Proposing new research directions in driven, transient, or engineered quantum states.

Do not use this skill for operational fabrication recipes, hazardous procedures, or as a general-purpose materials-discovery assistant unrelated to mechanism discrimination.

## Inputs required

Before producing a plan, identify or request:

- Target material class, relevant degrees of freedom, and candidate control variables.
- Scientific gap: unexplained contrast, missing phase boundary, or untested model proxy.
- Baseline facts widely reproduced versus system-specific claims.
- Candidate mechanisms and their coupling to symmetry, correlation, topology, or disorder.
- Available non-operational probes and the most direct observable for each suspected mechanism.
- Reference systems, stress-test systems, positive controls, negative controls, and boundary conditions.
- Known confounders: sample quality, disorder, thermal history, metastability, background, geometry, or model non-uniqueness.

If inputs are missing, state assumptions explicitly and label conclusions as boundary-conditioned.

## Core Workflow

1. **Frame the gap and anchor baselines**
   - Define the research question as a missing causal link or unexplained contrast between related systems.
   - Separate established observations from unresolved debates and system-specific claims.
   - Identify the tuning axis and the local structural, electronic, or magnetic mediator most likely to couple to it.

2. **Generate ranked mechanism hypotheses**
   - Produce at least one intrinsic mechanism hypothesis and one extrinsic or alternative hypothesis.
   - For each hypothesis, label: evidence strength (robust / strong / moderate / weak / speculative), key assumptions, predicted discriminating signatures, primary failure modes, and boundary conditions.
   - Include an artifact-control hypothesis that explains how background, contact, disorder, heating, or model choices could mimic the target signature.

3. **Design minimal viable validation**
   - Select one reference system with established or strongly anticipated behavior.
   - Select one stress-test system where a key assumption is weakened.
   - Define one direct diagnostic observable and one independent diagnostic observable.
   - Specify positive controls (mechanism should be present), negative controls (mechanism should be absent), and symmetry-equivalence controls.
   - Pre-register stop conditions: e.g., if direct and indirect observables disagree without an explainable model, or if confounders dominate the signal.

4. **Pre-register analysis criteria and build multi-observable maps**
   - Define anomaly criteria (kinks, slope changes, splitting, linewidth shifts, hysteresis) before inspecting data.
   - Normalize comparable quantities and report uncertainty and background treatment.
   - Plan to overlay boundaries from transport, magnetic, structural, spectroscopic, and modeling evidence in the same control-variable space.

5. **Execute analysis and cross-probe consistency gate**
   - Check data integrity: sample identity, reference handling, repeatability, and instrument separation.
   - Classify each anomaly by identity, symmetry, coherence, and dynamics.
   - **Decision gate:** Require convergence of at least two independent observables before promoting a hypothesis. If only one probe shows an anomaly, downgrade evidence to weak and return to Step 3 with improved controls.

6. **Confounder exclusion gate**
   - Test trivial explanations first: sample quality, stoichiometry, lattice stiffness, structural transition, heating, contact effects, apparatus background, and measurement-window artifacts.
   - Evaluate model non-uniqueness, fitting-parameter correlation, and sensitivity to baseline choices.
   - **Decision gate:** If a trivial explanation survives all controls, abandon or reframe the deeper mechanism hypothesis. If excluded, proceed to mechanism update.

7. **Conservative mechanism update**
   - Promote a hypothesis only when it explains the contrast, survives independent checks, and has clear falsification conditions.
   - Update the causal chain: tuning variable → mediator → microscopic interaction → observable signature.
   - Remove assumptions contradicted by controls; add new predictions that distinguish the updated hypothesis from its closest competitor.

8. **Stress-test boundaries and prospective prediction**
   - Choose a new system, composition, strain state, or tuning path that should separate competing mechanisms.
   - Make one falsifiable prediction.
   - **Stop condition:** Stop extrapolating if control variables leave the validated boundary-condition range. Stop claiming a new phase or mechanism if anomalies cannot be reproduced or localized in a control-variable map.

9. **Iterate or finalize**
   - If results are inconclusive, return to Step 2 or Step 3 with narrowed scope.
   - If results support the hypothesis after replication, document claim level (directly observed, inferred from multiple consistent observables, model-dependent, or speculative) and boundary conditions.

## Output Format

Return a structured research plan containing:

1. **Research question** — target system, control variable, and scientific gap.
2. **Hypothesis portfolio** — ranked hypotheses with evidence strength, key assumptions, predicted signatures, failure modes, and boundary conditions.
3. **Validation plan** — reference and stress-test systems, controls, direct and independent diagnostics, variables, evaluation metrics, and stop conditions.
4. **Analysis plan** — pre-registered anomaly criteria, normalization strategy, multi-observable mapping, confounder checks, and claim-level assignment rules.
5. **Iteration plan** — decision rules for upgrading, downgrading, reframing, or abandoning hypotheses based on outcomes.
6. **Validity and boundary statement** — reproducibility requirements, safety and compliance limits, non-operational scope, and explicit generalization boundaries.

## Validation Gates

- **Convergence gate:** At least two independent observables must agree before a mechanism is promoted beyond weak evidence.
- **Control gate:** Positive, negative, and symmetry controls must be defined before data collection; if controls reproduce the sample signature, halt mechanism promotion.
- **Confounder gate:** Trivial explanations must be tested and excluded before invoking deeper electronic, topological, or magnetic mechanisms.
- **Model-validity gate:** Fitted parameters and model assumptions must be checked for identifiability, sensitivity, and physical interpretability; non-unique fits cannot support standalone conclusions.
- **Reproducibility gate:** Anomalies must be reproducible across samples, runs, or tuning paths before strong claims are made.

## Claim Boundaries

- Distinguish observed facts, model-inferred mechanisms, and speculative extensions.
- Label conclusions as directly observed, inferred from multiple consistent observables, model-dependent, or speculative.
- Do not treat single-study or single-calculation results as field-wide consensus.
- Avoid assigning topology, gap opening, or phase identity from one observable alone.
- Keep transport or device claims separate from intrinsic mechanism claims.

## Failure Modes

- **Single-probe fallacy:** A mechanism is promoted based on one anomaly without independent confirmation.
- **Confounder dominance:** Stoichiometry, disorder, thermal history, or background uncertainty dominates the signal but is ignored.
- **Model overfitting:** Complex models are preferred over simpler alternatives without cross-control improvement.
- **Boundary violation:** Conclusions are extrapolated beyond the validated tuning range, symmetry class, or material family.
- **Artifact misattribution:** Instrument response, contact effects, or heating is interpreted as an intrinsic state.
- **Symmetry misidentification:** Apparent symmetry differences are not checked against equivalence operations or resolution limits.

## Validity Checks

- Are confounding factors (disorder, strain, heating, contacts, background, sample history) explicitly addressed?
- Is the signature reproducible across independent samples, runs, or analysis pipelines?
- Are uncertainties propagated through fitting and model comparison?
- Are boundary conditions limited to tested symmetry, temperature, tuning range, and material class?
- Does the proposed mechanism predict something that trivial alternatives cannot?
- Are source-paper findings separated from new-agent inferences?
- Are negative, inconclusive, or unstable results reported rather than suppressed?

## Provenance

- Synthesized from cluster 12, subcluster 12.0: symmetry-guided mechanism discovery and validation.
- Source skills: pressure-driven-quantum-materials-research-workflow (72279b182a2c2b22), correlated-oxide-low-energy-electrodynamics-workflow (b702de48fa01a6c3), subtle-topological-transition-exploration (2b5a5c9245001909), tunable-quantum-transport-research (a4558a5dcf66d78e), coherent-floquet-transport-exploration (b319e9104c383ae2), symmetry-guided-2d-spintronics-exploration (92049b820d97c302), transient-quantum-order-workflow (arxiv-cmoat__2606.17326), boundary-mass-topological-exploration (c69ee1d783faed8d).
