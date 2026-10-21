---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-55d90975
description: A reusable end-to-end workflow for discovering and validating candidate mechanisms in quantum, topological, and correlated systems by linking symmetry principles to effective models, controlled comparisons, and iterative exclusion.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 22"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent design reusable research plans that turn structural or microscopic principles into falsifiable mechanism hypotheses, validate them through hierarchical model comparisons and controlled diagnostics, and iterate until claims are bounded or excluded.

## When to use

Use this skill when the user asks to:
- Propose new research questions about hidden mechanisms, effective theories, symmetry-protected phenomena, or dynamic balances in condensed-matter, many-body, or wave/network systems.
- Design computational or theoretical validation plans with explicit controls, metrics, and stop conditions.
- Compare reduced, corrected, and higher-fidelity models across multiple observables.
- Iterate hypotheses after pass, fail, or ambiguous outcomes.

Do not use this skill for operational experimental protocols, fabrication recipes, device operation, or hazardous procedures.

## Inputs required

Before producing a research plan, request or identify:

- **Target system class**: degrees of freedom, dimensionality, symmetries, and expected low-energy excitations.
- **Microscopic anchor or symmetry principle**: the locality, causality, conservation law, symmetry, or dynamic balance expected to constrain the description.
- **Candidate model hierarchy**: baseline model, single-correction variants, feedback/response variants, effective reductions, and full or higher-fidelity references.
- **Observables and diagnostics**: spectral functions, response quantities, topological invariants, transport proxies, or other features that encode the physical claim.
- **Validation methods**: analytic derivation, symbolic computation, numerical simulation, or literature benchmark.
- **Constraints and boundaries**: regime limits, cutoff assumptions, computational budget, and acceptable stop conditions.

If any input is missing, state assumptions explicitly and rank hypotheses by evidence strength.

## Core Workflow

Follow this ordered end-to-end route, applying decision gates and iteration/stop conditions at each stage.

1. **Anchor the mechanism**  
   Identify the microscopic principle, symmetry, or dynamic balance that should constrain the low-energy theory. Define the target system class, regime of validity, and the diagnostic features that would signal the mechanism.  
   - *Decision gate*: If the anchor does not apply to the target class, stop and redefine scope.

2. **Construct a model hierarchy**  
   Build a baseline model, then systematic variants (e.g., single-correction, self-consistent feedback, effective reduction, full reference). Document what each variant includes, excludes, and approximates.  
   - *Decision gate*: If the baseline cannot reproduce known limits or independent benchmarks, revisit inputs before proceeding.

3. **Generate ranked hypotheses**  
   Derive mechanism hypotheses from the anchor. For each, label evidence strength (established, plausible, speculative, unsupported), key assumptions, predicted diagnostic signature, and falsification condition.  
   - *Decision gate*: If a hypothesis is not falsifiable with available methods, deprioritize or reformulate.

4. **Design controlled validation**  
   Define a minimal viable validation with:
   - **Positive control**: a known admissible case or benchmark.
   - **Negative control**: a case where the mechanism is suppressed, sign-reversed, or absent.
   - **Robustness/boundary controls**: symmetry-preserving perturbations, alternative reductions, or regime-edge tests.
   - **Metrics and stop conditions**: pre-registered criteria for success, ambiguity, and failure.

5. **Execute diagnostic analysis**  
   Locate spectral, topological, or response diagnostics in the same variable space as the anchor constraints. Compare model variants via ablation or controlled perturbation. Track parameter dependence and separate universal from non-universal contributions. Require at least two independent observables or diagnostics to agree before strengthening confidence.

6. **Run mechanism exclusion**  
   Check whether diagnostics violate anchor-derived forbidden regions, whether alternative explanations (disorder, boundaries, hidden modes, numerical artifacts) reproduce the same signature, and whether the candidate mechanism is required or merely consistent.  
   - *Decision gate*: If a simpler explanation survives all controls, abandon or downgrade the candidate mechanism.

