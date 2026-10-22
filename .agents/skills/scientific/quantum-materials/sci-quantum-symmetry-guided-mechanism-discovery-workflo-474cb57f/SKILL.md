---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-474cb57f
description: A reusable research-planning workflow for identifying gaps, generating falsifiable hypotheses, and validating competing mechanisms in quantum, topological, and wave systems through symmetry-aware controls and iterative triangulation.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 6"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to turn a scientific study of competing mechanisms in quantum, topological, or wave systems into a reusable research-planning workflow. It helps an agent identify methodological gaps, generate falsifiable mechanistic hypotheses, design controlled validations, and iterate on evidence without treating any single study as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions in systems where symmetry, topology, interactions, disorder, or geometry compete to determine phases, modes, or localization.
- Design numerical, theoretical, or simulation-based studies to distinguish candidate mechanisms.
- Evaluate whether a candidate phase, transition, topological state, or localized mode is credible across methods.
- Translate a known result into a broader mechanism-discovery strategy for a new Hamiltonian, platform, or observable.

Do not use this skill as a substitute for executing simulations, operating instruments, fabricating materials, or making material-specific device recommendations.

# Inputs required

Before generating a plan, identify or request:

- Target system class and its relevant degrees of freedom, dimensionality, symmetries, and conserved quantities.
- Competing mechanisms or energy scales and the control parameters that tune between them.
- Known limiting cases, benchmarks, or reference phases that serve as positive and negative controls.
- Candidate observables and diagnostics, including bulk, boundary, spectral, topological, or statistical probes.
- Available methods and their known limitations, such as finite-size effects, approximation bias, stochastic noise, sign problems, or discretization errors.
- Intended claim strength, ranging from exploratory hypothesis to secure result.
- Literature context distinguishing prior claims, disputed regimes, and open methodological gaps.

# Core Workflow

Apply the following ordered end-to-end route:

1. **Frame the gap.** Identify an unresolved mechanism, phase boundary, or diagnostic tension. State why existing evidence is insufficient and what observable would falsify a proposed explanation.
   - *Decision gate:* If the gap cannot be expressed as a falsifiable question with a measurable discriminator, stop and reformulate.

2. **Abstract a minimal tunable model.** Retain only the degrees of freedom, symmetries, and competing energy scales needed to capture the target physics. Anchor the model in solvable or well-understood limiting cases.
   - *Decision gate:* If the model fails to reproduce established limits, revise the abstraction before proceeding.

3. **Generate competing mechanistic hypotheses.** For each candidate, specify the expected symmetry fate, observable signatures, distinguishing tests, evidence strength, key assumptions, and likely failure modes.
   - *Decision gate:* If hypotheses cannot be distinguished by available observables or methods, redesign the diagnostic set or narrow the scope.

4. **Design controlled validation.** Define independent variables, positive/negative/method/boundary controls, and pre-registered stop conditions. Prioritize observables that independently separate mechanisms.
   - *Decision gate:* If no control can falsify the leading hypothesis, expand the method set or bound the claim.

5. **Establish baselines and limiting cases.** Compute or summarize noninteracting, weak/strong-coupling, trivial/nontrivial, or localized/extended limits before interpreting the full regime.
   - *Decision gate:* If baseline behavior contradicts known physics, audit definitions, conventions, and implementation.

6. **Execute primary diagnostics and triangulate methods.** Compare results across independent methods or representations. Inspect finite-size trends, scaling behavior, boundary sensitivity, statistical uncertainty, and rare-event tails where relevant.
   - *Decision gate:* If methods disagree without a resolvable explanation (for example, finite-size effect, approximation limit, or boundary condition), pause and diagnose before advancing claims.

7. **Evaluate against controls and pre-registered criteria.** Verify that positive controls reproduce expected behavior, negative controls suppress the target signature, and method controls agree in overlapping regimes.
   - *Decision gate:* If any control fails, halt hypothesis expansion, debug the pipeline, and revisit assumptions.

8. **Iterate, narrow, or stop.**
   - *Strengthen:* If bulk, boundary, and method diagnostics converge, test robustness under parameter variation, disorder, geometry, or platform changes; generalize cautiously.
   - *Narrow:* If evidence supports only a subregime, restrict claims to that window and design targeted follow-up.
   - *Replace:* If an alternative mechanism explains the data better, pivot to a new hypothesis using the same workflow.
   - *Stop:* If finite-size effects dominate, numerical noise prevents discrimination, assumptions are violated, or controls remain failed, bound the claim explicitly and terminate the line of inquiry.

