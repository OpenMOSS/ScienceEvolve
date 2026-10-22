---
name: sci-dft-directed-catalysis-method-coupling-mechanism-di-5750790d
description: A reusable end-to-end workflow for discovering and validating mechanisms in directed catalysis and synthetic method development, from hypothesis generation through iterative mechanistic discrimination and claim bounding.
scienceevolve-title: "Organometallic catalysis and DFT · directed catalysis method coupling mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Help an agent transform a mechanistic gap in directed catalysis or bond-forming methodology into a rigorous, reusable research workflow. The goal is to generate testable hypotheses, design minimal validation plans with discriminating controls, analyze evidence to differentiate competing mechanisms, and iterate until claims are appropriately bounded—without treating a single source system as field-wide consensus.

# When to use

Use this skill when:

- Designing new studies in directed catalysis, C–H functionalization, organometallic relay coupling, carbonyl-directed transformations, or related method development.
- The task requires mechanism-guided hypothesis generation, non-operational experimental design, or iterative model updating.
- Available evidence is limited to one or a few papers and must be separated from new agent inferences.
- The user needs a research plan, hypothesis map, or validation framework rather than executable protocols.

Do not use this skill for clinical recommendations, industrial scale-up, operational laboratory recipes, or high-risk chemical execution instructions.

# Inputs required

Before generating a plan, obtain or infer:

- **Target transformation class** and the specific bond-forming or selectivity challenge.
- **Known limitations** of direct routes (e.g., competing pathways, poor selectivity, uncontrolled activation).
- **Candidate mechanistic model**: proposed intermediates, activation modes, turnover steps, and selectivity-determining events.
- **Available evidence**: prior trends, mechanistic probes, computational predictions, and negative results.
- **Analytical constraints**: available structural, spectroscopic, kinetic, or stereochemical diagnostics.
- **Safety and ethical boundaries**: institutional oversight requirements and non-operational hazard considerations.

# Core Workflow

1. **Frame the mechanistic gap.**
   - Identify the synthetic bottleneck and the specific missing mechanistic object (intermediate, coordination mode, or selectivity control).
   - State why indirect evidence is insufficient.
   - *Decision gate:* If the gap is not falsifiable or lacks a diagnostic observable, stop and refine the research question.

2. **Generate competing hypotheses.**
   - Produce at least three hypotheses: target-access, alternative-state/context-dependence, and null (observable without the proposed intermediate).
   - For each, document: claim, mechanistic rationale, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted diagnostic observations, likely failure modes, and extrapolation boundary.
   - Distinguish paper-supported facts, analogy-supported inferences, and agent-generated speculations.
   - *Decision gate:* If no hypothesis can be discriminated by a feasible experiment, return to Step 1.

3. **Design minimal viable validation.**
   - Select a small conceptual matrix that tests the core mechanistic claim (e.g., catalyst/ligand class, directing motif, substrate electronics/sterics, redox environment).
   - Include: baseline case, challenging case, positive control (known benchmark), negative controls (omit catalyst, omit directing feature, omit turnover partner), orthogonal controls (distinguish alternative pathways), and mechanistic probes (stereochemical, isotopic, crossover, additive).
   - Predefine independent variables, dependent variables (product identity, selectivity, side-product profile, reproducibility), and stopping criteria.
   - *Decision gate:* If controls cannot separate the target pathway from background, redesign before proceeding.

4. **Execute and gather evidence (conceptual).**
   - Collect structural, spectroscopic, kinetic, and outcome data with orthogonal confirmation.
   - Maintain replication logic and account for blocking variables (reagent source, analyst, environmental exposure).
   - This skill provides research design only; actual execution requires qualified laboratory oversight.

5. **Analyze and discriminate mechanisms.**
   - Confirm product identity and connectivity before interpreting yield or selectivity.
   - Compare controls first: a result is mechanistically informative only if catalyst, ligand, directing-group, and redox controls separate the proposed pathway from background processes.
   - Use factor-level reasoning to map electronic, steric, coordination, and medium effects to proposed elementary steps.
   - Update evidence strength: increase confidence only when outcomes, controls, and mechanistic probes converge; decrease confidence if a single control explains the result.
   - *Decision gate:* If product identity is ambiguous, mass balance is unresolved, or controls are uninformative, stop and repair the analytical design.

6. **Classify and iterate.**
   - **Confirmed:** Outcome and controls support the proposed mechanism. Expand scope by one orthogonal axis and add the next discriminating mechanistic test.
   - **Partial:** Desired transformation occurs but selectivity or scope is limited. Redesign the controlling element (ligand, directing motif, substrate geometry) while preserving the mechanistic test.
   - **Ambiguous:** Outcome could arise from multiple mechanisms. Generate competing mechanisms and design the smallest experiment that distinguishes them; do not expand scope.
   - **Refuted:** Controls or probes contradict the hypothesis. Update or discard the hypothesis, identify the failed assumption, and return to Step 2.
   - *Stop conditions:* Halt if the desired transformation lacks mechanistic distinction from background, selectivity collapses with increasing substrate complexity, or results depend on uncontrolled variables.

