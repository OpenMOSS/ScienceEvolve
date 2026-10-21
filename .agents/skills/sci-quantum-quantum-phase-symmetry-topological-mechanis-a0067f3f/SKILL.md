---
name: sci-quantum-quantum-phase-symmetry-topological-mechanis-a0067f3f
description: A reusable end-to-end workflow for discovering and validating microscopic mechanisms in quantum many-body systems where symmetry, topology, or conservation laws govern emergent phases and dynamics.
scienceevolve-title: "Quantum materials and condensed matter · quantum phase symmetry topological mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to guide an agent through generating, testing, and iterating mechanism-based hypotheses for quantum many-body phenomena involving phases, symmetries, topological order, or non-equilibrium dynamics. The workflow transfers a methodological pattern: audit governing assumptions, derive competing hypotheses, design minimal controlled validations, and bound claims by evidence strength.

# When to use

Trigger this skill when the user asks for research design, hypothesis generation, or validation planning in theoretical or computational quantum many-body physics—especially when symmetry breaking, topological classification, dynamical phase transitions, conservation-law constraints, or emergent collective modes are central. Do not use this skill as a general physics tutor, a literature-review generator, a source of field-wide consensus, or a provider of operational laboratory protocols.

# Inputs required

Before producing a research plan, request or infer:

- Target phenomenon and system class.
- Proposed mechanism and the assumptions that support it.
- Relevant symmetries, conservation laws, topological invariants, or equivalence relations.
- Candidate observables or diagnostics and available theoretical or numerical methods.
- Known confounders, alternative mechanisms, and boundary conditions.
- Reproducibility constraints and validity limits of the chosen methods.

If inputs are missing, state the assumptions explicitly and mark resulting hypotheses as tentative.

# Core Workflow

Follow this ordered end-to-end route. Apply decision gates at each numbered step; stop or redesign if a gate fails.

1. **Frame the research gap.** Define the phenomenon to explain, the proposed microscopic or dynamical mechanism, and what would count as support, contradiction, or inconclusive evidence.  
   *Gate: If the phenomenon cannot be linked to a falsifiable mechanism, stop and reformulate.*

2. **Audit governing assumptions.** List symmetry choices, conservation laws, topological invariants, basis or sign conventions, boundary conditions, coupling hierarchies, and equivalence relations that determine qualitative outcomes. Identify leverage points where a small change could reverse ordering, alter selection rules, suppress the mechanism, or create an alternative explanation.  
   *Gate: If the mechanism depends on an unchecked convention or unstated symmetry, flag the claim as assumption-sensitive before proceeding.*

3. **Generate competing hypotheses.** Produce at least:
   - **H1 (mechanism-consistent):** the proposed structure produces the target observable through a specified intermediate route.
   - **H2 (alternative mechanism):** the same observable arises from a different microscopic or dynamical route.
   - **H3 (null/artifact or convention-sensitive):** the predicted mechanism reverses, weakens, or disappears under corrected conventions, boundary changes, or uncontrolled disorder.
   For each hypothesis, state the causal chain, key assumptions, predicted primary and secondary signatures, and likely failure modes. Label evidence strength as weak, moderate, or strong.  
   *Gate: If hypotheses are not mutually distinguishable by available observables, redesign the diagnostic mapping.*

4. **Map to controlled observables.** Assign each hypothesis a primary observable (the most direct test) and secondary observables (independent co-signatures). Identify nuisance variables—such as finite-size effects, decoherence, disorder, numerical artifacts, or estimator bias—that could mimic the signal.  
   *Gate: If no primary observable is directly tied to the mechanism, stop and redefine the diagnostic.*

5. **Design minimal viable validation.** Specify:
   - **Baseline control:** neutral or unperturbed condition.
   - **Positive control:** condition where the mechanism should be strong.
   - **Negative control:** condition where the mechanism should be absent or suppressed.
   - **Convention/symmetry control:** repeat checks under alternative sign, phase, basis, coordinate, symmetry, or equivalence-relation choices.
   - **Model/data control:** test with an independent approximation, benchmark model, or independent dataset.
   Define success criteria, failure criteria, and stop conditions before executing tests.  
   *Gate: If controls cannot isolate the mechanism from confounders, expand the control set before execution.*

6. **Execute and analyze.** Reconstruct the causal chain: assumption → intermediate state/ordering → observable signature → interpretation. Compare controls; separate early-time, late-time, finite-size, and thermodynamic regimes; and assess robustness to nuisance variables. Distinguish physical error from numerical or statistical artifact.  
   *Gate: If negative controls show the predicted signal, positive controls fail without explanation, or independent models give incompatible qualitative outcomes, stop and downgrade the claim.*

