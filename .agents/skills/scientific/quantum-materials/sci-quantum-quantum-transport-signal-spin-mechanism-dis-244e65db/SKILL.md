---
name: sci-quantum-quantum-transport-signal-spin-mechanism-dis-244e65db
description: A reusable end-to-end workflow for discovering and validating physical mechanisms behind ambiguous observables in quantum, spin, and transport systems through causal mapping, contrastive hypothesis testing, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport signal spin mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent transform an ambiguous experimental or simulated signal into a disciplined, testable mechanism hypothesis. The workflow emphasizes causal-chain decomposition, systematic generation of false-positive alternatives, symmetry- or regime-based discrimination, cross-channel validation, and conservative claim classification. It is abstracted from studies involving quantum transport, spin dynamics, and correlated signal generation, but contains no material-specific recipes or device parameters.

# When to use

- When a measured signal in a quantum, spin, or transport system could arise from multiple physical mechanisms.
- When the readout is indirect, mixed, or confounded by geometry, disorder, thermal, or artifact contributions.
- When designing research questions, controls, or analysis plans for mechanism discrimination.
- When cross-validating evidence across transport, thermodynamic, spectroscopic, or simulation channels.
- When the goal is to bound claims rather than prove a preferred narrative.

# Inputs required

Before executing the workflow, identify or request:

- Target system class and the functional or scientific question.
- The ambiguous observable and its readout channel.
- Candidate mechanisms and known false positives (trivial resonances, artifacts, disorder, geometry, etc.).
- Available control knobs: symmetry operations, field orientation, phase, frequency, regime variables, or geometric knobs.
- Comparison systems or reference conditions for baseline and controls.
- Independent material or model properties needed for mechanistic modeling.
- Safety, compliance, and feasibility constraints.

# Core Workflow

1. **Observable Framing and Causal Chain Mapping**
   - Define the target mechanism operationally.
   - Map the full causal chain: stimulus → intermediate variable → material response → readout.
   - Flag ambiguous or confounded links and readout mediators (e.g., thermal, geometric, or detector contributions).
   - *Decision gate:* If the causal chain cannot be defined in observable terms, stop and refine the research question.

2. **Contrastive Hypothesis Generation**
   - Formulate one candidate mechanism hypothesis.
   - Formulate at least two alternative hypotheses (false positives, artifacts, or trivial mechanisms) that reproduce the superficial signal.
   - For each hypothesis, record: evidence strength, key assumptions, predicted observable signature, selective discriminator, and likely failure mode.
   - *Decision gate (Candidate Gate):* If no falsifiable discriminator exists between the candidate and the strongest alternative, return to step 1 or redesign the observable.

3. **Control and Selective Variable Design**
   - Choose selective variables predicted to transform the candidate and alternative mechanisms differently.
   - Design positive, negative, baseline, orthogonal, and artifact controls.
   - Define minimal viable validation: the smallest test that can separate the candidate from the leading alternative.
   - Pre-register stop conditions and success criteria before execution.
   - *Decision gate:* If controls cannot bound the dominant confounder, redesign the selective variables.

4. **Minimal Viable Validation Execution**
   - Execute or simulate the minimal validation under stable baseline conditions.
   - Monitor reproducibility across independent runs, samples, or model realizations.
   - Check for irreversible modification, drift, or uncontrolled state changes.
   - *Decision gate (Stability Gate):* If the signal is irreproducible or the system exhibits uncontrolled modification, stop and diagnose.

5. **Layered Analysis and Mechanism Discrimination**
   - Pre-register analysis rules and decision thresholds.
   - Separate background and artifact contributions before extracting target dynamics.
   - Extract parameters with uncertainty and test sensitivity to background models.
   - Compare candidate and alternative predictions under identical analysis conditions.
   - Evaluate scaling laws, symmetry transformations, and phase relationships.
   - *Decision gate (Mechanism Exclusion Gate):* If the leading alternative cannot be excluded within uncertainty, do not upgrade to quantitative or causal claims.

6. **Cross-Channel and Simulation Consistency Check**
   - Compare results across independent readouts, measurement channels, or simulation routes.
   - Require convergent evidence before strengthening the hypothesis.
   - Test robustness against nuisance variables (disorder, calibration, finite size, coupling variation).
   - *Decision gate (Robustness Gate):* If independent routes disagree or the contrast collapses under nuisance variation, diagnose assumptions before iterating.

