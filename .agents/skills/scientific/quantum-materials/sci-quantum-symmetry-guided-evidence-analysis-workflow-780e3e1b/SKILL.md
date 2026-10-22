---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-780e3e1b
description: A reusable end-to-end workflow for symmetry-guided scientific research that generates falsifiable hypotheses, designs minimal validation studies with layered controls, discriminates mechanisms through staged analysis, and iteratively audits claims while enforcing strict boundaries on evidence strength and generality.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow 3"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent convert a symmetry-guided, topology-guided, or structure-guided research idea into a rigorous, reusable evidence-analysis and claim-audit workflow. It abstracts the shared scientific pattern across quantum, topological, transport, statistical, and wave systems: frame a bottleneck using a mechanism-first lens, generate falsifiable hypotheses, design minimal validations with strong controls, analyze evidence in layers to discriminate mechanisms, bound claims by evidence strength, and iterate based on robustness checks rather than isolated successes.

# When to use

Use this skill when:

- A user asks to explore research questions where symmetry, topological invariant, structural reduction, cancellation principle, or grouped design is central to the proposed mechanism.
- The task requires turning a paper-derived insight into a transferable research plan with hypothesis cards, control matrices, and iteration logic.
- The domain involves quantum simulation, spintronic concepts, stochastic thermodynamics, wave-guiding systems, transport phenomena, or computational inference where claim validity depends on distinguishing mechanism from artifact.

Do not use this skill when the task is only to summarize a paper, optimize a fixed operational recipe, execute hazardous procedures, or make domain-unrelated recommendations.

# Inputs required

Before producing a research plan, collect or infer:

- Target phenomenon or system class.
- Desired function or performance bound.
- Candidate mechanism, symmetry principle, or structural reduction hypothesis.
- Available evidence, modeling tools, or measurement modalities.
- Baseline comparators and their known limitations.
- Constraints: feasibility, safety, computational budget, and acceptable uncertainty.

If inputs are missing, state assumptions explicitly and mark dependent conclusions as provisional.

# Core Workflow

Follow this ordered end-to-end route. Treat each gate as a hard stop or redesign trigger.

1. **Frame the bottleneck and operational question**
   - Define the target function and the bottleneck metric that gates downstream success.
   - Identify whether the limitation is a design-class gap, representation inadequacy, or missing mechanism.
   - **Gate 1 — Clarity Gate:** If the bottleneck cannot be expressed as a falsifiable gap between a baseline and a desired state, stop and clarify inputs.

2. **Generate symmetry-guided hypotheses**
   - For each candidate, state: "If [structural input / symmetry / control strategy] produces [intermediate state / alignment / reduced structure], then [macroscopic function / bound / transport property] will improve relative to [baseline] because [mechanism]."
   - Label evidence strength (speculative / weak / moderate / strong), key assumptions, predicted observables, and likely failure modes.
   - Prioritize hypotheses that are mechanistically specific, falsifiable, and distinct from any single source system.
   - **Gate 2 — Falsifiability Gate:** If a hypothesis lacks a clear negative control or minimal validation path, reformulate or deprioritize it.

3. **Design a minimal validation study with layered controls**
   - Define independent variables (structural, symmetry-breaking, regime, or control parameters), dependent variables (functional metrics, bounds, or transport observables), and nuisance variables.
   - Include: negative control (mechanism removed), baseline control (best existing method), mechanism control (key ingredient disabled), and perturbation control (stressing robustness).
   - Specify primary metrics, stopping conditions, and safety or ethical boundaries.
   - **Gate 3 — Minimality Gate:** If the smallest decisive test is infeasible, reduce scope or abandon the hypothesis.

4. **Execute staged analysis and mechanism discrimination**
   - **Layer A (Bookkeeping / Parent system):** Verify governing equations, invariants, convergence, or topological prerequisites.
   - **Layer B (Boundary / Interface / State):** Identify localized states, resonances, reduced representations, or coupling channels.
   - **Layer C (Function / Transport / Output):** Measure the target observable against baselines.
   - **Layer D (Attribution / Robustness):** Test whether the signal survives when the proposed mechanism is perturbed or removed; check for confounders.
   - **Gate 4 — Attribution Gate:** If negative controls replicate the signal or the effect tracks an unintended variable, halt mechanism claims and search for alternative explanations.

5. **Assess robustness and bound claims**
   - Test sensitivity to parameter variation, model assumptions, truncation, disorder, or structural perturbation.
   - Explicitly label each conclusion as demonstrated (directly supported), inferred (plausible extension), or speculative (untested).
   - State the extrapolation boundary: geometry, regime, model class, or material scope.
   - **Gate 5 — Robustness Gate:** If the result depends on a narrow, unexplained regime or unverified assumption, demote the claim and require additional validation.