# Output Format

When using this skill, produce:

1. **Research question:** A concise, falsifiable question tied to a mechanism or phase-diagram gap.
2. **Minimal model and assumptions:** System class, symmetries, control parameters, and missing-input assumptions.
3. **Hypotheses table:** For each hypothesis, list evidence strength, key assumptions, predicted signatures, likely failure modes, and minimum viable validation.
4. **Study design:** Primary and secondary variables, controls (positive, negative, method, boundary), observables, and stop conditions.
5. **Analysis plan:** Baseline checks, symmetry-resolved observables, finite-size or scaling strategy, method comparison, and uncertainty reporting.
6. **Iteration plan:** Next step for each plausible outcome, including failure-driven narrowing.
7. **Validity summary:** Confounders, reproducibility notes, statistical caveats, symmetry or topological assumptions, and extrapolation boundaries.
8. **Evidence boundaries:** Explicitly separate existing evidence, model-based inference, and agent-generated new research directions.

# Validation Gates

- **Symmetry consistency:** Proposed order or topology must respect or break expected symmetries in a physically consistent way.
- **Observable independence:** The main claim must not rely solely on multiple plots or metrics derived from the same fitted quantity.
- **Finite-size and scaling validity:** Claim strength must match available size trends, crossing behavior, or scaling collapse.
- **Method boundary:** State where each method (exact, stochastic, mean-field, effective-model, or numerical) is reliable.
- **Control fidelity:** Positive, negative, and method controls must behave as expected before advancing claims.
- **Topological and spectral validity:** Confirm gap, manifold, gauge, and boundary assumptions before using topological or spectral diagnostics.
- **Statistical validity:** Report uncertainties, fitting windows, sampling choices, and sensitivity to analysis decisions.

# Claim Boundaries

- Distinguish directly computed results from model-inferred or agent-generated hypotheses.
- Separate model-level conclusions from material-specific or platform-specific predictions.
- Do not extrapolate phase boundaries, universality classes, or topological phases beyond tested regimes.
- Label conclusions as observed, inferred, or speculative.
- Stop generalization if the model omits essential physics relevant to the target platform.

# Failure Modes

- **Finite-size artifacts:** Small-system commensurability or boundary effects mimic bulk phases or transitions.
- **Approximation bias:** Mean-field, perturbative, or numerical artifacts create spurious order or suppress real order.
- **Diagnostic confusion:** A single observable or derived quantity is interpreted as multiple independent evidences.
- **Control failure:** Positive or negative controls fail due to pipeline errors, misidentified limits, or broken assumptions.
- **Method disagreement:** Independent methods conflict without resolution via finite-size, boundary, or regime arguments.
- **Rare-region or tail dominance:** Atypical configurations or distribution tails drive the signal but are treated as typical behavior.
- **Extrapolation overreach:** Claims extend to the thermodynamic limit, new materials, or devices without validated bridging assumptions.

# Validity Checks

Before finalizing any plan or interpretation, check:

- **Confounders:** List physical and numerical factors that could mimic the proposed mechanism.
- **Symmetry consistency:** Verify order parameters, topological markers, and boundary modes against preserved or broken symmetries.
- **Observable independence:** Ensure the claim rests on physically distinct diagnostics.
- **Finite-size validity:** Require convergence, crossing behavior, or scaling appropriate to the claim strength.
- **Method boundaries:** State reliability limits for each computational or analytical tool.
- **Statistical validity:** Report uncertainties and sensitivity to fitting and sampling.
- **Topological and spectral validity:** Confirm assumptions behind invariants, boundary correspondence, or spectral interpretation.
- **Reproducibility:** Document conventions, normalizations, boundary conditions, and comparison baselines.
- **Extrapolation boundary:** Separate model conclusions from broader predictions.

# Provenance

- Derived from cluster 136, subcluster 136.0 ("symmetry-guided mechanism discovery and validation").
- Synthesized from source skills: rashba-hubbard-phase-diagram-explorer, quasiperiodic-mbl-resonance-exploration, plasma-harmonic-spatial-metrology-research, quantum-spin-chain-phase-exploration, chiral-magnonic-flat-mode-exploration, localized-fermion-instability-workflow, correlated-topological-materials-exploration, non-hermitian-sonic-topological-research.
- No specific paper conclusions, numerical parameters, or material protocols are retained in the reusable workflow body.