7. **Assign evidence strength.**
   - **Strong:** multiple signatures agree, controls pass, and results are robust to reasonable model or convention changes.
   - **Moderate:** one direct signature is supported, but controls or model sensitivity remain limited.
   - **Weak:** the hypothesis is plausible but rests on analogy, a single observable, or untested assumptions.
   - **Contradicted:** direct tests or controls invalidate the predicted mechanism.  
   *Gate: If evidence is weak or contradicted, abandon or narrow the hypothesis; do not escalate to broader claims.*

8. **Iterate or terminate.**
   - **If supported:** increase evidence strength only when controls and independent checks agree; add sharper predictions; test a more demanding observable or boundary condition; generalize one variable at a time.
   - **If partially failed:** identify which link in the causal chain failed; revise the mechanism rather than preserving the conclusion through ad hoc assumptions; narrow the hypothesis and restate its boundary conditions.
   - **If failed:** preserve the negative evidence; decide whether the failure invalidates the mechanism, the observable mapping, or the design; generate an alternative mechanism that explains both the original phenomenon and the failed test.
   - **If assumptions change:** treat the change as a new modeling regime; re-evaluate all affected ordering, stability, selection-rule, or pathway claims; state which previous claims remain valid and which are obsolete.  
   *Stop conditions: Terminate when the signal is indistinguishable from uncertainty; when the result depends on a single convention-sensitive assumption; when the mechanism requires extrapolation beyond stated boundary conditions; or when repeated iterations fail to produce discriminating evidence.*

# Output Format

When using this skill, return:

1. **Research target** — Phenomenon, system class, and target observable.
2. **Assumption audit** — Key symmetries, conventions, boundary conditions, coupling hierarchies, and equivalence relations.
3. **Hypotheses** — At least three hypotheses, each with evidence strength, key assumptions, mechanism, predicted primary/secondary signatures, and likely failure modes.
4. **Minimal viable validation plan** — Primary and secondary observables; baseline, positive, negative, convention/symmetry, and model/data controls; success, failure, and stop conditions.
5. **Analysis plan** — Steps for regime separation, robustness checks, uncertainty decomposition, and comparison with alternative mechanisms.
6. **Iteration plan** — How each hypothesis should be strengthened, narrowed, revised, or abandoned.
7. **Validity and ethics statement** — Confounders, reproducibility requirements, extrapolation limits, and safety boundaries.

# Validation Gates

- Distinguish paper-supported methodology from agent-inferred claims.
- Audit sign, phase, basis, symmetry, boundary, and equivalence assumptions before interpreting results.
- Confirm the primary observable is directly tied to the proposed mechanism.
- Verify that positive, negative, baseline, convention, and model controls are specified and behave as expected.
- Define stop conditions before interpreting results.
- Ensure uncertainty, reproducibility metadata, and model sensitivity are addressed.
- Confirm confounders and alternative mechanisms have been considered.
- State extrapolation boundaries for new systems, regimes, or equivalence relations.

# Claim Boundaries

- Do not present model-consistency results as empirical proof.
- Do not treat single-study or single-model agreement as field-wide consensus or universality.
- Separate exact results, perturbative arguments, numerical evidence, heuristic intuition, and speculation.
- Mark claims that are invariant under assumption changes versus those that are assumption-sensitive.
- Avoid extrapolating beyond the validated regime, dimensionality, symmetry class, or equivalence relation.

# Failure Modes

- Signal is indistinguishable from statistical, numerical, or systematic uncertainty.
- Result depends on a single unchecked convention, sign, basis choice, symmetry assumption, or equivalence relation.
- Negative control produces the predicted signature.
- Positive control fails without defensible explanation.
- Independent models or approximations give incompatible qualitative outcomes.
- Mechanism requires extrapolation beyond stated boundary conditions.
- Apparent scaling, phase agreement, or diagnostic convergence arises from regime mixing, estimator bias, or finite-size artifacts.
- Diagnostic disagreement between information-theoretic and symmetry-based tests without resolution.

# Validity Checks

Before finalizing a research plan or result, verify:

- Equivalence relations and symmetry conventions are explicit before any phase label or mechanism claim is assigned.
- Primary and secondary observables are defined and mechanism-linked.
- Controls are complete and discriminating.
- Regime boundaries (time, system size, perturbation strength, fitting window) are identified and respected.
- Convergence, conservation-law, and numerical checks pass.
- Uncertainty is decomposed into statistical, model-form, convention, and extrapolation components.
- Reproducibility metadata—model definitions, code versions, seeds, ensemble procedures, fitting windows, and processing steps—is documented.
- Extrapolation boundaries are stated and respected.

# Provenance

Synthesized from cluster 16.0 (symmetry-guided mechanism discovery and validation). Source skills: assumption-audited-quantum-materials-research, quantum-nonstabilizerness-slow-mode-exploration, quantum-nonequilibrium-squeezing-research-workflow, coherent-trajectory-research-workflow, mixed-state-topological-phase-discovery, nonlinear-quantum-gas-pattern-exploration, conserved-structure-stability-exploration, quantum-droplet-collision-vorticity-exploration. Paper-specific conclusions, parameters, and operational protocols have been removed.
