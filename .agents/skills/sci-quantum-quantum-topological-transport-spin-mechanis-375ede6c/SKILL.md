---
name: sci-quantum-quantum-topological-transport-spin-mechanis-375ede6c
description: A reusable end-to-end workflow for symmetry-guided discovery and validation of hidden mechanisms in quantum, topological, spin, and transport systems.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological transport spin mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Enable agents to generate, discriminate, and validate competing mechanistic hypotheses in quantum, topological, spin, and transport research. The workflow maps hidden order parameters or latent dynamics to observable signatures through symmetry-guided controls, multi-modal validation, and iterative evidence grading.

# When to use

Use this skill when the user asks to:
- Propose new research questions involving hidden order, phase transitions, collective modes, coherent dynamics, or emergent topological behavior.
- Design non-operational studies that discriminate competing mechanisms using symmetry arguments, spectroscopy, transport observables, or simulation.
- Plan analysis, control structures, and iteration strategies for mechanism discovery.
- Evaluate evidence strength, claim boundaries, and failure modes in condensed matter, AMO, or related quantum domains.

Do not use this skill to summarize individual papers as literature reviews, to claim field-wide consensus from single studies, or to provide executable laboratory procedures, hazardous protocols, or fabrication parameters.

# Inputs required

Before generating a proposal, identify or request:

- **Target system class** and research objective.
- **Hidden variable or mechanism gap:** the unresolved order, phase, or latent structure under investigation.
- **Candidate mechanisms:** at least two competing explanations, including a baseline and an artifact/null hypothesis.
- **Theoretical bridge:** symmetry argument, effective model, or operator relation linking each mechanism to observable consequences.
- **Available observables:** measurement channels, simulation outputs, or correlation functions accessible without operational detail.
- **Control systems:** benchmarks, reference regimes, or symmetry-related states expected to show, suppress, or invert signatures.
- **Constraints:** safety boundaries, facility limits, computational budget, and acceptable uncertainty.

# Core Workflow

Follow the ordered route below. Each **Decision Gate** determines whether to proceed, redesign, or stop.

**Step 1: Frame the evidence gap**
Define the unresolved mechanism or hidden variable. Explain why existing data cannot distinguish the candidate mechanisms.

**Step 2: Generate competing hypotheses**
Produce at least three hypotheses:
- **Baseline mechanism:** conventional or smooth-behavior explanation.
- **Target mechanism:** the hidden order, coherent effect, or topological dynamics under test.
- **Artifact/null mechanism:** systematic bias, background, detector effect, or finite-system artifact.

For each, specify:
- Predicted signature(s) and symmetry transformation behavior.
- Evidence strength (low / moderate / high).
- Key assumptions and falsifying observations.

**Step 3: Build a mechanism-signature matrix**
Map hypotheses against observable axes (e.g., symmetry channel, state variable, spectral feature, spatial distribution, temporal dependence). Mark signatures as **unique** or **shared**. Prioritize hypotheses with unique, control-testable predictions.

*Decision Gate 3 — Feasibility Gate:*  
If no candidate predicts a unique signature reachable with available controls, stop and refine the observable or theoretical bridge.

**Step 4: Design minimal viable validation**
Select:
- **Primary discriminant:** the observable most directly tied to the hidden mechanism.
- **Primary variation:** one controlled parameter expected to alter the discriminant under the target mechanism but not the baseline.
- **Controls:** positive (signature should appear), negative (signature should be absent), mirror/symmetry (signature should reverse or transform), and instrumental/background checks.
- **Evaluation metrics:** specificity, symmetry consistency, model agreement, robustness, reproducibility.
- **Stopping conditions:** thresholds for background dominance, control failure, or model-degeneracy.

**Step 5: Pre-register analysis and decision criteria**
Document before data inspection:
- Baseline and mechanism models.
- Fitting windows, normalization strategy, and exclusion criteria.
- Thresholds for evidence grading (low / moderate / high).
- Criteria for accepting, rejecting, or revising each hypothesis.

**Step 6: Acquire or generate data**
Execute measurements, simulations, or computations according to the non-operational design. Record metadata, configuration, seeds, and preprocessing steps.

**Step 7: Staged analysis**
1. **Sanity checks:** inspect raw data for artifacts, saturation, convergence failures, or boundary effects.
2. **Background separation:** isolate the mechanism-relevant component from linear response, drive artifacts, and detector asymmetry.
3. **Differential and symmetry analysis:** compare symmetry-related states; construct differential observables; test predicted transformations.
4. **Model comparison:** evaluate competing models on equal footing; compare residuals, parameter stability, and complexity.

*Decision Gate 7 — Robustness Gate:*  
Repeat with alternative preprocessing, region selection, and normalization. If the conclusion reverses or becomes unstable, stop mechanism interpretation and revise assumptions.

**Step 8: Evaluate controls**
Verify that:
- Positive controls reproduce expected signatures.
- Negative controls suppress the signature.
- Mirror/symmetry controls exhibit the predicted reversal or transformation.

*Decision Gate 8 — Control Gate:*  
If any control fails, classify the result as artifact-prone or inconclusive. Do not infer the mechanism.

