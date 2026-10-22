---
name: sci-quantum-quantum-symmetry-correlated-topological-mec-91a0907a
description: A reusable end-to-end workflow for discovering and validating mechanisms in quantum, correlated, and topological systems using symmetry-guided effective modeling, hypothesis ranking, and controlled model discrimination.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry correlated topological mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to transform an observed anomaly or theoretical puzzle in a quantum, correlated, or topological system into a structured research program. It guides the agent through symmetry-constrained hypothesis generation, minimal effective-model construction, mechanism discrimination via strong controls, and iterative refinement while keeping claims bounded by evidence.

# When to use

Use this skill when the task involves one or more of the following:

- Proposing new research questions or mechanisms in quantum materials, correlated electron systems, topological phases, or driven quantum platforms.
- Building minimal effective models from symmetry and low-energy degrees of freedom.
- Discriminating among competing mechanisms using model comparisons, control studies, and robustness checks.
- Designing non-operational validation plans (theoretical, computational, or conceptual experimental) for emergent phases or order parameters.
- Iterating hypotheses based on failed predictions, unexpected symmetries, or confounding alternatives.

Do not use this skill for operational laboratory protocols, fabrication recipes, hazardous procedures, or as a general domain tutorial.

# Inputs required

Before starting the workflow, identify or request:

- **Target system class** and known symmetries (crystal or magnetic point group, time-reversal, inversion, spin-orbit structure).
- **Observed anomaly or puzzle** and the baseline model that fails to explain it.
- **Candidate degrees of freedom** (orbitals, bands, spin, pseudospin, collective modes, hidden mediators).
- **Available observables and diagnostics** (spectral, transport, thermodynamic, response functions, correlation spectra).
- **Competing mechanisms** or alternative explanations to exclude.
- **Constraints** on approximations, computational methods, or validation standards.
- **Boundary conditions** described qualitatively (dimensionality, temperature regime, disorder level, coupling strength, energy scale).

# Core Workflow

Follow this ordered end-to-end route. Each step includes a decision gate; use the iteration rules to revisit earlier steps when a gate fails.

1. **Define the puzzle and baseline**
   - State the anomaly and why the standard reduced model is insufficient.
   - Identify whether the gap concerns mechanism, missing degrees of freedom, geometry, or diagnostics.
   - **Gate:** If the anomaly is not explicitly defined or the baseline model is missing, stop and clarify inputs.

2. **Symmetry audit and missing-variable scan**
   - Identify the local and global symmetries that constrain low-energy states and order parameters.
   - Audit which degrees of freedom are underrepresented in the baseline (e.g., orbital structure, spin-orbit coupling, interband coupling, hidden mediators).
   - **Gate:** If the system's symmetries are unknown, flag this as a blocking uncertainty and request input before proceeding.

3. **Generate ranked hypotheses**
   - For each candidate mechanism, specify:
     - The missing variable or symmetry channel.
     - How it modifies the low-energy subspace or effective interactions.
     - Predicted discriminators (signatures that differ from the baseline).
     - Evidence strength: **High** (symmetry-enforced or multi-observable), **Moderate** (model-consistent but assumption-dependent), **Low** (plausible analogy), or **Speculative**.
     - Key assumptions and likely failure modes.
   - **Gate:** If no hypothesis produces a falsifiable prediction distinguishable from the baseline and alternatives, return to step 2 and expand the missing-variable scan.

4. **Construct minimal effective models**
   - Build the smallest symmetry-respecting model that includes the proposed mechanism.
   - Keep terms required by symmetry separate from model-specific ansätze.
   - Derive gap-closing conditions, instability indicators, or phase boundaries as functions of tuning variables.
   - **Decision:** If the model requires uncontrolled fine-tuning or violates stated symmetries, downgrade the evidence strength or reject the hypothesis.

5. **Design controlled validation**
   - Define the minimal viable check that could falsify the mechanism.
   - Specify controls:
     - **Positive control:** a known limit or benchmark the framework must reproduce.
     - **Negative control:** remove the proposed ingredient and confirm the new behavior disappears.
     - **Strong control:** vary symmetry class, coupling structure, or geometry to test the predicted fingerprint.
     - **Discriminating control:** a comparison that yields different signatures for the proposed mechanism and its closest competitor.
   - Define evaluation metrics and pre-register stop conditions before testing.
   - **Gate:** If controls cannot isolate the mechanism from confounders (disorder, artifacts, competing orders), redesign the validation plan.

6. **Execute model comparison and stability analysis**
   - Compare full, reduced, and alternative models using matched approximations, truncations, and boundary conditions.
   - Check thermodynamic stability, gap structure, and phase-boundary topology.
   - Test robustness to reasonable parameter variation, finite-size changes, and disorder realizations.
   - **Gate:** If the effect disappears under matched approximations, stability checks, or robustness tests, trigger iteration.