6. **Iterate or redesign based on evidence**
   - **If mechanism is supported:** Strengthen the claim cautiously; propose the next higher-value validation or generalization test.
   - **If inactive controls match the signal:** Revise the mechanism hypothesis; redesign the study to isolate the true cause.
   - **If no signal is found:** Reconsider the representation, symmetry assumption, regime, or target function.
   - **If methods disagree:** Prioritize convergence and uncertainty analysis before making novelty claims.
   - **Stop conditions:** Stop when a hypothesis is falsified, numerical uncertainty dominates the effect, safety or compliance constraints are violated, or the claim boundary is firmly established.

# Output Format

Return a structured research plan containing:

1. **Scope and assumptions** — Target function, constraints, and provisional inputs.
2. **Candidate research questions** — Three to six sharply scoped questions.
3. **Hypothesis table** — Columns: hypothesis, mechanism, evidence strength, key assumptions, predicted observables, likely failure mode, minimal validation path.
4. **Study design** — Variables, layered controls, metrics, and stopping conditions.
5. **Analysis plan** — Staged layer sequence, convergence checks, and visualization strategy.
6. **Iteration plan** — Update rules for positive, negative, and ambiguous outcomes.
7. **Validity checklist** — Confounders, reproducibility checks, and boundary conditions.
8. **Recommended next step** — The most decisive low-cost test or analysis to run next.

# Validation Gates

Explicit go/no-go criteria embedded in the workflow:

- **Clarity Gate:** The bottleneck must be expressible as a falsifiable gap.
- **Falsifiability Gate:** Every hypothesis must have a defined negative control and minimal test.
- **Minimality Gate:** The validation must be the smallest credible test that can falsify the hypothesis.
- **Attribution Gate:** The signal must track the proposed mechanism, not confounders or artifacts.
- **Robustness Gate:** Claims must survive reasonable perturbation and model variation.

# Claim Boundaries

- Distinguish demonstrated results (directly observed in the tested system) from inferred extensions (supported by analogy or symmetry) and speculative conjectures (untested).
- Limit claims to the tested geometry, regime, model class, and validation level.
- Do not treat a single successful candidate, model, or bound as field-wide consensus.
- Separate paper-validated mechanisms from agent-inferred extensions in every conclusion.

# Failure Modes

Common ways the workflow or hypothesis can fail:

- **Overfitting to approximate model:** The hypothesis is optimized for an approximate target state or idealized geometry and collapses under stronger references or realistic perturbations.
- **Control failure:** Inactive or negative controls reproduce the target signal, indicating the mechanism is not specific.
- **Fragile alignment:** The effect depends on a single, narrow parameter coincidence rather than a protected symmetry or robust structure.
- **Parasitic dominance:** Unwanted interactions, confounders, or numerical artifacts explain the observed signal better than the proposed mechanism.
- **Extrapolation error:** Results from one system class, scale, or regime are generalized without boundary-condition checks.
- **Cost inversion:** The proposed improvement in the target metric is erased by growth in secondary costs (computational, energetic, or implementation).

# Validity Checks

Before finalizing or presenting any research plan or result, verify:

- **Mechanism specificity:** Does the signal disappear when the proposed symmetry, topology, or structural ingredient is removed?
- **Control validity:** Are negative, baseline, mechanism, and perturbation controls all present and matched?
- **Baseline fairness:** Is the baseline optimized within a fair and feasible family?
- **Confounder isolation:** Have environmental fluctuations, numerical artifacts, truncation effects, and nuisance variables been ruled out?
- **Reproducibility:** Are assumptions, parameters, seeds, boundary conditions, and analysis scripts documented for independent checking?
- **Metric alignment:** Does the primary metric actually advance the stated research objective?
- **Boundary conditions:** Are independence, stationarity, symmetry, regime, and geometry assumptions explicitly stated?
- **Evidence grading:** Are exact results, numerical evidence, and conjectures clearly separated and labeled?
- **Statistical validity:** Are uncertainty estimates, repeated trials, or ensemble checks included where variability matters?

# Provenance

- Derived from cluster 5, subcluster 5.0 ("symmetry-guided evidence analysis and claim audit").
- Synthesized from representative source skills: `vdw-spin-tunnel-diode-exploration`, `stochastic-feedback-thermodynamics-workflow`, `grouped-design-scientific-exploration`, `transformation-media-flow-exploration`, `optical-air-waveguide-exploration`, `quantum-chemistry-initial-state-overlap`, `topological-guided-wave-research`, `superconducting-nonlinear-mediator-research`.
- No specific paper conclusions, numerical results, or operational protocols are reproduced in this reusable workflow.
