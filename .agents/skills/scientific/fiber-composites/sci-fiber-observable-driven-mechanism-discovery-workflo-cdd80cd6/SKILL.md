---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-cdd80cd6
description: Use this skill when designing research questions or experiments to discover and validate physical mechanisms from observable anomalies through controlled diagnostics, regime mapping, and iterative hypothesis testing.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 16"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Synthesize a reusable, domain-agnostic research workflow that turns an observable anomaly or functional gap into discriminating experiments, mechanism-resolved analysis, and bounded claims. It abstracts the shared pattern across transport, interfacial, electrochemical, quantum, and porous-material systems: start from observables, generate competing hypotheses, enforce control-first validation, and iterate until claims are adequately supported or abandoned.

# When to use

Use when a user asks to:
- Generate research questions or hypotheses around anomalous transport, interfacial behavior, structural evolution, or performance degradation.
- Design experiments that distinguish competing mechanisms rather than merely optimizing a target metric.
- Plan analysis workflows that separate raw observables from derived descriptors, regime maps, and model-inferred quantities.
- Iterate material, device, or study designs based on ambiguous, contradictory, or partially supportive evidence.

Do not use as a general-purpose scientific assistant for literature review, clinical research, wet-lab protocols, or domains where hidden variables and observables are unrelated to physical mechanisms.

# Inputs required

- Target system class and observable anomaly or functional gap.
- Candidate hidden variables, tuning knobs, or design levers suspected to control the behavior.
- Competing mechanism families (at least two), including artifact or disorder-dominated alternatives.
- Available complementary observables or diagnostics that couple differently to each mechanism.
- Baseline, reference, or control conditions accessible for comparison.
- Constraints on sample count, measurement access, safety, and reproducibility.
- Prior constraints, literature benchmarks, or model predictions to bound expectations.

# Core Workflow

1. **Anomaly Framing & Mechanism Hypothesis Generation**
   - State the observable anomaly as a measurable contrast or regime gap.
   - Generate at least two competing mechanism-level hypotheses and at least one artifact or disorder-dominated alternative.
   - For each hypothesis, define key assumptions, predicted signatures, evidence strength (High / Medium / Low / Speculative), and likely failure modes.
   - *Decision gate*: Proceed only if hypotheses are falsifiable and signatures are distinguishable; otherwise reformulate the anomaly.

2. **Control-First Experimental Design**
   - Define independent variables (tuning knobs), dependent variables (observables), and monitored confounders.
   - Specify controls: baseline, negative control (mechanism suppressed), positive control (mechanism expected), and strong mechanistic or artifact controls.
   - Predefine evaluation metrics, primary readouts, and stop conditions before data collection.
   - *Decision gate*: If controls cannot isolate the intended variable from confounders, redesign or stop.

3. **Data Collection & Process-Resolved Diagnostics**
   - Acquire raw measurements across relevant states or regimes.
   - Collect at least two complementary observables that should respond differently to artifacts versus the target mechanism.
   - Record baseline, tuned, reset, and control conditions for reproducibility.
   - *Iteration gate*: If measurement uncertainty exceeds expected effect size, improve precision or stop.

4. **Regime Mapping & Descriptor Construction**
   - Separate raw measurements from derived descriptors (rates, ratios, length scales, model parameters).
   - Construct a regime map plotting descriptors against hidden variables and control conditions.
   - Identify regions consistent with each hypothesis without assuming universal behavior.
   - *Decision gate*: If regime boundaries are ambiguous or descriptors are unidentifiable, simplify the model or add process-isolation controls.

5. **Mechanism Discrimination & Model Comparison**
   - Compare complementary observables for consistency; flag disagreements as confounder alerts.
   - Fit the simplest adequate mechanism-based model and compare against a simpler alternative.
   - Assess reversibility, boundary behavior, and stability of inferred parameters.
   - *Candidate gate*: Rank hypotheses by alignment with evidence. If no hypothesis is favored over the artifact alternative, return to Step 2.

6. **Uncertainty Audit & Claim Bounding**
   - Propagate measurement, model, and sampling uncertainty into all derived quantities.
   - Label each claim as directly measured, model-inferred, analogy-based, or speculative.
   - Define claim boundaries: state where the mechanism should weaken, saturate, or fail.
   - *Claim bounding gate*: Downgrade or discard claims that depend on uncontrolled parameters, single-sample data, or unsupported extrapolation.

