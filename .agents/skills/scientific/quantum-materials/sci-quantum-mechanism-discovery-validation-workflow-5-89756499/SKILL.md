---
name: sci-quantum-mechanism-discovery-validation-workflow-5-89756499
description: Guide an agent through an end-to-end workflow to discover, discriminate, and validate mechanisms behind complex patterns, order, or collective behavior across computational, spatial, or network-driven systems.
scienceevolve-title: "Quantum materials and condensed matter · mechanism discovery validation workflow 5"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide an agent through a reusable, end-to-end scientific workflow to discover, discriminate, and validate candidate mechanisms behind observed patterns, emergent order, or collective behavior in complex systems. The workflow treats every model-specific finding as a conditional hypothesis subject to controlled falsification, not as established consensus.

# When to use

Use this skill when the user asks to:

- Propose research questions about emergent phenomena where baseline explanations are insufficient.
- Compare competing mechanisms that could produce similar observables.
- Design minimal validation studies with explicit controls and stopping criteria.
- Move from observed trends or averaged data to testable, latent-structure hypotheses.
- Evaluate whether a proposed mechanism survives robustness checks, scaling tests, and independent observables.

Use for theoretical, computational, or observational research planning. Do not use as a substitute for domain consensus, safety review, or operational experimental protocols.

# Inputs required

Before generating a plan, collect or clarify:

- **Target system class**: the domain, relevant degrees of freedom, and applicable symmetry or conservation laws.
- **Observable**: the primary measurement, simulation output, or scale-resolved statistic that motivates the inquiry.
- **Baseline model**: the simplest accepted explanation and its predicted signatures.
- **Candidate mechanisms**: competing hypotheses for what generates the discrepancy (e.g., hidden states, latent spatial structure, critical fluctuations, nonlinear coupling, or symmetry breaking).
- **Available tools**: computational solvers, statistical frameworks, imaging or tracking methods, and likelihood approximations.
- **Constraints**: resource limits, acceptable uncertainty, ethical boundaries, and whether the task is exploratory or confirmatory.

# Core Workflow

Execute the following ordered route. Treat each numbered step as a stage with an explicit decision gate.

1. **Frame the discrepancy**
   - Define the observed phenomenon and the specific mismatch with the baseline model.
   - Identify whether the mismatch is robust or potentially artifactual.
   - **Gate:** If the discrepancy cannot be separated from measurement noise, sampling bias, or preprocessing choices, stop and refine the observable or baseline before proceeding.

2. **Generate competing hypotheses**
   - Formulate at least two falsifiable, mechanistic hypotheses that explain the discrepancy (e.g., robustness, destabilization, hidden-state, critical-coordination, or latent-feature hypotheses).
   - For each hypothesis, specify: predicted signatures, key assumptions, evidence strength (strong / moderate / weak / speculative), and likely failure modes.
   - **Gate:** If the hypotheses are not mutually distinguishable with available or obtainable observables, narrow the mechanism scope or expand the diagnostic set before continuing.

3. **Design minimal validation**
   - Define a minimal viable study: baseline condition, positive control, negative control, and robustness / mechanism-isolation control.
   - State independent variables, dependent variables, nuisance variables, and pre-registered stopping criteria.
   - **Gate:** If the leading hypothesis cannot be falsified with available resources, downgrade it to exploratory and flag the missing diagnostic.

4. **Execute observation or simulation**
   - Collect data or run simulations under the predefined conditions.
   - Document initialization, seeds, parameter choices, and preprocessing pipelines.
   - **Gate:** If data quality, coverage, or equilibration is insufficient for the planned diagnostics, iterate on collection or reduce the scope; do not proceed to inference with inadequate inputs.

5. **Hierarchical analysis**
   - Inspect raw distributions before averaging; test for multimodality, skew, or latent branches.
   - Compute diagnostic observables: order parameters, correlation functions, local slopes, event-size distributions, or population statistics.
   - Compare against null models, surrogate data, and alternative mechanism predictions.
   - **Gate:** If diagnostics fail to separate candidates, perform sensitivity checks on thresholds, binning, event definitions, or coarse-graining. If still ambiguous, flag inconclusive and proceed to iteration.

6. **Control validation and confound screening**
   - Verify that positive and negative controls separate as expected.
   - Check for confounding by initialization, finite-size effects, boundary conditions, direct contact, source placement, or input sampling bias.
   - Test robustness across alternative analysis windows, partitions, or random seeds.
   - **Gate:** If results depend critically on arbitrary choices or fail control checks, reject the hypothesis and return to step 2.

