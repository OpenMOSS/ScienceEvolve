---
name: sci-dft-map-computational-organometallic-catalytic-path-21ed2eea
description: A reusable end-to-end workflow for discovering and validating catalytic mechanisms through hypothesis generation, pathway mapping, control-based discrimination, and iterative evidence bounding.
scienceevolve-title: "Organometallic catalysis and DFT · map computational organometallic catalytic pathways"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Transform mechanistic uncertainty in homogeneous catalysis into a structured, testable research plan. This skill abstracts a mechanism-first pattern: define competing pathways and active states, map full catalytic cycles, discriminate with controls and sensitivity checks, and iterate while bounding claims. It is designed for conceptual and computational research planning, not for operational laboratory execution.

# When to use

Use this skill when:
- A catalytic transformation may proceed through multiple plausible elementary-step sequences, active states, or activation modes.
- The central ambiguity concerns pathway order, rate- or selectivity-determining steps, resting states, or side-channel competition.
- Computational or conceptual reaction profiling is available or planned.
- Experimental observations need interpretation through mechanistic hypotheses rather than operational protocols.
- The requested output is a research design, hypothesis matrix, validation plan, or iteration strategy.

Do not use this skill to provide executable synthetic procedures, operational hazardous conditions, scale-up instructions, or clinical recommendations.

# Inputs required

Before starting the workflow, collect or define:
- Target transformation class and product family at a conceptual level.
- Candidate catalyst, ligand, substrate, and medium categories without specific operational parameters.
- Known experimental observations: product distribution, selectivity, reproducibility, failed cases, and side processes.
- Mechanistic ambiguity: pathway order, active form, activation mode, selectivity-determining step, or side-process origin.
- Available modeling or experimental validation capabilities and constraints.
- Safety, ethics, procurement, waste, and regulatory constraints relevant to the research context.
- Boundaries for the intended claim: narrow local mechanism versus broader design principle.

# Core Workflow

Execute the following ordered stages. Do not proceed past a decision gate until the stated condition is met.

1. **Frame the mechanistic question**
   - State the ambiguity as a falsifiable choice among plausible pathways, active/resting states, or activation modes.
   - Bound the claim scope (local mechanism vs. transferable design rule).
   - **Decision gate:** Proceed only if the question identifies at least two competing, chemically plausible hypotheses and a defined chemical space.

2. **Enumerate competing hypotheses**
   - List candidate active or resting states (coordination, spin, charge, ligand lability).
   - List candidate pathway orders and elementary sequences.
   - List candidate activation modes or electronic-state manifolds.
   - Include side channels, off-cycle routes, and deactivation pathways.
   - **Stop condition:** If fewer than two plausible hypotheses survive preliminary feasibility screening, gather additional evidence or redefine the question before continuing.

3. **Construct full-cycle mechanistic maps**
   - Map each retained hypothesis as a connected sequence from substrate entry through bond formation, product release, and catalyst regeneration.
   - Identify intermediates, transition states, and likely resting states.
   - **Decision gate:** Reject disconnected or incomplete routes. Proceed only when every retained map forms a closed catalytic cycle.

4. **Design discriminating validation**
   - Define the minimal viable comparison that can distinguish the leading hypotheses from at least one alternative.
   - Specify controls:
     - **Positive control:** benchmark with prior mechanistic support.
     - **Negative control:** variant expected to lack the proposed feature.
     - **Mechanistic control:** perturbation that changes one mechanistic variable at a time.
     - **Robustness control:** test under reasonable alternative assumptions or models.
     - **Boundary control:** variant outside the intended chemical space to limit overgeneralization.
   - Define non-operational evaluation metrics (e.g., relative energetic span, structural feasibility, descriptor coherence, kinetic consistency).
   - **Stop condition:** If no discriminating test is conceptually possible, mark hypotheses as unresolved and pause.

5. **Execute comparative analysis**
   - Compare pathways under consistent reference states, model assumptions, and structural criteria.
   - Assess structural feasibility, electronic/bonding rationale, and medium effects.
   - Test model sensitivity (conformers, spin states, solvation treatment, model size).
   - **Decision gate:** Downgrade or reject hypotheses that depend on a single unvalidated descriptor or that reverse under reasonable sensitivity checks.

6. **Rank and classify evidence**
   - Classify each hypothesis as supported, weakened, rejected, or unresolved.
   - Label evidence strength (high, medium, low, speculative) and key assumptions.
   - Document predicted observable patterns and likely failure modes for retained hypotheses.
   - **Stop condition:** If all hypotheses are rejected, return to step 2 with revised assumptions.

7. **Iterate or expand**
   - **If supported:** extend to an adjacent substrate, ligand, or environment variant; add a boundary control.
   - **If ambiguous:** design a targeted discriminator focused on the earliest branch point or differing predicted signature.
   - **If contradicted:** revise the mechanistic map or active-state assignment before adding complexity.
   - **If controls fail:** diagnose the control failure before revising the main hypothesis.
   - **Stop condition:** Stop when the claim is bounded by validated evidence, when further discrimination requires unsafe or unfeasible action, or when uncertainty cannot be reduced without new data.

