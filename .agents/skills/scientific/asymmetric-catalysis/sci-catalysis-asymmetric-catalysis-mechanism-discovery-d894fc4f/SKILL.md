---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-d894fc4f
description: A reusable end-to-end workflow for hypothesis generation, non-operational validation design, and iterative mechanism discovery in asymmetric catalysis and chiral method development.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Provide a transferable, evidence-driven research workflow for asymmetric catalysis and stereoselective synthesis. This skill guides an agent from identifying a synthetic gap through generating falsifiable hypotheses, designing conceptual validation plans, analyzing layered evidence, and iterating based on controlled observations—without providing operational laboratory protocols or paper-specific conclusions.

# When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, stereoselective bond formation, or chiral method development.
- Generate hypotheses for catalyst-controlled selectivity, ligand-enabled activation, or mechanistic pathway discrimination.
- Design non-operational validation plans with variables, controls, metrics, and stop conditions.
- Evaluate whether a proposed substrate class, catalyst/ligand concept, or mechanistic model is worth exploring.
- Translate literature methodological patterns into reusable research planning for a new chemical system.

Do not use this skill to provide clinical, toxicological, or directly executable laboratory protocols; to make biological or medicinal claims from synthetic feasibility; or to present a single source as field-wide consensus.

# Inputs required

Collect or infer before proceeding:

- Target stereochemical motif or reaction class and its synthetic value.
- Candidate substrate architecture described structurally, not as an execution recipe.
- Proposed catalyst, ligand, or activation concept at a conceptual level.
- Known precedents, baseline methods, and failed or limited approaches in the same area.
- Hypothesized catalytic cycle, stereochemistry-setting event, and competing pathways.
- Analytical readouts available for conversion, yield, regio-/diastereo-/enantioselectivity, and structural assignment.
- Facility-level safety, regulatory, waste, and equipment constraints.
- Provenance of claims: which elements are literature-supported versus agent-inferred.

# Core Workflow

Follow this ordered route from question to iterated conclusion. Pass each decision gate before advancing; return to the preceding step or stop if a gate fails.

1. **Gap Framing & Question Formulation**
   - Define the target product class and the specific stereochemical or reactivity bottleneck.
   - Diagnose whether the limitation arises from reactivity, selectivity, substrate scope, functional-group compatibility, or downstream stereochemical erosion.
   - **Gate:** If the gap is not supported by current literature or user-provided context, or if simpler methods already solve it, stop and refine the research question.

2. **Tiered Hypothesis Generation**
   - Generate hypotheses in order of increasing mechanistic specificity:
     a. *Synthetic-value hypothesis* — the target addresses a real accessibility gap.
     b. *Activation/feasibility hypothesis* — a catalytic system can mediate the desired bond formation.
     c. *Stereocontrol hypothesis* — a chiral environment can bias the selectivity-determining step.
     d. *Mechanistic-pathway hypothesis* — a specific intermediate or transition-state arrangement explains the outcome.
     e. *Platform-scope/utility hypothesis* — the approach generalizes and enables downstream value.
   - For each hypothesis, label evidence strength (strong/moderate/weak/speculative), key assumptions, most likely failure mode, minimum validation, and falsification criterion.
   - **Gate:** If no hypothesis is falsifiable with the available conceptual controls and readouts, redesign the question or assumptions before proceeding.

3. **Minimal Viable Validation Design**
   - Select one model substrate that isolates the proposed bond-forming event and stereochemical decision point.
   - Define conceptual variable classes (catalyst identity, ligand architecture, substrate electronics/sterics, medium, activation mode) and their mechanistic roles.
   - Construct a control matrix: omission, background/no-catalyst, achiral, blocked analogue, and positive benchmark if available.
   - Specify evaluation metrics: product identity confidence, conversion, yield category, regio-/diastereo-/enantioselectivity, mass balance, and reproducibility.
   - Preset stop conditions: no distinguishable product, background dominates, selectivity vanishes in omission controls, or safety/compliance boundaries are breached.
   - **Gate:** If the plan requires operational hazardous details or exceeds facility constraints, redesign at a non-operational level.

4. **Conceptual Execution & Evidence Collection**
   - Collect analytical readouts for the full system and every control arm.
   - Record conversion, selectivity, byproduct profiles, and any stereochemical assignment data.
   - **Gate:** If the proposed product cannot be distinguished from background, side products, or analytical artifacts, stop and improve structural confirmation before interpreting selectivity.

5. **Layered Analysis**
   - *Layer 1 — Identity:* Confirm product structure and stereochemical outcome with orthogonal evidence before optimizing or scoping.
   - *Layer 2 — Control comparison:* Attribute reactivity and selectivity to the proposed catalytic system only if omission and background controls give meaningfully different outcomes.
   - *Layer 3 — Mechanistic mapping:* Compare substrate trends (electronic, steric, conformational) against the predicted transition-state model. Check whether product stereochemistry supports the proposed stereodetermining event.
   - *Layer 4 — Boundary classification:* Group substrates by structural features. Treat failures as boundary evidence that defines the method’s limits. Avoid claiming generality from a narrow set.
   - **Gate:** If controls contradict the proposed mechanism, or if omission controls match the full system, weaken or discard the corresponding mechanistic hypothesis.

6. **Mechanistic Discrimination**
   - Integrate orthogonal probes (perturbation experiments, diagnostic substrates, spectroscopic or computational evidence when available) to distinguish plausible pathways.
   - Determine whether selectivity is catalyst-controlled, substrate-controlled, or arises from dynamic equilibration.
   - **Gate:** If probes conflict and cannot be reconciled by confounders, prioritize the simplest supported explanation and design a follow-up test that discriminates the remaining alternatives.

