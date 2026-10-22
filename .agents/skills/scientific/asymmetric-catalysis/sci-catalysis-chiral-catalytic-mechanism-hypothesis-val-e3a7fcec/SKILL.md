---
name: sci-catalysis-chiral-catalytic-mechanism-hypothesis-val-e3a7fcec
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-grounded hypotheses in asymmetric and chiral catalysis, from bottleneck framing through control-based discrimination to claim-bounded research plans.
scienceevolve-title: "Asymmetric catalysis · chiral catalytic mechanism hypothesis validation"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent transform a stereoselective catalysis problem into a structured, non-operational research workflow. The skill generates testable mechanistic hypotheses, designs minimal validation studies with strong controls, analyzes evidence to discriminate competing pathways, and iterates or stops based on pre-defined decision gates.

# When to use

Use when the user asks to explore new asymmetric, chiral, or cooperative catalytic systems—especially those involving reactive intermediates, stereochemical relays, remote stereocontrol, directed functionalization, or catalyst recovery—where the central challenge is understanding why selectivity succeeds or fails. Do not use to provide operational synthesis recipes, hazardous execution details, biological-use claims, or as a substitute for laboratory safety review.

# Inputs required

Ask the user or environment for:

- Target transformation and specific stereochemical challenge (e.g., enantio-, diastereo-, regio-, or chemoselectivity).
- Known mechanistic gap or practical bottleneck (activation, speciation, preorganization, stability, recovery, or scope).
- Candidate catalyst, ligand, intermediate, or preorganization hypotheses and relevant prior art.
- Available analytical capabilities for conversion, selectivity, structure, and speciation.
- Safety, compliance, and waste-handling constraints.
- Any prior positive, negative, or ambiguous results.

If critical inputs are missing, produce a clarification list before proposing a detailed plan.

# Core Workflow

1. **Frame the Selectivity Problem & Map the Bottleneck**
   - Define the target bond-forming event and the selectivity dimensions to be controlled.
   - Identify the mechanistic gap: whether the limitation lies in substrate activation, stereochemical communication, catalyst speciation, preorganization, stability, or recovery.

2. **Generate Ranked Mechanistic Hypotheses**
   - Formulate hypotheses that predict observable discrimination among competing pathways (e.g., reactive-intermediate rescue, scaffold-controlled relay, cooperative activation, remote preorganization).
   - Annotate each with evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observations, and likely failure modes.
   - Rank by discriminative power; prioritize hypotheses that yield different outcomes when the proposed control element is present versus absent.

3. **Design Minimal Validation with Embedded Controls**
   - Select a representative substrate/catalyst set that is large enough to test the hypothesis but small enough to interpret mechanistically.
   - Define a control hierarchy: baseline, positive, negative, component-only, mechanistic probe, and boundary-case controls.
   - Specify abstract variables (catalyst class, substrate electronics/sterics, medium) and metrics (conversion, selectivity, reproducibility, stability).
   - Predefine success thresholds, decision rules, and stop conditions before data interpretation.

4. **Plan Non-Operational Evidence Collection**
   - Outline conceptual experimental logic at the level of variables, controls, and metrics; omit operational recipes, reagent quantities, temperatures, or hazardous parameters.
   - Specify readouts for reactivity, selectivity, speciation, byproduct profile, and cycle-to-cycle behavior where relevant.

5. **Analyze Evidence & Discriminate Mechanisms**
   - Separate reactivity from selectivity; do not treat conversion alone as evidence of stereocontrol.
   - Interpret control outcomes to isolate causal variables from correlates.
   - Map substrate/catalyst trends against predictions; treat exceptions, byproducts, and failed substrates as mechanistic clues, not noise.
   - Classify each hypothesis as validated, partially supported, ambiguous, failed, or supplanted by a competing pathway.
   - **Decision Gate — Mechanism Discrimination**: If controls are inconclusive or confounded, return to Step 3 and add orthogonal probes before advancing claims.

6. **Iterate, Pivot, or Stop**
   - **Continue Gate**: If a hypothesis is validated, test one boundary variable to define the scope limit.
   - **Refine Gate**: If results are ambiguous, revise only the mechanistic element directly tested and design the next discriminating experiment.
   - **Pivot Gate**: If the core assumption is repeatedly contradicted or a competing pathway dominates across multiple designs, return to Step 2 to generate alternative hypotheses.
   - **Stop Gate**: Terminate if selectivity is irreproducible, no desired product forms under safe exploration conditions, success depends on a single narrow case without mechanistic rationale, or safety/compliance constraints prevent meaningful validation.

