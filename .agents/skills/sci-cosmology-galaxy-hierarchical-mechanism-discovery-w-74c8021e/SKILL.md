---
name: sci-cosmology-galaxy-hierarchical-mechanism-discovery-w-74c8021e
description: A reusable end-to-end workflow for discovering, discriminating, and validating astrophysical mechanisms in hierarchical galaxy formation using controlled comparisons, observable-forward modeling, and iterative hypothesis refinement.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy hierarchical mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent turn an unresolved astrophysical mismatch, scatter, or structural anomaly into a structured research program that discriminates between competing mechanisms in hierarchical galaxy formation. The workflow emphasizes generating falsifiable mechanism hypotheses, designing controlled comparisons, projecting models into observable space, and iterating on evidence without treating any single model or paper as field-wide consensus.

# When to use

Use this skill when the task involves:

- Explaining unresolved scatter, tensions, or unexpected structure in galaxy formation data or simulations.
- Proposing and testing mechanisms (e.g., feedback, accretion, mergers, environmental coupling, selective transport) that could explain a population-level pattern.
- Designing simulation-to-observation comparisons or simulation-only controlled experiments with explicit controls.
- Iterating hypotheses after initial validation attempts, including cases where aggregate null results may hide cohort-level signals.
- Comparing complementary constraints from multiple observables, platforms, or model families.

Do not use this skill as a general astronomy tutor, a paper-summarization tool, an operational observational manual, or a substitute for domain-specific simulation documentation.

# Inputs required

Before generating a research plan, identify or request:

1. **Scientific target**: the phenomenon, mismatch, or scatter to explain (e.g., angular momentum deficit, unexpected scaling relation, structural diversity, hidden feedback signature).
2. **Target regime**: mass range, redshift, environment, evolutionary stage, or hierarchical level where the mechanism should be most diagnostic.
3. **Candidate mechanisms**: physically motivated processes that could produce the observed pattern.
4. **Data and simulation inventory**: available catalogues, snapshots, observational summaries, mock data, prior constraints, and baseline methods.
5. **Observable bridge**: indirect or direct observables expected to encode the mechanism, with a stated physical link rather than purely empirical correlation.
6. **Comparison baselines**: negative controls, positive controls, strong controls (alternative mechanism), and reduced-model counterparts.
7. **Nuisance factors**: selection functions, resolution limits, projection effects, background contributions, coordinate transformations, and definition dependencies.
8. **Decision goal**: model discrimination, mechanism localization, feasibility assessment, blind-spot identification, or follow-up prioritization.

If any input is missing, propose a minimal viable plan with explicit assumptions and identify the most important missing information.

# Core Workflow

Follow this ordered route from problem framing to bounded claims. Each phase includes a decision gate; the final phase includes iteration rules and stop conditions.

1. **Frame the gap and define the mismatch**
   - State the unresolved scatter, tension, or structural anomaly and why existing methods or models are insufficient.
   - Identify the regime where the signal should be strongest or cleanest to test.
   - Define a measurable proxy for the hidden process.
   - *Gate — Gap clarity*: If the phenomenon is not clearly defined or lacks a measurable proxy, stop and refine the question before proceeding.

2. **Generate ranked mechanism hypotheses**
   - For each candidate mechanism, specify: causal chain, predicted signature (direction, amplitude, morphology, gradient, or conditional trend), evidence strength (high / medium / low / exploratory), key assumptions, and failure modes.
   - Include at least one conservative (null / alternative) hypothesis and one high-information mechanism hypothesis.
   - Prioritize hypotheses that can be strengthened or weakened by feasible evidence.
   - *Gate — Falsifiability*: If hypotheses lack discriminating predictions or cannot be falsified by available data, return to step 1.

3. **Design controlled discriminating comparisons**
   - Define the **minimal viable validation**: the smallest comparison that could support or falsify the main claim.
   - Construct **competing forward models** or matched counterfactuals that differ primarily in the mechanism under test.
   - Specify controls:
     - **Negative control**: mechanism absent or suppressed.
     - **Positive control**: regime where the mechanism should produce a strong signal.
     - **Strong control**: alternative mechanism predicting a different signature.
     - **Baseline control**: no-filter, weak-filter, or standard-physics counterpart.
   - Classify variables: independent (mechanism, geometry, environment, timing), dependent (observable outcomes), and confounders (resolution, subgrid physics, selection, merger history).
   - *Gate — Design feasibility*: If controls are infeasible, comparisons are degenerate, or the minimal test cannot discriminate mechanisms, redesign or stop.

