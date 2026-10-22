---
name: sci-quantum-quantum-symmetry-mechanism-discovery-workfl-939bb87b
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in quantum systems, turning anomalous spectroscopic or transport observations into ranked, falsifiable hypotheses through multi-probe discrimination and iterative claim-bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides an agent through a transferable research program for discovering and validating microscopic mechanisms in quantum systems where anomalous spectroscopic, transport, thermodynamic, or correlation observations defy standard explanations. It replaces single-study conclusions with a reusable pattern: frame anomalies against baseline models, generate competing symmetry-resolved hypotheses, design minimal multi-probe validation with rigorous controls, and iterate by falsification until claims are bounded by convergent independent evidence.

## When to use

- When a user presents an unexpected feature in quantum matter data and seeks discriminating mechanisms rather than a literature summary.
- When competing explanations involve symmetry breaking, hidden order, emergent quasiparticles, localization, or collective modes that must be separated by independent observables.
- When the task requires designing non-operational research plans, analysis pipelines, or iteration strategies across multiple probes and control variables.
- Do not use for executable experimental protocols, fabrication recipes, or hazardous operational procedures.

## Inputs required

- **Anomaly description:** the unexpected observation, its symmetry channel, and the baseline model it contradicts.
- **System context:** relevant quantum regime, known symmetries, conservation laws, and dimensionality.
- **Available diagnostics:** primary and independent probes, measurement constraints, and calibration status.
- **Prior hypotheses:** candidate mechanisms from literature or theory, including artifact and null explanations.
- **Constraints:** safety boundaries, facility limits, sample availability, and target output type.

## Core Workflow

1. **Frame anomaly and baseline.** Define the tension between observation and the conservative baseline prediction. State the qualitative deviation and the regime where it appears.
   - *Gate:* Is the anomaly reproducible across independent samples, runs, or analysis choices and separable from background? If no, stop and audit preprocessing, calibration, or sample quality.
2. **Generate competing mechanisms.** Produce at least three falsifiable hypotheses: a canonical explanation, an anomaly-compatible mechanism, and an artifact or confounder. Map each to predicted symmetry signatures, hidden variables, or latent structures.
   - *Gate:* Does every hypothesis make a testable prediction that differs from the others in at least one independent observable? If no, refine or decompose hypotheses until discriminable.
3. **Construct mechanism-signature matrix.** For each hypothesis, list expected dependencies on symmetry channels, control variables, and cross-probe signatures.
   - *Gate:* Is there at least one orthogonal perturbation or probe that can reject the leading hypothesis if it is wrong? If no, redesign the validation plan before proceeding.
4. **Design minimal viable validation.** Select a primary diagnostic, one independent latent-variable diagnostic, and a calibration/background check. Define positive, negative, and instrumental controls. Specify qualitative variables and evaluation metrics.
   - *Gate:* Are controls feasible at a non-operational design level and do they address the dominant confounders? If no, scope down to a smaller variable range or simpler contrast.
5. **Execute pre-registered analysis.** Apply consistent preprocessing across all conditions. Fit the baseline model first, then add minimal discriminant ingredients only where residuals are systematic. Compare nested and non-nested models using parameter stability and cross-observable consistency.
   - *Gate:* Do the data require a mechanism beyond the baseline, or can the anomaly be absorbed by background, calibration, or fitting artifacts? If the latter, stop and report null.
6. **Cross-probe consistency check.** Compare inferred latent variables or mechanism signatures across independent diagnostics. Treat agreement as convergent support and disagreement as evidence for intermediate regimes, missing physics, or probe-specific artifacts.
   - *Gate:* Do at least two independent probes agree on the mechanism direction? If divergent, flag as unresolved and require a third discriminating observable before promoting any hypothesis.
7. **Rank evidence and bound claims.** Assign each hypothesis an evidence strength (strong, moderate, weak, speculative) based on convergent observations, control survival, and model parsimony. Explicitly label what is directly observed, model-inferred, and agent-proposed.
   - *Gate:* Is the leading hypothesis supported by multiple independent observables and free from contradiction by strong controls? If yes, bound the claim to the tested regime; if no, demote or suspend.
