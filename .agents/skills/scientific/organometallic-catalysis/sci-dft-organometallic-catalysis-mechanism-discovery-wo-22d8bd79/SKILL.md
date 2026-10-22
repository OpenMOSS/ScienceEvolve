---
name: sci-dft-organometallic-catalysis-mechanism-discovery-wo-22d8bd79
description: A reusable end-to-end workflow for discovering and validating catalytic mechanisms in organometallic and transition-metal chemistry through hypothesis generation, controlled discrimination experiments, and iterative model refinement.
scienceevolve-title: "Organometallic catalysis and DFT · organometallic catalysis mechanism discovery workflow 2"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

This skill guides the design of reusable, mechanism-first research plans for transition-metal and organometallic catalysis. It converts a synthetic or selectivity gap into a structured program of hypothesis generation, minimal validation, multi-stream evidence integration, and iterative model refinement. The workflow is intended for research planning and methodological reasoning, not for reproducing specific literature systems or providing executable laboratory protocols.

# When to use

Use this skill when:

- The user asks to propose new research questions in catalytic reaction discovery, selectivity control, or mechanistic validation.
- The project involves transition-metal-mediated bond activation, insertion, cyclization, coupling, or related elementary-step networks.
- The agent must reason about competing productive and nonproductive pathways, catalyst speciation, ligand effects, or substrate-controlled branching.
- The user needs a controlled plan with explicit variables, controls, evaluation metrics, failure criteria, and iteration rules.
- The goal is to generalize a mechanistic principle rather than copy a known substrate-catalyst combination.

Do not use this skill for unbounded reaction execution, clinical or toxicological claims, scale-up engineering, or hazardous operational optimization.

# Inputs required

Before generating a plan, collect or request:

- Target transformation class, desired product architecture, and the synthetic or mechanistic gap motivating the study.
- Candidate substrate concepts, including activation handles, tethering logic, substitution patterns, and functional-group compatibility concerns.
- Candidate catalyst concepts, including metal class, ligand environment, and expected mechanistic roles.
- Known competing pathways, likely side reactions, and prior failed transformations.
- Available analytical capabilities for structural assignment, stereochemical assessment, kinetic profiling, and mechanistic interrogation.
- Safety, environmental, regulatory, and resource constraints.
- Decision thresholds for stopping, revising, or escalating the research plan.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

## Phase 1: Frame the gap and abstract the mechanistic platform
1. Define the synthetic or selectivity gap: identify why existing approaches are insufficient (e.g., poor regio- or stereocontrol, limited scope, harsh conditions).
2. Abstract transferable mechanistic handles from known chemistry: substrate coordination, insertion geometry, ligand sterics/electronics, elementary-step sequences, and off-cycle traps.
3. Map credible competing pathways (productive cyclization, elimination, isomerization, decomposition, background reaction).
4. **Decision Gate 1:** Is the gap addressable through a testable mechanistic variable? If no, stop and reframe the research question.

## Phase 2: Generate and rank hypotheses
1. Formulate falsifiable hypotheses for:
   - Pathway control (which elementary step determines selectivity).
   - Catalyst/substrate matching (which metal-ligand or substrate feature biases the branch point).
   - Scope boundaries (where the mechanism is expected to survive or fail).
2. For each hypothesis, record:
   - Evidence strength (low / medium / high).
   - Key assumptions.
   - Likely failure modes.
   - Boundary conditions for extrapolation.
3. Prioritize hypotheses that can reject at least one competing mechanism with the smallest diagnostic set.
4. **Decision Gate 2:** Do the top hypotheses have discriminating tests? If no, return to Phase 1.

## Phase 3: Design minimal validation and control architecture
1. Define a minimal validation set that varies one mechanistic variable at a time.
2. Specify a control panel:
   - Negative controls (omit catalyst, omit key substrate feature, or disable the proposed activation mode).
   - Positive / benchmark controls (known productive system for relative comparison only).
   - Mechanistic controls (probes expected to distinguish insertion, elimination, isomerization, or coordination pathways).
3. Define primary metrics (product identity, conversion, regio-/stereo-/enantioselectivity, product distribution).
4. Define secondary metrics (substrate recovery, byproduct classes, catalyst stability, mass balance, reproducibility).
5. Predefine stop conditions (ambiguous product identity, irreproducible selectivity, dominant side reactions, controls contradicting the mechanism, safety constraints).
6. **Decision Gate 3:** Is the plan safe to investigate conceptually and are controls sufficient? If no, redesign before proceeding.

## Phase 4: Run discrimination experiments (conceptual)
1. Execute the minimal validation set and controls.
2. Collect orthogonal evidence streams (product distribution, stereochemical outcome, kinetic trends, spectroscopic or isotopic probes, computational comparisons).
3. **Decision Gate 4:** Are controls behaving as expected and are products unambiguously assigned? If no, pause to resolve analytical or methodological issues.