7. **Iterate or generalize**
   - **If supported:** Map boundary conditions, test scaling with system size or parameter range, and assess transferability to analogous systems.
   - **If rejected:** Return to step 2 with updated constraints or an expanded model space.
   - **If inconclusive:** Identify the specific missing diagnostic and return to step 3 for targeted validation.
   - **Stop condition:** Halt when a mechanism is discriminated to the available resolution, when further discrimination requires resources outside scope, or when the phenomenon is determined to be artifactual.

# Output Format

When using this skill, produce:

1. **Research question:** concise statement of the discrepancy and target mechanism.
2. **Hypothesis table:** competing hypotheses with predicted signatures, evidence strength, key assumptions, and failure modes.
3. **Validation plan:** minimal viable design with controls, variables, metrics, and stopping criteria.
4. **Analysis plan:** diagnostic hierarchy, null-model comparisons, robustness checks, and decision rules.
5. **Iteration plan:** update rules for supported, rejected, or ambiguous results.
6. **Validity statement:** confounds, boundary conditions, reproducibility requirements, and uncertainty labels.

# Validation Gates

- **Discrepancy clarity gate:** The mismatch must be definable independent of analysis choices.
- **Distinguishability gate:** Hypotheses must predict distinct signatures across at least two observables or control conditions.
- **Falsifiability gate:** The study design must be capable of rejecting the leading hypothesis if it is wrong.
- **Quality gate:** Data or simulations must pass equilibration, coverage, and replication checks before inference.
- **Control gate:** Positive and negative controls must separate; otherwise inference is suspended.
- **Robustness gate:** Conclusions must survive reasonable variation in thresholds, partitions, windows, or seeds.

# Claim Boundaries

- **Directly supported:** Claims backed by the current study's controls, replicated diagnostics, and pre-registered criteria.
- **Method-supported:** Claims consistent with the workflow logic but relying on approximate methods (e.g., linear response, finite-size scaling).
- **Speculative:** Claims extrapolated to new systems, untested parameter regimes, or analogical transfers.
- Never present single-study or single-model results as field-wide consensus. Always label the boundary of validity.

# Failure Modes

- **Metastability and initialization dependence:** Results reflect trapped states rather than equilibrium or typical behavior.
- **Finite-size artifacts:** Apparent order or transitions vanish or shift with larger system sizes.
- **Overfitting to diagnostics:** Models tuned to one signature fail on independent observables.
- **Confounding variables:** The tested variable is entangled with unintended symmetry changes, boundary effects, or sampling bias.
- **Averaging artifacts:** Ensemble or time averages conceal coexisting hidden states or multimodal distributions.
- **Threshold sensitivity:** Conclusions change when event definitions, activation thresholds, or smoothing parameters are varied.
- **Degeneracy:** The target shift is absorbed by standard parameter correlations rather than revealing a new mechanism.

# Validity Checks

- **Confounding:** Screen for boundary effects, preparation history, environmental drift, detector bias, and model-dependent labeling.
- **Equilibration:** Verify that results are not dominated by transient relaxation or unreported warm-up periods.
- **Finite-size and scaling:** Distinguish true long-range order or criticality from crossover behavior; test size dependence before claiming universality.
- **Statistical validity:** Use independent replicates, uncertainty propagation, predefined model-comparison criteria, and multiple-comparison controls.
- **Reproducibility:** Document assumptions, code versions, random seeds, data provenance, and decision rules sufficiently for independent replication.
- **Boundary conditions:** State explicitly whether conclusions apply to the tested model class, interaction range, symmetry, spatial dimension, or observation window.

# Provenance

- Synthesized from cluster 95 / subcluster 95.0 (end-to-end mechanism discovery and validation).
- Source skills: centrosymmetric-skyrmion-exploration (19529f0ff4fc425e), cluster-magnetism-hidden-state-exploration (7abbbaef9d57676f), criticality-driven-collective-information-transfer (dfb858e0cab5ece3), chromosome-polymer-scale-signature-exploration (e940c25bdb225610), nonlinear-sensory-avalanche-exploration (0ed09538293cd440), cosmological-tension-data-driven-model-search (87c9b9880e7c726a), spatial-stochastic-cooperation-exploration (f544b3e2bc0c1c64), non-equilibrium-soft-matter-self-replicating-patterns (7d75563387fdfa80).