8. **Bound the final claim**
   - State external validity limits (scaffold, substrate, environment, model class).
   - Separate paper-supported findings from agent inferences and speculative extensions.
   - Document residual uncertainty and failure modes.

# Output Format

Return results in the following structure:

1. **Research question**
   - Target transformation and mechanistic ambiguity.
   - Validated starting points versus agent inferences.
   - Boundary of the intended claim.

2. **Mechanistic map**
   - Candidate active/resting states.
   - Competing pathway orders and activation modes.
   - Decisive step for each branch.
   - Side processes and off-cycle routes considered.

3. **Hypothesis set**
   - For each hypothesis: mechanistic rationale, evidence strength, key assumptions, predicted observable pattern, likely failure mode, minimal validation, and boundary condition.

4. **Validation design**
   - Decision variables.
   - Positive, negative, mechanistic, robustness, and boundary controls.
   - Primary and secondary evaluation endpoints.
   - Stop conditions.

5. **Analysis plan**
   - Full-cycle comparison criteria.
   - Structural, electronic, and medium-effect checks.
   - Side-process and sensitivity checks.
   - Evidence classification rules.

6. **Iteration plan**
   - Actions for supported, partially supported, contradicted, and control-failure outcomes.

7. **Validity and safety summary**
   - Confounders and uncertainty sources.
   - External validity boundary.
   - Ethical and safety constraints.
   - Confidence level and evidence labeling.

# Validation Gates

- **Completeness gate (step 3):** All retained mechanisms must include substrate activation, productive steps, product release, and catalyst regeneration. Reject incomplete cycles.
- **Discrimination gate (step 4):** The validation plan must include at least one control capable of falsifying each leading hypothesis. If not, pause.
- **Sensitivity gate (step 5):** Conclusions must survive reasonable changes in model representation (e.g., solvation, spin state, conformer). Downgrade if sensitive.
- **Consistency gate (step 6):** A hypothesis marked as supported must explain multiple independent constraints without ad hoc additions.
- **Boundary gate (step 8):** Final claims must include explicit scope limits and must not be presented as field-wide consensus.

# Claim Boundaries

- Distinguish paper-supported observations from analogy-based inferences and from new agent-generated hypotheses.
- Treat a single computational or experimental study as evidence for its specific system, not as universal catalytic law.
- Limit mechanistic claims to the validated catalyst class, ligand scaffold, substrate type, and environmental conditions.
- Do not extrapolate to industrial viability, clinical utility, or safe operational parameters without domain-specific validation.
- Mark speculative extensions as low evidence strength until independent validation is planned.

# Failure Modes

- **Omitted mechanism:** A plausible pathway, active state, or side channel was not included in the initial hypothesis set.
- **Catalyst instability:** Decomposition, aggregation, or ligand loss masquerades as mechanistic failure.
- **Model sensitivity:** Conclusions reverse under alternative conformers, spin states, solvation treatments, or basis sets.
- **Boundary mismatch:** The mechanism fails outside the tested substrate or environment space but is overgeneralized.
- **Off-cycle trap:** A stable resting state or catalyst-substrate adduct sequesters the catalyst and invalidates the apparent rate-limiting step.
- **Control misinterpretation:** A failed control is attributed to the wrong mechanistic variable.
- **Evidence overreach:** A single descriptor or one line of evidence is treated as definitive proof.

# Validity Checks

Before presenting conclusions, verify:
- **Mechanistic completeness:** Active forms, pathway orders, activation modes, product release, catalyst regeneration, and side processes are considered.
- **Full-cycle consistency:** The favored pathway explains the decisive step, selectivity, and side-process evidence together.
- **Descriptor coherence:** Structural, electronic, and medium-sensitive descriptors point to the same explanation.
- **Control adequacy:** Positive, negative, mechanistic, robustness, and boundary controls distinguish the hypothesis from alternatives.
- **Statistical and reproducibility validity:** Repeated observations, uncertainty, and replicate behavior are sufficient for the claimed trend.
- **Model sensitivity:** The conclusion survives reasonable changes in model representation.
- **External validity:** The claim is limited to the validated chemical space rather than treated as a domain-wide consensus.
- **Failure-mode coverage:** Omitted mechanisms, side processes, and boundary mismatches are documented.
- **Evidence labeling:** Paper-validated facts are separated from agent inferences for the new system.
- **Safety and ethics boundary:** No operational hazardous protocols are embedded in the research plan.

# Provenance

- Derived from cluster 1, subcluster 1.2 (organometallic computational mechanistic catalysis).
- Synthesized from source skills: test1723, test0105, test1710, test1830, test0317, test0642, test0220, test1572.
- Preserves shared workflow structure without source-specific systems, materials, parameters, or paper conclusions.
