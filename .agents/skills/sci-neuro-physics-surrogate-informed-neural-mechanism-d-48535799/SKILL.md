---
name: sci-neuro-physics-surrogate-informed-neural-mechanism-d-48535799
description: A reusable end-to-end workflow for designing, validating, and iterating machine-learning surrogates that propose and discriminate candidate mechanisms in physical and stochastic dynamical systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · physics surrogate informed neural mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to turn observations of complex physical, stochastic, or computational systems into testable mechanistic hypotheses via surrogate modeling. It guides an agent to identify why standard models fail, propose a learnable or physics-structured surrogate mechanism, validate it against strong controls, and iterate while bounding claims.

# When to use

Use this skill when:
- The user wants to discover or validate mechanisms in systems with hidden states, path-dependent dynamics, rugged landscapes, or recurrent structure.
- Proposing surrogate models—such as neural, energy-based, recurrent, or stochastic surrogates—to replace or augment explicit physical models.
- Designing controlled comparisons between a proposed mechanism and matched baselines in simulation or data-driven studies.
- Iterating on model structure based on mechanism-level diagnostics rather than aggregate metrics alone.

Do not use for operational laboratory protocols, clinical decision-making, hazardous experimental procedures, or hardware-specific execution recipes.

# Inputs required

Before producing a plan, ask for or identify:
- Target system class and the observable phenomenon or computational task to explain.
- Baseline model or theory that is currently insufficient, with a concrete failure mode (e.g., local trapping, missing hidden state, poor scaling, incorrect transient response).
- Candidate surrogate family or structural property hypothesized to close the gap.
- Available data or simulation environment, including what variables are observed versus latent or auxiliary.
- Reference methods for comparison (analytical, numerical, or established baselines).
- Evaluation priorities, such as accuracy, efficiency, robustness, scalability, or mechanistic fidelity.
- Constraints on reproducibility, compute budget, safety, and ethics boundaries.

# Core Workflow

Follow this ordered route. Treat each gate as a hard stop or redesign trigger; treat each stop/iterate condition as a rule for exiting or revisiting an earlier step.

1. **Frame the mechanistic gap**
   - Define the target behavior, the baseline failure mode, and the specific observation the surrogate must explain.
   - **Gate:** If the gap cannot be operationalized into a falsifiable discrepancy, stop and refine the research question.

2. **Propose surrogate mechanism(s)**
   - Translate the gap into structural hypotheses (e.g., learnable hidden state, equilibrium/fixed-point formulation, auxiliary stochastic process, energy-landscape mapping, or architectural property).
   - Rank hypotheses by evidence strength and specify key assumptions, predicted signatures, and likely failure modes.
   - **Gate:** If no hypothesis can be linked to a measurable change in system behavior, stop.

3. **Design minimal viable validation**
   - Construct the smallest interpretable test that can falsify the core mechanism.
   - Define the target condition, baseline, negative control (mechanism absent or disrupted), positive control (known behavior expected), and strong comparator.
   - Specify independent variables, dependent variables, and primary metrics.
   - **Gate:** If the validation cannot distinguish the proposed mechanism from a capacity-matched baseline, redesign controls before scaling.

4. **Execute training or sampling**
   - Run the surrogate and baselines under matched conditions: identical preprocessing, splits, budgets, initialization policies, and evaluation protocols.
   - For path-dependent or sequential problems, use sequence-level splits to prevent temporal leakage.
   - **Stop/iterate:** If the surrogate is unstable across most initializations, fails the minimal task, or cannot converge, revisit the mechanism or architecture before benchmarking.

5. **Diagnose mechanism-level performance**
   - Separate aggregate metrics from mechanistic evidence:
     - Check convergence, stationarity, or equilibrium quality.
     - Compare marginals, joint dependencies, and conditional predictions.
     - Inspect residuals, failure cases, and trajectory behavior.
     - Run ablations that remove or randomize the proposed structural property.
   - **Gate:** If the proposed mechanism does not outperform its ablation or a matched baseline on mechanism-specific checks, downgrade or reject the hypothesis.

