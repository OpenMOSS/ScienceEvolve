---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-b3f00c46
description: Reusable end-to-end workflow for generating, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and chiral catalyst or ligand discovery.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 10"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Convert an unresolved asymmetric catalysis problem into a structured, mechanism-centered research workflow. This skill guides an agent to identify selectivity or scope bottlenecks, propose falsifiable catalyst or ligand hypotheses, design minimal validation studies with rigorous controls, analyze results by separating activity from selectivity, and bound claims to tested substrate and catalyst classes. It preserves the scientific reasoning pattern common to asymmetric catalysis discovery without embedding any single paper’s specific chemistry as a universal rule.

# When to use

Use this skill when the user asks to:
- Propose new research questions in asymmetric catalysis, chiral ligand design, enantioselective synthesis, or stereocontrolled bond formation.
- Design a validation workflow for a catalyst, ligand, or organocatalyst hypothesis with unresolved selectivity, scope, or mechanism.
- Translate stereochemical observations into testable mechanistic models and boundary-aware scope plans.
- Evaluate whether a proposed catalytic design is coherent, experimentally testable, and properly controlled.

Do not use this skill for:
- Directly executable hazardous chemical procedures, operational recipes, or step-by-step wet-lab instructions.
- Domains outside asymmetric catalysis and chiral catalyst or ligand discovery (e.g., biology, clinical decision-making, materials fabrication).
- Claims that a single literature precedent constitutes field-wide consensus.

# Inputs required

Before generating a plan, request or infer:
- Target transformation class and desired stereochemical outcome.
- Unresolved selectivity, scope, or mechanistic limitation.
- Relevant prior catalyst, ligand, or organocatalyst families.
- Suspected mechanistic bottleneck (e.g., weak coordination, poor transition-state organization, insufficient steric differentiation, competing pathways, catalyst speciation).
- Desired product class and key structural features.
- Available analytical readouts for conversion, byproducts, regioisomers, stereoisomers, and catalyst state.
- Safety, ethics, and compliance constraints for the intended research setting.

If any input is missing, state assumptions explicitly and separate them from evidence-backed claims.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

## 1. Gap definition and bottleneck translation
State the unresolved catalysis problem in terms of a valuable transformation whose enantioselectivity, regioselectivity, diastereoselectivity, or substrate scope remains limited. Compare known catalyst families against the target outcome to locate the mismatch. Translate the gap into a mechanistic design requirement (e.g., activation mode, steric environment, electronic tuning, or conformational constraint).

**Gate:** If the bottleneck cannot be framed as a mechanistic variable, stop and reframe the problem.

## 2. Mechanistic hypothesis generation
Generate a portfolio of mechanism-first hypotheses. For each hypothesis specify:
- **Hypothesis:** concise catalyst or ligand design principle or stereochemical model.
- **Mechanistic rationale:** the transition-state or intermediate feature the design is meant to control.
- **Evidence strength:** High, Medium, Low, or Insufficient, based on direct precedent, mechanistic consistency, and representative validation.
- **Key assumptions:** binding mode, active species, substrate tolerance, analytical resolution, transferability.
- **Failure modes:** inactive complexes, poor turnover, competing pathways, over-rigid or over-flexible scaffolds, misleading substrates, analytical ambiguity.
- **Differentiation from prior work:** how the proposal addresses a limitation not resolved by known classes.

**Gate:** If a hypothesis cannot be falsified by a minimal validation experiment, refine or discard it.

## 3. Minimal validation design
Design a non-operational validation schema. Define:
- **Comparator set:** existing catalyst or ligand class; minimal scaffold lacking the proposed design element; close analog changing only one design variable; negative control (no catalyst or achiral comparator) where appropriate; positive control for a related established transformation if available.
- **Variables:** catalyst or ligand architecture (scaffold, donor identity, steric or electronic tuning, rigidity), substrate class, activation mode.
- **Primary metrics:** conversion or yield, desired-product selectivity, enantioselectivity or diastereoselectivity, regio- or chemoselectivity, byproduct profile, reproducibility.
- **Structural validation:** how representative product identity and stereochemical assignment will be confirmed, distinguishing direct assignment from analogy.
- **Stop conditions:** no candidate exceeds controls; byproducts dominate; analytical ambiguity prevents interpretation; safety or compliance boundaries exceeded.

