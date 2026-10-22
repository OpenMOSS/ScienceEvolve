---
name: sci-immune-antibody-immunoglobulin-molecular-mechanism-e2262dde
description: Reusable end-to-end workflow for generating hypotheses, designing controlled validation, and iterating on mechanism discovery in antibody, immunoglobulin, and membrane-active molecular systems without source-specific parameters or operational protocols.
scienceevolve-title: "Antibody and immune recognition · antibody immunoglobulin molecular mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to plan and execute research programs that discover and validate molecular mechanisms in antibody, immunoglobulin, modular protein, and membrane-active molecular systems. It guides the agent from an initial observation or design gap through hypothesis generation, minimal viable validation, mechanism discrimination, and iterative redesign while keeping outputs at a non-operational, research-planning level.

Do not use this skill to produce clinical recommendations, patient-specific therapeutic claims, executable wet-lab protocols, or high-risk operational parameters.

# When to use

Use this skill when the user asks to:

- Generate new research questions about binding, recognition, domain organization, or molecular mechanism in antibody or immunoglobulin systems.
- Design studies to test whether distal regions, framework residues, loop architectures, or modular boundaries alter binding specificity, affinity, stability, or selectivity.
- Plan validation for small-molecule recognition, domain dissection, scaffold transfer, or membrane-active selectivity.
- Convert single-system observations into transferable hypothesis-testing workflows.

Do not use this skill as a substitute for domain expert review, biosafety review, or clinical development advice.

# Inputs required

Before producing a plan, request or infer:

- **Target system and question:** antigen or target class, binding challenge, domain architecture, or mechanism under study.
- **Prior evidence:** parent binder behavior, known specificity, structural or sequence annotation, and prior negative results.
- **Candidate variables:** loops, domains, framework regions, distal contexts, or modular boundaries to be tested.
- **Readout capacity:** available assay classes for binding, specificity, structure, thermodynamics, stability, or function.
- **Constraints:** biosafety level, ethics oversight, reproducibility requirements, and governance boundaries.
- **Claim level:** exploratory hypothesis, comparative pattern, or mechanistic inference.

If key inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Frame the mechanistic gap**
   - Define the unexpected phenotype, measurement gap, or design liability.
   - Set the intended claim level (exploratory, comparative, or mechanistic).
   - *Gate:* Stop and reformulate if the gap cannot be expressed as a falsifiable mechanistic question.

2. **Generate competing hypotheses**
   - Draft 3–6 hypotheses that include:
     - A primary molecular-mechanism hypothesis.
     - A local/recognition-module-only alternative.
     - An artifact, avidity, aggregation, or context-dependent alternative.
   - Tag each with evidence strength (low/moderate/high), key assumptions, predicted discriminators, and failure modes.
   - *Gate:* Stop and expand inputs if no hypothesis can be discriminated with available readouts.

3. **Design minimal viable validation**
   - Define baseline, perturbation, and comparator arms.
   - Lock in positive, negative, benchmark, and orthogonal controls.
   - Pre-register primary endpoints and stopping rules (success, ambiguity, failure).
   - *Gate:* Redesign if controls cannot separate mechanism from artifact.

4. **Collect staged evidence**
   - **Layer 1 – Quality:** Confirm candidate integrity, identity, folding, and assay performance.
   - **Layer 2 – Activity:** Establish target engagement or functional output against the intended target.
   - **Layer 3 – Specificity:** Discriminate target signal from off-target, background, matrix, or nonspecific effects.
   - **Layer 4 – Mechanism:** Gather orthogonal mechanistic proxies (structural, thermodynamic, conformational, or routing).
   - *Decision gates after each layer:*
     - Pass → proceed to the next layer.
     - Ambiguity → add controls or refine readouts before continuing.
     - Fail → trigger iteration or termination.

5. **Discriminate mechanisms**
   - Compare competing hypotheses using convergent evidence from independent readout classes.
   - Separate observation, interpretation, and inference.
   - Classify each hypothesis as supported, partially supported, contradicted, or inconclusive.
   - *Gate:* Upgrade evidence strength only when at least two orthogonal readouts agree.

6. **Iterate, redesign, or terminate**
   - **Supported:** Expand to adjacent contexts (e.g., alternative loops, domains, target classes, or environmental conditions).
   - **Partially supported:** Identify the failing arm (activity, specificity, mechanism) and generate a narrowed hypothesis.
   - **Contradicted:** Reject the leading hypothesis and formulate an alternative mechanism.
   - **Ambiguous:** Reduce variables, strengthen controls, or switch readouts.
   - *Stop conditions:*
     - Repeated control failure.
     - Irreproducible signal across independent preparations or runs.
     - Safety, dual-use, or ethics boundary crossed.
     - Inability to discriminate alternatives after two full validation cycles.

