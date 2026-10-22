---
name: sci-catalysis-asymmetric-catalysis-hypothesis-workflow-fddcd180
description: Reusable end-to-end workflow for generating mechanism-driven hypotheses, designing minimal validation experiments with strong controls, and iterating asymmetric catalysis and selective functionalization studies.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis hypothesis workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Migrate mechanism-driven asymmetric catalysis and selective functionalization research patterns to new problems. The workflow guides an agent to define selectivity bottlenecks, generate falsifiable hypotheses, design minimal validation experiments with rigorous controls, and iterate based on mechanistic evidence rather than reproducing specific literature conditions or operational recipes.

# When to use

- When proposing new catalytic reactions, ligand designs, multi-center systems, or tandem sequences where selectivity (enantio-, diastereo-, regio-, or site-selectivity) is the primary bottleneck.
- When unexpected reactivity—such as ligand rearrangement, neighboring-group participation, or byproduct capture—suggests a hidden mechanism that could be harnessed for selective transformation.
- When designing studies to distinguish true catalytic pathways from background reactions, decomposition, or analytical artifacts.
- When migrating a methodological insight from one substrate or ligand class to another, explicitly not for reproducing exact literature recipes, hazardous protocols, or fabrication parameters.

# Inputs required

- Target reaction class and desired selectivity dimensions (e.g., enantioselectivity, diastereoselectivity, regioselectivity).
- Candidate catalyst or ligand architectures and activation modes (e.g., bifunctional cooperative, dinuclear/multi-center, organocatalytic, metal-ligand cooperative).
- Substrate scope boundaries and known competing pathways (background, decomposition, isomerization, racemization).
- Available analytical capabilities for structural confirmation, stereochemical analysis, reaction monitoring, and mass-balance assessment.
- Safety, compliance, and resource constraints that bound the experimental design space.

# Core Workflow

## Step 1: Define the gap and competing pathways
- Map the reaction network: substrate, desired product, expected intermediates, byproducts, and background paths.
- Identify the selectivity or activity bottleneck and articulate why existing approaches are insufficient.
- Explicitly distinguish literature-validated facts from analogical inferences for the new system.

## Step 2: Generate mechanism-driven hypotheses
- Propose 2–5 candidate hypotheses linking catalyst/ligand/substrate structure to selectivity or reactivity outcomes.
- For each hypothesis, specify: mechanistic rationale, a falsifiable prediction, evidence strength (High/Medium/Low), critical assumptions, and failure modes.
- Include at least one hypothesis for non-selective background dominance and one for catalyst deactivation or structural rearrangement.

## Step 3: Design minimal viable validation (MVV)
- Select representative substrates and catalyst variants that maximally distinguish hypotheses with the fewest experiments.
- Define a control matrix:
  - **Negative**: absence of catalyst, absence of chiral element, or blocked key functional group.
  - **Positive**: known viable system confirming the detection framework.
  - **Strong**: single-variable structural perturbation (e.g., ligand steric/electronic change, substrate homolog).
  - **Mechanism-specific**: enantiomeric ligand, alternate metal center, or conformationally constrained substrate.
- Pre-define evaluation metrics (conversion, selectivity, mass balance, structural confirmation) and stop conditions (no reproducible signal above background, unresolved analytical ambiguity, safety boundary reached).

## Step 4: Plan execution and evidence collection
- Plan simultaneous confirmation of catalyst/substrate integrity and product identity before mechanistic interpretation.
- Record batch information, analytical methods, and observed anomalies (precipitation, color change, decomposition signals).

**Decision Gate 1 — Material Integrity:** If catalyst/substrate identity or stability is ambiguous, stop mechanistic claims and return to characterization.

## Step 5: Analyze and map results to mechanism
- Compute core metrics consistently across all runs.
- Check background and artifact contribution first: confirm selectivity is not caused by non-catalytic paths, analytical error, or separation bias.
- Build structure-performance maps correlating electronic, steric, and conformational features with selectivity trends.
- Compare experimental trends against hypothesized transition-state or activation models; flag conflicts explicitly.

**Decision Gate 2 — Background Exclusion:** If the selective/functionalized path does not significantly outperform appropriate negative controls, reject or downgrade the hypothesis and investigate background dominance.

**Decision Gate 3 — Selectivity Threshold:** If selectivity or conversion falls below pre-defined minima, trigger iteration (modify ligand environment, activation mode, or substrate class) rather than expanding scope.

## Step 6: Probe robustness and scope boundaries
- Test reproducibility across independent batches or repetitions.
- Probe substrate scope systematically to identify electronic/steric boundaries, retaining failure cases.
- Assess separation feasibility, mass balance, and catalyst stability.

**Decision Gate 4 — Mechanistic Consistency:** If scope trends contradict the proposed model (e.g., unpredicted stereochemical inversion or loss of trend), revise the mechanism or narrow boundary conditions before further expansion.

