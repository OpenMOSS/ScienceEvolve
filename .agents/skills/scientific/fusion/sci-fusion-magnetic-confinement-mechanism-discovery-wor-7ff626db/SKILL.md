---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-7ff626db
description: Reusable end-to-end workflow for designing hypothesis-driven research plans to discover and validate confinement and transport mechanisms in magnetic-confinement plasma systems.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow 6"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Use this skill to transform an ambiguous plasma confinement or transport observation into a disciplined, hypothesis-driven research plan. The workflow guides mechanism discrimination through reference-state definition, contrastive hypothesis generation, controlled study design, multi-stream analysis, and iterative claim refinement without copying device-specific settings or treating single-study results as consensus.

# When to use

- Use when the user asks for new research questions, hypotheses, or study designs about internal transport barriers, profile stiffness, critical-gradient behavior, turbulence-driven transitions, edge-core coupling, detachment compatibility, energetic-particle confinement, or operational-envelope gaps in magnetic-confinement plasma (tokamak, stellarator, or analogous concepts).
- Use when an observed transition, residual transport, or performance gap is hard to interpret because multiple variables change together or because baseline and improved states overlap.
- Use when the task requires a minimal viable validation plan with explicit baseline, negative control, positive control, primary metric, independent validation observable, and stop conditions.
- Do not use this skill to provide operational instructions for an active device, prescribe high-risk machine settings, or treat any single paper's result as field-wide consensus.

# Inputs required

Before producing a plan, request or infer:

- **Target system:** device class, confinement concept, magnetic topology, and relevant transport or confinement channel.
- **Observable gap:** the transition, residual, barrier, or performance-duration intersection to explain.
- **Available data:** diagnostics, profile observables, fluctuation measurements, equilibrium reconstructions, uncertainty estimates, and prior model results.
- **Candidate mechanisms:** turbulence, profile stiffness, critical-gradient saturation, geometry or topology effects, source coupling, boundary or edge effects, impurity effects, energetic-particle interactions, or user-proposed alternatives.
- **Validation resources:** independent diagnostics, simulation tools, analytic models, known-response cases, or matched historical data.
- **Constraints:** safety, compliance, diagnostic availability, computational cost, and acceptable stopping criteria.

If key inputs are missing, state assumptions explicitly and ask for the missing information before finalizing the study design.

# Core Workflow

1. **Frame the observable gap**
   - Define the transition or residual as a deviation from a well-defined reference state, not as a label-only phenomenon.
   - State the research question as a mechanism-level claim to test, not as an operational outcome.

2. **Build the reference state and primary metric**
   - Construct an ordinary-transport or baseline reference using the target system's own diagnostics and normalization.
   - Quantify deviation with an interpretable scalar or small metric set traceable to physical observables.
   - **Decision gate:** If the reference state is unstable, ill-defined, or dominated by transients, stop and redesign the metric or request better baseline data.

3. **Generate contrastive hypotheses**
   - Produce at least three competing hypotheses (for example: gradient-driven, configuration-dependent, boundary-coupled, non-diffusive, or measurement-artifact).
   - For each, state the mechanism claim, expected signature in primary and independent observables, key assumptions, evidence strength (strong, moderate, weak, or speculative), and failure modes.
   - **Decision gate:** If hypotheses predict identical signatures, redesign to decorrelate mechanisms or add observables before proceeding.

4. **Design minimal viable validation**
   - Define baseline control (reference state).
   - Define test case (probes candidate mechanism).
   - Define negative control (suppresses or avoids candidate mechanism).
   - Define positive control (known-response case, if available).
   - Select independent variables that isolate one assumption at a time.
   - Select dependent variables: barrier or residual intensity, profile indicators, turbulence and transport metrics, and independent validation observables.
   - Fix controlled variables (diagnostic definitions, preprocessing, matching criteria, exclusion rules) before analysis.
   - Define success, failure, and stop conditions before viewing results.
   - **Stop condition:** If the design requires unsafe or unauthorized operations, stop and propose a lower-risk conceptual alternative.

5. **Execute analysis with mechanism discrimination**
   - **Direct observation:** State what the primary metric shows before adding mechanism claims.
   - **Matched comparison:** Compare cases matched on dominant organizing variables; stratify when exact matching is impossible.
   - **Profile and localization checks:** Inspect spatial profile shape, core-edge separation, and layer localization rather than relying solely on scalar scores.
   - **Multivariate decomposition:** Use transparent methods to identify correlated variables; treat correlation as hypothesis-generating, not causal proof.
   - **Perturbative or transient check:** Where possible, compare steady-state and perturbative responses to distinguish average transport from local gradient sensitivity or feedback timing.
   - **Robustness checks:** Repeat conclusions under alternative preprocessing, matching, regression, and model assumptions.
   - **Independent validation:** Confirm mechanism claims with observables not used to define the primary metric.
   - **Decision gate:** If independent diagnostics contradict the primary metric, pause mechanism claims and investigate confounders or diagnostic validity.

