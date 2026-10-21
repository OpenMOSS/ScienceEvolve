---
name: sci-immune-binder-evolution-developability-workflow-677b0f1b
description: End-to-end research workflow for stress-gated functional selection and iterative affinity maturation of protein binders, emphasizing mechanism discovery and developability validation.
scienceevolve-title: "Antibody and immune recognition · binder evolution developability workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help agents generate reusable, non-clinical research plans for evolving protein binders toward improved developability. The workflow abstracts an observable-driven mechanism-discovery loop: identify a developability bottleneck, generate modular mechanistic hypotheses, design comparative validation with orthogonal readouts, and iterate until the binder meets functional and developability criteria or the hypothesis is falsified.

## When to use

Use this skill when:

- Designing binder discovery or maturation studies where selection, expression, stability, specificity, or manufacturability is limiting.
- Comparing display, selection, linker, conjugation-site, or scaffold strategies for molecular recognition.
- Generating hypotheses about why a binder fails functional or developability gates.
- Planning iterative rounds that separate binding affinity from avidity, expression yield from product quality, or in vitro behavior from in vivo disposition.
- Evaluating whether a published method pattern transfers to a new target or scaffold class.

Do not use for clinical recommendations, operational wet-lab protocols, therapeutic dosing, or high-risk biological execution.

## Inputs required

Before producing a plan, ask for or explicitly assume:

- **Target biology and intended binder class:** the molecular target and the type of recognition molecule being engineered.
- **Current bottleneck:** e.g., low affinity, poor specificity, weak expression, aggregation, instability, or off-target retention.
- **Available modular components:** scaffold, linker, display system, host expression system, or conjugation chemistry, described generically.
- **Prior evidence:** binding data, enrichment histories, structural models, expression readouts, or literature patterns.
- **Constraints:** safety, ethics, biosafety level, regulatory boundaries, and available assay categories.
- **Success and failure criteria:** thresholds for advancing, holding, or rejecting candidates.

If inputs are missing, state assumptions and reduce evidence strength accordingly.

## Core Workflow

1. **Frame the developability bottleneck**
   - Define the gap: e.g., affinity, specificity, expression, stability, or manufacturability.
   - Decompose the binder system into modular axes: target engagement, scaffold architecture, display/selection context, host expression, linker/conjugation site, and physicochemical behavior.
   - **Gate 1 — Observability:** Confirm the bottleneck is measurable with available readouts. If not, refine metrics before proceeding.

2. **Generate modular mechanistic hypotheses**
   - For each axis, propose a mechanistic claim, predicted observation pattern, evidence strength (high/medium/low/speculative), key assumptions, and failure modes.
   - Label claims as paper-supported pattern, agent inference, or speculative extension.
   - Prioritize hypotheses by leverage, testability, and safety.
   - **Gate 2 — Falsifiability:** Ensure the leading hypotheses can be distinguished by the proposed comparative design. If not, redesign the variable panel.

3. **Design minimal viable validation (MVV)**
   - Select the smallest set of comparative arms needed to test the leading hypothesis: baseline, intervention, mechanism-test, and boundary-test.
   - Define controls: negative (non-target/non-binding), positive (established binder), process, and orthogonal.
   - Choose readouts that separate mechanisms: binding/specificity, functional activity, expression/quality, oligomeric/aggregation state, and developability proxies.
   - Predefine decision rules and stop conditions.
   - **Stop:** If matched controls are infeasible or the baseline is unmeasurable, halt and repair assay validity.

4. **Apply stress-gated functional selection**
   - Introduce selective pressure (e.g., stringency, functional gate, or environmental stress) to enrich for candidates that satisfy the hypothesis.
   - Monitor enrichment, recovery, and background across independent replicates.
   - **Gate 3 — Control validity:** Confirm negative/positive/process controls behave as expected. If not, suspend interpretation.

5. **Collect orthogonal evidence**
   - Gather independent readouts across all arms: transcript/protein levels if expression is tested; binding kinetics and specificity if affinity is tested; oligomeric state and stability if architecture is tested; clearance/retention if disposition is tested.
   - Record batch structure, replicate consistency, and exclusions.
   - **Gate 4 — Data quality:** Pass only if raw-data completeness, replicate consistency, and assay linearity are acceptable.

6. **Discriminate mechanisms**
   - Classify observed patterns:
     - Binding and function align → support specific target engagement.
     - Binding high but function low → suggest avidity, aggregation, or non-functional epitope.
     - Expression low with transcript low → transcriptional limit.
     - Expression low with transcript normal → translational/folding limit.
     - Enrichment high but diversity collapsed → selection artifact or clone dominance.
     - In vitro success but in vivo failure → stability, clearance, or retention bottleneck.
   - Compare effect sizes with uncertainty intervals.
   - **Gate 5 — Mechanistic coherence:** Advance only if orthogonal readouts agree on mechanism direction. If discordant, treat as ambiguous and refine controls.

