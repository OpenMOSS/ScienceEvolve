---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-5e791e8a
description: Use this skill to turn an anomalous observation into a testable research plan by generating competing mechanisms, designing minimal controlled studies, and iterating toward validated, bounded claims.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 18"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to turn an anomalous observation or performance bottleneck into a testable mechanism-discovery research plan. The goal is to identify which physical mechanism could explain an apparent effect, design the smallest credible study that can distinguish that mechanism from confounders, and iterate toward validated, bounded claims.

## When to use

Use this skill when the user asks to:
- Propose new research questions driven by an unexpected observation, transport anomaly, structural change, or response deviation.
- Design controlled experiments or simulations that compare competing mechanisms rather than single-factor screening.
- Interpret anomalous data in materials, interfaces, fibers, composites, polymers, or soft-matter systems where multiple physical processes may coexist.
- Build an iteration strategy with explicit stop conditions, pivot rules, and claim boundaries.

## Inputs required

Before producing a research plan, identify or ask for:
- **Target system class** and baseline/reference condition.
- **Primary observable:** the anomaly, response, or bottleneck to be explained.
- **Candidate mechanisms:** at least one amplifying and one suppressing/saturating process.
- **Available diagnostics:** imaging, spectroscopy, transport, scattering, simulation, or mechanical probes.
- **Known confounders:** history, environment, geometry, preparation, measurement artifacts, and resolution limits.
- **Intended boundary of generalization:** geometry class, scale regime, material family, or environmental window.
- **Constraints:** safety, facility, regulatory, or reproducibility requirements.

## Core Workflow

Follow this ordered end-to-end route. Do not skip a decision gate.

1. **Frame the observable and reference.**  
   Define the primary anomaly, the baseline condition, and the normalization strategy.  
   - *Decision gate:* Is the observable reproducible across replicates and independent of known artifacts? If no, stop and audit measurement integrity.

2. **Enumerate competing mechanisms.**  
   Decompose the apparent effect into mechanisms that increase, decrease, or saturate the response.  
   - *Decision gate:* Are the mechanisms mutually distinguishable with available diagnostics? If no, refine the observable or add a discriminating probe before proceeding.

3. **Formulate falsifiable hypotheses.**  
   For each mechanism, state a one-sentence causal claim, key assumption, predicted signature, evidence strength, and most likely failure mode.  
   - *Decision gate:* Does every hypothesis have a defined observation that would weaken or exclude it? If no, reformulate until falsifiable.

4. **Design a minimal viable study.**  
   Select independent variables by causal role, paired dependent variables (structure and function), and strong controls (baseline, negative, positive, process).  
   - *Decision gate:* Can the design reject the leading alternative mechanism? If no, add a control or variable that isolates the competing explanations.

5. **Pre-register the analysis plan.**  
   Specify normalization, regime-separation rules, structure-before-function ordering, statistical comparisons, and decision thresholds.  
   - *Decision gate:* Are success, failure, and stop criteria defined before data collection? If no, complete pre-registration.

6. **Collect data and audit quality.**  
   Verify calibration, replicate consistency, batch identity, and control performance.  
   - *Decision gate:* Do negative and positive controls bracket the expected behavior? If controls fail, pause hypothesis testing and resolve preparation or measurement issues.

7. **Analyze with mechanism discrimination.**  
   Normalize outcomes, classify regimes, compare independent observables, and quantify uncertainty. Prefer explanations supported by multiple measurements over single-metric correlations.  
   - *Decision gate:* Do independent diagnostics converge on the same mechanism? If they conflict, treat the mechanism as unresolved and proceed to Step 8.

8. **Test confounders and robustness.**  
   Check whether the effect persists when contact state, loading history, geometry, environment, or preparation is varied.  
   - *Decision gate:* Does the effect survive controlled variation of the most likely confounders? If no, demote the hypothesis and return to Step 3.

9. **Update the evidence matrix.**  
   Promote hypotheses with reproducible, multi-probe support; demote hypotheses weakened by controls or alternative fits.  
   - *Decision gate:* Is the evidence strong enough to support a bounded claim? If no, identify the next discriminating experiment and iterate from Step 4.

