---
name: sci-catalysis-chiral-asymmetric-catalysis-mechanism-dis-9d73e7fe
description: A reusable end-to-end workflow for discovering and validating mechanisms in chiral and asymmetric catalysis, from gap identification and hypothesis generation through minimal validation design, mechanism discrimination, and iterative model refinement.
scienceevolve-title: "Asymmetric catalysis · chiral asymmetric catalysis mechanism discovery workflow 2"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to transform an open question in chiral or asymmetric catalysis into a structured, mechanism-guided research program. It provides an end-to-end route for identifying capability gaps, generating testable hypotheses, designing minimal validation studies, discriminating between competing mechanisms, and iterating until the evidence supports a bounded mechanistic claim.

## When to use

Use when exploring new enantioselective transformations, ligand or catalyst designs, substrate-scope boundaries, stereochemical models, or competing pathway hypotheses in asymmetric catalysis. Applicable to transition-metal, organocatalytic, and main-group catalytic systems where stereocontrol, reactivity, and mechanism are interdependent.

## Inputs required

- Target transformation class and stereochemical objective (e.g., enantioselectivity, diastereoselectivity, site selectivity).
- Candidate catalyst or ligand design logic at a conceptual level (scaffold, donor set, chiral pocket, activation mode).
- Known or suspected mechanistic variables (substrate orientation, intermediate geometry, competing pathways, configurational lability).
- Available evidence and constraints (literature precedents, preliminary data, analytical access, safety boundaries, stopping conditions).

## Core Workflow

1. **Define the capability gap and bottleneck**
   - Identify the specific mismatch between a desired chiral product class and the absence of a reliable catalytic route.
   - Frame the bottleneck as a mechanistic limitation (activation, stereocontrol, stability, or scope) rather than merely an untested substrate.
   - **Decision gate:** Is the bottleneck defined in mechanism-linked terms? If not, refine the research question before proceeding.

2. **Map mechanism variables and generate ranked hypotheses**
   - List dominant variables: catalyst/ligand geometry, activation mode, substrate orientation, solvent or medium effects, competing coordination or pathways, and product-release steps.
   - For each hypothesis, state the expected benefit, key assumption, minimal observable evidence, likely failure mode, and evidence strength (strong / moderate / weak / speculative).
   - **Decision gate:** Can each hypothesis be accepted or rejected with a small set of orthogonal measurements? If not, decompose or restate.

3. **Design minimal viable validation**
   - Select one representative model system that isolates the central hypothesis without unnecessary complexity.
   - Build a sparse design matrix varying one dominant mechanism variable at a time.
   - Plan controls: baseline (achiral or no-catalyst), component controls, negative controls (expected to weaken the target interaction), positive benchmarks (literature comparators used only as references), and analytical controls (calibration, stereochemical reference).
   - Predefine metrics (conversion, selectivity, reproducibility, side-product profile) and stop conditions (no activation, near-racemic selectivity, irreproducibility, ambiguous assignment).
   - **Decision gate:** Can the planned experiments distinguish the intended pathway from background, cascade, or non-selective alternatives? If not, redesign.

4. **Collect orthogonal evidence**
   - Gather data at the research-design level: stereochemical outcomes, control comparisons, product distributions, time-course trends, and structural confirmations.
   - Confirm data integrity (identity, purity, calibration) before mechanistic interpretation.
   - **Decision gate:** Are analytical foundations solid and results reproducible across representative repeats? If not, halt and resolve.

5. **Analyze, discriminate, and update the mechanism model**
   - Compare controls first; attribute stereocontrol to the chiral environment only when achiral, racemic, and stereochemical counterpart controls support it.
   - Separate activity from selectivity. Diagnose tradeoffs: yield increase with selectivity decrease suggests competing pathways; selectivity increase with yield decrease suggests turnover or stability issues.
   - Map structure-performance trends and update each hypothesis as supported, weakened, or refuted.
   - **Decision gate:** Are at least two independent evidence streams available for the preferred mechanism? If not, flag as inconclusive and plan additional mechanistic probes.