**Gate:** If the design does not isolate one mechanistic variable at a time or lacks negative and benchmark controls, redesign.

## 4. Conceptual execution and data collection
Execute the validation conceptually. Gather results under a consistent analytical framework. Record failed substrates, unexpected byproducts, and control outcomes with equal weight.

**Gate:** If controls are not exceeded or analytical signals are ambiguous, stop and resolve analytical validity before interpreting selectivity.

## 5. Mechanism-driven analysis
Analyze results in this order:
1. **Check controls first.** Confirm product formation and selectivity exceed background, catalyst-only, and literature comparator baselines.
2. **Separate activity from selectivity.** A system that produces product without improving the central stereochemical metric has not solved the stated problem.
3. **Inspect byproducts and competing pathways.** High byproduct formation may indicate catalyst-substrate mismatch or incorrect design assumptions.
4. **Map structure-performance trends.** Each analog should clarify whether donor identity, scaffold rigidity, steric environment, or electronic tuning controls the outcome.
5. **Interpret speciation-sensitive results.** Strong dependence on catalyst-to-ligand ratio or additive suggests productive and nonproductive complexes coexist.
6. **Validate structural claims.** Support stereochemical assignments with orthogonal evidence; label analogy-based assignments explicitly.
7. **Group substrates by mechanistic variable.** Separate steric, electronic, heteroatom, and competing-site effects.

**Gate:** Classify each hypothesis as Supported, Partially supported, Contradicted, or Inconclusive.

## 6. Iteration decision
Based on the classification:
- **If Supported:** expand scope deliberately with substrates that test the next mechanistic boundary (steric, electronic, functional-group compatibility).
- **If Partially supported:** redesign the catalyst or ligand environment to isolate the selectivity-determining feature or reduce background pathways.
- **If Contradicted:** revise the mechanistic model before designing the next analog family. Test alternative active species, binding modes, or bottlenecks.
- **If Inconclusive:** strengthen controls, improve analytical resolution, or repeat the most informative comparison.

**Stop conditions:**
- No candidate improves the central selectivity metric without creating a new dominant failure mode.
- Results cannot distinguish the proposed mechanism from the leading alternative.
- Reproducibility is poor and no interpretable variable explains variation.
- Safety, facility, or compliance constraints are violated.

**Gate:** Continue only when the lead improves the central selectivity metric and controls are clean. Otherwise pivot or stop.

## 7. Scope expansion and boundary mapping
Expand substrate or catalyst scope only after the core transformation is validated. Use deliberate contrasts that test one structural feature at a time. Preserve negative substrates and failed analogs as boundary evidence. Define the narrowest claim supported by the data.

**Gate:** Are claims limited to validated catalyst, substrate, and analytical classes? If not, trim claims.

## 8. Claim formulation and final validation
Assemble the final deliverable. Label every claim with its evidence strength. Separate:
- Observed outcomes.
- Mechanistic inferences.
- Analogical predictions.
- Speculative extensions.

Confirm that no single successful example is treated as a general principle.

**Gate:** If any claim exceeds the tested boundary or lacks reproducibility support, downgrade or remove it.

# Output Format

When using this skill, produce:

1. **Research question:** One-sentence problem statement.
2. **Literature gap and bottleneck:** Prior limitation and suspected mechanistic cause.
3. **Hypothesis portfolio:** For each hypothesis, include mechanistic rationale, evidence strength, key assumptions, and possible failure modes.
4. **Minimal validation plan:** Comparator set, controls, variables, primary metrics, structural validation, and stop conditions.
5. **Analysis plan:** How results will be interpreted, how hypotheses will be updated, and how failures will be used as boundary evidence.
6. **Iteration plan:** Decision rules for supported, partial, contradicted, and inconclusive outcomes.
7. **Boundary and validity statement:** Confounders, reproducibility checks, analytical limitations, and the narrowest defensible claim.
8. **Next decision:** Continue, pivot, or stop recommendation based on hypothetical or provided results.

