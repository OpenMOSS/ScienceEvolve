---
name: sci-quantum-observable-driven-mechanism-discovery-workf-a1f1d405
description: A reusable end-to-end workflow for generating, discriminating, and validating competing mechanistic hypotheses in complex physical systems using observable signatures, strong controls, and iterative refinement.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 20"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Synthesize a transferable research workflow that guides an agent from an unexplained phenomenon to a validated mechanistic claim by generating competing hypotheses, designing minimal discriminating tests with strong controls, analyzing multi-signature evidence, and iterating until the mechanism is either supported, bounded, or falsified.

## When to use

Use this skill when:

- A physical system exhibits an unexplained transition, instability, transport anomaly, or collective behavior.
- Multiple competing mechanisms could plausibly drive the observed phenomenon.
- The user needs a structured research plan encompassing hypothesis generation, validation design, analysis, and iteration.
- The context involves theoretical, computational, or non-operational experimental studies across condensed matter, plasma, quantum, soft matter, or multiscale domains.
- The agent must distinguish model-derived evidence from speculative extrapolation.

## Inputs required

Before executing the workflow, identify or request:

- Target system class and observable phenomenon (e.g., mode selection, transport switching, interfacial transition).
- Known baseline behavior and competing instability or transition pathways.
- Candidate mechanisms (drive, selection, stabilization, confinement, pathway encoding).
- Available diagnostics or observables (growth rates, frequencies, spatial localization, statistical moments, energy decomposition).
- Constraints: model validity regime, computational or experimental boundaries, safety and compliance limits, and acceptable stopping criteria.

## Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame the mechanistic puzzle.**
   Define the operational gap: what observable behavior is unexplained, what competing modes or states are involved, and what would constitute a successful mechanistic explanation.
   **Gate:** If the phenomenon cannot be operationalized into observable signatures, pause and refine the question.

2. **Generate ranked, falsifiable hypotheses.**
   Produce at least three competing mechanistic hypotheses. For each, specify:
   - Target mechanism and causal pathway.
   - Predicted observable signatures (growth ordering, frequency scaling, localization, statistical moments, energy landscape features).
   - Evidence strength label (established, plausible, speculative).
   - Key assumptions without which the hypothesis fails.
   - Likely failure modes (e.g., confounding by unmodeled transport, finite-size artifacts, thermodynamic dominance).
   **Gate:** If hypotheses are not mutually distinguishable by at least one independent observable, redesign signatures before proceeding.

3. **Design a minimal viable validation plan.**
   Construct the smallest test (simulation, reduced model, or non-operational experiment) that can discriminate the leading hypotheses.
   - Define independent variables (control parameters, perturbations, pattern classes).
   - Define dependent variables (diagnostics directly tied to predicted signatures).
   - Include strong controls:
     * **Positive control:** known regime where the target mechanism should operate.
     * **Negative control:** regime where the mechanism is disabled or absent.
     * **Mechanism-negative control:** target mechanism removed while retaining other conditions.
     * **Baseline control:** standard condition without special preparation.
     * **Sensitivity control:** perturbation of geometry, boundary, or noise ensemble.
   **Gate:** If the plan lacks at least one mechanism-negative and one positive control, redesign.

4. **Execute and preprocess.**
   Run the minimal validation. Inspect raw diagnostics before thresholding or averaging. Confirm that the intended state or structure was achieved and that baseline and controls behave as expected.
   **Stop condition:** If controls fail to separate as predicted, halt and diagnose whether the failure arises from model reduction, insufficient discrimination, or artifacts.

5. **Analyze with mechanism-first decomposition.**
   - Quantify the primary observable signatures for each hypothesis.
   - Separate error sources or contributions (e.g., local fluctuations versus switching, pairwise versus collective residuals, precursor versus signal growth).
   - Compare relevant timescales or interaction hierarchies.
   - Check robustness: vary boundaries, profiles, coarse-graining, disorder ensembles, or realization samples.
   - Classify evidence: label each claim as paper-validated, model-derived, simulation-supported, empirically plausible, or speculative.
   **Gate:** If the full distribution or multi-signature evidence contradicts the reduced-state or reduced-model prediction, reject or refine the hypothesis rather than tuning parameters.

6. **Map regimes and bound claims.**
   Construct a regime map using control variables as axes and outcome modes as labels. Mark uncertainty bands and validity boundaries. State explicitly whether conclusions apply to the minimal model, a class of systems, or a specific platform.
   **Gate:** If conclusions depend on a single realization, narrow parameter window, or unsupported assumption, bound the claim accordingly or stop.

