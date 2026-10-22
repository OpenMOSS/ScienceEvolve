---
name: sci-neuro-magnetic-adaptive-plasticity-mechanism-discov-9f5067d7
description: Guide agents through an end-to-end machine-learning-assisted workflow to discover, discriminate, and validate adaptive or transport mechanisms in complex physical, biological, or engineered systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · magnetic adaptive plasticity mechanism discovery validation"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Guide agents to transform a scientific question about adaptive, plastic, or transport mechanisms into a testable machine-learning-assisted discovery and validation workflow. The skill emphasizes mechanism discrimination over performance benchmarking, using controlled comparisons, dynamic response indicators, and iterative hypothesis refinement.

# When to use

Use when designing studies where machine learning is used to discover, discriminate, or validate mechanisms in complex adaptive systems—such as coupled transport phenomena, plasticity rules, emergent collective states, or energy-based dynamics. Applicable across computational, theoretical, and experimentally informed domains. Do not use for operational deployment recipes, clinical decision-making, or hazardous procedural instructions.

# Inputs required

- Target phenomenon and the specific mechanism gap to address.
- Available data or observables with documented limitations and measurement context.
- Candidate mechanisms and at least one plausible competing explanation.
- Baseline models, theoretical frameworks, or established domain structures.
- Constraints: safety, ethics, reproducibility, resource limits, and acceptable evaluation boundaries.

# Core Workflow

1. **Frame the mechanism question.**  
   State the research gap as a mechanism test, not a performance benchmark. Define the emergent behavior, transport property, or adaptive response to be explained, and specify what observable state counts as success.

2. **Generate falsifiable hypotheses.**  
   Produce at least three competing hypotheses: a target mechanism, an alternative mechanism, and an artifact or confounder hypothesis. For each, state the predicted direction of change, key assumptions, minimal test, and likely failure modes.  
   *Candidate Gate:* Reject vague or non-discriminating hypotheses; every hypothesis must make a directional prediction that differs across mechanisms.

3. **Design minimal viable validation.**  
   Select the smallest system, dataset, or simulation that preserves the mechanism-relevant structure. Define independent, dependent, and nuisance variables. Establish positive, negative, ablation, and baseline-parity controls. Pre-register primary metrics, diagnostic metrics, and stop conditions.  
   *Stop Condition:* Redesign if controls cannot discriminate competing mechanisms or if the minimal system lacks interpretable structure.

4. **Prepare observations or system configuration.**  
   Document preprocessing, smoothing, aggregation, calibration, initialization, or exclusion choices. Verify data integrity, sample identity, and measurement context.  
   *Integrity Gate:* Halt if leakage, contamination, calibration artifacts, or unauthorized data access are detected.

5. **Build the model or system ladder.**  
   Include: (a) a mechanistic or interpretable baseline encoding known domain structure; (b) a flexible baseline without mechanistic constraints; (c) a hybrid or target formulation integrating the proposed adaptive or plastic mechanism. Match capacity, preprocessing, and evaluation protocol across candidates where possible.

6. **Execute experiments or simulations.**  
   Collect dynamic response indicators and intermediate variables, not only final performance metrics. Vary one control lever at a time where feasible. Record uncertainty, repeated runs, and environmental conditions.

7. **Run primary analysis and mechanism diagnostics.**  
   Compare outcomes across the ladder. Check whether intermediate variables move in the predicted direction before global outcomes change.  
   *Diagnostic Gate:* If the outcome changes but mechanism diagnostics do not, revise the causal story and proceed to Step 9.

8. **Stress-test with ablations and robustness checks.**  
   Remove or freeze candidate terms, add noise, degrade observations, shift domain, or vary initial conditions and topology.  
   *Robustness Gate:* If the effect disappears under stronger controls, downgrade the hypothesis, inspect confounders, and proceed to Step 9.

9. **Grade evidence and iterate.**  
   Assign evidence strength (strong, moderate, weak, unsupported) based on control success, diagnostic alignment, and reproducibility.  
   *Iteration Gate:*  
   - If evidence is weak or unsupported, return to Step 2 or 3 with revised hypotheses or controls.  
   - If evidence is moderate, define the next decisive test and return to Step 6.  
   - If evidence is strong and stable, proceed to Step 10.