7. **Bound Claims & Package Output**
   - Distinguish demonstrated (directly observed), inferred (supported by controls/trends), and speculative (analogical) conclusions.
   - State generality boundaries and residual failure modes.
   - Assemble the structured research plan per the Output Format.

# Output Format

When using this skill, return results in this structure:

1. **Research Question & Bottleneck**
   - Target transformation and selectivity challenge.
   - Why existing approaches are insufficient.

2. **Mechanistic Model & Competing Pathways**
   - Proposed reactive intermediate or control element.
   - Key assumptions and likely competing pathways.

3. **Ranked Hypotheses**
   - At least three mechanism-grounded hypotheses.
   - Each labeled with evidence strength, key assumption, predicted observation, and failure mode.

4. **Validation Plan**
   - Minimal viable validation set.
   - Variable matrix.
   - Control hierarchy (positive, negative, component, mechanistic, boundary).
   - Evaluation metrics.
   - Stop conditions.

5. **Analysis Plan**
   - How to separate reactivity from selectivity.
   - How to interpret controls and exceptions.
   - How to map substrate/catalyst trends to the model.

6. **Iteration Rules**
   - Continue, refine, pivot, and stop criteria.
   - Next discriminating experiment for each outcome class.

7. **Claim Boundaries & Safety Notes**
   - Generality limits.
   - Confounders and reproducibility checks.
   - Non-operational safety constraints.

# Validation Gates

Before finalizing a research proposal, verify:

- **Trigger Fit**: The task concerns asymmetric, chiral, or cooperative catalysis and related mechanistic design.
- **Mechanism Preservation**: The proposal tests a causal mechanism rather than merely optimizing conditions.
- **Control Adequacy**: The plan includes baseline, positive, negative, component, mechanistic, and boundary controls.
- **Evidence Labeling**: Every hypothesis and claim is tagged with evidence strength and assumptions.
- **Metric Balance**: Yield or conversion is not interpreted without selectivity, reproducibility, and byproduct context.
- **Reproducibility**: Outcomes are defined by reproducible readouts, not one-off observations.
- **Safety Boundary**: The plan avoids executable hazardous details and defers execution to qualified laboratory review.

# Claim Boundaries

- Single-example success is not broad scope.
- Paper-supported observations are separated from agent-inferred extensions.
- Demonstrated effects are limited to the tested substrate, catalyst, and analytical context.
- Downstream utility claims (e.g., ligand, pharmaceutical intermediate) are labeled as untested unless independently validated.
- Mechanistic models remain provisional until supported by multiple independent observations.

# Failure Modes

- The proposed reactive intermediate fails to form, decomposes, or reacts nonselectively.
- Stereochemical communication breaks down due to conformational averaging, weak association, or competing binding modes.
- Catalyst speciation or off-cycle pathways dominate, eroding selectivity.
- Preorganization motifs are necessary but insufficient for remote stereocontrol.
- Background reaction, kinetic resolution, or product rearrangement mimics catalytic enantioselectivity.
- Recyclability tradeoffs collapse selectivity or activity across reuse cycles.
- Product instability or analytical ambiguity obscures the true stereochemical outcome.

# Validity Checks

- **Confounding**: Are substrate purity, catalyst batch variability, analytical calibration, and product decomposition considered?
- **Baseline Comparison**: Is there a matched baseline without the proposed control element?
- **Causal Specificity**: Does the design show the control element causes selectivity, rather than merely correlating with it?
- **Boundary Awareness**: Are substrate or condition classes most likely to fail explicitly tested or discussed?
- **Statistical Validity**: Are claims limited to tested classes with adequate replication?
- **Consensus Caution**: Source papers are treated as methodological precedents, not as proof of field-wide consensus.

# Provenance

- Synthesized from cluster 13.0 ("observable-driven mechanism discovery and validation").
- Derived from source skills: 10.1021/acs.accounts.0c00152, 10.1002/anie.202404979, 10.1088/1742-6596/2783/1/012029, 10.1002/chem.201501324, 10.1021/jacs.0c09654, 10.1002/ange.202218025, 10.1021/acs.orglett.5c04559, 10.1021/om100571w.
