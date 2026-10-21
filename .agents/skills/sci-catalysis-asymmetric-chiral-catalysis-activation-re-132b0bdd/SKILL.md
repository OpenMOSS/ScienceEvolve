---
name: sci-catalysis-asymmetric-chiral-catalysis-activation-re-132b0bdd
description: Reusable end-to-end research design workflow for asymmetric, chiral, and catalytic activation studies covering hypothesis generation, minimal validation, controlled experimentation, and iterative refinement.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis activation research design workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent transform literature-derived methodological insights into a transferable research design framework for asymmetric and chiral catalysis. The workflow supports defining new research questions, generating falsifiable hypotheses, designing minimal validation experiments with rigorous controls, analyzing structure-selectivity relationships, and iterating based on mechanistic evidence—without reproducing paper-specific conditions or operational protocols.

## When to use

- When proposing a new asymmetric transformation, chiral ligand scaffold, or catalytic activation strategy based on known reaction classes.
- When migrating a selectivity-control logic (e.g., substrate-directed, catalyst-controlled, chiral-environment-controlled) to new substrates, metals, or ligand platforms.
- When designing a non-operational research plan that includes variable matrices, control tables, evaluation metrics, and iteration rules.
- When distinguishing literature-supported patterns from agent-inferred hypotheses that require experimental validation.
- Not for providing executable lab recipes, hazardous parameters, clinical recommendations, or treating single-paper conclusions as field consensus.

## Inputs required

- Target reaction class and desired selectivity outcomes (enantio-, diastereo-, regio-).
- Candidate substrate archetypes and known limitations of existing methods.
- Abstract catalyst/ligand categories (e.g., metal center class, chiral scaffold type, coordination mode), not specific commercial reagents.
- Available analytical and characterization capabilities (non-operational).
- Safety, compliance, and resource boundaries.

## Core Workflow

### 1. Map Reaction Space and Identify Gap
Catalog known substrate classes, activation modes, intermediate types, and selectivity control strategies in the target domain. Identify uncombined regions: reactive intermediates or catalytic modes that have not been paired with the target substrate or transformation.

**Decision Gate:** If the gap is not clearly defined or no analogous activation mode exists in the literature, stop and request additional domain input.

### 2. Formulate Mechanism-Driven Hypotheses
Abstract specific reagents into roles (activatable fragment, complementary fragment, chiral control source, directing group). Generate 2–5 candidate hypotheses linking structure to selectivity via a proposed mechanistic causal chain. Annotate each with evidence strength (High/Medium/Low), key assumptions, predicted outcomes, and falsification criteria.

**Decision Gate:** If no hypothesis can be framed with a falsifiable prediction, return to Step 1.

### 3. Design Minimal Viable Validation (MVV)
Select a representative model substrate that tests the core mechanistic premise with minimal confounding. Define a variable matrix covering substrate features (electronic, steric, directing group), catalyst/ligand properties (chiral environment, coordination geometry), medium effects (solvent polarity, additive class), and reaction regime (kinetic vs. thermodynamic). Establish a control hierarchy:
- **Positive control:** known competent system to validate the detection chain.
- **Negative control:** absence of chiral source, metal, or directing group.
- **Mechanistic control:** matched/mismatched chiral environments, isotopic probes, or intermediate analogues.
- **Competitive control:** substrates with alternative reactive sites.

Define stop conditions before conceptual execution: no conversion above background, selectivity indistinguishable from racemic/thermodynamic ratio, irreproducible key results, or safety boundary exceeded.

### 4. Execute Conceptual Screening and Record Outcomes
Record structured entries for each experiment: variables, conversion, selectivity, mass balance, byproduct profile, and anomalies. Preserve negative results and failed substrates as boundary data.

**Decision Gate:** If negative controls show significant product formation, halt and diagnose background reaction or impurity catalysis before proceeding.

### 5. Analyze Selectivity and Mechanistic Consistency
Establish mass balance and confirm product identity before interpreting selectivity. Map trends correlating changes in substrate sterics/electronics or ligand geometry with changes in regio-, diastereo-, or enantioselectivity. Attribute byproducts to competing pathways (e.g., background reaction, over-activation, isomerization). Compare results against the causal chain predicted in Step 2.

**Decision Gate:** If data contradict all candidate hypotheses, proceed to Step 7 (failure-mode iteration). If consistent, proceed to Step 6.

### 6. Boundary Expansion or Optimization
Systematically expand substrate scope to test electronic, steric, and functional-group boundaries. Iterate ligand/catalyst variables to optimize selectivity based on mechanistic insight.

**Decision Gate:** If expansion reveals the model system was an outlier, narrow claim boundaries and return to Step 2 to revise hypotheses.

