---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-fa380aa8
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing controlled validation studies, and iterating on multifunctional material systems from observable bottlenecks.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 4"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an observed functional bottleneck in a complex material system into a rigorous, non-operational mechanism-discovery and validation program. It guides the agent through bottleneck decomposition, falsifiable hypothesis generation, control-centric study design, multi-modal evidence chain analysis, claim bounding, and iterative refinement—without prescribing specific materials, numerical parameters, or procedural details.

# When to use

Use this skill when the user needs to:

- Propose new research questions for multifunctional material systems limited by coupled structural, chemical, interfacial, or transport phenomena.
- Design controlled studies to discriminate between competing mechanisms in composites, fibers, scaffolds, battery components, or related multiphase platforms.
- Validate a mechanism hypothesis through orthogonal evidence chains and strong controls.
- Iterate from incomplete or contradictory results by updating the causal model rather than optimizing isolated metrics.

Do not use this skill to:

- Provide operational recipes, fabrication parameters, or executable laboratory protocols.
- Offer application-specific safety certification, clinical guidance, or regulatory approval advice.
- Replace domain-expert review for hazardous materials, biological safety, or large-scale deployment decisions.

# Inputs required

Before producing a research plan, identify or request:

- **Observable bottleneck:** The specific failure mode or performance limitation.
- **System decomposition:** Components, phases, interfaces, and known compatibility issues.
- **Candidate design levers:** Architecture, chemistry, surface modification, or processing motifs under consideration.
- **Available evidence:** Prior literature, preliminary data, or known controls in the same material class.
- **Characterization and testing capabilities:** Modalities accessible for structure, chemistry, transport, kinetics, performance, and reliability assessment.
- **Constraints:** Safety, ethical, environmental, regulatory, equipment, and acceptable tradeoff limits.

# Core Workflow

1. **Bottleneck Decomposition & Observable Definition**
   - Define the specific observable limitation as a failure mode rather than a broad aspiration.
   - Decompose the system into coupled components and interfaces. Identify candidate sub-mechanisms (structural, chemical, interfacial, transport, mechanical) that could plausibly cause the bottleneck.
   - **Gate:** If the bottleneck cannot be linked to at least one candidate design lever or location of action, stop and request more system-specific inputs.

2. **Mechanism-Coupled Hypothesis Generation**
   - Produce at least three falsifiable hypotheses using the template: *If [design lever] is applied at [location], then [mechanism] should produce [observable signature] while respecting [tradeoff constraint].*
   - For each hypothesis, specify: evidence strength (strong / moderate / weak / speculative), key assumptions, predicted orthogonal signatures, likely failure modes, and the minimum observation that would falsify it.
   - **Gate:** If hypotheses overlap in mechanism or cannot be distinguished by available diagnostics, refine or merge them before proceeding.

3. **Control-Centric Study Design**
   - Define independent variables (design lever, location, architecture), dependent variables (mechanism-specific and functional outcomes), and controlled variables (processing, geometry, environment, batch).
   - Assemble a control hierarchy: baseline, negative/inactive analogue, process blank, mechanism-isolation controls (architecture-only, chemistry-only, transport-only), and positive benchmark when available.
   - Specify minimal viable validation (smallest controlled test that can falsify the hypothesis) and strong validation (boundary tests, independent batches, realistic configurations).
   - **Gate:** If the control set cannot isolate the proposed mechanism from confounders (e.g., loading, thickness, interfacial contact, batch variability), redesign before any data collection.

4. **Multi-Modal Evidence Acquisition**
   - Acquire orthogonal evidence streams mapped to mechanism layers (structural integrity, chemical state, interfacial behavior, kinetic/transport response, functional performance, reliability/safety indicators).
   - Record controlled conditions and any deviations.
   - **Gate:** If evidence relies on a single modality or lacks pre-registered measurement protocols, flag as insufficient for mechanism discrimination.

5. **Mechanism Discrimination & Evidence Chain Analysis**
   - Map each evidence stream to the hypothesis portfolio. Require converging support from at least two orthogonal streams before accepting a mechanism.
   - Classify each hypothesis as: strongly supported, moderately supported, weakly supported, unsupported, or not transferable.
   - Check causal attribution: do stepwise controls support that the design lever caused the change, or could confounders explain it?
   - **Gate:** If mechanism evidence is absent or contradictory despite functional improvement, halt claims and return to Step 3 to add isolation controls or to Step 2 to reformulate.

6. **Claim Bounding & Robustness Checking**
   - Bound all claims to the tested system, conditions, and measurement context. Separate directly observed evidence from inferred mechanism and from literature extrapolation.
   - Evaluate tradeoffs: verify that gains in the target metric do not introduce unacceptable losses in others (mechanical, safety, durability, processability).
   - Define the valid domain and state where extrapolation is unsupported.
   - **Gate:** If claims extend beyond the validated domain or tradeoffs are unresolved, trim the claims before communication.

