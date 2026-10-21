---
name: sci-quantum-quantum-nonlinear-field-wave-mechanism-disc-98b5262a
description: Guides agents to design end-to-end research plans for discovering and validating mechanisms in quantum, nonlinear, field, wave, photonic, and topological systems through symmetry-guided hypothesis discrimination and controlled dual-channel validation.
scienceevolve-title: "Quantum materials and condensed matter · quantum nonlinear field wave mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent design reusable research plans for discovering and validating microscopic or emergent mechanisms in systems where symmetry, scale, nonlinearity, boundary conditions, or collective modes shape observable behavior. The core method is symmetry-guided mechanism discrimination: map a domain gap onto competing hypotheses, validate through controlled dual-channel evidence, decompose responses by mode or scale, and iterate until claims are bounded by robustness checks.

# When to use

Use this skill when the user asks to:

- Propose new research questions in quantum, nonlinear, field, wave, photonic, or topological domains.
- Resolve discrepancies between theoretical predictions and observations, or between descriptions at different scales.
- Design minimal validation plans for a candidate mechanism.
- Discriminate among competing mechanisms using symmetry analysis, controlled perturbations, and independent evidence channels.
- Evaluate whether theory-experiment or theory-simulation agreement is robust enough to support a mechanism claim.

Do not use this skill for clinical decision-making, biological safety guidance, or operational instructions for hazardous experiments.

# Inputs required

Before generating a research plan, collect or infer:

- Target system class, symmetry constraints, and conservation laws.
- Functional property or phenomenon of interest.
- Candidate mechanisms and known gaps or discrepancies motivating the study.
- Available evidence channels (e.g., analytical theory, numerical simulation, spectroscopy, bulk or local probes).
- Perturbation variables that can alter the relative weight of candidate mechanisms.
- Baseline behavior expected in the absence of the proposed mechanism.
- Safety, ethics, facility, and compliance constraints relevant to the domain.

If any input is missing, state the assumption explicitly and mark conclusions as conditional.

# Core Workflow

1. **Frame the gap and define the observable space**
   - Convert the broad scientific question into a falsifiable mechanism question. Identify discrepancies between predictions and observations, or between descriptions at different scales.
   - Define the primary observable and the baseline behavior expected without the proposed mechanism.
   - **Decision gate:** Is the gap observable with available channels? If not, refine the question or stop.

2. **Construct a symmetry-preserving minimal model**
   - Identify exact symmetries, conservation laws, and relevant collective variables.
   - Build the coarsest model consistent with these symmetries that can distinguish the candidate mechanism from a simpler baseline.
   - Explicitly list omitted terms and justify why they are expected to be subdominant.
   - **Decision gate:** Does the model predict a measurable deviation from the baseline? If not, reformulate the model or stop.

3. **Generate a competing hypothesis portfolio**
   - Formulate at least three hypotheses: a primary mechanism, a competing mechanism, and an artifact or confounder hypothesis.
   - For each, specify: mechanistic rationale; evidence strength (strong, moderate, weak, or speculative); key assumptions; predicted observable signature; contrast condition under which it should change; boundary where it should fail; and likely failure modes.
   - **Decision gate:** Are the hypotheses falsifiable and distinguishable with planned variables and controls? If not, redesign perturbations or controls.

4. **Design dual-channel validation**
   - Pair independent evidence channels (e.g., analytical or simulation prediction with experimental or numerical observation).
   - Map both channels into the same observable representation, including weighting, resolution, selection rules, background treatment, and finite-size or discretization assumptions.
   - Define a minimal viable validation: one direct observable; one mapped prediction; one positive or reference control; one negative or null control; and one perturbation that should alter the mechanism.
   - **Decision gate:** Can both channels produce comparable, reproducible observables? If not, redesign the analysis pipeline.

5. **Execute controlled comparison and decomposition**
   - Apply perturbations that shift the relative weight of candidate mechanisms.
   - Decompose responses by mode, scale, symmetry sector, element, or subsystem to attribute features.
   - Verify that controls behave as expected and that background or nuisance variables do not dominate.
   - **Decision gate:** Do controls pass and confounders remain subdominant? If not, audit sample state, model validity, or analysis choices before interpreting.

6. **Discriminate mechanisms against baselines**
   - Compare the observed signature against the simpler baseline and against competing hypotheses.
   - Test robustness to model truncation, boundary conventions, finite-size effects, disorder, or parameter variations.
   - Exclude mechanisms that fail negative controls or require post hoc adjustments.
   - **Decision gate:** Does one hypothesis survive while alternatives are excluded? If inconclusive, proceed to iteration.

7. **Iterate or redesign**
   - Classify evidence for the leading hypothesis as strong support, partial support, weak or inconclusive, or contradiction.
   - Identify the bottleneck: sample state, measurement sensitivity, observable mapping, model approximation, confounder structure, or hypothesis granularity.
   - Select the next decisive test that most efficiently distinguishes the surviving leading hypothesis from the strongest alternative.
   - **Iteration and stop conditions:** Stop and redesign if controls fail, background dominates, competing hypotheses remain indistinguishable after reasonable tests, the model cannot be mapped to the observable, or safety or ethics constraints prevent reliable execution. Otherwise, loop to step 4 or 5 with stronger controls or independent observables.