7. **Iterate or terminate.**
   - If the mechanism is supported across controls and robustness checks, strengthen the hypothesis and plan a broader generalization test.
   - If the mechanism fails, archive the failure mode and return to step 2 to generate alternatives.
   - If multiple mechanisms remain viable, design a new discriminating test that changes one mechanism while preserving others.
   - If evidence is ambiguous, prioritize diagnostics that separate confounders before scaling claims.
   **Stop condition:** Terminate when the hypothesis is falsified, strongly bounded, or when further discrimination requires unsafe, non-compliant, or operationally unfeasible actions.

## Output Format

Return a structured research design containing:

1. **Research question** — concise statement of the phenomenon and gap.
2. **Mechanism map** — candidate mechanisms with role classifications (drive, selection, initiation, confounding).
3. **Ranked hypotheses** — for each: mechanism, predicted signatures, evidence strength, key assumptions, likely failure modes.
4. **Minimal validation plan** — variables, strong controls, diagnostics, and stop conditions.
5. **Analysis plan** — error-source separation, timescale and hierarchy checks, robustness tests, and evidence classification.
6. **Regime map** — outcome modes, transition boundaries, and validity limits.
7. **Iteration decision** — rules for promoting, demoting, splitting, or discarding hypotheses based on possible outcomes.
8. **Validity and boundary statement** — confounders, external validity limits, reproducibility requirements, and residual speculation.

## Validation Gates

- **Mechanism separation:** The design must distinguish the target mechanism from threshold-shifting, initiation, and confounding effects using independent diagnostics.
- **Control adequacy:** Positive, negative, mechanism-negative, baseline, and sensitivity controls must all be present and must separate as predicted.
- **Diagnostic independence:** Conclusions must rest on more than one observable or simulation output.
- **Assumption validity:** Simplifying assumptions must be justified for the tested regime.
- **Robustness:** Results must survive perturbations of boundary conditions, profiles, coarse-graining, ensemble sampling, or realization choice.
- **Evidence labeling:** Every claim must carry an evidence-strength label; speculative extensions must be explicitly flagged.

## Claim Boundaries

- State explicitly whether a claim applies only to the minimal model, to an abstract class of systems, or to a specific physical platform.
- Do not present single-study or single-model results as field-wide consensus.
- Distinguish paper-validated concepts from agent-inferred hypotheses and from proposed tests.
- Limit extrapolation to regimes where controls and robustness checks have been performed.

## Failure Modes

- **Thermodynamic confounding:** The observed behavior is driven by stability differences rather than the proposed kinetic, dynamic, or pathway mechanism.
- **Artifact-driven signatures:** Finite-size effects, boundary conditions, numerical damping, mesh sensitivity, or detector artifacts mimic the predicted mechanism.
- **Overfitted models:** Parameters are tuned to match one threshold while ignoring morphology, timing, or full-distribution evidence.
- **Undiagnosed competing pathways:** Hidden states, resonance clusters, or unmodeled error pathways explain the observation.
- **Insufficient timescale separation:** The proposed mechanism requires a separation that does not exist in the target regime.
- **Non-operational blockage:** The validation plan requires unsafe procedures, unreviewed experimental operations, or unrealistic platform constraints.

## Validity Checks

Before finalizing any recommendation:

- **Confounder analysis:** Evaluate finite size, boundaries, noise, nonstationarity, calibration disorder, hidden states, and model truncation.
- **Reproducibility:** Document state-assignment rules, preprocessing, analysis pipelines, and model assumptions so the study can be repeated.
- **Statistical validity:** Report uncertainty, sampling variability, sensitivity ranges, and convergence tests; avoid post-hoc realization selection.
- **External validity:** State the domain of applicability and avoid generalizing beyond validated geometries, coupling topologies, or regimes.
- **Safety and compliance:** Ensure the plan remains non-operational; flag any need for qualified human review before physical implementation.

## Provenance

Synthesized from cluster 8 (subcluster 8.0) of the scientific skills codex. Source skills contributing to this merged workflow include:
- `kinetic-pathway-assembly-research-planning` (8b14e2b1a66cff93)
- `topological-memory-localization-exploration` (7d43b7af63efb1f1)
- `helimagnet-skyrmion-interaction-workflow` (00544f9a4d6d37f0)
- `tokamak-edge-mode-selection-workflow` (d298e397f9ccae7a)
- `bistable-transport-research-pattern` (26541ca6b0c6c6f5)
- `multiscale-interfacial-dynamics-mechanism-isolation` (8f8076df7812e0d4)
- `quantum-array-localization-research-planning` (df59b9b2956efa96)
- `plasma-laser-amplifier-research-workflow` (030fd4150589f63e)