6. **Evaluate and bound claims**
   - Classify each conclusion as directly observed, inferred, or model-dependent.
   - If supported: narrow the claim to the tested regime and propose the next discriminating boundary test.
   - If partially supported: split the mechanism into sub-mechanisms and test the weakest assumption.
   - If refuted: preserve the negative result and identify whether the baseline, matching, diagnostics, or mechanism assumption failed.
   - If inconclusive: redesign around a more discriminating observable rather than increasing confidence post hoc.
   - **Iteration gate:** Return to Step 3 or 4 with updated hypotheses only when independent evidence supports the update.

7. **Map operational or compatibility envelope (when applicable)**
   - Construct a multi-axis operational map (performance, duration, constraint) stratified by regime and platform class.
   - Identify sparse or poorly connected regions as candidate research gaps.
   - Attribute gaps to mechanism families (physics, engineering, control, boundary or interface, measurement) rather than single causes.
   - **Stop condition:** If gaps depend on incomparable cases or single-platform evidence, mark them as speculative and stop extrapolation.

# Output Format

When using this skill, produce:

```text
1. Research question
- Target system:
- Observable gap / transition:
- Main uncertainty:

2. Candidate hypotheses
| Hypothesis | Mechanism claim | Evidence strength | Key assumptions | Expected signature | Minimal validation | Possible failure modes |

3. Reference-state and metric design
- Ordinary-transport / baseline reference:
- Deviation or residual metric:
- Interpretability justification:
- Robustness checks:

4. Study design
- Baseline control:
- Test case:
- Negative control:
- Positive control:
- Independent variables:
- Dependent variables:
- Controlled variables:
- Success criteria:
- Failure criteria:
- Stop conditions:

5. Analysis plan
- Direct observation:
- Matched comparison:
- Profile / localization / core-edge checks:
- Multivariate decomposition:
- Perturbative or transient test:
- Robustness checks:
- Independent validation:

6. Iteration plan
- If supported:
- If refuted:
- If inconclusive:
- Boundary for extrapolation:

7. Validity and safety checks
- Confounders:
- Reproducibility:
- Statistical validity:
- Safety / compliance boundaries:
```

# Validation Gates

- **Reference stability gate:** The baseline reference must be reproducible and free of dominant transient contamination.
- **Hypothesis discrimination gate:** Competing hypotheses must predict measurably different signatures; if not, redesign before experimentation.
- **Control integrity gate:** Baseline, negative, and positive controls must be defined and feasible before analysis begins.
- **Mechanism independence gate:** Mechanism claims require agreement between primary metrics and at least one independent validation observable.
- **Robustness gate:** Conclusions must survive reasonable alternative preprocessing, matching, and model assumptions.
- **Safety gate:** Any plan requiring unreviewed operational changes, interlock bypasses, or hazardous procedures must be stopped and referred to qualified human review.

# Claim Boundaries

- Limit mechanism claims to the tested regime, device class, magnetic configuration, diagnostic coverage, and timescale.
- Mark cross-device, cross-configuration, or reactor-relevant extrapolations as speculative until independently validated.
- Distinguish directly observed signals from inferred quantities, model-dependent interpretations, and extrapolated design implications.
- Do not present single-study or single-platform findings as field-wide consensus.

# Failure Modes

- **Confounded transition:** The apparent gap is explained by density class, configuration change, source variation, diagnostic artifact, or transient event rather than the candidate mechanism.
- **Compensated effect:** Core improvement is masked by edge degradation (or vice versa), or turbulence reduction is offset by non-turbulent transport.
- **Invalid baseline:** The reference state is contaminated, misnormalized, or unstable, causing artificial residuals.
- **Diagnostic mimicry:** Calibration drift, line-integration effects, saturation, or misalignment creates spurious signatures.
- **Model overreach:** A simulation matches one observable but fails on another, yet the mechanism claim is generalized beyond the model's validity range.
- **Overfitting to single events:** A transient or single-shot observation is treated as a robust regime property.

# Validity Checks

- Are compared cases sufficiently matched on major co-varying drivers?
- Are uncertainties small enough to render claimed separations meaningful, or large enough to invalidate them?
- Could calibration, source localization, profile fitting, or equilibrium reconstruction create the apparent residual?
- Are edge, near-axis, or poorly diagnosed regions excluded or separately analyzed?
- Do independent diagnostics support the same trend?
- Do alternative transport or mechanism models explain the same observations?
- Are new hypotheses labeled with evidence strength, assumptions, and failure modes?
- Are stop conditions defined for ambiguous, unsafe, or uninformative outcomes?
- Is the source material used as a methodological template rather than a source of universal consensus?

# Provenance

- Synthesized from cluster 1 / subcluster 1.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: magnetic-fusion-transport-barrier-workflow (10.1038_s41598-019-52271-w), fusion-plasma-transport-discovery (10.1088_1741-4326_abea55), tokamak-detachment-confinement-exploration (10.1088_1741-4326_ad9e04), threshold-feedback-plasma-research (10.1209_0295-5075_92_35001), magnetic-fusion-long-pulse-operational-map (10.1088_1741-4326_ad0606), liquid-metal-fusion-research-design (10.1088_0029-5515_55_2_027001), stellarator-neutral-beam-research-workflow (10.1088_1741-4326_ac121c), fusion-materials-multi-stress-exploration (10.14311_1761).
- Methodological patterns were abstracted; no device-specific parameters, operational recipes, or paper conclusions are preserved in the reusable workflow body.