7. **Bound claims and define scope.**
   - Explicitly separate demonstrated findings from inferred mechanisms and speculative extensions.
   - State the validated catalyst/substrate class and mark untested domains as outside scope.
   - Document boundary conditions where extrapolation may fail.

8. **Assess downstream utility (optional).**
   - Test synthetic value only after product formation and mechanism are established.
   - *Decision gate:* If utility does not differ meaningfully from known analogues, limit claims to mechanistic insight alone.

# Output Format

When using this skill, produce:

1. **Research question** — concise statement of the synthetic gap and why it matters.
2. **Evidence map** — separation of known observations, analogy-based inferences, and agent speculations.
3. **Ranked hypotheses** — table with claim, evidence strength, key assumptions, predicted diagnostic observations, and likely failure modes.
4. **Mechanistic model** — proposed catalytic-cycle bottleneck and control variables.
5. **Validation plan** — minimal viable matrix, controls, variables, primary/secondary metrics, and stop conditions.
6. **Analysis plan** — how to interpret outcomes, compare controls, and update confidence.
7. **Iteration plan** — decision rules for confirmed, partial, ambiguous, and refuted outcomes.
8. **Claim boundary statement** — scope limits and extrapolation warnings.
9. **Validity and safety notes** — confounders, reproducibility checks, and non-operational safety constraints.

# Validation Gates

- **Specificity gate:** The research question targets a specific mechanistic gap, not merely an underexplored area.
- **Discrimination gate:** Controls and probes can distinguish the proposed mechanism from background and at least one plausible alternative.
- **Structural gate:** Product identity and connectivity are confirmed by orthogonal evidence before mechanistic interpretation.
- **Reproducibility gate:** Central claims require repeated observations or independent confirmation.
- **Scope gate:** Substrate scope is used to test boundaries, not to claim broad generality from a narrow set.

# Claim Boundaries

- Paper-supported findings are limited to the source system; they are not presented as field consensus.
- Agent-inferred hypotheses are labeled with evidence strength and remain provisional until validated.
- Mechanistic claims are restricted to the tested catalyst class, substrate class, and reaction manifold.
- Product formation alone does not constitute proof of a proposed intermediate or pathway.
- Downstream synthetic utility is claimed only when demonstrated beyond analogy.

# Failure Modes

- **Indistinguishable pathways:** Target mechanism cannot be separated from background or alternative routes. *Response:* Redesign discriminating controls or mechanistic probes.
- **Analytical ambiguity:** Product identity or selectivity is uncertain. *Response:* Halt interpretation and obtain orthogonal structural evidence.
- **Narrow scope success:** Method works only for an unusually reactive substrate class without a generality argument. *Response:* Define the boundary explicitly and avoid broad claims.
- **Control failure:** Negative or orthogonal controls produce the same outcome as the proposed pathway. *Response:* Revisit the mechanistic model and test for nonspecific reactivity.
- **Uncontrolled variables:** Results depend on unreported factors (reagent quality, environmental exposure). *Response:* Introduce blocking variables and replication.
- **Safety blocker:** Proposed validation requires hazardous execution beyond approved oversight. *Response:* Redesign the conceptual plan or escalate to qualified reviewers.

# Validity Checks

Before presenting a plan, verify:

- Are source-paper findings clearly separated from new hypotheses?
- Does the plan include positive, negative, orthogonal, and mechanistic controls?
- Are confounding factors (impurities, decomposition, isomerization, ligand exchange) considered?
- Are replicates, uncertainty estimates, and blinded analysis addressed where appropriate?
- Are analytical methods sufficient for independent verification?
- Does the plan identify substrate, catalyst, and mechanistic assumptions where extrapolation may fail?
- Is every failure mode linked to a diagnostic control or model revision?
- Are hazardous reagents and operations treated as requiring qualified institutional oversight?

# Provenance

- Synthesized from cluster 10.0 (directed-catalysis-method-coupling-mechanism-discovery-workflow).
- Source skills: test1201 (cobalt-directed-ch-alkylation-research-design), test1525 (synthetic-method-discovery-c-h-carbonylation), test0101 (gold-allenyl-mechanistic-exploration), test0118 (mechanism-guided-selective-catalysis-exploration), test1474 (rhodium-metalacycle-relay-azocane-methodology), test1338 (carbonyl-directed-catalysis-discovery), test0968 (organometallic-relay-coupling-discovery), test0705 (mechanism-guided-silylene-capture-skill).