## Step 7: Iterate or terminate
- **Continue and expand:** Mechanism supported, robustness confirmed, and scope shows interpretable trends. Proceed to broader scope or downstream application planning.
- **Redesign:** Activity/selectivity is insufficient but the model identifies a fixable variable (e.g., pocket size, electronic tuning). Return to Step 2 with revised hypotheses.
- **Narrow scope:** Success is limited to a narrow substrate class. Redefine claim boundaries and test adjacent classes.
- **Stop:** Background dominates, results are irreproducible, safety/compliance limits are reached, or no diagnostic experiment can distinguish competing mechanisms.

# Output Format

The agent should produce:

1. **Research Question** — Focused on the structure–mechanism–selectivity relationship.
2. **Gap and Rationale** — Bottleneck, competing paths, and why current approaches are insufficient.
3. **Hypotheses Table** — Hypothesis name, mechanistic rationale, falsifiable prediction, evidence strength, key assumptions, and failure modes.
4. **Experimental Plan** — MVV design, control matrix, variables, metrics, and stop conditions.
5. **Analysis Plan** — Data structure, background-check protocol, structure-performance mapping, mechanism comparison, and uncertainty reporting.
6. **Iteration Plan** — Rules for continuing, redesigning, narrowing, or stopping based on possible outcomes.
7. **Validity and Safety Notes** — Confounders, reproducibility requirements, extrapolation boundaries, and non-operational safety boundaries.

# Validation Gates

- **Gate 1 — Material & Product Identity:** Catalyst, ligand, and substrate integrity are confirmed; product structure and stereochemistry are assigned with orthogonal evidence.
- **Gate 2 — Background Exclusion:** Selectivity and activity are statistically distinguishable from negative controls, blank reactions, and non-catalytic background.
- **Gate 3 — Selectivity & Activity Threshold:** Predefined minima for conversion and selectivity are met before scope expansion.
- **Gate 4 — Mechanistic Consistency:** Experimental trends align with the proposed activation or transition-state model; conflicting data triggers model revision.
- **Gate 5 — Robustness & Reproducibility:** Key results replicate across independent preparations; failure cases are retained and explained.

# Claim Boundaries

- Distinguish "observed in this study," "mechanistically supported," and "generalizable to the field."
- Single-substrate or single-ligand success does not justify broad scope claims.
- Computational or visual models (e.g., transition-state sketches, descriptor matrices) are interpretive aids, not standalone mechanistic proof.
- In vitro or model reaction results must not be presented as clinical, industrial-scale, or environmental-safety claims.
- Hypotheses for new ligands, metals, or substrates remain inferential until validated by the full control matrix.

# Failure Modes

- Background reaction dominates or masks catalytic selectivity.
- Catalyst or ligand decomposition, deactivation, or structural rearrangement invalidates the intended mechanism.
- Substrate or product racemization, isomerization, or degradation during reaction or workup confuses readouts.
- Analytical artifacts (misassigned peaks, separation bias, calibration errors) produce false positives.
- Scope expansion reveals no interpretable trend, indicating the initial hypothesis was overfitted to a single substrate.
- Batch-to-batch irreproducibility due to uncontrolled material states (e.g., oxidation, hydration, aggregation).
- Safety or compliance constraints prevent testing of a critical diagnostic variable.

# Validity Checks

- **Confounders:** Check substrate purity, moisture/oxygen, solvent impurities, metal salt contaminants, temperature gradients, mixing order, and batch variability.
- **Reproducibility:** Require independent repeats for positive and boundary cases; retain negative or low-selectivity results.
- **Statistical validity:** Use pre-defined primary endpoints; avoid cherry-picking; report variance and outliers.
- **Mechanistic validity:** Every mechanism hypothesis must have at least one falsifiable prediction and a corresponding diagnostic experiment.
- **Extrapolation limits:** Explicitly state which substrate classes, ligand scaffolds, and reaction types the conclusions do and do not cover.
- **Operational safety:** This skill provides non-operational research design only; it does not include executable lab recipes, hazard parameters, or scale-up details.

# Provenance

- Synthesized from cluster 23.0 ("catalyst-oxide-asymmetric-catalysis-hypothesis-workflow").
- Source skills: organic-kinetic-resolution-discovery; bifunctional-noninnocent-ligand-catalysis-workflow; ir-spo-ligand-reactivity-exploration; organophosphorus-intramolecular-cyclization-workflow; chiral-dinuclear-catalyst-exploration; organocatalytic-fused-heterocycle-discovery; catechol-biopolymer-mucoadhesion-research; rhodium-diene-asymmetric-alkenylation-research.
- Paper-derived operational protocols, specific reagents, numerical results, and material parameters from the source literature have been excluded per the merge definition.