4. **Project into observable space and emulate measurement**
   - Translate model outputs into the same observable space as the data.
   - Apply **measurement emulation**: selection, smoothing, projection, background treatment, aperture matching, and realistic noise.
   - For hierarchical or nested structures, use reduced representations (dendrograms, trees, phase-space graphs, reachability plots) that expose nested relationships while explicitly separating algorithmic discovery from physical interpretation.
   - *Gate — Observable fidelity*: If the observable cannot be robustly projected or emulated, redefine the bridge or stop.

5. **Execute extraction and summary diagnostics**
   - Extract weak signals via stacking, summary statistics, hierarchical decomposition, or density-contrast scoring.
   - Quantify evidence per candidate: membership consistency, local contrast, contamination estimate, stability under perturbation, and overlap with baselines.
   - Track time ordering, mass budget, or component-specific histories to establish causality rather than correlation.
   - *Gate — Signal integrity*: If the signal is below the noise floor after emulation, if negative controls replicate the signal, or if extraction fails robustness checks, classify as inconclusive and proceed to iteration.

6. **Compare models and classify evidence**
   - Compare amplitude, morphology, spatial profiles, gradients, and environment-conditioned behavior across model variants and controls.
   - Classify each result as: **supported**, **partially supported**, **ambiguous**, **contradicted**, or **inconclusive**.
   - Check for non-monotonic responses, definition dependence, geometry dependence, and population-mixing effects.
   - *Gate — Mechanism exclusion*: If the negative control replicates the signal, if the positive control fails, or if multiple mechanisms remain degenerate after comparison, halt and investigate systematics or redesign the test.

7. **Conduct uncertainty and robustness audit**
   - Test resolution sensitivity, definition sensitivity, selection robustness, parameter stability, sample variance, and approximation validity.
   - Estimate uncertainties: statistical, systematic, model-dependent, and approximation-based.
   - Vary one assumption at a time where possible; report stability bands rather than single brittle settings.
   - *Gate — Robustness*: If conclusions depend on a single feature, unresolved numerical uncertainty, or an untested approximation, downgrade evidence strength and improve controls before claiming support.

8. **Iterate or redesign**
   - **If supported**: broaden to adjacent regimes, add independent observables, or test generalization across environments and assembly histories.
   - **If ambiguous**: add controls for the strongest confounder, improve hidden-variable measurement, refine cohort definitions, or increase sample quality.
   - **If contradicted**: revise or reject the mechanism; test alternative explanations before forcing interpretation.
   - **If inconclusive**: reduce scope, improve definitions, or redesign the observable bridge.
   - *Stop conditions*:
     - The mechanism is indistinguishable from alternatives after matched controls.
     - Controls fail or the signal appears in negative controls.
     - Further changes only increase complexity without improving evidence.
     - The hypothesis is excluded by strong independent constraints.
     - Extrapolation beyond the tested regime is required without justification.

9. **Bound claims and document provenance**
   - Limit claims to tested regimes and explicitly mark extrapolations.
   - Separate paper-supported patterns, simulation evidence, and new agent inferences.
   - Record assumptions, definitions, excluded alternatives, and model dependence.

# Output Format

When using this skill, return a structured research plan containing:

1. **Research question**: one-sentence target question and the tension being addressed.
2. **Gap diagnosis**: why existing methods or models are insufficient.
3. **Hypotheses**: ranked table with claim, mechanism, prediction, evidence strength, key assumptions, and failure modes.
4. **Experimental design**: minimal viable validation, controls (negative / positive / strong / baseline), variables, metrics, and stop conditions.
5. **Analysis plan**: projection method, extraction or summarization strategy, diagnostic hierarchy, time-ordering or budget checks, and robustness checks.
6. **Decision criteria**: what outcomes support, weaken, or reject each hypothesis.
7. **Iteration plan**: update rules for supported, ambiguous, contradicted, and inconclusive outcomes.
8. **Validity and boundary statement**: confounders, reproducibility requirements, extrapolation limits, and ethics guardrails.

# Validation Gates

