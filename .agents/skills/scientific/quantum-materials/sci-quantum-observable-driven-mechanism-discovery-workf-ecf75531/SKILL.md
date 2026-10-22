---
name: sci-quantum-observable-driven-mechanism-discovery-workf-ecf75531
description: A reusable end-to-end workflow for generating competing hypotheses, designing controlled validation studies, and iteratively discriminating mechanisms from anomalous or underexplored observables without copying source-specific parameters.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 26"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to turn anomalous or underexplored observables into discriminating mechanism hypotheses, design minimal controlled validation plans, and iterate evidence-aware conclusions without reusing source-specific parameters, systems, or numerical results.

## When to use

Use this skill when the user asks to propose new research questions, explain anomalous responses, reconcile conflicting interpretations, or design validation studies where multiple microscopic mechanisms could produce the same macroscopic observable. Applicable across transport, interfacial, boundary, dynamic, correlated, and active-matter systems when the task requires mechanism isolation rather than single-model fitting or operational protocol execution.

## Inputs required

Before producing a plan, request or identify:

- Target system class and regime of interest, described conceptually without unsafe or paper-specific operating values.
- The anomalous or underexplored observable, including how it is measured and its known constraints.
- Candidate mechanisms and known confounders (e.g., coupled processes, boundary effects, artifacts).
- Available validation assets: simulations, experiments, diagnostics, benchmarks, or literature anchors.
- Constraints: safety, ethics, computational or experimental budget, instrumentation access, and acceptable stopping criteria.

## Core Workflow

Follow this ordered route from gap identification to bounded claim. Pass each gate before proceeding; if a gate fails, stop or redesign.

1. **Anchor the gap and observable**
   - Define the model-data gap or anomalous observable in terms of a measurable state variable, flux, contrast, or response signature.
   - Separate robust observations from interpretation-dependent claims.
   - **Gate:** If the observable cannot be defined independently of the proposed mechanism, refine the measurement concept before proceeding.

2. **Generate competing mechanism hypotheses**
   - Produce at least three alternative hypotheses (e.g., target mechanism, confounding mechanism, artifact mechanism).
   - For each hypothesis record: mechanism statement, predicted signature, falsification signal, key assumptions, evidence strength (established / plausible / weak / speculative), and domain boundary.
   - **Gate:** If hypotheses are not mutually distinguishable by any planned observable or control, redesign the observable set.

3. **Design minimal controlled validation**
   - Define independent variables (mechanism under test), intermediate diagnostics, and outcome variables.
   - Include baseline, negative, positive, and alternative-mechanism controls.
   - Pre-register stop conditions: artifact dominance, assumption violation, uncertainty overlap with baseline, or unsupported extrapolation.
   - **Gate:** If controls cannot isolate the target mechanism from known confounders, downgrade to exploratory or redesign.

4. **Execute and analyze with mechanism-first logic**
   - Verify matched conditions across cases so that only intended inputs differ.
   - Extract intermediate diagnostics before interpreting macroscopic outcomes.
   - Compare branches, decompose responses, or ablate terms conceptually to separate necessary from merely compatible mechanisms.
   - Quantify uncertainty, residual structure, and sensitivity to analysis assumptions.
   - **Gate:** If numerical, finite-size, sampling, or diagnostic artifacts explain the signal, stop causal interpretation.

5. **Discriminate and exclude mechanisms**
   - Score each hypothesis against controls using sign, magnitude, trend, and uncertainty overlap.
   - Exclude hypotheses falsified by negative controls or inconsistent with intermediate diagnostics.
   - **Gate:** If no hypothesis survives exclusion, return to Step 2 with a revised mechanism map.

6. **Iterate or escalate claims**
   - **Supported:** Strengthen only after alternative mechanisms and artifacts are ruled out; propose orthogonal validation.
   - **Partially supported:** Revise the mechanism map and identify the controlling assumption.
   - **Falsified:** Record the falsifying observation and promote the strongest alternative for testing.
   - **Ambiguous:** Prioritize the next minimal discriminator; avoid consensus claims until independent checks converge.
   - **Stop conditions:** Halt when the claim reaches the boundary of the tested regime, when uncertainty dominates the sign or curvature of the response, when fitted parameters depend on arbitrary preprocessing, or when further discrimination requires unsupported extrapolation.