# Validation Gates

Before advancing between stages, verify:
- **Bottleneck clarity:** The gap is expressed as a mechanistic variable, not just a performance deficit.
- **Hypothesis falsifiability:** Every hypothesis can be weakened or refuted by a feasible experiment.
- **Control completeness:** Negative, positive, benchmark, and mismatched controls are included where relevant.
- **Analytical resolution:** The method can distinguish desired product, stereoisomers, regioisomers, and byproducts.
- **Mechanistic consistency:** Observed trends are explainable by the proposed model without ad hoc adjustments.
- **Reproducibility:** The most informative result is repeatable under the same conceptual conditions.
- **Safety and compliance:** The plan remains non-operational and defers execution to qualified personnel with institutional oversight.

# Claim Boundaries

- Limit all claims to the tested catalyst or ligand family, substrate class, and analytical framework.
- Do not conflate activity (conversion or yield) with selectivity (enantio-, diastereo-, or regioselectivity).
- Label analogy-based stereochemical assignments as such; do not present them as direct structural proof.
- Do not treat a single successful example or one paper’s result as field-wide consensus.
- Distinguish observed outcomes, mechanistic inferences, computed predictions, and speculative extensions in every output.

# Failure Modes

- **No improvement over controls:** Product formation or selectivity does not exceed background or literature benchmarks. Action: stop and test alternative activation modes or catalyst classes.
- **Competing pathways dominate:** Byproducts or side reactions obscure the desired outcome. Action: diagnose whether the issue is substrate mismatch, catalyst decomposition, or incorrect mechanistic assumption.
- **Analytical ambiguity:** Inability to distinguish stereoisomers, regioisomers, or byproducts. Action: pause scope expansion and prioritize orthogonal structural validation.
- **Catalyst speciation or decomposition:** Dependence on stoichiometry, additive, or aging suggests multiple active species. Action: investigate speciation before optimizing selectivity.
- **Stereochemical scrambling or epimerization:** Loss of stereochemical information during formation or handling. Action: distinguish formation-stage from downstream-stage scrambling.
- **Poor reproducibility:** Unexplained variability across runs. Action: identify confounding variables before claiming a trend.
- **Safety or compliance violation:** Proposed direction exceeds institutional safety boundaries. Action: stop and consult qualified oversight.

# Validity Checks

Before presenting any plan or conclusion, check:
- **Confounding factors:** Are analogs changing only the intended variables? Could catalyst speciation, substrate electronics, or steric effects explain the trend instead of the proposed design feature?
- **Controls:** Are relevant negative, positive, literature comparator, and mismatched controls included?
- **Reproducibility:** Is the most informative result repeated, and are metrics reported consistently?
- **Analytical validity:** Can the method unambiguously distinguish desired product, regioisomers, stereoisomers, and byproducts?
- **Boundary conditions:** What is the narrowest claim supported by the data? Which substrate or catalyst classes remain untested?
- **Statistical validity:** Are replicates and uncertainty discussed where variability could change the decision?
- **Evidence separation:** Are source-paper observations clearly separated from agent-inferred hypotheses for new systems?
- **Extrapolation:** Is the proposal framed as a testable hypothesis rather than a domain-wide consensus?

# Provenance

Synthesized from Cluster 10 / Subcluster 10.0. Derived from the following source skills:
- `asymmetric-catalysis-ligand-discovery` (10.1021/ol200602x)
- `asymmetric-synthesis-catalyst-exploration` (10.1002/(SICI)1099-0690(199904)1999:4<805::AID-EJOC805>3.0.CO;2-R)
- `phosphorus-nucleophile-organophosphorus-discovery` (10.1007/BF02495680)
- `asymmetric-dual-catalysis-exploration` (10.1002/anie.202305638)
- `organocatalytic-divergent-cycloaddition-research-pattern` (10.1002/chem.201703526)
- `asymmetric-desymmetrization-catalysis-workflow` (10.1016/j.tet.2019.130560)
- `p-chiral-phosphinite-research-design` (10.1021/acs.joc.3c01753)
- `catalyst-template-desymmetrization-research` (10.1002/anie.200805066)