7. **Analyze and decompose results**
   - Decompose observables into retained-sector, eliminated-sector, and cross-sector contributions where possible.
   - Test symmetry signatures (phase dependence, scaling, orientation, locality, topology).
   - Compare against simpler alternative models and artifact explanations.
   - Quantify uncertainty: separate numerical, model-structure, and statistical sources.
   - **Gate:** If results are equally explained by a simpler alternative or artifact model, exclude the hypothesis.

8. **Iterate or redesign**
   - **If supported:** Sharpen predictions, propose the next independent discriminator, and narrow the claim.
   - **If ambiguous:** Test calibration, confounders, boundary regimes, or approximation validity before increasing confidence.
   - **If failed:** Revise the symmetry assignment, add omitted physics, or reject the hypothesis and return to step 3.
   - **Stop conditions:** Stop if the hypothesis requires unsupported assumptions, violates symmetry, is indistinguishable from alternatives after controls, or if competing phases dominate across the plausible model space.

9. **Bound claims and document provenance**
   - Label each conclusion as **symmetry-enforced**, **model-derived**, **numerically observed**, or **speculative**.
   - State extrapolation limits, weakest assumptions, and residual risks explicitly.

# Output Format

Return a structured report containing:

1. **Research question** — concise statement of the anomaly and proposed investigation.
2. **Ranked hypotheses table** — hypothesis, missing variable/symmetry channel, mechanism, evidence strength, key assumptions, predicted discriminators, and likely failure modes.
3. **Minimal validation plan** — model arms, controls (positive/negative/strong/discriminating), evaluation metrics, and stop conditions.
4. **Analysis plan** — symmetry audit, effective-model extraction, stability/robustness checks, decomposition strategy, and alternative-model comparison.
5. **Iteration decision log** — conditions for strengthening, weakening, redirecting, or rejecting each hypothesis.
6. **Validity and boundary statement** — confounders, reproducibility requirements, extrapolation limits, and explicit separation of established versus inferred claims.

# Validation Gates

- **Puzzle clarity gate:** The anomaly and the baseline mismatch are explicitly stated.
- **Symmetry gate:** Proposed terms are allowed by the system's stated symmetries; forbidden terms are excluded.
- **Falsifiability gate:** Every hypothesis predicts at least one signature that would distinguish it from the baseline and from plausible alternatives.
- **Control isolation gate:** The validation plan includes controls capable of separating the proposed mechanism from disorder, artifacts, and competing orders.
- **Stability gate:** The effective model is thermodynamically stable and robust to reasonable variation of uncertain parameters.
- **Convergence gate:** Results are reproducible across independent methods, finite-size settings, or disorder realizations where applicable.

# Claim Boundaries

- **Symmetry-enforced:** Direct consequences of the stated symmetries, independent of detailed model parameters.
- **Model-derived:** Follows from the minimal effective model under explicitly listed assumptions.
- **Numerically observed:** Reproduced in simulations or calculations with stated approximations and convergence checks.
- **Speculative:** Plausible extension or analogy not yet tested in the target system or regime.

Do not present a single study, platform, or paper as field-wide consensus.

# Failure Modes

- **Reduction failure:** The low-energy model misses essential coupling to eliminated high-energy or hidden sectors.
- **Symmetry misassignment:** The actual symmetry is lower than assumed, invalidating protected degeneracies or forbidden terms.
- **Competing order dominance:** An omitted mechanism (e.g., charge order, magnetism, disorder-induced localization) reproduces the same signature.
- **Fine-tuning artifact:** The effect appears only for narrow, unjustified parameter choices or boundary conditions.
- **Observable nonuniqueness:** A single diagnostic is equally explained by multiple mechanisms; multi-feature discrimination is absent.
- **Boundary artifact:** The signal is a finite-size, boundary, gauge, or initialization artifact rather than a bulk phase property.
- **Calibration or confounding:** Drift, leakage, heating, readout nonlinearity, or environmental coupling mimics the predicted signature.

# Validity Checks

Before finalizing any proposal or conclusion, verify:

- **Confounders:** Have disorder, strain, finite-size effects, temperature, measurement backaction, and competing orders been considered?
- **Approximation parity:** Are differences between models due to the proposed mechanism and not unmatched truncations, basis sets, or closures?
- **Reproducibility:** Are assumptions, controls, decision rules, and numerical choices explicit enough for independent replication?
- **Extrapolation limits:** Are claims restricted to the tested symmetry class, energy scale, and parameter regime?
- **Evidence separation:** Are paper-derived mechanisms, model-derived predictions, and speculative extensions clearly labeled?
- **Mechanism specificity:** Does the proposed mechanism predict something that simpler alternatives cannot?
- **Numerical reliability:** Have convergence, cutoff dependence, discretization, and basis completeness been checked where applicable?

# Provenance

Synthesized from cluster 132.0 ("symmetry-guided mechanism discovery and validation") source skills: `altermagnet-majorana-research-workflow`, `correlated-quantum-materials-effective-model-workflow`, `bilayer-superconductor-phase-patterns`, `field-induced-superconductivity-agent`, `multiband-superconductivity-exploration`, `hybrid-mediator-correlation-research-planning`, `auxiliary-harmonic-quantum-control`, `mott-reduced-model-research-planning`.
