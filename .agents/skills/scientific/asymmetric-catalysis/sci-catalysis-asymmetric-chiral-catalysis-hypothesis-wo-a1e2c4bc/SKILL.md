---
name: sci-catalysis-asymmetric-chiral-catalysis-hypothesis-wo-a1e2c4bc
description: An end-to-end reusable workflow for generating mechanism-driven hypotheses, designing minimal validation experiments, and iteratively refining chiral catalyst models in asymmetric catalysis research.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis hypothesis workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent translate asymmetric catalysis and chiral catalyst design challenges into a structured, iterative research workflow. The goal is to generate falsifiable hypotheses, design non-operational validation plans, analyze evidence across experimental and computational sources, and update catalyst models while maintaining strict claim boundaries.

## When to use

- When a user wants to propose new research questions in asymmetric catalysis, enantioselective synthesis, or chiral catalyst/platform development.
- When migrating a known catalytic concept to new substrate classes, catalyst scaffolds, ligand designs, or reaction manifolds.
- When designing validation strategies involving stereoselectivity, chemoselectivity, or regioselectivity controls without requesting operational lab procedures.
- When distinguishing literature-verified patterns from new inferential claims and bounding evidence strength.

## Inputs required

- Target transformation, desired chiral element, and selectivity bottleneck (e.g., enantio-, diastereo-, regio-, or chemoselectivity).
- Candidate catalyst/ligand classes, substrate categories, and known scope or failure modes from literature or prior data.
- Available analytical and computational resources, plus safety/compliance constraints.
- Priority ranking among yield, selectivity, substrate scope, mechanistic clarity, scalability, or sustainability.

## Core Workflow

1. **Frame the Selectivity Bottleneck**  
   Convert the user goal into a falsifiable question about which reactivity or selectivity gap limits the new system. Define the target product, major competing pathways, and desired extrapolation boundaries.  
   **Decision Gate 1 (Scope Gate):** If the bottleneck cannot be linked to a specific catalyst–substrate interaction model, pause and request clarification before proceeding.

2. **Generate Mechanism-Driven Hypotheses**  
   Produce 2–5 candidate hypotheses that explain the selectivity origin (e.g., activation mode, chiral pocket matching, non-covalent steering, dynamic kinetic resolution, or competing-pathway suppression). For each hypothesis record: core claim, key assumptions, evidence strength (High/Medium/Low), falsifiable predictions, and failure modes.  
   **Decision Gate 2 (Plausibility Gate):** Discard hypotheses that lack an observable prediction or cannot be distinguished with the available validation toolkit.

3. **Distinguish Verified from Inferred**  
   Label every claim as either (a) verified in prior literature or analogous systems, or (b) an agent inference for the new system. Do not treat single-source results as field consensus.  
   **Stop Condition:** If the majority of critical claims rest on Low evidence with no close analog, flag high risk and narrow the initial validation scope.

4. **Design Minimal Viable Validation (MVV)**  
   Select a representative prototype (substrate plus catalyst) that preserves the core structural bottleneck but minimizes complexity. Define variable tiers: primary (catalyst scaffold, chiral source, key activating groups), secondary (electronic/steric tuning, additive classes), and constrained (safety, analytical limits). Design controls: negative (absence of chiral catalyst or key motif), positive (known selective system to calibrate analytics), mechanistic (structural variants testing geometric/electronic predictions), and analytical (standards, racemic samples, blanks).  
   **Decision Gate 3 (MVV Gate):** If the plan cannot include at least one mechanistic control and one negative control, redesign before proceeding.

5. **Define Evaluation Metrics & Stop Conditions**  
   Establish primary metrics (conversion, selectivity, product identity), mechanistic metrics (background fraction, structure–selectivity correlation, consistency with computational trends), and practicality metrics (scope indicators, reproducibility). Hard stop triggers: negative control matches experimental outcome; selectivity is insensitive to catalyst structural changes; background or side reactions dominate with no mechanistic handle; results are irreproducible; safety/compliance risks exceed institutional capacity.

6. **Execute Structured Data Collection & Analysis**  
   Build a structured matrix of substrate/catalyst descriptors, outcomes, side products, and replicate variance. Stratify by mechanism-relevant groupings (electronic series, steric series, competing pathways). Prioritize anomalous outcomes; they often expose model gaps. Integrate orthogonal evidence (computation, kinetics, spectroscopy) only as comparative trends, not standalone proof.  
   **Decision Gate 4 (Trend Gate):** If experimental trends conflict with computational predictions across multiple prototypes, return to Step 2 to revise assumptions.