8. **Iterate or terminate.**
   - If a hypothesis is falsified by a robust control, remove it and return to step 2.
   - If evidence is ambiguous, add the single most informative discriminating measurement and return to step 4.
   - If the leading hypothesis survives and converges, test boundary conditions by varying symmetry class, material family, or regime.
   - *Stop conditions:* (a) the key prediction is contradicted by a control; (b) only one observable supports the mechanism; (c) no remaining test can separate the top hypotheses; (d) the next step requires operational parameters or exceeds safety/facility limits.

## Output Format

1. **Research question:** one-sentence anomaly statement and why it is nontrivial.
2. **Ranked hypotheses:** table with mechanism, evidence strength, key assumptions, predicted signatures, falsification criteria, and failure modes.
3. **Minimal validation plan:** diagnostics, controls, qualitative variables, metrics, and stop conditions.
4. **Analysis plan:** preprocessing, model comparison, residual inspection, uncertainty handling, and cross-probe integration.
5. **Iteration roadmap:** decision tree for promote/demote/reject, next measurement, and alternative branches.
6. **Validity and claim-boundary notes:** confounders, reproducibility requirements, regime limits, and safety/compliance constraints.

## Validation Gates

- **Reproducibility gate:** Anomaly must appear across independent samples, repeated runs, or equivalent analysis pipelines.
- **Control gate:** Positive and negative controls must behave as expected before interpreting the primary signal.
- **Cross-probe gate:** Mechanism claims require convergence from at least two independent observables; single-probe claims remain provisional.
- **Model-parsimony gate:** Prefer the simplest explanation that accounts for all relevant data; add parameters only when baseline failure is documented.
- **Statistical gate:** Uncertainty must be propagated through calibration, fitting, and model comparison; avoid overfitting and multiple-comparison bias.
- **Symmetry gate:** Symmetry assignments must survive checks for accidental degeneracy, conserved-sector leakage, and misalignment.

## Claim Boundaries

- Distinguish **observed facts** from **model inferences** and **speculative extensions**.
- Limit mechanism claims to the tested symmetry class, material family, energy regime, and control-variable range.
- Do not treat a single-system result as field-wide consensus.
- Mark agent-inferred extensions as provisional until independently validated.

## Failure Modes

- **Artifact dominance:** The anomaly is generated by detector response, background subtraction, calibration drift, or data-processing choices.
- **Confounding by hidden variables:** An unmeasured symmetry channel, disorder, or boundary condition mimics the proposed mechanism.
- **Single-probe overreach:** A mechanism is claimed based on one diagnostic without independent corroboration.
- **Model overfitting:** A complex model fits noise or sample-specific details and fails on independent data.
- **Irreproducibility:** The anomaly vanishes under changed samples, cooldowns, analysis criteria, or preprocessing.
- **Symmetry leakage:** Apparent symmetry breaking is an artifact of unresolved degeneracies, misalignment, or mixed domains.
- **Finite-size or crossover confusion:** A regime attributed to a new phase collapses toward conventional behavior under scaling or improved resolution.
- **Extrapolation beyond validity:** Fitted parameters or mechanisms are applied outside their demonstrated regime.

## Validity Checks

- **Confounders:** Audit sample quality, disorder, strain, inhomogeneity, contact/boundary effects, instrument background, and environmental variability.
- **Reproducibility:** Require independent samples, repeated measurements, consistent transitions across probes, and stable fitting results.
- **Statistical validity:** Report uncertainties, avoid overfitting, compare nested and non-nested models, and perform sensitivity analyses.
- **Boundary conditions:** State whether conclusions apply only to specific structures, carrier densities, dimensionalities, field regimes, or energy windows.
- **Evidence discipline:** Separate measured facts, model-dependent inferences, and speculative extensions in every output.
- **Consensus discipline:** Treat source skills as provenance for the workflow pattern, not as evidence for universal physical conclusions.

## Provenance

- Derived from cluster 87.0 ("symmetry-guided mechanism discovery and validation").
- Synthesized from source skills: condensed-matter-musr-superconductivity-exploration, condensed-matter-elastic-anomaly-explorer, laser-plasma-spectral-dip-exploration, field-angle-superconductivity-exploration, quantum-thermalization-exploration, fractional-quantum-hall-excitation-gap-exploration, thermal-paradox-rc-research-design, cosmic-ray-solar-modulation-exploration.
