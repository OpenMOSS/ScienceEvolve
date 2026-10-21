---
name: sci-cosmology-galaxy-halo-simulation-feedback-mechanism-3e35cfb9
description: A reusable end-to-end workflow for discovering and validating astrophysical feedback mechanisms in galaxy and halo simulations through controlled hypothesis generation, matched comparative modeling, multi-diagnostic analysis, and iterative claim refinement.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo simulation feedback mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill guides an agent through designing, executing, and validating a simulation-based research program to discover or discriminate among physical mechanisms—particularly feedback, merger, or environmental processes—that shape galaxy and halo properties. It abstracts the shared methodological logic from cosmological simulation studies into a reusable, domain-adaptable workflow.

## When to use

Use this skill when:
- A research problem involves uncertain, coupled, or partially represented mechanisms affecting galaxies, halos, or their surrounding medium.
- The user needs testable research questions and controlled experimental designs rather than literature summaries.
- Multiple observables or diagnostics must jointly constrain a model family.
- The task requires iterating between hypothesis generation, minimal validation, and robustness testing.

Do not use this skill as a substitute for current domain literature, expert review, or independent validation in the target regime.

## Inputs required

Before applying the workflow, ask for or infer:

- Target physical system and regime (e.g., mass range, redshift, environment class).
- Observable gap or theoretical tension motivating the study.
- Candidate mechanisms linking sources or processes to medium or structural evolution.
- Available simulation, catalog, or analytic assets and their known limitations.
- Primary conditioning variables and response diagnostics.
- Computational constraints and acceptable evidence thresholds.
- Known validity boundaries of the data, model code, or observational sample.

If any input is missing, state assumptions explicitly and mark downstream claims as inferred rather than verified.

## Core Workflow

Follow this ordered route; treat each decision gate as a hard stop or redesign trigger.

1. **Frame the gap and mechanism space**
   - Define the observational or theoretical tension in terms of a measurable discrepancy.
   - List candidate mechanisms and construct explicit causal chains from input physics to intermediate dynamical response to final observable.
   - **Decision gate:** If the gap cannot be expressed as a falsifiable contrast between mechanism-on and mechanism-off expectations, stop and reformulate the research question.

2. **Design controlled comparisons**
   - Define a baseline model that excludes or minimizes the candidate mechanism.
   - Define mechanism-enabled variants with independent physical motivation; do not tune parameters to reproduce the target discrepancy.
   - Specify strong controls (matched initial conditions, resolution, measurement definitions), negative controls (regimes where the mechanism should be negligible), and positive controls (regimes where it should operate clearly).
   - **Decision gate:** If baseline and variants differ in more than the intended variable, redesign before proceeding.

3. **Pre-register definitions and metrics**
   - Fix object definitions, selection criteria, measurement apertures, fitting windows, and binning schemes before inspecting outcomes.
   - Define primary metrics (most direct mechanism test), secondary metrics (abundance, scaling relations, environmental dependence), and failure metrics (signals that should disappear under controls).
   - Define stop conditions: convergence failure, control mismatch, sample sparsity, or unresolved confounding.

4. **Execute minimal viable validation**
   - Run the smallest comparison set that can falsify the leading hypothesis.
   - Check numerical convergence and resolution sufficiency before interpreting physical trends.
   - **Decision gate:** If null or positive controls behave incorrectly, or if the primary diagnostic is dominated by numerical noise, stop and resolve the setup before scaling up.

5. **Analyze at multiple levels**
   - **Population-level:** Compare abundance, scaling relations, residual distributions, and environmental dependence.
   - **Per-object/case-level:** Inspect formation histories, time-resolved trajectories, and threshold-crossing events.
   - **Relation-level:** Examine covariance among response residuals and secondary-selection effects.
   - Require agreement across structural, dynamical, spatial, and observable metrics before strengthening a claim.
   - When visualizing, show time or condition evolution, not only endpoint summaries.

6. **Discriminate mechanisms and classify failures**
   - If the signal is robust, map it to the specific causal link (e.g., source production, transport, feedback coupling, environmental modulation).
   - If diagnostics disagree, classify the failure mode: wrong source physics, incorrect feedback prescription, missing coupling, invalid observable interpretation, numerical artifact, or insufficient model coverage.
   - **Decision gate:** If the mechanism only works under unsupported assumptions, in unresolved regimes, or worsens independent diagnostics, downgrade or reject the hypothesis.