**Step 9: Mechanism discrimination**
Score each hypothesis against the mechanism-signature matrix. Exclude mechanisms whose predictions are violated by the data. If a single mechanism survives with consistent unique signatures, proceed to grading.

*Decision Gate 9 — Discrimination Gate:*  
If multiple mechanisms remain degenerate, return to Step 4 and design a new discriminant observable or control variable.

**Step 10: Evidence grading and claim bounding**
Assign an evidence grade:
- **High:** multiple independent signatures, passing controls, robust analysis, and reproducibility checks converge.
- **Moderate:** several aligned signatures and controls, but residual assumptions remain.
- **Low:** single signature, weak controls, or artifact-prone interpretation.

Explicitly separate:
- Verified observations.
- Inferred order or mechanism.
- Assumed coupling or theoretical bridge.

State boundary conditions and regime limits.

**Step 11: Iterate or terminate**
- **Promote:** If evidence is high, expand scope by adding one new channel, variable, or limiting regime (return to Step 4).
- **Revise:** If evidence is moderate but ambiguous, refine the model or add targeted diagnostics (return to Step 3).
- **Reject:** If signatures are absent, controls fail, or artifacts dominate, reject or downgrade the hypothesis (return to Step 2).
- **Stop:** If no feasible discriminator exists and the minimal validation remains inconclusive, stop and report the boundary limits.

# Output Format

When using this skill, return results in the following structure:

1. **Research question** — Concise statement of the gap and why it matters.
2. **Competing hypotheses** — Table with mechanism, predicted signature, evidence strength, key assumptions, and failure modes.
3. **Mechanism-signature matrix** — Hypotheses vs. observable axes, marking unique and shared predictions.
4. **Minimal viable validation** — Primary discriminant, primary variation, controls, metrics, and stop conditions.
5. **Analysis plan** — Sanity checks, background separation, symmetry/differential analysis, model comparison, robustness tests.
6. **Iteration rules** — Conditions for promoting, revising, rejecting, or stopping.
7. **Validity and boundary statement** — Confounders, reproducibility requirements, extrapolation limits, and non-operational safety constraints.

# Validation Gates

- **Feasibility Gate (Step 3):** At least one candidate mechanism must yield a unique, control-testable signature.
- **Robustness Gate (Step 7):** Conclusions must remain stable under alternative reasonable analysis choices.
- **Control Gate (Step 8):** Positive, negative, and mirror/symmetry controls must behave as predicted.
- **Discrimination Gate (Step 9):** Data must exclude at least one competing mechanism; degeneracy triggers redesign.
- **Evidence Gate (Step 10):** Observations, inferences, and theoretical bridges are separated and graded.

# Claim Boundaries

- Distinguish **observed asymmetry or feature** from **inferred order orientation** and from **assumed coupling mechanism**.
- Label every claim with its evidence strength and list the assumptions it depends on.
- Restrict claims to the tested system class, parameter regime, and measurement conditions.
- Do not treat single-study or single-system results as field-wide consensus.

# Failure Modes

- **Artifact dominance:** Background, detector response, drive artifacts, or normalization bias mimic mechanism signatures.
- **Control failure:** Negative or mirror controls show unexpected signals, indicating confounding or systematic error.
- **Model non-identifiability:** Competing mechanisms produce observables that cannot be distinguished with current discriminants.
- **Insufficient sampling:** Sparse coverage of phase, state, or parameter space prevents resolving oscillatory or threshold behavior.
- **Confounding by hidden variables:** Disorder, geometry, boundary effects, or uncontrolled couplings explain the observation.
- **Post-hoc tuning:** Theory agreement is achieved only by unsupported assumptions added after observing the data.
- **Finite-system or numerical artifacts:** Convergence limits, boundary conditions, or discretization effects masquerade as physical mechanisms.

# Validity Checks

Before presenting conclusions, verify:

- **Confounders:** Consider sample heterogeneity, geometry, boundary conditions, interfacial effects, background signals, matrix-element variations, and detector asymmetry.
- **Reproducibility:** Require repeated states, independent samples or runs, documented seeds and settings, and versioned analysis pipelines.
- **Statistical validity:** Propagate uncertainties including correlations; report goodness-of-fit and residual patterns; assess overfitting and multiple-comparison risk.
- **Systematic validity:** Vary dominant approximations within justified ranges; state extrapolation boundaries; quantify model-form uncertainty.
- **Boundary conditions:** Identify regimes where the mechanism should weaken, disappear, or change character.
- **External validity:** Avoid extrapolating beyond the tested model class or platform without independent validation.

# Provenance

Synthesized from cluster **98.0** (symmetry-guided mechanism discovery and validation).  
Derived from source skills: `spintronic-antiferromagnet-band-asymmetry-workflow`, `cold-antimatter-formation-exploration`, `superconductivity-thz-nonlinear-research-agent`, `spintronics-phase-accumulation-research`, `tunable-geometry-frustrated-spin-liquids`, `lattice-qcd-gpd-transverse-structure-exploration`, `synthetic-chiral-light-research-exploration`, `spiral-wave-instability-research-workflow`.