### 7. Iterate, Pivot, or Terminate
- **Success pathway:** Mechanism supported → expand scope → update model → plan downstream application validation.
- **Partial success pathway:** Conversion without selectivity → revise chiral-environment hypothesis; selectivity without conversion → revise activation hypothesis.
- **Failure pathway:** Background reaction dominates, results irreproducible, or safety/compliance limits reached → document boundary conditions and terminate or pivot to an alternative activation mode.

**Stop Conditions:**
1. Core hypothesis falsified by decisive controls.
2. Results non-reproducible across replicates.
3. Extrapolation demands exceed available evidence.
4. Risk assessment prohibits continuation.

## Output Format

The agent must produce:
1. **Research Question:** One-sentence testable proposition.
2. **Gap Analysis:** Known modes versus uncombined regions.
3. **Hypotheses:** Ranked list with evidence strength, key assumptions, and failure modes.
4. **Minimal Validation Plan:** Model system, control hierarchy, variable matrix, and stop conditions.
5. **Analysis Plan:** Mass balance, selectivity interpretation, byproduct mapping, and mechanistic consistency checks.
6. **Iteration Rules:** Decision tree for success, partial success, and failure.
7. **Validity and Safety Notes:** Confounders, reproducibility requirements, extrapolation boundaries, and non-operational safety constraints.
8. **Evidence Boundary Statement:** Clear labeling of literature-verified, agent-inferred, and experiment-required claims.

## Validation Gates

- **Confounder check:** Are substrate purity, catalyst batch variance, solvent coordination, moisture, and analytical calibration accounted for?
- **Reproducibility gate:** Have key positive and negative results been replicated or cross-validated?
- **Statistical gate:** Is the substrate scope diverse enough (electronic, steric, functional-group dimensions) to support generality claims?
- **Mechanistic gate:** Does the proposed explanation simultaneously account for major product, stereoisomers, and byproducts?
- **Extrapolation gate:** Are claims restricted to tested substrate/ligand/metal categories, with explicit boundaries for untested classes?
- **Safety gate:** Has a non-operational risk assessment been performed, and are hazardous protocols excluded from the design?

## Claim Boundaries

- Distinguish three tiers of claims:
  - **Literature-supported:** Patterns directly evidenced by cited source skills or domain consensus.
  - **Agent-inferred:** Hypotheses generated by analogical reasoning from known systems; marked as requiring validation.
  - **Experimental-required:** Any claim about a new substrate, ligand, or condition not yet tested.
- Never present single-paper findings as field consensus.
- Never extrapolate from a model substrate to complex substrates, from screening scale to process scale, or from synthetic accessibility to biological activity without additional evidence.

## Failure Modes

- **No activation:** Target intermediate or active species does not form under tested conditions.
- **Background dominance:** Non-selective or non-catalytic pathways outcompete the designed chiral pathway.
- **Selectivity erosion:** Initial selectivity lost upon substrate change, purification, or attempted scale-up.
- **Mechanistic misattribution:** Selectivity arises from an unanticipated pathway (e.g., substrate autocatalysis, impurity catalysis, or post-reaction isomerization).
- **Irreproducibility:** Results vary across batches, operators, or analytical methods without identifiable cause.
- **Boundary violation:** Model success does not transfer to electronically or sterically divergent substrates.
- **Safety/compliance barrier:** Proposed route involves unmanageable hazards or regulatory restrictions.

## Validity Checks

- Verify that variable matrices change only one major factor at a time or use a structured factorial design with clear interpretation rules.
- Verify that all reported selectivity trends are referenced against concurrent controls, not historical literature values.
- Verify that absolute configuration or stereochemical assignments rely on independent confirmation, not trend extrapolation.
- Verify that failed substrates are reported with structural rationale and are not omitted.
- Verify that computational models are used to generate falsifiable predictions, not as standalone proof.
- Verify that evidence labels are applied to every major conclusion.

## Provenance

- Synthesized from cluster 25 (subcluster 25.0): asymmetric-chiral-catalysis-activation-research-design-workflow.
- Source skills: asymmetric-annulation-research-design (10.1021_acs.orglett.0c03963), asymmetric-synthesis-workflow-design (10.1021_jo050178), chiral-desymmetrization-research-design (10.17951_aa.2019.74.1.65-92), chiral-ligand-asymmetric-catalysis-exploration (10.1002_tcr.201500208), catalyst-controlled-divergent-synthesis-discovery (10.1021_jacs.9b10578), mixed-oxo-imido-schiff-base-research (10.1021_ic035318h), substrate-directed-ch-borylation-research (10.1021_ol301635x), asymmetric-ch-activation-research-design (10.1002_chem.202001793).
- No paper-specific conditions, numerical results, or operational protocols are included in the reusable workflow body.