7. **Iteration or Program Exit**
   - **If strongly supported:** escalate to boundary testing (higher stress, different architecture, more realistic configuration) and update the hypothesis to include limiting conditions.
   - **If ambiguous:** add orthogonal diagnostics, tighten controls, or test alternative mechanisms.
   - **If unsupported or falsified:** return to Step 2 to generate revised hypotheses or to Step 1 to reframe the bottleneck.
   - **Stop conditions:**
     - The design fails minimal viable validation.
     - Performance gains disappear under strong controls.
     - Results are irreproducible across independent batches or replicates.
     - Safety, ethical, or compliance boundaries are breached.
     - Claims are successfully bounded and boundary tests confirm robustness.

# Output Format

When using this skill, produce:

1. **Research question and bottleneck map** — The observable limitation, decomposed sub-mechanisms, and targeted design lever.
2. **Ranked hypotheses table** — For each hypothesis: mechanism, evidence strength, key assumptions, predicted orthogonal signatures, likely failure modes, and falsification criteria.
3. **Study design** — Independent, dependent, and controlled variables; control hierarchy (baseline, negative, mechanism-isolation, positive); minimal viable validation plan; strong validation plan; and predefined stop conditions.
4. **Evidence chain and mechanism discrimination summary** — Mapping of orthogonal evidence streams to hypotheses, classification of support level, and causal attribution reasoning.
5. **Claim boundary statement** — Explicit limits on what is observed, inferred, extrapolated, and unsupported.
6. **Iteration roadmap** — Rules for continuing, revising, or stopping based on evidence patterns.
7. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, and ethical/compliance constraints.

# Validation Gates

Before advancing past each major stage, verify:

- **Bottleneck specificity:** The limitation is defined as an observable failure mode, not a general performance gap.
- **Hypothesis isolation:** Each hypothesis targets a distinct mechanism and includes falsification criteria.
- **Control adequacy:** The design includes baseline, negative, and mechanism-isolation controls capable of distinguishing the proposed cause from confounders.
- **Orthogonality:** At least two independent evidence streams are planned to support each mechanism claim.
- **Reproducibility:** Independent batches, replicates, or repeated preparations are included, with variability reported.
- **Tradeoff scrutiny:** Gains in the target metric are weighed against losses in coupled properties.
- **Safety and ethics:** All proposed work remains at the research-design level; operational hazards, clinical claims, and certification are flagged for expert review.

# Claim Boundaries

- Distinguish **directly observed evidence** from **inferred mechanism** and from **literature extrapolation**.
- Limit performance and mechanism claims to the tested control set, material system, and measurement conditions.
- Do not generalize from simplified or idealized validation to full-system deployment without targeted boundary tests.
- Treat single-source findings as hypotheses, not field consensus.
- Avoid stating that a material is safe, certified, or application-ready based solely on laboratory-scale screening.

# Failure Modes

- **Hypothesis conflation:** Changing multiple design features simultaneously without isolation controls, making attribution impossible.
- **Single-modal overreach:** Inferring a mechanism from one assay or metric without orthogonal support.
- **Confounding:** Uncontrolled differences in loading, geometry, interfacial contact, processing history, batch variability, or environment masquerade as mechanism effects.
- **False synergy:** A multifunctional design outperforms baseline but not the relevant single-function controls, suggesting redundancy or confounding rather than true synergy.
- **Irreproducibility:** Uncharacterized feedstock, fabrication variability, or measurement drift undermines mechanism claims.
- **Boundary violation:** Extrapolating claims beyond the tested domain (e.g., from laboratory screening to clinical or field deployment).

# Validity Checks

Before finalizing any research plan or claim:

- Confirm the research question is tied to a specific bottleneck rather than material novelty alone.
- Verify that every hypothesis is falsifiable and includes evidence strength, key assumptions, and predicted signatures.
- Ensure the control hierarchy can separate structure, chemistry, transport, and processing effects.
- Confirm metrics are predefined and directly linked to the bottleneck.
- Check that source-specific parameters, numerical results, and operational protocols have been excluded from the reusable plan.
- Require mechanism consistency across orthogonal evidence streams; flag contradictions instead of averaging over them.
- Predefine success, failure, and stop criteria before confirmatory testing.

# Provenance

- Derived from cluster **26 / subcluster 26.1** (composite-fiber-scaffold-sulfur-mechanism-discovery-workflow).
- Synthesized from representative source skills: `interfacial-flame-retardant-composite-exploration`, `biomass-inspired-battery-material-research`, `lis-safety-performance-research-design`, `lithium-sulfur-research-pattern`, `lithium-sulfur-binder-discovery`, `electrospun-scaffold-regeneration-research-design`, `li-s-battery-host-research-pattern`, `li-sulfur-trap-convert-research-design`.
- Workflow archetype: **observable-driven mechanism discovery and validation**.
