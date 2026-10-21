---
name: sci-catalysis-asymmetric-chiral-catalysis-mechanism-dis-b6cdcf6b
description: A reusable end-to-end workflow for discovering and validating mechanisms in asymmetric chiral catalysis, from gap definition and competing-hypothesis generation through minimal validation design, mechanistic discrimination, and iterative claim bounding.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide agents to design, validate, and iterate mechanistic hypotheses for new asymmetric catalytic methods without reproducing paper-specific systems or providing operational procedures. The workflow emphasizes distinguishing enantiodetermining events from background pathways, bounding claims by evidence, and using failure modes to refine models.

# When to use

Use this skill when:

- The user seeks to propose a new asymmetric catalytic method or understand the stereocontrolling step of a proposed transformation.
- The task is to design a non-operational research plan involving chiral ligands, metal catalysts, biocatalysts, or organocatalysts.
- Mechanistic ambiguity exists about which bond-forming event, intermediate, or transition state controls stereochemistry.
- Evaluating scope, robustness, or platform utility of a stereoselective transformation.

Do not use this skill for clinical recommendations, executable synthesis protocols, safety-critical operations, or reproducing specific published conditions.

# Inputs required

Ask the user or environment to provide:

- Target transformation class and desired stereochemical outcome (e.g., enantioselective, diastereoselective, atroposelective, P-stereogenic).
- Candidate catalyst/ligand/chiral environment concepts and known precedents.
- Substrate or precursor classes with key electronic, steric, or coordinating features.
- Proposed reactive intermediates and the step hypothesized to set stereochemistry.
- Available analytical capabilities for product identity, selectivity quantification, and mechanistic probing.
- Constraints: safety, regulatory, material availability, and facility boundaries.

If inputs are missing, state assumptions explicitly and label all downstream hypotheses as provisional.

# Core Workflow

1. **Gap Definition & Mechanistic Framing**
   - Identify the synthetic or mechanistic gap by comparing established enantiodetermining modes with underexplored disconnections or intermediate logic.
   - Define the stereochemical operation: creation, transfer, resolution, or retention of chirality at carbon, phosphorus, sulfur, nitrogen, or an axial element.
   - State the proposed enantiodetermining event and at least one competing pathway.

2. **Hypothesis Generation & Ranking**
   - Generate 2–4 competing mechanistic hypotheses. For each, specify:
     - The stereocontrolling step (e.g., coordination, insertion, trapping, bond-forming).
     - Evidence strength (high / moderate / low / speculative).
     - Key assumptions and most likely failure mode.
     - Minimal observation that would support or falsify it.
   - Rank by decisiveness: prefer hypotheses distinguishable by controls, labeling, or selectivity trends.

3. **Minimal Validation Design**
   - Select one benchmark substrate and one benchmark reaction partner that directly test the proposed stereocontrolling event.
   - Define variables to isolate one mechanistic factor at a time: catalyst class, ligand architecture, substrate electronics/sterics, precursor activation mode, or coupling partner class.
   - Establish evaluation metrics: product formation above background, selectivity relative to achiral control, reproducibility, and mass balance.
   - **Decision Gate 1 (Feasibility):** If no product forms above background controls, stop and revise the activation or intermediate-access hypothesis.

4. **Control & Probe Architecture**
   - **Negative controls:** omit or disable the chiral catalyst, metal center, directing group, or key reagent to quantify background.
   - **Positive controls:** include a known transformation or analytical standard to verify detection and stereochemical assignment.
   - **Mechanistic probes:** design isotope/labeling experiments, crossover studies, radical clocks, catalyst-enantiomer comparisons, or intermediate-trapping experiments to distinguish competing pathways.
   - **Boundary controls:** test steric/electronic extremes or substrate classes predicted to fail.
   - **Decision Gate 2 (Stereocontrol):** If selectivity is indistinguishable from the achiral or background control, stop and revise the chiral-environment or binding-orientation hypothesis.

5. **Execution & Data Collection (Conceptual)**
   - Collect conversion, yield proxy, regio-/diastereo-/enantioselectivity, and side-product profiles.
   - Record reaction-profile data where needed to distinguish kinetic resolution from dynamic processes.
   - Confirm product identity by orthogonal characterization before interpreting selectivity.

6. **Mechanism Discrimination & Analysis**
   - Compare full-system results against all controls. Attribute outcomes to the proposed pathway only when negative controls are inert or clearly lower-yielding/lower-selectivity.
   - Integrate probe results: each piece of evidence should support or weaken specific hypotheses; do not rely on a single probe as proof.
   - Classify substrate effects by structural axes (electronic, steric, tether geometry, heteroatom) to infer which step is limiting.
   - **Decision Gate 3 (Consistency):** If mechanistic probes contradict the proposed enantiodetermining step, revise the order of events or ligand-substrate interaction model before expanding scope.