- **Gap clarity gate**: The phenomenon and its proxy are well-defined and measurable.
- **Falsifiability gate**: Hypotheses make discriminating, measurable predictions.
- **Design feasibility gate**: Controls exist and comparisons are non-degenerate.
- **Observable fidelity gate**: Projection and measurement emulation are tractable.
- **Signal integrity gate**: Negative controls do not replicate the signal; positive controls behave as expected.
- **Mechanism exclusion gate**: At least one mechanism can be ruled out or distinguished under tested conditions.
- **Robustness gate**: Conclusions survive resolution, definition, and parameter variation.
- **Iteration gate**: The next step is defined for each outcome class.

# Claim Boundaries

- Treat any single-model or single-simulation result as evidence for that model under tested conditions, not as field-wide consensus.
- Distinguish "not constrained" from "confirmed" or "preferred."
- Keep algorithmic hierarchies as candidate structure maps, not confirmed physical hierarchies, until independently validated.
- Limit mechanism claims to the tested regime, mass range, environment, and model assumptions.
- Do not generalize from isolated systems to populations without explicit validation.
- Do not present idealized or simulated diagnostics as direct observational proof without uncertainty and scope limits.

# Failure Modes

- **Hypothesis failure**: Mechanism is not falsifiable; predictions lack discriminating power.
- **Control failure**: Negative controls show the target signal; positive controls fail; baseline is mismatched.
- **Degeneracy failure**: Multiple mechanisms produce identical observable signatures after projection and emulation.
- **Extraction failure**: Signal is below the measurement floor, dominated by background, or lost during stacking or summarization.
- **Robustness failure**: Result depends on one resolution level, definition choice, coordinate range, or parameter setting.
- **Interpretation failure**: Algorithmic structures treated as physical objects; correlation mistaken for causation; cause-effect timing not established.
- **Extrapolation failure**: Claims extended beyond the tested regime, mass range, or environment without justification.

# Validity Checks

Before finalizing any plan or result, verify:

- **Confounding**: Could selection, background, environment, projection, neighboring structures, or nuisance variables mimic the signal?
- **Causal ordering**: Does the proposed cause precede the observed effect in time-resolved data or assembly histories?
- **Distributional evidence**: Are full distributions compared, not only integrated totals or single summary statistics?
- **Control integrity**: Do negative, positive, strong, and baseline controls behave as expected?
- **Selection robustness**: Do alternative object definitions, sample cuts, or catalog matching preserve the qualitative result?
- **Resolution and numerical robustness**: Are conclusions stable above convergence limits and insensitive to defensible resolution choices?
- **Definition sensitivity**: Do key results change when structural proxies, apertures, coordinate definitions, or model variants are varied?
- **Observational comparability**: Are simulated and observed quantities measured in compatible ways, with the same definitions and apertures?
- **Reproducibility**: Could another agent reconstruct the comparison from the stated inputs, steps, and settings?
- **Statistical validity**: Are uncertainties estimated, bin correlations considered, and multiple-comparison risks handled?

# Provenance

This skill was synthesized from cluster 17 (subcluster 17.0) of the scientific skills codex. Source skill references include:

- `agn-feedback-tsz-observable-design` (observable-forward-model discrimination, measurement emulation, stacked weak-signal extraction)
- `astro-hierarchical-structure-discovery` (hierarchical clustering discovery, baseline comparison, metric ablation, separation of discovery from interpretation)
- `galaxy-disk-cohort-formation-workflow` (cohort separation, definition tension, gradient mechanism tests, population-mixing diagnostics)
- `dwarf-galaxy-formation-exploration` (matched counterfactuals, transition regimes, scatter interpretation, second-parameter mechanisms)
- `external-pressure-triggered-star-formation-skill` (controlled proxy variables, non-monotonic response, geometry variants, mass-budget accounting)
- `pmssm-inspired-constraint-driven-research` (high-dimensional constraint layering, stratified sampling, channel complementarity, blind-spot identification)
- `galaxy-formation-angular-momentum-workflow` (selective filtering, distribution mismatch, observable mocks, component-specific retention)
- `screened-modified-gravity-exploration` (environmental screening, approximation validation, cross-platform comparison, hidden-deviation regimes)

No paper-specific conclusions, numerical results, or operational protocols are included.