## Phase 5: Analyze and triangulate mechanism
1. Confirm product structure before interpreting selectivity.
2. Classify outcomes by pathway (productive, alternative, decomposition, unreacted).
3. Compare perturbation effects against predictions.
4. Integrate evidence streams; check whether alternative pathways could explain the same data.
5. Quantify uncertainty (experimental variability, analytical ambiguity, substrate-specific effects, model error).
6. **Decision Gate 5:** Does evidence converge on a falsifiable model? If ambiguous, design an orthogonal probe and return to Phase 3. If contradictory, revise the mechanism map and return to Phase 2.

## Phase 6: Validate model and define boundaries
1. Test predictions on a small boundary panel (electronic, steric, or structural variants).
2. Confirm reproducibility and mass balance.
3. **Decision Gate 6:** Does the model hold across the boundary panel with acceptable uncertainty? If yes, proceed to limited scope expansion or reporting. If no, narrow claim boundaries and iterate.

## Phase 7: Iterate or terminate
1. If validated: propose limited scope expansion or downstream utility tests, changing one variable at a time.
2. If invalidated: return to Phase 2 to revise hypotheses or Phase 1 to reframe the gap.
3. **Termination conditions:** Irreproducible results, ambiguous product identity, dominant side reactions, controls contradict the mechanism, or resource/safety limits reached.

# Output Format

When using this skill, produce:

1. **Research question:** A concise mechanistic or synthetic question and the gap it addresses.
2. **Mechanistic premise:** Abstracted causal chain and competing pathways.
3. **Ranked hypothesis table:** Each hypothesis with mechanistic claim, evidence strength, key assumptions, predicted observable, likely failure mode, and boundary.
4. **Minimal validation plan:** Variables, controls, primary and secondary metrics, and stop conditions.
5. **Analysis plan:** How results will be classified, triangulated, and checked against alternatives, including uncertainty handling.
6. **Iteration/termination decision map:** Result patterns that trigger scope expansion, mechanism revision, or study termination.
7. **Validity and safety checklist:** Boundary conditions, reproducibility concerns, and domain-specific guardrails.

# Validation Gates

- **Mechanistic clarity:** Each hypothesis must identify a selectivity-determining step, branch point, or pathway exclusion.
- **Control adequacy:** The plan must distinguish catalysis from background reaction, substrate bias, ligand effects, and side reactions.
- **Evidence separation:** Source-paper or literature observations must be clearly separated from new agent inferences.
- **Analytical validity:** Product structures, isomer ratios, and stereochemical assignments require orthogonal supporting evidence.
- **Reproducibility:** Key claims require repeated measurements or independent validation.
- **Scope discipline:** The plan must avoid treating one substrate class or one ligand success as evidence for broad generality.
- **Boundary conditions:** Explicitly state substrate classes, ligand classes, and mechanistic assumptions where extrapolation may fail.

# Claim Boundaries

- Distinguish verified precedent, computational inference, and agent-generated speculation.
- Limit mechanistic claims to the tested catalyst, substrate, and medium classes.
- Do not treat single-system success as consensus for the broader reaction family.
- Evaluate product formation, selectivity, mechanism, and downstream utility as separate claims.
- Label any extrapolation beyond the validated design space as provisional.

# Failure Modes

- Unproductive side reactions or catalyst deactivation that obscure the desired pathway.
- Competing pathways (e.g., insertion, elimination, isomerization, background reaction) producing overlapping outcomes.
- Weak or misleading regio-, diastereo-, or enantioselectivity due to substrate bias or nonselective background.
- Product misassignment or analytical ambiguity, especially with isomers or rearranged products.
- Overfitting conclusions to one favorable substrate, ligand, or condition.
- False extrapolation beyond the mechanistic boundary of the validated system.

# Validity Checks

- **Confounding:** Distinguish true catalysis from background transformation, substrate decomposition, or analytical artifacts.
- **Reproducibility:** Require independent repeats for claims of yield, selectivity, or mechanism.
- **Statistical and ranking validity:** Ensure observed differences exceed expected method uncertainty; check ranking stability under sensitivity analyses.
- **Computational validity (if applicable):** Use consistent reference states, realistic ligand/spin/solvent treatments, and comparison with alternative pathways.
- **Mechanistic sufficiency:** Require at least two independent evidence lines before proposing a detailed catalytic cycle.
- **Safety and ethics:** Avoid operational hazardous details; defer execution decisions to qualified experts and institutional safety review.

# Provenance

- Synthesized from cluster 11.0 (catalysis-organometallic-transition-catalytic-mechanism-discovery).
- Source skills: test0509, test0111, test0460, test1781, test0353, test1009, test1471, test1797.
- Paper-derived mechanistic patterns have been abstracted into a domain-general workflow. No specific operational protocols, numerical results, or paper conclusions are retained in the reusable body.