7. **Scope Mapping & Robustness Check**
   - Expand systematically along one structural axis at a time.
   - Treat failed substrates as boundary evidence, not noise. Group failures by likely cause: poor activation, competing elimination, nonselective trapping, product instability, or racemization.
   - Assess configurational stability of enantioenriched products or intermediates under handling and downstream conditions.
   - **Decision Gate 4 (Boundary):** If scope collapses outside a narrow class, bound the claim to tested substrates and generate a new discriminating hypothesis.

8. **Iteration or Redesign**
   - **No product / low conversion:** Verify detection, then test precursor activation, catalyst binding, or substrate compatibility.
   - **Low selectivity:** Distinguish background reaction, weak chiral recognition, poor binding orientation, and product racemization.
   - **Ambiguous mechanism:** Add orthogonal probes; avoid claiming a single pathway until multiple observations converge.
   - **Narrow scope:** Convert boundary cases into steric/electronic/coordination rules.
   - **Stop condition:** Stop iterating when repeated redesigns do not improve primary metrics, when safety/compliance constraints are unsatisfied, or when analytical uncertainty is comparable to the observed effect.

9. **Claim Bounding & Documentation**
   - Separate observations (what was detected), inferences (what likely caused the trend), and recommendations (next test).
   - Label each claim as supported by prior literature, supported by the current validation, or speculative extrapolation.
   - Define explicit boundary conditions: tested substrate classes, catalyst/ligand families, and stability regimes.

# Output Format

When using this skill, produce:

1. **Research question and gap** — concise statement of the stereochemical or mechanistic problem.
2. **Ranked hypotheses table** — hypothesis, evidence strength, key assumptions, predicted observations, likely failure mode, and falsification criterion.
3. **Validation plan** — benchmark, variables, controls (negative, positive, mechanistic, boundary), metrics, and stop conditions.
4. **Analysis summary** — control comparisons, probe interpretations, substrate classification, and mechanistic update.
5. **Scope and robustness statement** — verified substrate classes, boundary limits, stability assessment, and reproducibility status.
6. **Iteration roadmap** — next discriminating experiment or stop decision based on current evidence.
7. **Validity and safety notes** — confounders, reproducibility requirements, non-operational constraints, and ethical boundaries.

# Validation Gates

- **Analytical validity:** Product identity and stereochemical assignment must be confirmed by independent measurements before selectivity claims.
- **Control validity:** Full-system outcomes must exceed relevant negative/background controls in both activity and selectivity.
- **Mechanistic validity:** At least two independent observations (e.g., selectivity trend plus probe experiment) must converge before assigning an enantiodetermining mechanism.
- **Reproducibility:** Key outcomes must be replicated or supported by independent readouts; single-batch anomalies must be flagged.
- **Statistical validity:** Scope claims require representative data across planned structural axes, not isolated examples.

# Claim Boundaries

- Limit stereocontrol claims to the tested catalyst/ligand class, substrate class, and reaction environment.
- Distinguish kinetic resolution from dynamic kinetic resolution using reaction-profile evidence.
- Do not generalize from a single successful substrate or one paper’s system to field-wide consensus.
- Treat downstream utility as evidence of platform value, not proof of broad generality.
- Avoid clinical, therapeutic, or biological efficacy claims.

# Failure Modes

- **Background domination:** Product formation is indistinguishable from catalyst-free or achiral controls.
- **Stereochemical erosion:** Racemization, substrate-controlled bias, or analytical artifacts masquerade as catalyst-controlled selectivity.
- **Intermediate misassignment:** Proposed reactive intermediate is not on the productive pathway or decomposes nonselectively.
- **Scope collapse:** Selectivity or reactivity disappears outside a narrow substrate class due to unanticipated steric/electronic boundaries.
- **Instability gate failure:** Enantioenriched intermediates or products racemize under required handling or transformation conditions.
- **Probe ambiguity:** A single mechanistic probe supports multiple incompatible pathways or is confounded by side reactions.

# Validity Checks

- Are confounding factors (impurities, incomplete conversion, catalyst deactivation, product racemization, analytical overlap) addressed?
- Is the chiral information clearly linked to the catalyst/environment rather than substrate bias?
- Are negative results reported and used to define boundaries?
- Are paper-supported patterns distinguished from agent-generated inferences?
- Does the plan remain non-operational and free of executable hazardous parameters?
- Are safety, environmental, and compliance constraints stated?

# Provenance

- Synthesized from cluster 15 / subcluster 15.1 (asymmetric-chiral-catalysis-method-mechanism-discovery-workflow).
- Source-skill references: asymmetric-reductive-difunctionalization-workflow; chiral-reactive-intermediate-asymmetric-methodology; hemoprotein-stable-carbene-precursor-discovery; p-chiral-phosphorus-research-design; directing-group-atroposelective-ch-functionalization; chiral-ligand-asymmetric-catalysis-exploration; asymmetric-catalysis-cascade-rearrangement-explorer; phosphinamidate-platform-exploration.
- Paper-specific conclusions, numerical results, and operational protocols have been excluded.
