---
name: sci-dft-computational-organometallic-mechanism-discover-bc71fb65
description: A reusable end-to-end workflow for discovering, discriminating, and validating organometallic catalytic mechanisms through computational hypothesis generation, pathway mapping, control design, and iterative refinement.
scienceevolve-title: "Organometallic catalysis and DFT · computational organometallic mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Use this skill to transform ambiguous catalytic observations into structured, testable mechanistic research programs. The workflow guides hypothesis generation, competing-pathway discrimination, and validation planning for organometallic catalysis without assuming a single system generalizes to the entire field.

# When to use

Use this skill when:

- A catalytic transformation shows activity, regioselectivity, enantioselectivity, or chemoselectivity that lacks a clear mechanistic explanation.
- Competing pathways (e.g., additive-altered vs. additive-free, metal-bound vs. free-intermediate, or spin-state alternatives) must be discriminated.
- Designing computational studies to identify turnover-limiting steps, selectivity-determining transition states, resting states, or deactivation routes.
- Proposing new research questions, catalyst modifications, or substrate boundaries based on mechanistic reasoning rather than analogy alone.

Do not use this skill for executable laboratory protocols, hazardous procedure development, scale-up, clinical or agrochemical deployment advice, or as a substitute for domain-specific safety review.

# Inputs required

Before applying the workflow, collect:

- Target reaction class and desired observable outcomes (activity, selectivity, product identity).
- Candidate catalyst families, ligand environments, plausible oxidation and spin states, and additive roles.
- Known experimental observations: product distributions, failed cases, kinetic trends, spectroscopic hints, and reproducibility notes.
- Existing mechanistic proposals and the assumptions behind them.
- Available modeling or analytical resources and acceptable uncertainty levels.
- Safety, regulatory, and ethical constraints relevant to the chemical systems involved.

# Core Workflow

**Phase 1: Frame the mechanistic gap**
1. Define the selectivity or activity anomaly as a pathway-choice problem.
2. Identify the observable evidence that must be explained and bound the chemical space under study.
3. **Decision Gate DG1:** Is the gap well-defined and the scope bounded? If not, refine the question before proceeding.

**Phase 2: Map competing pathways**
1. Enumerate plausible catalytic cycles: catalyst activation, substrate binding, key bond-forming events, product release, and regeneration.
2. Include off-cycle resting states, dead-end complexes, and deactivation routes.
3. Identify branch points where pathways diverge and label discriminating intermediates or transition states.
4. **Decision Gate DG2:** Are at least two chemically reasonable alternatives mapped? If not, conduct scoping analysis before proceeding.

**Phase 3: Generate layered hypotheses**
1. Formulate hypotheses in sequence:
   - **Mechanistic role hypothesis:** whether a feature (ligand, additive, substrate) is a passive modifier, direct participant, or pathway selector.
   - **Selectivity hypothesis:** which transition state or intermediate ensemble controls the outcome.
   - **Electronic/structural hypothesis:** how catalyst or substrate features alter energies and geometries.
   - **Design hypothesis:** a minimal perturbation that tests one mechanism at a time.
2. Annotate each hypothesis with evidence strength (strong, moderate, weak, speculative), key assumptions, predicted observables, likely failure modes, and transferability boundaries.
3. **Decision Gate DG3:** Does each hypothesis specify a falsifiable prediction? If not, reformulate.

**Phase 4: Design minimal validation plan**
1. Define variables: catalyst state, ligand environment, substrate electronics and sterics, additive role, coordination mode, spin state, and solvation representation.
2. Define controls:
   - **Positive:** a benchmark expected to preserve the proposed mechanism.
   - **Negative:** a variant expected to suppress the proposed pathway.
   - **Mechanistic:** a perturbation that distinguishes two plausible pathways.
   - **Robustness:** sensitivity to model, conformational, or methodological assumptions.
   - **Boundary:** a case near the edge of the proposed applicability.
3. Define evaluation metrics: relative energetics, activation barriers, turnover-relevant metrics, descriptor consistency, predicted selectivity trends, and connectivity of key states.
4. Define stop conditions: unverified transition states, energy differences within expected uncertainty, unresolved product identity, contradictory controls, or dependence on a single unsupported interaction.
5. **Decision Gate DG4:** Can the plan falsify the leading hypothesis? If not, add discriminating comparisons.

**Phase 5: Analyze and discriminate**
1. Construct energy profiles for competing pathways using consistent reference states.
2. Compute electronic, spin, and structural descriptors before interpreting pathway energetics.
3. Compare desired and undesired transition states by geometry, energy, and electronic structure.
4. Perform sensitivity checks for conformational sampling, solvation, model size, and method choices.
5. Check product identity against plausible tautomers or regioisomers.
6. **Decision Gate DG5:** Do independent evidence streams converge? If not, flag ambiguity and expand sensitivity checks.