7. **Bound claims and document assumptions**
   - State system-specific boundaries (scaffold family, target class, environmental regime).
   - Label claims as paper-verified, literature-supported, or agent-inferred.
   - List non-transferable assumptions that must be revalidated in new contexts.

# Output Format

When using this skill, return the research plan in this structure:

1. **Research question and claim level:** concise problem statement and intended inference strength.
2. **Evidence map:** paper-verified, literature-supported, and agent-inferred claims with their limitations.
3. **Hypothesis cards:** each with mechanistic rationale, evidence strength, key assumptions, predicted outcome, failure modes, and boundary conditions.
4. **Validation plan:** minimal viable design matrix, controls, metrics, staged readouts, and stopping rules.
5. **Analysis plan:** endpoint logic, orthogonal integration rules, outcome classification, and uncertainty handling.
6. **Iteration plan:** decision tree for the next cycle based on possible results.
7. **Validity and ethics summary:** confounders, reproducibility risks, extrapolation limits, and safety boundaries.
8. **Non-transferable assumptions:** what must not be reused without revalidation.

# Validation Gates

- **Falsifiability gate:** The central question must be expressible as a testable mechanistic hypothesis.
- **Control gate:** Every plan must include positive, negative, benchmark, and orthogonal controls before evidence collection begins.
- **Quality gate:** Candidate integrity, identity, and assay performance must be confirmed before interpreting binding or activity data.
- **Specificity gate:** Target signal must be discriminated from off-target, matrix, carrier, or nonspecific background.
- **Orthogonality gate:** Mechanism claims require agreement between at least two independent readout classes.
- **Reproducibility gate:** Patterns must be consistent across independent preparations or runs before upgrading evidence strength.
- **Safety/ethics gate:** The plan must not cross into clinical recommendations, executable hazardous protocols, or ungoverned high-risk biological work.

# Claim Boundaries

- Do not treat single-system observations as field consensus.
- Do not extrapolate binding, specificity, or mechanism findings beyond the tested scaffold, target class, or environmental regime.
- Distinguish structural hypotheses from functional proof; dynamic or allosteric explanations require orthogonal support.
- Label all agent-inferred extrapolations as provisional until independently validated.
- Keep structural separation claims distinct from functional mechanism claims until functional assays directly support the link.

# Failure Modes

- **Hypothesis failure:** The proposed mechanism is contradicted by controls or orthogonal readouts.
- **Artifact failure:** Observed phenotype is explained by aggregation, misfolding, avidity, assay format, matrix effects, or measurement artifacts rather than the intended mechanism.
- **Specificity failure:** The candidate shows target activity but lacks discrimination against off-targets, analogs, or related backgrounds.
- **Reproducibility failure:** Results are inconsistent across independent preparations, batches, or platforms.
- **Model failure:** Binding or thermodynamic models are unstable, non-identifiable, or insensitive to the proposed mechanism.
- **Boundary failure:** The design crosses safety, dual-use, or governance constraints.

# Validity Checks

- **Confounding:** Check expression context, tags, glycosylation, solubility, aggregation, batch effects, and clone identity.
- **Specificity:** Distinguish true target recognition from nonspecific or polyreactive behavior.
- **Framework/context effects:** Avoid attributing local effects to distal changes without direct evidence.
- **Structural uncertainty:** Treat homology models, loop predictions, and static structures as hypotheses, not observations.
- **Statistical validity:** Use predefined endpoints, appropriate replication, uncertainty estimates, and correction for multiple comparisons.
- **Mechanistic restraint:** Treat sequence or structural explanations as hypotheses unless directly tested by perturbation.
- **Extrapolation boundary:** Do not treat findings from one scaffold, target, or loop family as universal rules.

# Provenance

- Derived from cluster 6, subcluster 6.1.split0.
- Synthesized from source skills: antibody-loop-diversification-workflow (f6f4e8aec35bc69c), sorf-polyprotein-expression-research (e3faf0e876dc25d0), catechin-recognition-antibody-exploration (4a1ee7232f2c0459), antibody-remote-domain-binding-mechanism (0056699aa4e0cc4a), antibody-framework-thermodynamic-exploration (45489510116f454e), idiotype-vaccine-delivery-exploration (ff6f15b349ff6111), immunoglobulin-domain-modular-dissection (c87a31283b7cc6be), membrane-active-antimicrobial-selectivity-research (ab6b85ff29926ebb).