7. **Scope & Utility Mapping**
   - Expand to representative substrate classes only after the model system passes identity, control, and reproducibility gates.
   - Evaluate downstream transformations conceptually to test platform value, distinguishing synthetic utility from biological or commercial claims.
   - **Gate:** If scope expansion reveals systematic failures, define explicit boundary conditions rather than forcing broad generality.

8. **Iterate, Pivot, or Terminate**
   - *Support:* If results support the hypothesis, strengthen claims incrementally, expand scope, and add mechanistic depth.
   - *Ambiguity:* If results are ambiguous, add orthogonal readouts or revise one mechanistic assumption at a time.
   - *Falsification:* If results falsify the hypothesis, pivot to an alternative activation mode, ligand class, substrate disconnection, or route hypothesis.
   - *Stop conditions:* Terminate if the gap is already solved by simpler methods; if stereochemistry is unassignable; if background or side reactions dominate; if reproducibility fails across independent readouts; or if safety, regulatory, or waste constraints cannot be satisfied.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question, scientific motivation, gap addressed, and claim boundary (literature-supported vs. agent-inferred).
2. **Hypothesis table** — Tiered hypotheses (value, feasibility, stereocontrol, mechanism, scope/utility) with evidence strength, key assumptions, likely failure modes, minimum validation, and falsification criteria.
3. **Validation plan** — Minimal viable validation design, conceptual variables and mechanistic roles, control matrix, evaluation metrics, and stop conditions.
4. **Analysis plan** — Identity confirmation strategy, control-comparison logic, mechanistic interpretation framework, scope-boundary classification, and evidence-labeling scheme.
5. **Iteration plan** — Decision rules for support, ambiguity, falsification, and pivot; next-test priorities; and claim-narrowing triggers.
6. **Validity and safety statement** — Confounders, reproducibility requirements, boundary conditions, and non-operational safety/compliance constraints.

# Validation Gates

Pass each gate before advancing to the next workflow stage:

- **Gap validity:** The proposed limitation is grounded in current literature or user context, not inferred from a single source.
- **Hypothesis falsifiability:** Every core hypothesis has a defined falsification criterion and a feasible minimum validation.
- **Identity confidence:** Product identity and stereochemical assignment are secure before selectivity or scope claims are made.
- **Control adequacy:** The plan includes omission, background, achiral, and mechanistic controls sufficient to distinguish catalytic control from background.
- **Mechanistic convergence:** Multiple independent probes or observations point to the same interpretation before a mechanism is treated as established.
- **Reproducibility:** Key observations are supported by independent repeats or orthogonal analytical readouts.
- **Boundary explicitness:** Failed and untested substrate classes, ligand classes, or conditions are explicitly reported, not omitted.
- **Safety and compliance:** The plan remains non-operational and respects facility-level chemical safety, waste, and regulatory boundaries.

# Claim Boundaries

- Clearly separate **paper-verified observations**, **directly observed validation results**, **mechanistically inferred conclusions**, and **speculative extensions** for every claim.
- Do not present a single literature source as field-wide consensus.
- Limit scope claims to substrate classes and conditions actually supported by the evidence.
- Limit mechanistic claims to interpretations consistent with the full control matrix; label them as inferred when converging evidence is incomplete.
- Do not claim biological, medicinal, environmental, or industrial value solely from synthetic feasibility or stereochemical control.

# Failure Modes

Anticipate and document the following common failure modes:

- Background or uncatalyzed reaction dominates, making selectivity claims untenable.
- Product identity or stereochemical assignment remains ambiguous after initial analysis.
- Selectivity disappears in ligand-free, achiral, or omission controls.
- Omission controls reproduce the full-system outcome, undermining cooperative or catalytic hypotheses.
- Substrate scope is limited to a narrow class without a mechanistic rationale for broader application.
- Stereochemical information is eroded during downstream conversion or handling.
- Competing pathways (oligomerization, decomposition, alternative cyclization) consume starting material.
- Results are irreproducible across independent analytical methods or replicate observations.
- Safety, regulatory, or facility constraints prevent non-operational planning from advancing.

# Validity Checks

Before finalizing any research plan or conclusion, verify:

- **Confounding:** Could impurities, uncontrolled background, substrate instability, catalyst decomposition, analytical overlap, or workup artifacts explain the result?
- **Reproducibility:** Are key claims supported by independent repeats or orthogonal confirmation?
- **Boundary conditions:** Are failed substrates, untested classes, and condition-sensitive cases explicitly reported?
- **Statistical validity:** Are quantitative comparisons based on repeated measurements with appropriate uncertainty reporting?
- **Mechanistic validity:** Do controls, structural evidence, and any computational or spectroscopic data converge on the same pathway?
- **External validity:** Is each source treated as one methodological example rather than universal consensus?
- **Safety validity:** Are all recommendations non-operational, facility-appropriate, and compliant with chemical safety and waste requirements?
- **Ethical validity:** Are medicinal or bioactive references framed only as synthetic motivation, not as clinical or exposure guidance?

# Provenance

This skill was synthesized from Cluster 7 / Subcluster 7.0 (observable-driven mechanism discovery and validation). Representative source skills include:

- `asymmetric-nickel-cyclization-research-design`
- `phosphinyl-radical-reaction-discovery-workflow`
- `chiral-induction-p-stereogenic-research`
- `asymmetric-fluoroalkyl-reaction-design`
- `asymmetric-cycloaddition-method-development`
- `p-chiral-phosphine-catalysis-workflow`
- `asymmetric-radical-dual-catalysis-exploration`
- `chiral-metal-asymmetric-desymmetrization-exploration`

Paper-specific conclusions, operational protocols, and numerical results from these sources were excluded from the reusable workflow body.
