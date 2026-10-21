---
name: sci-cosmology-galaxy-simulation-mechanism-discovery-wor-abde27fa
description: A reusable end-to-end workflow for designing controlled simulation studies that discover, discriminate, and validate physical mechanisms behind galaxy-scale dynamical and structural phenomena.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy simulation mechanism discovery workflow 2"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide agents in transforming an observational or theoretical degeneracy into a rigorous, simulation-based mechanism-discovery study. The workflow structures hypothesis generation, controlled experimental design, diagnostic analysis, and iterative claim validation for galaxy formation and dynamics problems.

# When to use

Use this skill when:
- A user needs to distinguish competing physical mechanisms that can reproduce the same primary observable in galaxy simulations.
- The task requires designing controlled numerical experiments for dynamics, feedback, transport, or structural evolution.
- The goal is to validate whether a simulated signature is physical or numerical/artifactual.
- The task involves iterating on sub-resolution models, equilibrium constructions, or environmental-process hypotheses.

Do not use this skill for purely observational survey design without a simulation component, operational telescope or instrument instructions, or as a general astrophysics encyclopedia.

# Inputs required

Before proposing a study, identify or request:
- Target phenomenon and primary observable (e.g., morphology, kinematics, scaling relation, phase-space structure).
- Competing mechanism frameworks or candidate processes to be contrasted.
- Simulation or modeling modality (e.g., N-body, hydrodynamical, semi-analytic, reduced-dimension).
- Diagnostic capabilities: time-dependent, spatial, spectral, or budgetary quantities extractable from model outputs.
- Known confounders: resolution limits, boundary conditions, initial conditions, selection effects, projection effects, and tracer biases.
- Claim scope: mechanism test, model comparison, resolution convergence, or prediction for future observations.

# Core Workflow

Follow this ordered end-to-end route. Apply decision gates at each stage; stop or redesign when a gate fails.

1. **Frame the Degeneracy.** Identify a primary observable that multiple mechanisms can reproduce. Define the mechanism gap by separating what is directly constrained from what depends on hidden physics, force laws, transport channels, or boundary assumptions.
   - *Decision gate:* If competing frameworks cannot be matched on the primary observable, pause and recalibrate baselines before proceeding.

2. **Generate Ranked Hypotheses.** Produce at least three mechanistic hypotheses. For each, specify: evidence strength, key assumptions, predicted secondary signature, failure mode, and boundary condition.
   - *Decision gate (Candidate gate):* Reject or refine hypotheses that cannot be falsified by the available diagnostics or simulation modality.

3. **Design Controlled Experiments.** Match primary observables across frameworks to isolate differences. Vary one mechanism at a time using paired variants. Include:
   - Negative controls: suppress or remove the proposed channel.
   - Positive controls: a regime where the expected signature is known to be detectable.
   - Technical controls: cross-check solver behavior, boundary assumptions, resolution sensitivity, and analysis definitions.
   - *Stop condition:* If baseline matching fails, controls cannot separate mechanisms, or diagnostics are insensitive, redesign before execution.

4. **Validate Numerical Foundation.** Confirm solver agreement, conservation behavior, convergence, and boundary robustness before any physical interpretation.
   - *Decision gate (Stability gate):* If numerical artifacts dominate, halt scientific interpretation and fix the modeling pipeline.

5. **Execute Mechanism-Discrimination Analysis.** Analyze processes through time, not only end states. Decompose signals by component, phase, region, and time. Map resonances, transport budgets, angular-momentum exchange, or structural modes. Link emergent morphology to the candidate physics.
   - *Decision gate (Mechanism exclusion):* If the signature disappears in the negative control or appears identically in all variants, reject the specific mechanism hypothesis.

6. **Stress-Test Robustness.** Repeat key conclusions under alternative initial conditions, analysis definitions, resolution levels, and observational proxies. Verify that results do not depend on a single threshold, aperture, tracer choice, or time window.
   - *Decision gate (Robustness check):* If the conclusion is definition-sensitive, downgrade the claim to a measurement artifact before making physical inferences.

7. **Iterate and Redesign.** Update the research plan based on results:
   - If secondary signatures are consistent across independent diagnostics, strengthen the mechanism claim.
   - If results are resolution-dependent, treat the finding as conditional on the numerical regime.
   - If multiple mechanisms remain degenerate, add independent diagnostics or redesign the experimental contrast.
   - *Iteration gate:* Return to Step 2 or 3 if hypotheses are weakened but not excluded, or if new confounders are discovered.