7. **Iteration or Redesign**
   - **Supported**: If one hypothesis survives controls with consistent orthogonal evidence, increase complexity one dimension at a time.
   - **Ambiguous**: If evidence is mixed, add the missing discriminating measurement or control.
   - **Refuted**: If predictions fail where the mechanism should be active, replace the hypothesis and return to Step 1.
   - **Out of scope**: If the system lacks required tunability or observable resolution, halt and recommend a different mechanism class.
   - *Stop condition*: Halt if redesign requires unsafe procedures, inaccessible equipment, or violates constraints.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question framed around the observable anomaly and competing mechanisms.
2. **Ranked hypotheses** — Table with mechanism statement, evidence strength, key assumptions, predicted signatures, and failure modes.
3. **Study plan** — Minimal viable validation, variable definitions, control groups, evaluation metrics, and stop conditions.
4. **Analysis plan** — Raw-to-derived descriptor workflow, regime-map strategy, model-comparison rules, and orthogonal-correlation checks.
5. **Validation plan** — Reproducibility checks, uncertainty propagation, boundary-condition tests, and artifact audits.
6. **Failure modes** — Likely confounders, model-instability triggers, irreversibility risks, and misinterpretation pathways.
7. **Iteration roadmap** — Branches for supported, ambiguous, refuted, and out-of-scope outcomes with explicit next actions.

# Validation Gates

- **Confounding check**: Verify that the intended tuning knob does not simultaneously alter secondary variables that could mimic or mask the target mechanism.
- **Reproducibility check**: Require baseline-reset repeats and independent-sample confirmation before strong claims.
- **Statistical check**: Estimate uncertainty, fit stability, and effect size; avoid interpreting trends within noise.
- **Boundary check**: Test regimes where the mechanism should weaken, saturate, or yield to an ordinary explanation.
- **Model check**: Confirm inferred parameters remain stable and interpretable across states; reject overparameterized fits.
- **External check**: Do not generalize from one platform or geometry to a broader class without cross-system evidence.

# Claim Boundaries

- Distinguish **measured results** from **model-inferred quantities**, **analogy-based hypotheses**, and **speculative extrapolations**.
- Treat single-system or single-paper evidence as platform-specific, not field-wide consensus.
- State the applicability boundary explicitly: chemistry, geometry, temperature, disorder level, or operational state.
- Describe agreement with prior work as compatibility, not proof of uniqueness.
- Map residual tolerance into constraints rather than discovery claims unless all systematic alternatives are excluded.

# Failure Modes

- **Tuning non-specificity**: The hidden-variable route changes multiple parameters simultaneously, preventing causal attribution.
- **Observable collision**: Complementary observables share artifacts or noise sources, undermining discrimination.
- **Irreversibility**: Reset or baseline states fail to recover, confusing reversible mechanism shifts with permanent damage.
- **Model underdetermination**: Multiple mechanism models fit the data equally well; strong claims are unsupported.
- **Disorder dominance**: Material imperfections or background effects exceed the scale of the target mechanism, masking or mimicking the predicted signature.
- **Single-sample overreach**: Claims rely on one device, one batch, or one measurement geometry without corroboration.
- **Extrapolation beyond evidence**: Performance trends are assumed to hold outside tested frequency, temperature, thickness, or composition ranges.

# Validity Checks

- Are the hypotheses mechanism-level and falsifiable?
- Are controls designed to challenge the preferred hypothesis, not just confirm it?
- Are raw observables reported before derived descriptors?
- Are alternative models (including artifact and disorder alternatives) compared before ranking mechanisms?
- Are uncertainty and parameter correlations reported for all inferred quantities?
- Are stop conditions and safety constraints defined before experimentation?
- Is provenance preserved for all source-derived method patterns versus new inferences?

# Provenance

- Synthesized from cluster 74.0 (observable-driven mechanism discovery and validation).
- Source skill references: `reversible-scattering-transport-exploration` (10.1103_z38z-dz5l), `oxide-interface-defect-research` (10.1039_c3nr06456e), `precision-force-new-physics-exploration` (10.1140_epjc_s10052-007-0346-z), `lithium-whisker-mechanism-exploration` (2503.21481), `hierarchical-pore-acoustic-thermal-material-design` (fiber__10.1002_app.56850), `state-resolved-eis-interfacial-bottleneck-discovery` (10.1149_10501.0225ecst), `orbital-degeneracy-quantum-transport-research-design` (10.1038_nature03422), `disorder-aware-topological-phase-validation` (10.1103_physrevmaterials.2.064603).
- Paper-specific conclusions, numerical results, and operational protocols have been excluded per synthesis requirements.
