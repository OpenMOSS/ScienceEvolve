---
name: sci-dft-catalysis-mechanism-discovery-validation-workfl-c6f32d1d
description: A reusable end-to-end workflow for observable-driven mechanism discovery and validation in homogeneous and organometallic catalysis, integrating hypothesis generation, discriminating study design, evidence triangulation, and iterative refinement without operational protocols.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis mechanism discovery validation workflow 3"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Use this skill to drive observable-driven mechanism discovery and validation in homogeneous, organometallic, and molecular catalysis. It transforms ambiguous catalytic observations into structured, competing mechanistic hypotheses and designs minimal, discriminating validation plans—computational, experimental, or mixed—without prescribing operational laboratory procedures.

# When to use

Trigger this skill when the user asks to:

- Explain anomalous rate, selectivity, catalyst speciation, or product distribution in a catalytic system.
- Generate competing mechanistic hypotheses for bond activation, insertion, or catalyst regeneration steps.
- Design a non-operational validation plan to discriminate between plausible pathways.
- Integrate computational modeling with spectroscopic, kinetic, isotopic, electrochemical, or product-distribution evidence.
- Iterate catalyst, ligand, or substrate design based on mechanistic insight.

Do not use this skill to:

- Generate executable synthesis protocols, reaction recipes, or hazardous operational parameters.
- Replace expert safety review or institutional hazard assessment.
- Treat a single paper’s conclusion as field-wide consensus.

# Inputs required

Before starting, collect or request:

- **Target transformation** and the specific observable anomaly or gap (e.g., unexpected selectivity, rate law, resting-state behavior).
- **Baseline mechanism** and at least one plausible alternative mechanistic family.
- **Available evidence types**: kinetic profiles, spectroscopy, isotope labeling, electrochemistry, product analysis, or computational modeling.
- **Abstract system descriptors**: catalyst metal class, ligand role, substrate binding motif, additive role, and environment class.
- **Constraints**: safety boundaries, analytical limits, computational scope, reproducibility requirements, and sustainability considerations.

# Core Workflow

An ordered, end-to-end route with decision gates (G) and iteration/stop conditions (S).

1. **Frame the discrimination problem**
   - Define the observable anomaly and the baseline mechanistic expectation.
   - State the decision objective: which mechanistic step, selectivity origin, or speciation event needs resolution.
   - **G1:** Is the anomaly well-defined and distinct from baseline behavior? If no, stop and refine scope.

2. **Generate competing mechanism hypotheses**
   - Enumerate at least two plausible mechanistic families (e.g., canonical vs. noncanonical ordering, inner- vs. outer-sphere, concerted vs. stepwise).
   - For each hypothesis, specify: mechanistic claim, key assumptions, predicted observables, evidence strength (high / moderate / low / speculative), and likely failure modes.
   - **G2:** Do the hypotheses predict discriminable observables? If no, reformulate at a more granular mechanistic level.

3. **Design minimal validation plan**
   - Define abstract variables by role (catalyst speciation, ligand steric/electronic effect, substrate coordination mode, environment).
   - Construct a control matrix: baseline, positive, negative, orthogonal (mechanism-specific), and stability controls.
   - Define evaluation metrics (viability, selectivity, robustness, reproducibility) and stop conditions.
   - **G3:** Can the proposed controls distinguish the leading two hypotheses? If no, redesign before proceeding.

4. **Collect and preprocess evidence**
   - Gather experimental or computational observations mapped to specific mechanistic steps.
   - Separate confirmed observations from inferred intermediates.
   - Flag confounds: transport limitations, reagent depletion, catalyst decomposition, detection bias, and background reactivity.
   - **G4:** Is data quality sufficient and reproducible? If no, pause to diagnose artifacts.

5. **Triangulate and discriminate**
   - Build an evidence matrix linking each hypothesis to independent observations (supports / contradicts / ambiguous).
   - Compare relative feasibility rather than relying on absolute computed values alone.
   - Assess catalyst speciation, resting states, off-cycle traps, and regeneration routes.
   - **G5:** Do at least two independent evidence streams converge on a preferred hypothesis? If ambiguous, proceed to iteration.

