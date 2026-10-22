---
name: sci-quantum-quantum-symmetry-topological-amplitude-evid-f307de4f
description: A reusable end-to-end workflow for symmetry-guided evidence analysis and claim audit in quantum, topological, and amplitude-focused research, spanning hypothesis generation, multi-evidence validation, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry topological amplitude evidence analysis"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent to design, execute, and audit research plans where symmetry, topology, or amplitude structure is used to discriminate among competing mechanisms. The workflow emphasizes decomposing global observables into interpretable components, enforcing consistency across independent evidence streams, and bounding claims before generalization.

## When to use

Use this skill when:

- A global observable is anomalous, vanishing, or degenerate and may conceal competing local mechanisms.
- The research question requires distinguishing sign, phase, representation, scaling, or topological pathways.
- Existing analyses rely on approximations of unclear validity or incomplete decomposition.
- The user needs a minimal validation plan with explicit controls, stop conditions, and iteration rules.

Do not use this skill for operational experimental protocols, hazardous procedures, clinical or biological domains, or as a substitute for domain-specific safety reviews.

## Inputs required

- Target system class and relevant symmetries or conservation laws.
- Global observable or quantity that is anomalous, ambiguous, or under-explained.
- High-symmetry reference or baseline framework.
- Candidate mechanisms, decompositions, or competing pathways.
- Available evidence types (e.g., simulation, spectroscopy, transport, literature benchmarks).
- Practical constraints: measurement access, computational limits, noise model, or state-preparation assumptions.
- Known limiting cases, sum rules, or consistency constraints.

## Core Workflow

1. **Frame via symmetry and reference state**
   - Define the high-symmetry or baseline reference.
   - Identify the observable anomaly, gap, or degeneracy.
   - State exact constraints (conservation laws, sum rules, gauge invariance, topology) that any valid explanation must satisfy.

2. **Decompose and hypothesize**
   - Propose that the observable arises from competing components, amplitudes, or pathways.
   - Generate a ranked set of hypotheses:
     - Baseline/null hypothesis.
     - Mechanism hypotheses with predicted signatures.
     - Nuisance-mimic or confounder hypotheses.
   - Label each with evidence strength, key assumptions, and likely failure modes.
   - **Decision gate:** If the decomposition is arbitrary or unjustified, stop and reformulate before proceeding.

3. **Design minimal validation**
   - Define independent variables (tuning parameters, regimes, state labels).
   - Define dependent variables (partitioned observables, scaling diagnostics, correlation metrics).
   - Establish controls:
     - Positive control: known behavior to verify the analysis pipeline.
     - Negative control: regime where the target mechanism should be absent.
     - Strong contrast: cases with similar global outcomes but different internal structure.
   - Specify evaluation metrics and stopping conditions.
   - **Decision gate:** If no falsifiable discriminant exists, downgrade to exploratory and expand the observable set.

4. **Execute analysis and cross-check**
   - Compute or measure partitioned quantities using the decomposition.
   - Locate balance boundaries, critical scales, or crossover regimes.
   - Verify reconstruction: components must recover the global observable within tolerance.
   - Check consistency against independent anchors (sum rules, asymptotic limits, symmetry requirements).
   - **Decision gate:** If reconstruction fails or constraints are violated, return to step 2.

5. **Audit robustness and bound claims**
   - Test sensitivity to nuisance parameters, approximation choices, boundary conditions, and finite-size effects.
   - Compare against alternative hypotheses and baseline models.
   - Inspect residuals for unmodeled structure or direction-dependent bias.
   - **Decision gate:** If results depend on a single unvalidated approximation or model choice, treat the claim as preliminary.

6. **Iterate or generalize**
   - If evidence is strong and robust: bound the claim, state extrapolation limits, and propose the next discriminating test.
   - If evidence is ambiguous: add observables, refine the decomposition, or target a narrower regime.
   - If evidence contradicts the hypothesis: reject or revise the mechanism and return to step 2.
   - **Stop condition:** Do not generalize beyond the validated regime; do not treat source-model evidence as universal consensus.

## Output Format

1. **Research question:** concise statement of anomaly and target system.
2. **Hypothesis table:** ranked hypotheses with evidence strength, assumptions, predicted signatures, and failure modes.
3. **Validation plan:** variables, controls, metrics, minimal viable test, and stopping conditions.
4. **Analysis plan:** decomposition method, constraint checks, robustness tests, and reconstruction verification.
5. **Claim boundary statement:** what is proven, numerically supported, or speculative; regime of validity.
6. **Iteration path:** how results trigger redesign, refinement, or generalization.

## Validation Gates

- **Decomposition validity:** Is the component split physically or mathematically justified?
- **Reconstruction check:** Do partitioned quantities recover the global observable?
- **Constraint satisfaction:** Are sum rules, symmetries, and conservation laws preserved?
- **Control adequacy:** Are positive, negative, and contrast controls included and passed?
- **Nuisance transparency:** Are confounding parameters identified and treated explicitly?
- **Scale consistency:** Are comparisons made at compatible energy, length, or correlation scales?
- **Regime check:** Is the analysis within the domain where the decomposition and approximations hold?

## Claim Boundaries

- Distinguish proven results, numerically certified claims, data-supported inferences, and speculative extrapolations.
- State the system class, state range, symmetry assumptions, and approximation level for which the claim holds.
- Do not present single-study or single-model results as field-wide consensus.
- Separate source-model validation from new-system inference.

## Failure Modes

- **Arbitrary decomposition:** splitting an observable without physical or mathematical justification.
- **Unstable boundary:** balance or critical scale depends sensitively on representation, gauge, or numerical parameters.
- **Nuisance absorption:** a confounding parameter mimics the target mechanism.
- **Overfitting to benchmark:** hypothesis tuned to one state family or dataset without cross-validation.
- **False direct transition:** claiming continuity without resolving intermediate phases or crossover scales.
- **Endpoint overreach:** using asymptotic or limiting behavior to interpret the accessible interior regime.
- **Constraint violation:** proposed mechanism breaks conservation laws, gauge invariance, or symmetry requirements.

## Validity Checks

Before finalizing output:

- Label what is validated in source literature versus inferred for the new problem.
- Verify that direction-dependent or representation-dependent quantities are justified before identification.
- Confirm that multiple independent evidence streams converge before claiming a strong conclusion.
- Check that failure modes and stopping conditions are defined and not bypassed.
- Ensure measurement or computational practicality is assessed; avoid theoretically valid but infeasible designs.
- Document assumptions, controls, and uncertainty sources for reproducibility.

## Provenance

- Derived from cluster 184, subcluster 184.0 ("symmetry-guided evidence analysis and claim audit").
- Synthesized from source skills: multipartite-bell-witness-design, charge-state-defect-reconstruction, anisotropic-nonequilibrium-scaling-explorer, qcd-pdf-nonperturbative-momentum-research, hadronic-form-factor-research-design, quantum-landau-critical-boundary-workflow, interference-shaped-symmetry-probe, correlated-topological-parent-state-workflow.
- Preserves methodological patterns (symmetry reduction, multi-evidence consistency, decomposition-reconstruction, scaling audit, parent-state instability analysis, interference-based discrimination) without transferring paper-specific parameters, systems, or conclusions.