6. **Iterate or redesign**
   - If activation is weak: revisit electronics, coordination, or acidity/basicity balance.
   - If selectivity is poor: refine the chiral pocket, test matched/mismatched behavior, or suppress background pathways.
   - If scope is narrow: expand along one structural axis (steric, electronic, heteroatom) at a time.
   - If downstream utility fails: verify stereochemical retention and product stability before broadening.
   - If controls contradict the model: revise the mechanism rather than attributing to noise.
   - **Iteration rule:** Return to Step 3 with a revised hypothesis set.
   - **Stop condition:** Proceed to limited scope expansion only after the core benchmark is reproducible and mechanistically explained; otherwise, stop or pivot.

7. **Bound the claim and archive residual uncertainty**
   - State applicability boundaries (catalyst class, ligand family, substrate class, environment).
   - Label every claim as paper-verified, literature-supported, inferred, or speculative.
   - Document failed variants, ambiguous controls, and non-generalizable observations.
   - **Stop condition:** The mechanistic claim is bounded and no further iteration is justified without new independent evidence.

## Output Format

When using this skill, produce:

1. **Research question and bottleneck definition** — the mechanistic gap and why it matters.
2. **Mechanism model** — catalyst activation, substrate orientation, competing pathways, and likely failure modes.
3. **Ranked hypothesis table** — hypothesis, evidence strength, key assumption, minimal validation, and likely failure mode.
4. **Minimal validation plan** — model system, sparse design matrix, controls, metrics, and predefined stop conditions.
5. **Analysis plan** — control comparisons, orthogonal characterization, mechanism-update rules, and uncertainty labels.
6. **Iteration plan** — decision tree for proceed, redesign, or stop based on each likely outcome class.
7. **Validity and boundary statement** — confounders, reproducibility risks, extrapolation limits, and evidence provenance.

## Validation Gates

- **Scope validity:** The question targets a specific scaffold-donor-reaction intersection or mechanistic family, not a vague literature gap.
- **Hypothesis validity:** Every hypothesis is falsifiable and includes evidence strength, key assumptions, and failure modes.
- **Control validity:** Sufficient negative, positive, mechanistic, and analytical controls are planned to distinguish intended explanations from alternatives.
- **Mechanistic validity:** At least two independent evidence streams are required before assigning a mechanism.
- **Reproducibility validity:** Representative entries are repeated before scope expansion.
- **Analytical validity:** Methods can resolve relevant stereoisomers and products; calibration and purity are confirmed.

## Claim Boundaries

- Treat any single source or paper as one evidence source, not field-wide consensus.
- Label claims as paper-verified, supported by related literature, inferred from mechanism, or speculative.
- State whether conclusions apply only to the tested catalyst class, ligand family, substrate class, or environment.
- Do not generalize from one benchmark result to an entire reaction class.

## Failure Modes

- **No conversion despite plausible activation:** indicates an incorrect mechanism model or a missing activation pathway.
- **High conversion with near-racemic selectivity:** suggests a dominant background reaction or an ineffective chiral environment.
- **Good selectivity but low yield:** points to catalyst instability, slow turnover, or product decomposition.
- **Scope narrows abruptly:** the mechanism depends on a specific electronic, steric, or coordination pattern.
- **Controls contradict the hypothesis:** the mechanism model requires revision rather than experimental noise.
- **Irreproducible results:** substrate or catalyst purity, analytical calibration, or uncontrolled variables are confounding.
- **Stereochemical erosion in downstream steps:** indicates racemization, epimerization, or purification bias.

## Validity Checks

- Confirm catalyst or ligand identity and purity before interpreting catalytic outcomes.
- Verify stereochemical integrity and assignment with independent analytical methods.
- Normalize comparisons across matched substrate classes and consistent reporting bases.
- Include failed substrates, ambiguous controls, and negative results in the reasoning record.
- Use computational or structural models to explain trends, not to replace experimental evidence.

## Provenance

- Synthesized from cluster 3.2 (end-to-end mechanism discovery and validation).
- Source-skill references: chiral-bronsted-acid-phospha-michael-exploration, copper-phosphine-oxide-coupling-exploration, iridium-phebox-c-h-functionalization-research, chiral-mixed-donor-ligand-exploration, chiral-scaffold-organocatalyst-exploration, asymmetric-catalysis-research-exploration, asymmetric-rearrangement-exploration, p-chiral-phosphine-catalysis-exploration.
- No source-specific operational protocols, numerical results, or paper conclusions are embedded in the reusable workflow body.