**Phase 6: Rank mechanisms and update confidence**
1. Rank pathways by explanatory power, consistency with observations, and robustness to assumptions.
2. Promote a hypothesis only if it survives controls and suggests a testable next modification.
3. **Iteration / stop rules:**
   - **If supported:** Propose minimal perturbations that amplify the controlling feature; update boundary conditions and evidence strength.
   - **If partially supported:** Identify the failed evidence stream; design one focused perturbation and return to Phase 4.
   - **If contradicted:** Rebuild the pathway map in Phase 2; revise active-species or rate-limiting assumptions.
   - **If uncertainty dominates:** Downgrade evidence grade; stop generalizing and return to Phase 4 for additional validation.
   - **If controls fail:** Halt interpretation until control issues are resolved.
4. **Decision Gate DG6:** Is the confidence level commensurate with the claim? If not, narrow the claim or iterate.

**Phase 7: Document and boundary-check**
1. Record models, states, controls, decision criteria, and analysis choices for reproducibility.
2. State the validated chemical space and explicit extrapolation limits.
3. Separate paper-supported observations from agent-generated inferences.
4. **Decision Gate DG7:** Are safety and ethics constraints satisfied and documented? If not, halt and review.

# Output Format

Return results in this structure:

1. **Research question** — The mechanistic gap and why it matters for design.
2. **Mechanistic map** — Branch points, candidate pathways, discriminating states, bottlenecks, and dead-end routes.
3. **Hypothesis set** — For each: statement, evidence strength, key assumptions, predicted observable, likely failure mode, and transferability boundary.
4. **Validation design** — Variables, controls, minimal viable tests, evaluation metrics, and stop conditions.
5. **Analysis plan** — Pathway comparison, descriptor interpretation, sensitivity checks, and confidence grading.
6. **Iteration recommendation** — Update rules for supported, contradicted, ambiguous, and control-failure outcomes.
7. **Boundary statement** — Validated space, extrapolation limits, uncertainty summary, and safety notes.

# Validation Gates

- **Pathway completeness:** Activation, turnover, selectivity-determining step, regeneration, and deactivation are considered or explicitly scoped out.
- **Transition-state validity:** Key transition states connect to intended minima.
- **Energy robustness:** Conclusions are stable under reasonable sensitivity checks.
- **Selectivity consistency:** Predicted preferences align with reliable experimental or computational evidence.
- **Interaction causality:** Proposed contacts are supported by energy and geometry, not visual similarity alone.
- **Control adequacy:** Positive, negative, mechanistic, robustness, and boundary controls are present.
- **Reference-state consistency:** Competing pathways are compared using the same thermodynamic baseline.
- **Reproducibility:** Models, assumptions, and decision criteria are documented for independent audit.

# Claim Boundaries

- Treat each mechanistic study as evidence for a class-level hypothesis, not field-wide consensus.
- Distinguish validated starting points from agent inferences about new substrates, catalysts, or conditions.
- Limit claims to the studied mechanistic class; label extrapolations explicitly.
- Do not present plausible pathways as proven without robust pathway discrimination.
- Avoid overgeneralizing from a small substrate or catalyst set.

# Failure Modes

- Active species is unidentified or inconsistently generated.
- A competing pathway remains within expected uncertainty of the leading pathway.
- Key transition states are unverified or unconnected to intended minima.
- Predicted selectivity conflicts with reliable evidence.
- Controls fail or show nonspecific activity.
- Conclusions depend on a single unsupported interaction, substrate, or model assumption.
- Product identity is ambiguous among tautomers or regioisomers.
- Catalyst deactivation or substrate inhibition provides a simpler explanation than the proposed mechanism.

# Validity Checks

- Have plausible alternatives been considered, or is the analysis biased toward one assumed route?
- Do key transition states connect to the intended minima?
- Are conclusions stable under reasonable sensitivity checks?
- Do predicted product preferences align with reliable evidence?
- Are proposed contacts supported by energy and geometry, not just visual similarity?
- Is the new system close enough to the mechanistic class for the pattern to apply?
- Are models, states, controls, and decision criteria documented clearly?
- Are new hypotheses labeled separately from established observations?

# Provenance

- Synthesized from cluster 14, subcluster 14.0 (computational-mechanistic-catalysis-organometallic-mechanism-discovery-workflow).
- Source skills: test1594 (additive-catalytic-mechanism-exploration), test1522 (catalytic-defunctionalization-mechanism-triangulation), test1845 (computational-radical-coupling-selectivity), test1453 (olefin-metathesis-mechanistic-design), test1851 (computational-metal-carbene-mechanism-exploration), test1837 (homogeneous-gold-enyne-mechanism-discovery), test0483 (directed-ch-functionalization-mechanism-exploration), test1810 (palladium-aromatic-fluorination-research-workflow).