6. **Run robustness and boundary tests**
   - Vary initial states, noise levels, data regimes, or problem scales.
   - Test extrapolation beyond the training distribution.
   - **Stop/iterate:** If results depend on a single seed, narrow benchmark, or unrealistic protocol, stop generalizing and redesign.

7. **Iterate or redesign**
   - If the mechanism is supported, relax one assumption at a time and return to step 4.
   - If results are mixed, split the hypothesis into regime-specific claims and design a discriminating control.
   - If negative, localize the failure (representation, dynamics, data, or inference) and return to step 2.
   - **Stop condition:** Stop when the mechanism is validated under strong controls, falsified, or bounded to a specific regime.

8. **Bound final claims**
   - Label each conclusion as exact, approximate, local, illustrative, or speculative.
   - Document where the mechanism is expected to hold, where it fails, and what remains untested.

# Output Format

Return the following structure:

1. **Research question** — Target phenomenon, baseline failure, and surrogate context.
2. **Ranked hypotheses** — For each: claim, evidence strength, key assumptions, predicted signature, and likely failure mode.
3. **Validation design** — Minimal setup, controls, variables, metrics, and stopping rules.
4. **Mechanism-level analysis** — Convergence checks, dependency tests, conditional predictions, residual inspection, and ablation outcomes.
5. **Robustness summary** — Seed variation, distribution-shift tests, scaling behavior, and boundary conditions.
6. **Iteration log** — Decision points, redesigns, and evidence updates.
7. **Validity and claim boundary statement** — Confounds, reproducibility checks, scope limits, and claim-strength labels.

# Validation Gates

- **Gap clarity:** The discrepancy between baseline and observation must be operationalized before surrogate design.
- **Control strength:** The validation must include a negative control and a strong comparator matched on capacity or budget.
- **Mechanism discrimination:** Aggregate performance gains alone are insufficient; the surrogate must show mechanism-specific improvement over its ablation.
- **Stability:** Results must be stable across multiple seeds, initial conditions, or independent runs.
- **Extrapolation discipline:** Claims beyond the tested regime require explicit boundary labeling.

# Claim Boundaries

- Distinguish exact guarantees from empirical approximations and illustrative plausibility.
- Separate surrogate optimization success from downstream learning or task success.
- Do not infer real-time physical dynamics from non-physical exchange, equilibrium approximations, or artificial sampling paths unless separately validated.
- Limit scope to the tested system class, data distribution, and surrogate architecture.

# Failure Modes

- **Misspecified target:** The baseline or target object is wrong, making the gap illusory.
- **Overfitting to protocol:** The surrogate memorizes training sequences or benchmark artifacts rather than learning a transferable mechanism.
- **Ablated gain vanishes:** Performance improvement disappears when the proposed structural property is removed or randomized.
- **Hidden confounding:** Gains arise from preprocessing, initialization, budget mismatch, or data leakage rather than the mechanism.
- **False convergence:** The surrogate reaches a trivial fixed point, local minimum, or unstable equilibrium that does not encode the target behavior.
- **Non-identifiability:** Multiple mechanisms explain the same observations; the experiment cannot discriminate them.

# Validity Checks

- **Confounding:** Could variability be explained by non-stationarity, noise, unmodeled inputs, or preprocessing choices?
- **Identifiability:** Can the proposed mechanism be distinguished from alternatives with available observations?
- **Baseline fairness:** Are comparisons matched in model family, budget, task, and evaluation protocol?
- **Dependency validity:** Are conclusions based on joint or conditional structure, not only marginal summaries?
- **Reproducibility:** Are splits, seeds, preprocessing, metrics, and selection criteria documented?
- **Boundary clarity:** Are exact, approximate, and speculative claims clearly separated?
- **Scope discipline:** Are claims limited to the tested system and not presented as domain-wide consensus?

# Provenance

- Synthesized from cluster 5.1: machine-learning-assisted mechanism discovery and validation.
- Source skill references: stochastic-recurrent-sampling-research-design; parallel-tempering-research-workflow; quantum-equilibrium-research-design; neuronal-dynamics-research-exploration; data-driven-dynamic-friction-research-skill; quantum-recurrent-research-workflow; quantum-inspired-stochastic-optimization-workflow; cim-energy-based-neural-training.
