---
name: sci-quantum-observable-driven-mechanism-discovery-workf-1f189e8d
description: A reusable end-to-end workflow for transforming anomalous or cross-regime observations into rigorous mechanism hypotheses, multi-method validation plans, and bounded scientific claims.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 11"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides an agent through a reusable, end-to-end workflow for mechanism discovery when an observable disagrees with an established model or when a regime boundary is suspected. It emphasizes generating competing hypotheses, designing minimal multi-method validations with strong controls, discriminating mechanisms through staged analysis, and bounding claims conservatively.

## When to use

- When a macroscopic or collective observable deviates from an established theoretical, empirical, or continuum prediction.
- When the earliest event, onset, or transition in a process is unresolved and may involve hidden microscopic or pre-equilibrium mechanisms.
- When multiple candidate mechanisms could explain the same observation and need to be discriminated.
- When designing cross-scale studies that link particle-level, local, or microscopic behavior to system-level signatures.
- When the user needs a reusable research-design workflow rather than a summary of one study.

Do not use for routine optimization of well-resolved processes, for operational implementation of hazardous procedures, or as a substitute for domain-specific safety review.

## Inputs required

Before executing the workflow, collect or infer:

1. **System and regime description** — phases, boundaries, environment, and relevant scales.
2. **Established model** — the current theoretical, continuum, mean-field, or empirical framework and its domain of validity.
3. **Anomalous or unexplained evidence** — experiments, simulations, trajectories, or observations that motivate new mechanism inquiry.
4. **Available methods** — experimental, computational, theoretical, or imaging capabilities accessible for validation.
5. **Observables** — direct measurements and indirect proxies, with their resolution limits.
6. **Constraints** — safety limits, computational bounds, reproducibility requirements, and ethical boundaries.
7. **Intended claim level** — exploratory hypothesis generation, mechanism discrimination, model validation, or proposal planning.

If inputs are missing, state assumptions explicitly and mark downstream conclusions as provisional.

## Core Workflow

1. **Gap Framing & Question Formation**
   - Define the observable anomaly, regime boundary, or cross-scale tension.
   - Identify where the established model breaks down, becomes untested, or predicts qualitatively different behavior.
   - Formulate a precise, falsifiable research question.
   - *Decision Gate — Scope Gate:* If the phenomenon is already well-resolved by existing models within measurement uncertainty, stop and redirect to routine analysis.

2. **Competing Hypothesis Generation**
   - Propose at least two competing mechanism families plus a null hypothesis (established model suffices).
   - For each hypothesis record: core claim, key assumptions, predicted signature, evidence strength (high / medium / low), and most likely failure mode.
   - Include hypotheses that span different causal pathways (e.g., suppression vs. support, fluctuation-initiated vs. deterministic, local vs. collective).
   - *Decision Gate — Plausibility Gate:* If no hypothesis is testable with available resources or falsifiable against the null, stop and reformulate the question or acquire new capabilities.

3. **Minimal Viable Validation Design**
   - Define independent variables, mechanistic mediators, and dependent observables generically.
   - Design controls: baseline, positive, negative, misalignment / perturbation-disabled, and method cross-checks.
   - Select evaluation metrics that map to mechanism rather than mere trend confirmation.
   - Predefine stopping conditions (e.g., anomaly indistinguishable from noise, controls fail, simpler alternative suffices).
   - *Decision Gate — Feasibility Gate:* If essential controls cannot be constructed or key variables are inaccessible, narrow the hypothesis set or redesign before execution.

4. **Multi-Stream Evidence Collection & Regime Segmentation**
   - Gather evidence from complementary streams (experiment, simulation, first-principles calculation, imaging, literature benchmark).
   - Segment trajectories or datasets into regimes if applicable (pre-onset, onset, transition, mature / established).
   - Map local or microscopic events to macroscopic observables through a structural, dynamical, or thermodynamic mediator; avoid assuming direct correspondence without a mediator.
   - *Decision Gate — Data Quality Gate:* If the anomaly cannot be separated from noise, artifacts, boundary effects, or finite-size artifacts, stop and debug the measurement or analysis protocol.

5. **Mechanism Discrimination & Model Comparison**
   - Compare competing hypotheses using pre-registered metrics and model comparison (e.g., coupling metrics, residual structure, regime-specific fits).
   - Prefer mechanisms justified by causal structure over those selected only by curve-fitting performance.
   - Test whether a proposed mechanism is necessary or if a simpler baseline explains the observation.
   - *Decision Gate — Discrimination Gate:* If competing mechanisms remain degenerate after available tests, classify as inconclusive and design a targeted discriminating test rather than forcing a conclusion.

6. **Hierarchical Validation & Uncertainty Calibration**
   - Validate promising candidates with higher-fidelity or independent methods.
   - Calibrate uncertainty at the individual-candidate or individual-mechanism level, not only at the population level.
   - Check robustness under alternative assumptions, priors, feature definitions, or model choices.
   - *Decision Gate — Validation Gate:* If candidates fail higher-fidelity checks, are unstable across reasonable methodological choices, or violate independent cross-domain constraints, reject or downgrade the hypothesis.