7. **Iterate or terminate**
   - **Advance:** Promote candidate to the next developability gate if criteria are met.
   - **Refine:** If the effect is context-dependent, narrow boundary conditions and design a more specific perturbation.
   - **Reject:** If controls contradict the prediction or the failure mode is confirmed, retire the hypothesis and return to Stage 2.
   - **Combine:** Combine modular improvements only after individual effects are attributable; otherwise epistasis is uninterpretable.
   - **Stop conditions:**
     - Candidate meets predefined developability thresholds (affinity, specificity, expression, stability, or clearance).
     - Hypothesis is falsified and no viable alternative remains.
     - Diversity collapses or controls repeatedly fail.
     - Further iteration yields diminishing mechanistic insight or unacceptable trade-offs.

8. **Bound claims and finalize**
   - Limit conclusions to the tested target-scaffold-host-assay context.
   - Require independent replication before generalizing beyond the current system.
   - Document the evidence ladder and residual uncertainty.

## Output Format

When using this skill, return:

1. **Research question and bottleneck framing** — the gap and why it matters.
2. **Mechanistic hypothesis table** — claim, evidence strength, key assumptions, predicted observations, and failure modes.
3. **Experimental design schema** — arms, controls, readouts, decision rules, and stop conditions.
4. **Analysis plan** — mechanism discrimination rules, visualization approach, and uncertainty reporting.
5. **Iteration plan** — advance/refine/reject logic for each major outcome.
6. **Validity and ethics summary** — confounders, reproducibility requirements, safety boundaries, and generalization limits.

## Validation Gates

- **Gate 1 (Observability):** The bottleneck is measurable with available readouts.
- **Gate 2 (Falsifiability):** Hypotheses can be distinguished by the proposed design.
- **Gate 3 (Control validity):** Negative, positive, and process controls show expected behavior.
- **Gate 4 (Data quality):** Raw data are complete, replicates are consistent, and assays are within linear range.
- **Gate 5 (Mechanistic coherence):** Orthogonal readouts agree on mechanism direction.
- **Gate 6 (Developability threshold):** The candidate meets predefined success criteria for the intended use context.

## Claim Boundaries

- Distinguish paper-supported patterns from agent inferences and speculative extensions.
- Restrict claims to the specific target, scaffold, host, assay format, and selection context tested.
- Do not present single-study or single-candidate results as field consensus.
- Separate binding validation from functional validation, and in vitro evidence from in vivo predictions.
- Avoid clinical, therapeutic, or diagnostic claims.

## Failure Modes

- **Assay artifact:** Signal derives from aggregation, avidity, matrix effect, or saturation rather than specific binding.
- **Mechanistic misattribution:** An expression or stability effect is mistaken for an affinity effect due to insufficient readouts.
- **Selection artifact:** Enrichment is driven by host fitness, display bias, or background binding rather than target engagement.
- **Context overfitting:** A rule learned in one scaffold-linker-host combination fails in another.
- **Hypothesis drift:** Combining modules before individual effects are established, leading to uninterpretable epistasis.
- **Translational disconnect:** In vitro cleavage, binding, or expression success does not translate to in vivo or manufacturing behavior.

## Validity Checks

- **Confounding:** Are construct architecture, copy number, host state, measurement timing, and assay saturation controlled?
- **Specificity:** Are off-target homologs, irrelevant targets, and non-binding controls included?
- **Orthogonality:** Do at least two independent readouts test the same mechanism?
- **Reproducibility:** Are there independent biological or technical replicates and consistent data processing?
- **Statistical validity:** Are effect sizes, uncertainty, multiple comparisons, and power reported?
- **Structural plausibility:** Do models support the proposed interface or architecture without replacing experimental validation?
- **Boundary testing:** Does the design include candidates that could falsify the emerging rule?
- **Safety and ethics:** Are biosafety, institutional review, and dual-use risks addressed?

## Provenance

- Derived from cluster 29 / subcluster 29.1.split0 (binder-evolution-developability-workflow).
- Synthesized from representative source skills: mammalian-cell-expression-optimization-research, phage-display-biopanning-method-skill, piii-phage-display-research-pattern, antibody-target-binding-discovery-workflow, antibody-epitope-research-workflow, adc-site-optimization-research-workflow, antibody-fragment-linker-workflow, radioimmunoconjugate-linker-metabolism-exploration.
- Excluded skill IDs: 0996a3e528b60cde, 0ef9bf6775a27517, 13c97c2b7c08eea9, 3250b0a7f780c73e, 5687e19535397f1f, 69e395374e05bbaa, af79f4f35f9ea7b1.