8. **Bound Claims and Audit Uncertainty.** Limit conclusions to tested galaxy classes, environments, redshifts, and resolution regimes. Clearly separate paper-supported methodology, cross-study context, and agent-inferred extensions. Document all choices required for reproduction.
   - *Decision gate (Claim bounding):* If extrapolation beyond tested boundaries is requested, flag the conclusion as speculative and require additional validation.

# Output Format

Each use of this skill must produce:

1. **Research question:** One concise question tied to the target phenomenon.
2. **Evidence map:** Observed evidence, paper-supported methodology, cross-study context, and agent-inferred assumptions with labeled strength.
3. **Ranked hypotheses:** At least three hypotheses, each with evidence strength, key assumptions, predicted secondary signature, failure mode, and boundary condition.
4. **Experimental plan:** Competing frameworks, baseline-matching strategy, controls, independent variables, dependent variables, metrics, diagnostics, and stop conditions.
5. **Analysis plan:** Numerical validity checks, time-series diagnostics, decomposition strategy, morphology or transport linkage, and robustness checks.
6. **Iteration rules:** How each possible result updates, weakens, or rejects the hypotheses.
7. **Validity and ethics report:** Confounders, reproducibility requirements, boundary conditions, and communication risks.

# Validation Gates

- **Baseline equivalence:** Competing frameworks match the primary observable within a pre-defined tolerance before mechanism contrast.
- **Control specificity:** Negative controls suppress the proposed signature; positive controls recover it; technical controls separate physics from numerics.
- **Numerical stability:** Conservation laws hold, convergence is demonstrated, and boundary effects are bounded and documented.
- **Diagnostic independence:** At least two independent diagnostics support the same mechanism.
- **Reproducibility:** Model versions, initial states, random seeds, output cadence, diagnostic definitions, and analysis scripts are documented for independent replication.

# Claim Boundaries

- Distinguish simulation-intrinsic quantities from mock-observable proxies and from direct observational claims.
- Label every claim as: directly supported by controls, plausible inference, or speculative extension.
- Do not generalize from a single simulation, halo, resolution, or environment to field-wide consensus.
- State explicit boundaries: mass range, environment density, redshift, resolution regime, and included physics modules.

# Failure Modes

- **Baseline mismatch:** Frameworks differ in the primary observable due to calibration rather than the candidate mechanism.
- **Numerical artifact dominance:** Solver, resolution, boundary, or discretization effects masquerade as physical signals.
- **Control failure:** Negative controls show the signature, or positive controls fail to recover it.
- **Definition sensitivity:** The result vanishes or reverses under alternative but defensible analysis choices.
- **Degeneracy persistence:** Multiple mechanisms predict identical secondary signatures within measurement uncertainty.
- **Tuning dependence:** The result relies on undocumented parameter choices or non-physical adjustments.
- **Extrapolation risk:** Applying idealized or isolated results to complex cosmological populations without forward validation.

# Validity Checks

- **Confounding:** Are differences caused by the candidate mechanism rather than initial conditions, boundary treatment, resolution, environment, gas content, or model tuning?
- **Statistical validity:** Are sample size, time averaging, selection effects, multiple comparisons, and uncertainty intervals appropriate for the claim?
- **Process consistency:** Do morphology, kinematics, transport budgets, resonance locations, and angular-momentum exchange converge on the same mechanism?
- **Boundary condition validity:** Are conclusions explicitly limited to the studied galaxy classes, isolation assumptions, acceleration regimes, and observational comparisons?
- **Evidence separation:** Are paper-supported findings, cross-study evidence, and agent-inferred extensions clearly labeled and separated?

# Provenance

- Derived from cluster 4, subcluster 4.1: symmetry-guided mechanism discovery and validation.
- Synthesized from source skills: galaxy-dynamics-gravity-model-exploration, subresolution-galaxy-formation-research, galaxy-disc-transport-exploration, cluster-satellite-evolution-research, galaxy-velocity-bias-exploration, cosmological-merger-orbit-research, etg-halo-research-exploration, iterative-equilibrium-model-design.
- Preserves shared methodological patterns without reproducing paper-specific parameters, numerical results, or code implementations.