7. **Robustness and stability screening**  
   Subject surviving hypotheses to finite-size/convergence checks, alternative truncations, and parameter perturbations. Verify that topological or spectral claims are stable under smooth, symmetry-preserving deformations.  
   - *Decision gate*: If the effect is fragile or depends on a single untested termination or assumption, narrow the claim boundary.

8. **Bound claims and record outcomes**  
   State what is excluded, what survives only as a necessary condition, and what remains unresolved. Document residual uncertainty, extrapolation limits, and the distinction between validated results and agent-generated inferences.  
   - *Iteration trigger*: If results are ambiguous, return to step 4 with tighter controls or to step 2 with revised model ingredients.

9. **Iterate or redesign**  
   If the mechanism passes, design the next discriminative test rather than increasing data volume. If it fails, revise the smallest necessary assumption, change the observable, narrow the regime, or abandon the ansatz. Update the mechanism map and return to step 3 or 2 as needed.  
   - *Stop condition*: Halt when a hypothesis is falsified, when it is validated across independent diagnostics with bounded uncertainty, or when further tuning only hides a consistency violation.

## Output Format

When using this skill, produce:

1. **Research question framing**: system class, gap, target observable, and why it matters.
2. **Microscopic anchor / symmetry principle**: the constraint used to generate hypotheses.
3. **Candidate hypotheses**: ranked list with evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Validation plan**: minimal viable test, positive control, negative control, robustness/boundary controls, metrics, and stop conditions.
5. **Analysis plan**: diagnostic sequence, model comparison route, uncertainty treatment, and criteria for interpreting results.
6. **Iteration plan**: how hypotheses and models should be updated after pass, fail, or ambiguous outcomes.
7. **Validity and ethics statement**: boundary conditions, confounders, reproducibility checks, and non-operational safety limits.

## Validation Gates

- **Anchor applicability**: The principle actually constrains the target system class and regime.
- **Regime check**: The effective model is not extrapolated beyond its stated validity.
- **Diagnostic independence**: At least two independent observables or diagnostics support major claims.
- **Control adequacy**: Positive, negative, and robustness controls are defined and evaluated.
- **Model consistency**: Reduced and full models agree qualitatively within the validated domain.
- **Convergence and reproducibility**: Numerical or statistical procedures are stable, with resolution and sampling checks reported.

## Claim Boundaries

- Distinguish excluded models from models that merely survive a necessary condition.
- Do not treat a single study, dataset, or model fit as field-wide consensus.
- Limit claims to the tested symmetry class, energy window, parameter domain, and material subset.
- Clearly separate validated results, agent-generated inferences, and speculative extrapolations.

## Failure Modes

- **Hidden cancellation**: Competing approximations mask a true mechanism failure.
- **Observable overfitting**: Agreement with one diagnostic while linked observables fail.
- **Confounding**: Loss, disorder, boundary effects, finite size, or numerical artifacts mimic the target mechanism.
- **Ground-state instability**: The excitation or effective picture breaks down due to an unmodeled phase transition.
- **Diagnostic degeneracy**: Multiple distinct mechanisms produce the same spectral or response signature.
- **Unconstrained fitting**: Post-hoc parameter tuning creates spurious agreement without mechanistic meaning.

## Validity Checks

Before finalizing a research plan, verify:

- The microscopic anchor applies to the target system class.
- The effective model is not used beyond its stated regime.
- Diagnostic singularities are defined in variables constrained by the anchor.
- High-energy, incoherent, or nonuniversal contributions are separated from low-energy diagnostics.
- Passing a necessary constraint is not described as proof of correctness.
- Every hypothesis includes evidence strength, key assumptions, failure modes, and stop conditions.
- The plan is reusable for new questions in the same research area, not a restatement of a single source.

## Provenance

Derived from cluster 167.0 (symmetry-guided mechanism discovery and validation), synthesizing source skills: lattice-causality-response-consistency, nonhermitian-polariton-research-design, nonlinear-lattice-localization-exploration, icf-power-balance-research-explorer, graphene-many-body-workflow, latent-effective-model-topological-lattice-design, symmetry-protected-topological-excitation-workflow, cuprate-model-guided-research.