10. **Converge or stop.**  
    - *Stop condition:* Stop when the mechanism is supported by independent observables and controls, and additional experiments no longer change the decision. Document claim boundaries and residual uncertainty.
    - *Pivot condition:* If the leading mechanism is excluded, if controls consistently fail, or if the effect disappears under confounder checks, stop the current line and reformulate the research question.

## Output Format

Produce the following structure on each use:

1. **Research question and reference definition** — one-sentence question, system class, and baseline.
2. **Competing-mechanism hypotheses table** — mechanism, claim, key assumption, predicted signature, evidence strength, failure mode, and boundary.
3. **Minimal viable study design** — variables by causal role, controls, primary and diagnostic metrics, and stop conditions.
4. **Pre-registered analysis plan** — normalization strategy, regime-separation rules, decision thresholds, and uncertainty treatment.
5. **Evidence matrix** — current status of each hypothesis after the latest data round.
6. **Iteration roadmap** — next variable to vary, proposed discriminating test, and pivot trigger.
7. **Claim boundaries and failure modes** — explicit limits on generalization and known ways the conclusion could be wrong.
8. **Validity and safety notes** — confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Reproducibility gate:** The anomaly is repeatable and not an artifact of a single batch, session, or detector.
- **Discrimination gate:** Competing mechanisms are distinguishable in principle with the chosen diagnostics.
- **Falsifiability gate:** Every hypothesis has a defined observation that would weaken or exclude it.
- **Control gate:** The study design can reject the strongest alternative mechanism.
- **Pre-registration gate:** Analysis rules and decision thresholds are fixed before data collection.
- **Convergence gate:** Independent observables agree before a mechanism is accepted.
- **Confounder gate:** The effect survives deliberate variation of nuisance variables.
- **Escalation gate:** New experiments are expected to change the evidence state; otherwise, stop.

## Claim Boundaries

- Do not extrapolate beyond tested geometry, scale, material class, or environmental regime.
- Do not treat a single-study or single-system result as field-wide consensus.
- Distinguish measured results, model-inferred quantities, and agent-proposed extrapolations.
- Separate equilibrium or path-independent claims from history-dependent or irreversible observations.
- Label analogies to other systems as hypothesis sources, not as domain consensus.

## Failure Modes

- The observable changes but the proposed mechanism is absent, or the mechanism is present but the observable does not change.
- Controls fail to bracket expected behavior.
- Conclusions depend on an unmeasured cutoff, resolution, or arbitrary regime boundary.
- A single metric is over-interpreted while independent diagnostics are ignored.
- The model requires assumptions inconsistent with observed geometry, contact state, or rate regime.
- Confounders are treated as noise rather than causal variables.
- Results improve only under unrealistic or non-transferable conditions.

## Validity Checks

Before finalizing a plan or accepting a conclusion, verify:
- **Confounding:** Are chemistry, contamination, environment, alignment, rate, history, and measurement method sufficiently controlled?
- **Reproducibility:** Are independent samples, repeated preparations, consistent markers, and transparent metadata included?
- **Statistical validity:** Are uncertainty intervals, effect sizes, model sensitivity, and appropriate group tests reported?
- **Boundary conditions:** Does the claim hold under changed scale, stiffness, history, or contact state?
- **Mechanism consistency:** Do structure and function trends agree? Is the decomposition into local/bulk, transport/reaction, or similar coupled terms justified?
- **Evidence separation:** Are source-supported methodological patterns distinguished from new-system inferences?

## Provenance

- Synthesized from cluster **33.0** (observable-driven mechanism discovery and validation).
- Source skills: rough-interface-adhesion-research (1602.02669); iron-chalcogenide-pressure-magnetism-explorer (10.1103/PhysRevB.103.184504); electrospun-nanofiber-research-design (fiber__10.3390/polym15010065); piezoelectric-nanofiber-research-explorer (fiber__10.1177/15280837241302259); viscoelastic-interface-research-skill (10.1021/ma021759t); polymer-fiber-rheology-processability (fiber__10.1021/acs.macromol.1c02164); dry-jet-wet-spinning-research-planner (fiber__10.1002/app.53820); polymer-kinetics-exploration (10.1007/s101890170110).