10. **Finalize and document.**  
    Package the research question, evidence map, hypothesis table, experimental design, analysis plan, iteration log, and boundary statement.

# Output Format

For each use of this skill, produce:

1. **Research question and gap diagnosis** — one sentence stating the dynamic mechanism to test and why existing approaches are insufficient.
2. **Evidence map** — what is supported by prior evidence, what is newly inferred, and what must remain unknown until tested.
3. **Hypothesis table** — columns for hypothesis, mechanism, predicted direction, evidence strength, key assumptions, failure modes, and minimal test.
4. **Experimental or simulation design** — variables, controls, metrics, data splits, and stop conditions.
5. **Analysis plan** — sanity checks, primary metrics, stability metrics, mechanism diagnostics, ablation interpretation, and uncertainty treatment.
6. **Iteration log** — decisions at each gate and the resulting next steps.
7. **Validity and boundary statement** — confounders, reproducibility checks, claim limits, and safety or ethics constraints.

# Validation Gates

- **Candidate Gate:** Hypotheses must be falsifiable, with directional predictions that discriminate target, alternative, and artifact explanations.
- **Integrity Gate:** Data and system configurations must pass sanity, leakage, and calibration checks before analysis.
- **Diagnostic Gate:** Intermediate mechanism variables must align with global outcomes before accepting a causal story.
- **Robustness Gate:** Effects must survive ablation, noise, domain shift, and resampling before upgrading evidence strength.
- **Stability Gate:** Results must be stable across independent seeds, splits, or initial-condition samples.
- **Claim-Bounding Gate:** Evidence must be graded (strong/moderate/weak/unsupported) before any generalization or performance claim is made.

# Claim Boundaries

- Distinguish mechanism evidence from pure performance improvement or optimization success.
- Separate in-sample fit from out-of-sample prediction, forecast, or generalization.
- Label every conclusion as directly tested, model-inferred, or speculative.
- Do not generalize beyond tested system families, model classes, task boundaries, or environmental conditions.
- Avoid treating a single positive result as field consensus; require replication or independent support.

# Failure Modes

- Hypothesis is vague or lacks a directional prediction.
- Controls fail to isolate the mechanism (positive and negative controls behave similarly).
- Outcome improves but mechanism diagnostics are absent, indicating spurious correlation.
- Effect is unstable across resampling, splits, seeds, or initial conditions.
- Data leakage, confounding, or preprocessing artifacts explain the result.
- Capacity or preprocessing mismatch favors the target model over the baseline independent of mechanism.
- Result depends on a narrow parameter region, single sample, or uncontrolled nuisance variable.
- Learned or recovered terms are dense, unstable, or non-parsimonious.

# Validity Checks

- **Confounding:** Distinguish target dynamics from sensor coverage, batch variation, calibration drift, intervention timing, environmental noise, and sampling artifacts.
- **Data leakage:** Ensure future information, labels, or preprocessing parameters do not enter training or analysis partitions.
- **Statistical validity:** Use held-out evaluation, repeated independent runs, uncertainty estimates, and predefined metrics before claiming superiority.
- **Identifiability:** Verify that competing mechanisms do not produce indistinguishable trajectories under the available data.
- **Reproducibility:** Version data, splits, code, random seeds, model definitions, and evaluation scripts.
- **External validity:** Require validation on distinct systems, time windows, populations, or material families before generalizing.
- **Interpretability limits:** Treat recovered symbolic terms, learned weights, or sparse components as explanatory hypotheses, not causal proof, unless supported by independent evidence.

# Provenance

- Derived from cluster 12.0 (machine-learning-assisted mechanism discovery and validation).
- Synthesized from source skills: cyber-propagation-scientific-ml, memristive-neural-synchronization-exploration, quantum-annealing-artificial-spin-exploration, magnetic-superlattice-exploration, eeg-signal-classification-exploration, neuromorphic-mof-snn-research-workflow, event-spike-spatiotemporal-research-workflow, photonic-equilibrium-learning-workflow.
- Preserves provenance as references only; no paper-specific conclusions, numerical results, or operational protocols are included.