7. **Uncertainty Audit and Claim Bounding**
   - Classify each conclusion as: directly demonstrated, model-supported, indirectly suggested, speculative, or not supported.
   - Explicitly bound claims by regime, geometry, sample class, and readout channel.
   - Report negative results and unresolved ambiguities.
   - *Decision gate (Claim Bounding Gate):* If uncertainty overlaps baseline variance or a key assumption lacks independent support, downgrade the claim.

8. **Iteration or Redesign**
   - If the candidate is supported: refine the mechanism map and test boundary conditions or generalization limits.
   - If evidence is mixed: introduce new discriminating controls or refine the causal chain.
   - If the candidate is rejected: pivot to the next strongest hypothesis or redefine the observable.
   - Define the next minimal validation.
   - *Stop condition:* Terminate if no falsifiable hypothesis remains, if safety or compliance constraints prevent interpretable testing, or if the signal remains indistinguishable from artifacts after reasonable controls.

# Output Format

Return the following structured deliverables:

1. **Research Question and Causal-Chain Map** — Target mechanism, ambiguous observable, confounded links, and readout ambiguity.
2. **Ranked Hypotheses Table** — Candidate and false-positive hypotheses with evidence strength, assumptions, predicted signatures, discriminators, and failure modes.
3. **Control Table and Validation Plan** — Selective variables, controls, minimal viable validation, metrics, and stop conditions.
4. **Analysis Plan** — Background separation, parameter extraction, competing-model comparison, uncertainty handling, and symmetry tests.
5. **Claim Boundary and Failure Mode Statement** — Classification of each claim, generalization limits, and residual risks.
6. **Iteration Plan / Study Plan** — Next experiment for each likely outcome, conditions for upgrading, downgrading, or abandoning hypotheses.

# Validation Gates

Before accepting any conclusion, verify:

- **Readout specificity:** The measurement reports the target variable rather than a mediator or artifact.
- **Confounder exclusion:** Dominant alternatives (thermal, geometric, disorder, detector, source/transient) have been tested.
- **Reproducibility:** Results are consistent across independent samples, runs, or analysis choices.
- **Boundary discipline:** Conclusions are limited to the tested regime, geometry, and channel.
- **Model validity:** Assumptions are independently plausible and clearly stated.
- **Statistical robustness:** Uncertainties are reported and conclusions survive reasonable alternative models.
- **Claim discipline:** Demonstrated coupling, inferred modulation, and speculative control are kept separate.

# Claim Boundaries

- **Directly demonstrated:** Observable causal link established with appropriate controls.
- **Model-supported:** Consistent with mechanistic modeling using independently sourced parameters.
- **Indirectly suggested:** Compatible with the data but dependent on untested assumptions.
- **Speculative:** Plausible but lacking direct or convergent evidence.
- Never present single-system or single-study evidence as class-wide consensus. Never equate sensitivity with deterministic control.

# Failure Modes

Stop, redesign, or downgrade claims when:

- The signal is irreproducible across independent runs or samples.
- The readout cannot distinguish the candidate mechanism from dominant artifacts.
- The system shows irreversible modification or degradation.
- The model requires assumptions contradicted by independent measurements.
- The same evidence is used to infer both an intermediate variable and a final functional claim without independent validation.
- Uncertainty overlaps baseline variance or the contrast depends on a single fragile tuning condition.
- Safety, ethics, or compliance constraints prevent an interpretable test.

# Validity Checks

- Are preparation and probing sufficiently separated to avoid circular inference?
- Are negative, positive, orthogonal, and artifact controls all included?
- Are relative shifts and parameters reported with propagated uncertainty?
- Are ambiguous features flagged rather than forced into a single interpretation?
- Are source-supported inferences distinguished from new speculative extensions?
- Is the mechanism map updated when controls reveal unexpected terms?

# Provenance

- Synthesized from cluster 111, subcluster 111.0.
- Derived from source skills: `arxiv-cmoat__2602.20686`, `2f688b9c5af6f6d5`, `fd1b9c7138c122d5`, `9f1513f424e81be4`, `3d2bf4f3209f3adc`, `4b097a31c3d100f0`, `f18def74eb94b9af`, `arxiv-cmoat__2606.23183`.