6. **Iterate or redesign**
   - Update hypothesis rankings: promote, demote, split, merge, or revise.
   - Identify the weakest link in the mechanism map and design the next decisive test.
   - **S1:** Stop and reframe if the active catalyst state is not credible, a competing pathway dominates, controls contradict the assignment, or the result depends on a single unvalidated model setting.

7. **Bound claims and archive**
   - State explicit claim boundaries: substrate scope, catalyst class, condition limits, and analytical context.
   - Document failure modes, residual uncertainties, and external validity limits.
   - Archive the mechanism map, evidence ledger, and decision rationale.
   - **S2:** Final stop when claims are bounded and the next research question is defined.

# Output Format

When using this skill, produce:

1. `Scope and target question`: reaction class, anomaly, and decision objective.
2. `Mechanistic role map`: catalytic components, substrate roles, and proposed cycle states.
3. `Evidence base`: known, inferred, and speculative items clearly labeled.
4. `Hypothesis table`: columns for claim, key assumptions, predicted observables, evidence strength, failure modes, and update trigger.
5. `Validation plan`: abstract variables, control matrix, metrics, and stop conditions.
6. `Analysis plan`: pathway enumeration, evidence triangulation method, and confound checks.
7. `Iteration ledger`: current rankings, evidence updates, and next discriminating test.
8. `Claim boundaries and validity notes`: external-validity limits, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

Before finalizing any plan or claim, confirm:

- The discrimination problem is framed as a comparison between competing mechanisms, not confirmation of a preferred pathway.
- Controls are designed to falsify hypotheses, not only to verify them.
- Evidence is triangulated across independent methods (e.g., kinetics + spectroscopy + computation).
- Confounding factors (transport, decomposition, speciation, detection bias) have been considered.
- Computational results are benchmarked against experimental observables where possible.
- Active species and resting states are chemically plausible.
- Claims are bounded to the tested substrate, catalyst, and analytical scope.

# Claim Boundaries

- This skill supports research design and mechanistic reasoning only.
- It does not prove mechanisms; it ranks hypotheses by convergent evidence.
- Extrapolation beyond the tested catalyst class, substrate family, or condition set requires explicit boundary statements.
- Single-system findings must not be presented as field-wide consensus.

# Failure Modes

- **Mechanism-level:** Active species is inaccessible; required intermediate is a thermodynamic sink; competing pathway is consistently favored; selectivity arises from an unmodeled confound.
- **Evidence-level:** Detection bias favors one species; isotope labels scramble via exchange; computational model lacks key environment effects; single-method convergence is overinterpreted.
- **Workflow-level:** Validation plan cannot discriminate top hypotheses; controls are inadequate; data quality is too low to update rankings; safety or scope constraints prevent meaningful follow-up.

# Validity Checks

- [ ] Single-paper boundary: avoid treating one source as consensus.
- [ ] Evidence separation: clearly label observed results, computational inferences, and new hypotheses.
- [ ] Alternative mechanisms: shortcuts, off-cycle states, ligand exchange, and competing coordination are considered.
- [ ] Thermodynamic vs. kinetic control: outcomes are assigned to the correct regime.
- [ ] Catalyst speciation: active species and resting states are identified or flagged as unknown.
- [ ] Selectivity logic: regio-, chemo-, stereo-, and enantioselectivity are evaluated independently.
- [ ] Computational uncertainty: model sensitivity, solvation, dispersion, entropy, and conformer treatment are appropriate.
- [ ] Reproducibility: structures, model choices, filters, and decision rules are documented for independent repetition.
- [ ] External validity: claims are limited to the scope supported by evidence.

# Provenance

- Synthesized from cluster 18.2 (observable-driven mechanism discovery and validation).
- Source skills: test0656 (mocc-catalysis-mechanistic-exploration), test1477 (molecular-electrocatalyst-proton-relay-discovery), test1142 (palladium-ch-functionalization-mechanistic-exploration), test1021 (organometallic-carbene-transfer-research-design), test1763 (c-c-activation-natural-product-synthesis-planning), test1808 (co2-photochemical-selectivity-inversion-workflow), test0041 (computational-catalysis-mechanism-discovery), test0727 (computational-selectivity-mechanism-design).
