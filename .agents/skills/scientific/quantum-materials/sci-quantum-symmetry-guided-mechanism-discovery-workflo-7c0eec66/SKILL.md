---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-7c0eec66
description: A reusable end-to-end workflow for designing, analyzing, and iterating symmetry-guided studies that discriminate hidden mechanisms using complementary probes, controlled perturbations, and structured hypothesis testing in quantum, spectroscopic, and transport systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 43"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill enables an agent to plan and critique research aimed at discovering or validating a hidden microscopic mechanism in quantum, spectroscopic, or transport systems. It abstracts a transferable pattern: frame a mechanism gap, generate competing symmetry-aware hypotheses, design a multi-probe perturbation study with strong controls, separate backgrounds rigorously, discriminate models through paired observables and scaling tests, and iterate from discrepancies. The workflow treats symmetry as a predictive filter, not automatic proof, and insists on bounding claims by control quality and uncertainty.

# When to use

Use this skill when the user asks to:

- Propose or evaluate research questions involving hidden states, coupled order parameters, or microscopic scattering mechanisms in quantum materials, spin systems, low-dimensional transport, or defect-based platforms.
- Design studies that combine bulk and local/mode-resolved probes to test whether one degree of freedom controls another.
- Interpret broad, diffuse, or anomalous spectral or transport signatures where exotic and conventional explanations compete.
- Infer an effective microscopic parameter from paired macroscopic observables using controlled variation and null-model testing.
- Disentangle bulk, interface, conversion, and artifact contributions in multi-layer or multi-channel measurements.

Do not use this skill as a general literature-review assistant, a generator of operational fabrication or hazardous procedural recipes, or a source of universal conclusions from a single study.

# Inputs required

Before executing the workflow, request or infer:

- **Target system class** and the unresolved microscopic variable or hidden mechanism.
- **Candidate observables** available or planned (bulk, local, momentum-resolved, transport, spectroscopic).
- **Tuning or perturbation axis** expected to preferentially modify one subsystem or reveal a hidden state.
- **Symmetry constraints**, selection rules, and known phase boundaries relevant to the system class.
- **Control and reference options** (positive, negative, baseline, artifact, replication).
- **Known confounders** (disorder, strain, thermal effects, instrumental drift, contact effects, background channels).
- **Modeling scope** (minimal models, simulation resources, or theoretical benchmarks available for predictive comparison).

If inputs are missing, state assumptions explicitly and flag downstream conclusions as agent-inferred.

# Core Workflow

Execute the following ordered route. Treat any stop condition as a hard gate requiring redesign or termination.

1. **Frame the mechanism gap**
   - State the hidden parameter, coupled degree of freedom, or unresolved transition to be tested.
   - Explain why it is obscured in equilibrium or single-probe measurements.

2. **Generate ranked, competing hypotheses**
   - Produce at least four hypotheses:
     - **H_target:** the proposed intrinsic mechanism.
     - **H_null:** a constant-probability or no-coupling baseline.
     - **H_confounder:** background, artifact, interface, or disorder-dominated explanation.
     - **H_alt:** at least one alternative intrinsic mechanism.
   - For each, specify symmetry-allowed vs. forbidden predictions, expected observable signatures, evidence strength (weak/moderate/strong), key assumptions, and a minimal falsification test.
   - **Gate:** If the hypotheses do not produce distinct, testable predictions, stop and refine the research question.

3. **Design the discriminating study**
   - Select a preferential perturbation or tuning variable and a complementary probe set (e.g., bulk + local/mode-resolved + symmetry-resolved).
   - Define controls: positive, negative, baseline, artifact, and replication.
   - Pre-register the predicted qualitative signature before data collection.
   - **Gate:** If controls cannot plausibly separate the target signal from background or artifact, redesign before proceeding.

4. **Acquire and preprocess matched observables**
   - Align all datasets by sample, device, tuning variable, and geometry.
   - Document preprocessing choices, calibration logic, and exclusion criteria.

5. **Separate backgrounds and normalize**
   - Model and subtract known baselines (host response, thermal drift, instrumental background, disorder contributions).
   - Propagate uncertainty from background subtraction forward.
   - Normalize to system-independent fingerprints only when underlying assumptions are justified.
   - **Gate:** If the background dominates the target signal and cannot be bounded, stop and redesign controls or system choice.

6. **Test mechanism predictions**
   - Compare paired observables (normalization channel vs. target-sensitive channel) for scaling consistency.
   - Apply symmetry filters: check whether signals are symmetry-allowed, forbidden, or indicative of lowered symmetry.
   - Evaluate shared-parameter models against independent-per-dataset tuning; prefer mechanisms that explain multiple observables without ad hoc per-mode adjustments.
   - Compare candidate models using the same uncertainty framework and observables.
   - **Gate:** If the null model or confounder hypothesis explains the data as well as the target mechanism, do not advance the target claim.