7. **Update Hypotheses & Iterate**  
   - **Support:** retain the model and expand to boundary substrates or stricter controls.  
   - **Partial support:** refine a single assumption (e.g., rate-determining step, substrate orientation).  
   - **Refutation:** retire the model, redefine competing pathways or activation modes, and generate new candidates.  
   Iteration priority: resolve attribution ambiguities before broadening scope; validate selectivity origin before substrate breadth.  
   **Decision Gate 5 (Convergence Gate):** If three consecutive iterations fail to improve mechanistic clarity, stop and redirect to a different catalyst platform or activation concept.

8. **Bound Claims & Document Residual Risk**  
   State explicit applicability boundaries (substrate class, catalyst type, selectivity metric). Label all conclusions with evidence grades: observed, model-consistent, plausible alternative, or unverified. Archive failure modes and negative results as boundary-defining data.

## Output Format

1. **Research Question:** One-sentence definition of the new problem and its selectivity bottleneck.  
2. **Ranked Hypotheses:** 2–5 mechanism-driven hypotheses with evidence strength, key assumptions, predictions, and failure modes.  
3. **Study Plan:** MVV design, control matrix, variable tiers, and stop conditions.  
4. **Validation Plan:** Metrics, analytical strategy, and reproducibility requirements.  
5. **Analysis Plan:** Data structure, stratification logic, anomaly handling, and orthogonal evidence integration rules.  
6. **Iteration Rules:** Decision tree for support/partial/refute outcomes and next-round priorities.  
7. **Claim Boundary Statement:** Distinction between verified patterns and new inferences, plus explicit extrapolation limits.  
8. **Safety & Compliance Note:** Non-operational risk boundaries and institutional review reminders.

## Validation Gates

- **Scope Gate:** The bottleneck must be translatable into a catalyst–substrate interaction model.  
- **Plausibility Gate:** Every retained hypothesis must yield an observable, distinguishable prediction.  
- **MVV Gate:** The validation plan must include negative, positive, and mechanistic controls.  
- **Trend Gate:** Persistent experimental–computational conflict triggers hypothesis revision.  
- **Convergence Gate:** Three iterations without mechanistic clarity force platform redirection.

## Claim Boundaries

- Do not present single-system observations as field consensus.  
- Do not extrapolate selectivity trends beyond the tested substrate/catalyst classes without labeling as unverified.  
- Distinguish "the catalyst enables the transformation" from "the catalyst controls selectivity via the proposed mechanism."  
- Computational results are trend evidence, not experimental confirmation.

## Failure Modes

- Background reaction dominates; catalytic differentiation is negligible.  
- Selectivity is invariant to catalyst structural changes; the chiral control model is unsupported.  
- Results are irreproducible due to uncontrolled analytical or batch variability.  
- The prototype substrate is not representative; apparent scope rests on a single scaffold.  
- Iteration stalls because multiple variables change simultaneously, preventing causal attribution.

## Validity Checks

- **Confounding factors:** Check substrate purity, background reactions, competing pathways, product decomposition, analytical bias, and batch variation.  
- **Mechanistic validity:** Catalyst structure changes must correlate with explainable selectivity shifts, not purely empirical optimization.  
- **Statistical validity:** Pre-defined replication, outlier rules, consistent metrics across substrate sets, and avoidance of cherry-picking best cases.  
- **Reproducibility:** Key claims require independent repeats; record non-operational metadata (substrate class, catalyst class, analytical method).  
- **Boundary clarity:** Conclusions are scoped to specific reaction types, substrate categories, and catalytic modes.  
- **Literature calibration:** Treat source papers as case studies, not universal truth; cross-check with independent reviews or replications.

## Provenance

- Synthesized from cluster 14 (subcluster 14.0): asymmetric-chiral-catalysis-catalyst-hypothesis-workflow.  
- Source skills merged: asymmetric-multicomponent-catalysis-research; imine-asymmetric-catalysis-research-workflow; chiral-bicyclic-imidazole-research-workflow; heteroatom-stereogenic-directed-heck-exploration; electrochemical-asymmetric-radical-discovery; chemoselective-reduction-methodology-agent; retrosynthetic-handle-synthesis-workflow; palladium-catalyzed-phenol-electrophile-amination-research.  
- Paper-derived details, operational protocols, and numerical results from source skills were excluded per merge requirements.