7. **Bound and document outputs**
   - Classify evidence as direct measurement, inferred mechanism, or speculative extension.
   - State domain boundaries and regime limits explicitly.
   - Archive provenance, residual risks, and unresolved confounders.

## Output Format

Produce the following deliverables:

1. **Research question and gap** — the observable anomaly and why it matters.
2. **Ranked candidate hypotheses** — table with mechanism, evidence strength, key assumptions, predicted signature, falsification signal, and failure mode.
3. **Minimal validation design** — primary perturbation concept, response observable, controls, replication strategy, and stop conditions.
4. **Analysis plan** — intermediate diagnostics, decomposition or ablation strategy, residual checks, and uncertainty treatment.
5. **Iteration decision rules** — what result supports, revises, rejects, or redirects each hypothesis, and the next discriminator.
6. **Claim boundary and validity summary** — confounders, reproducibility checks, domain limits, and residual risks.

## Validation Gates

Before advancing between workflow stages, confirm:

- **Observable independence:** the target signal is defined before mechanism assignment.
- **Hypothesis distinguishability:** competing hypotheses predict different signatures under at least one planned control.
- **Control adequacy:** baseline, negative, positive, and alternative-mechanism controls are specified.
- **Diagnostic ordering:** intermediate variables are analyzed before macroscopic outcome interpretation.
- **Uncertainty reporting:** effect size, residual structure, and sensitivity to assumptions are documented.
- **Extrapolation check:** claims remain within the tested regime, geometry, and model assumptions.

## Claim Boundaries

- Distinguish direct measurement, inferred mechanism, and speculative extension.
- Do not generalize anomaly locations, transition boundaries, or parameter sensitivities across untested material classes, regimes, or geometries.
- Do not treat single-study, single-model, or single-platform results as field consensus.
- State the domain boundary explicitly; conclusions should not be transferred beyond the tested control plane without independent validation.

## Failure Modes

- The signal is indistinguishable from artifact, noise, background drift, or diagnostic leakage.
- Fitted parameters or inferred transition locations depend on arbitrary preprocessing, smoothing, differentiation, or interpolation.
- The anomaly disappears under artifact controls, negative controls, or alternative-mechanism tests.
- Finite-size, sampling, numerical, or ensemble effects dominate the qualitative conclusion.
- The mechanism requires unsupported assumptions or extrapolation outside the validated regime.
- A competing mechanism explains the same observations more parsimoniously.

## Validity Checks

- **Confounder coverage:** coupled processes, boundary effects, geometry, finite-size effects, and measurement artifacts are explicitly considered.
- **Reproducibility:** baseline, variants, diagnostics, and analysis steps are specified at a conceptual level sufficient for independent reconstruction.
- **Statistical and numerical validity:** uncertainty, convergence, sampling variability, and solver choices are reported and separated from mechanism-driven effects.
- **Causal order:** in time-resolved studies, the proposed cause precedes the proposed effect.
- **Model validity:** approximations, closures, and coarse-graining choices are checked against the target regime.
- **Physical consistency:** inferred parameters and intermediate diagnostics satisfy independent constraints where available.

## Provenance

- Synthesized from cluster 83.1 (observable-driven mechanism discovery and validation).
- Derived from source skills: `thermodiffusion-transport-exploration`, `correlated-thermal-anomaly-exploration`, `magnetized-plasma-instability-workflow`, `eos-supernova-research-design`, `disordered-wave-localization-exploration`, `coupled-transient-damage-exploration`, `adaptive-intelligent-soft-matter-research-planning`, `softly-confined-active-matter-exploration`.
- Preserves reusable methodological patterns only; no paper-specific systems, materials, parameters, numerical results, or operational protocols are included.