7. **Claim Bounding & Regime Mapping**
   - Produce a regime map stating where each mechanism applies, where the established model remains valid, and where behavior is unresolved.
   - Label every claim with its evidence strength: verified, model-dependent, inferred, or speculative.
   - Explicitly state extrapolation boundaries and untested assumptions.
   - *Decision Gate — Claim Gate:* If the mechanism cannot be distinguished from alternatives or relies on unvalidated assumptions, bound claims to the tested regime and mark generalization as speculative.

8. **Iteration & Redesign**
   - Update hypotheses based on evidence: keep, narrow, split, replace, or discard.
   - If results are ambiguous, return to Step 3 or 5 with refined questions, additional controls, or higher resolution.
   - *Stop Conditions:* Terminate the loop when a hypothesis is robustly supported or ruled out, when the effect size is below uncertainty, when resources are exhausted, or when additional complexity yields no decision-relevant gain.

## Output Format

Return the research plan in this structure:

1. **Research question and scope** — system, anomaly, mature behavior boundaries.
2. **Gap map** — established model prediction, accessible evidence, mismatch, candidate missing mechanisms.
3. **Ranked hypotheses** — table with hypothesis, evidence strength, key assumptions, predicted signature, alternative explanation, discriminating test, and failure mode.
4. **Minimal viable validation plan** — variables, controls, metrics, replication strategy, and stopping conditions.
5. **Analysis and regime map** — trajectory segmentation (if applicable), coupling metrics, model comparison, residual / sensitivity checks, and regime boundaries.
6. **Iteration decision log** — rules for supporting, revising, or rejecting each hypothesis.
7. **Claim boundary statement** — explicit limits on extrapolation, transferability, and evidence classification.
8. **Validity and safety notes** — confounders, statistical checks, reproducibility requirements, and non-operational safety boundaries.

## Validation Gates

- **Scope Gate:** Confirm the phenomenon is not already explained by established models within measurement uncertainty.
- **Plausibility Gate:** Confirm at least one alternative hypothesis is falsifiable and testable with available resources.
- **Feasibility Gate:** Confirm essential controls and variable access exist before committing to execution.
- **Data Quality Gate:** Confirm the anomaly is separable from noise, artifacts, and boundary effects.
- **Discrimination Gate:** Confirm competing mechanisms can be distinguished with the proposed evidence; if not, require a new discriminating test.
- **Validation Gate:** Confirm candidates survive higher-fidelity or independent checks and do not violate cross-domain constraints.
- **Claim Gate:** Confirm claims are limited to tested regimes and labeled with appropriate evidence strength.

## Claim Boundaries

- Do not present a single study’s mechanism as field-wide consensus.
- Do not transfer a mechanism to untested systems, materials, compositions, or regimes without labeling it as speculative.
- Do not conflate correlation, model fit, or proxy agreement with causal mechanism validation.
- Do not present simulation-only evidence as experimental confirmation.
- Distinguish paper-derived patterns, logically inferred extensions, and newly proposed hypotheses.
- Avoid operational prescriptions for hazardous materials, high-risk environments, or specialized facilities; keep outputs at the research-design level.

## Failure Modes

- The observable anomaly is an artifact of measurement bias, preprocessing, boundary conditions, or finite-size effects.
- The proposed mechanism is indistinguishable from a simpler baseline or null model after controls are applied.
- Controls fail to establish measurement or model credibility.
- Calibration assumptions (e.g., exchangeability, feature stability) are violated when transferring across methods or datasets.
- The mechanism appears only under a narrow, unrepresentative set of conditions and disappears under robustness checks.
- Resource or resolution limits prevent separation of onset, transition, or regime-specific behavior from noise.
- Confounding variables explain the result as well as the proposed mechanism.

## Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** external fields, environment, history dependence, initial-condition bias, and sampling artifacts are considered.
- **Statistical validity:** independent realizations, uncertainty estimates, convergence, and sensitivity analyses are specified.
- **Reproducibility:** assumptions, data provenance, analysis definitions, and model versions are documented for independent repetition.
- **Measurement alignment:** direct and indirect observables refer to the same regime, scale, and conditions; proxies are validated against direct measures.
- **Model boundary:** the established model is retained where supported and extended only where evidence requires it.
- **Alternative mechanisms:** simpler or competing explanations are tested rather than dismissed.
- **Extrapolation limits:** size, chemistry, geometry, environment, and state conditions are not assumed transferable without testing.
- **Evidence separation:** paper-derived patterns, inferred extensions, and new hypotheses are clearly labeled.
- **Safety and ethics:** hazardous or high-risk operational details are excluded; safety review is referred to qualified personnel.

## Provenance

Synthesized from cluster 181.0 (observable-driven mechanism discovery and validation). Source skills: pre-continuum-interfacial-dynamics (06b9a4efca9e8c9f), porous-media-opposing-gradient-separation (6665e015175bb3c4), metallic-melt-transport-exploration (738e9de506c5598d), silicon-defect-discovery-workflow (26fc88b27e612a2b), polymer-nanocomposite-free-volume-exploration (3146367d683bdbc0), cosmology-phantom-energy-research-workflow (2888f1a04dc0364a), calibrated-multipipeline-research-exploration (63819211f8aa7bfe), dark-sector-neutron-star-research-design (1862ea74a774203a).