8. **Bound claims and define the validity region**
   - State the conditions under which the conclusion holds, including symmetry class, scale window, parameter regime, and material or system family.
   - Separate what is directly supported by evidence from what is inferred or speculative.
   - Document residual failure modes and unresolved alternatives.

# Output Format

When using this skill, produce:

1. **Research question** — property or phenomenon; candidate mechanism; gap or discrepancy motivating the study.
2. **Hypothesis portfolio** — at least three hypotheses, each with evidence strength, key assumptions, predicted signatures, failure modes, and boundary conditions.
3. **Minimal viable validation** — direct observable; mapped prediction; controls; perturbation or contrast condition; stop conditions.
4. **Stronger validation design** — independent observables; additional controls; replication or sensitivity checks; criteria for support, partial support, contradiction, or inconclusive outcome.
5. **Analysis plan** — preprocessing and uncertainty handling; observable mapping; feature extraction; decomposition; confounder testing.
6. **Iteration plan** — evidence classification rules; how results update the hypothesis; next decisive test; boundary conditions for extrapolation.
7. **Validity and safety notes** — final checks; non-operational safety boundaries; clear separation of observations, inferences, and speculative next steps.

# Validation Gates

Checkpoint criteria that must be satisfied to proceed between workflow stages:

- **Gap clarity:** The research question is falsifiable and the observable is well defined.
- **Symmetry validity:** The minimal model preserves all exact symmetries of the target system.
- **Hypothesis discriminability:** Competing hypotheses predict measurably different outcomes under at least one control or perturbation.
- **Channel comparability:** Theory and observation are mapped into the same representation with documented weighting, resolution, and conventions.
- **Control fidelity:** Positive and negative controls produce expected outcomes under identical analysis conventions.
- **Robustness:** The leading mechanism survives reasonable variation of truncation, boundary, disorder, or nuisance parameters.

# Claim Boundaries

Explicitly limit conclusions by stating:

- The tested symmetry class, material or system family, and geometry.
- The validated scale, energy, or resolution window.
- The regime where the mechanism is expected to hold versus where extrapolation is unsupported.
- Which evidence is source-supported, model-supported, or agent-inferred.
- That a single study or demonstration does not constitute field-wide consensus.

# Failure Modes

Prescribed responses to common failure scenarios:

- **Controls fail or background dominates:** Halt interpretation; redesign the measurement or model mapping; check sample state and nuisance variables.
- **Model and observable mismatch:** Stop; reformulate the minimal model or choose a different observable channel.
- **Competing hypotheses remain indistinguishable:** Add an independent observable or stronger control; do not overclaim uniqueness.
- **Signature depends on arbitrary analysis choices:** Reject the feature as artifact; require robustness to binning, fitting, or reduction pipelines.
- **Negative control shows the claimed signature:** Reject the proposed mechanism; search for hidden asymmetries or confounders.
- **Safety or compliance constraints violated:** Stop; maintain non-operational boundaries and defer execution to qualified personnel.

# Validity Checks

Before presenting a final research plan or conclusion, verify:

- **Confounding:** Could sample state, impurities, disorder, background, or instrument response explain the signature?
- **Comparable observables:** Are all channels compared in the same representation with appropriate weighting and resolution?
- **Controls:** Are positive or reference, negative or null, and artifact controls included and passed?
- **Perturbation logic:** Does each variable change test a specific mechanism rather than multiple unrelated effects?
- **Statistical and numerical validity:** Are uncertainties, convergence, fit stability, branch tracking, and multiple-comparison risks addressed?
- **Reproducibility:** Are model definitions, data reduction, feature extraction, and mapping choices documented for independent replication?
- **Boundary conditions:** Are conclusions limited to the tested regime, scale, and symmetry class?
- **Consensus discipline:** Is the source treated as one benchmark rather than universal truth?
- **Safety and ethics:** Does the plan avoid clinical advice and operational hazardous instructions?

# Provenance

This skill was synthesized from cluster 33.0 (symmetry-guided mechanism discovery and validation). Representative source skills: phonon-spectral-benchmarking-workflow (8c701978893e2de6), frustrated-magnet-research-workflow (bf6c70e1cd652b8b), elastic-bilayer-membrane-rg-exploration (7cbbad8a8561b14a), polaritonic-energy-transfer-research-design (de32bb766d6716f0), synthetic-coordinate-optical-cavity-research (4e37de7a8b2754f4), chiral-nonlinear-optics-research-design (e211ed2743481600), nonhermitian-boundary-robustness-workflow (4ff87e340df20b1b), neutrino-flavor-instability-research-design (64faa282429a6b9a).