7. **Audit robustness and uncertainty**
   - Test sensitivity to background subtraction, model choice, parameter bounds, and sample variation.
   - Verify statistical identifiability and report parameter covariance.
   - Check whether cross-readout inferences (e.g., attenuation-derived vs. dispersion-derived) are mutually consistent.
   - **Gate:** If the conclusion changes materially under reasonable alternative analysis choices, downgrade evidence strength or stop.

8. **Iterate or terminate**
   - **Proceed** to claim bounding if the target mechanism is supported by independent probes, controls pass, and residuals map to a single coherent picture.
   - **Revise** if discrepancies remain: map residuals to missing mechanisms, hidden channels, or systematic effects; return to step 2 or 3 with updated hypotheses.
   - **Stop** if negative controls reproduce the signature, artifacts dominate, or the model requires post hoc adjustment of core assumptions to match data.

9. **Bound claims and plan validation**
   - State the exact regime, system class, tuning range, and probe geometry where the claim holds.
   - Distinguish measured facts, model-inferred quantities, and speculative extensions.
   - Define the next falsifiable test or independent benchmark required to strengthen the claim.

# Output Format

Return a structured research plan containing:

1. **Research question** — one sentence defining the hidden mechanism or parameter.
2. **Mechanism map** — causal links from structural/symmetry variables to interaction hypotheses to expected observables.
3. **Hypothesis table** — for each hypothesis: statement, evidence strength, key assumptions, predicted signatures, failure modes, and minimal decisive test.
4. **Study design** — perturbation/tuning variables, complementary probes, control hierarchy, evaluation metrics, and stop conditions.
5. **Analysis plan** — background decomposition, normalization strategy, scaling tests, symmetry checks, model comparison, and uncertainty propagation.
6. **Iteration decision** — proceed, revise, or reject, with rationale and the next discriminating measurement.
7. **Validity statement** — demonstrated evidence, inferred claims, confounders, reproducibility requirements, and extrapolation boundaries.
8. **Claim boundary table** — scope limits, system-class restrictions, and probe-specific caveats.

# Validation Gates

Before advancing past any step, confirm:

- **Control logic:** Positive, negative, baseline, and artifact controls are defined and tied directly to hypothesis assumptions.
- **Symmetry discipline:** Symmetry arguments are used as predictive filters, not as automatic proof of mechanism.
- **Paired observables:** Target and normalization channels are measured under matched conditions.
- **Identifiability:** Model parameters are statistically distinguishable and physically plausible.
- **Reproducibility:** Feature extraction, background subtraction, and fitting choices are pre-registered or documented.
- **Evidence labeling:** Source-paper observations, literature benchmarks, and new agent inferences are clearly separated.

# Claim Boundaries

- Label conclusions as **measured**, **model-inferred**, or **speculative**.
- Restrict claims to the tested system class, tuning range, temperature regime, and probe geometry.
- Do not generalize a single benchmark result to a universal correction factor or field-wide consensus.
- Treat inferred microscopic probabilities or coupling strengths as effective model parameters, not direct observations.
- Avoid overstating exotic interpretations when conventional mechanisms remain viable.

# Failure Modes

- **Background dominance:** The target signal cannot be separated from host, instrumental, or disorder contributions.
- **Control failure:** Positive or negative controls behave unexpectedly, invalidating the experimental logic.
- **Non-identifiable models:** Multiple mechanism families fit equally well but imply incompatible physics.
- **Symmetry misassignment:** An incorrect symmetry analysis produces false predictions about allowed/forbidden signals.
- **Artifact mimicry:** Thermal, geometric, contact, or analysis artifacts reproduce the predicted signature.
- **Overfitting:** Independent explanations are added for each observable rather than a shared mechanism.
- **Extrapolation error:** Claims are extended beyond the validated regime without new controls.

# Validity Checks

Before finalizing any plan or interpretation:

- [ ] Does the design test both global and local responses (or equivalent complementary probes)?
- [ ] Are known baseline effects modeled before assigning coupling or hidden-state signatures?
- [ ] Are uncertainty and parameter covariance propagated through all inference steps?
- [ ] Do independent readouts or reconstruction methods recover mutually consistent conclusions?
- [ ] Are disorder, finite-size, protocol, and interface effects considered as possible mechanisms rather than noise?
- [ ] Is the next proposed experiment falsifiable with the smallest viable additional measurement?
- [ ] Are all safety, compliance, and non-operational boundaries respected?

# Provenance

- **Cluster:** 97 / 97.0
- **Workflow archetype:** symmetry-guided mechanism discovery and validation
- **Synthesized from source skills:**
  - `4e6f14fa99f33778` — coupled-order-parameter-exploration
  - `66309fca89b75dbd` — nuclear-decay-spectroscopy-research-design
  - `390c47ba50344927` — quantum-acoustics-jt-research-exploration
  - `033bbe632087ee99` — percolating-ferromagnet-research-pattern
  - `264a280047706df9` — gate-tunable-nonequilibrium-quantum-transport
  - `374ae4cd2acfcbd3` — kondo-transport-inference-workflow
  - `4d14c5c775e622b2` — honeycomb-kitaev-magnet-research-workflow
  - `872ea0b080eb997e` — orbital-torque-research-design