7. **Iterate and refine**
   - **Upgrade** the hypothesis when matched controls reproduce the predicted pattern and independent diagnostics agree.
   - **Downgrade** when success depends on a single fragile diagnostic or unsupported assumption.
   - **Split** when multiple mechanisms can explain the same symptom.
   - **Replace** when a stronger baseline shows the original hypothesis tested the wrong variable.
   - If convergence or resolution limits dominate, narrow the claimed regime and request higher-fidelity data.
   - Loop back to step 2 or 3 as needed.

8. **Bound claims and report**
   - Label evidence strength for each claim (high, moderate, weak, or insufficient).
   - Separate paper-supported, domain-supported, and newly inferred claims.
   - State validity boundaries explicitly: mass, redshift, environment, resolution, and model-family limits.

## Output Format

When using this skill, produce:

1. **Research question** — Concise, testable question framed around a mechanism and observable.
2. **Evidence boundary map** — Separation of paper-supported, domain-supported, inferred, and out-of-scope claims.
3. **Ranked hypothesis cards** — Each with claim, mechanism, evidence strength, key assumptions, predicted signal, failure modes, and iteration trigger.
4. **Experimental design summary** — Baseline, mechanism variants, controls, metrics, and stop conditions.
5. **Analysis plan and results** — Multi-level diagnostics, convergence checks, sensitivity ranking, and joint diagnostic comparison.
6. **Validation gate log** — Which gates passed or failed, with justification.
7. **Iteration record** — How results upgraded, downgraded, split, or replaced hypotheses.
8. **Final claim boundary statement** — Explicit limits on generalization and extrapolation.

## Validation Gates

- **Mechanism isolation gate:** Baseline and variants are matched on all non-target assumptions.
- **Convergence gate:** Target statistics are stable across resolution or methodological sensitivity tests.
- **Control fidelity gate:** Negative controls show negligible signal; positive controls show expected signal.
- **Multi-observable consistency gate:** Independent diagnostics agree on the same causal story.
- **Sample sufficiency gate:** Local windows or rare populations have enough objects for stable estimates.

## Claim Boundaries

- Distinguish **robust patterns** (reproduced across controls and independent diagnostics) from **conditional patterns** (valid only in specific regimes) and **inferred extensions** (requiring validation).
- Do not treat single-simulation or single-survey results as domain consensus.
- Mark extrapolations beyond tested mass, redshift, environment, or model-family regimes as speculative.
- Avoid presenting model-dependent inferences as established observational facts.

## Failure Modes

- **Confounding:** Unmatched variables between baseline and mechanism variants.
- **Numerical artifact:** Resolution, halo finder, boundary condition, or convergence bias masquerading as physical signal.
- **Selection bias:** Event definitions, thresholds, or survey incompleteness driving apparent trends.
- **Diagnostic degeneracy:** Multiple mechanisms produce identical signatures in the primary diagnostic.
- **Overfitting:** Tuning mechanism parameters to reproduce a target discrepancy without independent validation.
- **Extrapolation error:** Applying results beyond the validated regime without labeling them as speculative.

## Validity Checks

Before finalizing claims, verify:

- **Confounding and matching quality:** All variants matched except the intended mechanism.
- **Numerical convergence:** Mass, spatial, and time-resolution effects are quantified and within tolerance.
- **Definition stability:** Results survive reasonable changes in centers, apertures, thresholds, and halo finder settings.
- **Statistical validity:** Sample variance, cosmic variance, selection effects, and uncertainty ranges are considered.
- **Reproducibility:** Inputs, code versions, preprocessing choices, analysis steps, and random seeds are documented.
- **External validity:** The target regime is close enough to the validation domain.
- **Evidence separation:** Paper-supported lessons, cross-study support, and agent-inferred extensions are clearly labeled.

## Provenance

- Synthesized from cluster **18.0** (galaxy-halo-simulation-feedback-mechanism-discovery-workflow).
- Source skills: early-universe-feedback-bracketing (10.1111_j.1365-2966.2004.07636.x), dark-matter-halo-statistics-simulation-workflow (10.1088_0004-637x_767_2_146), baryonic-feedback-halo-structure-exploration (10.1093_mnras_stv2165), cosmological-simulation-merger-exploration (10.1093_mnras_staa459), dwarf-galaxy-threshold-exploration (10.1093_mnras_stag439), space-gw-mbh-mission-science-workflow (10.1103_physrevd.93.024003), mass-conditioned-population-statistics (10.48550_arxiv.2001.02283), early-universe-streaming-research-design (10.3847_1538-4357_ad6762).
