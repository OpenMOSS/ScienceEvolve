---
name: sci-immune-cellular-immune-causal-attribution-workflow-b19b6919
description: A reusable end-to-end workflow for compartment-aware, stage-localized necessity, sufficiency, and cooperation testing of immune cell mechanisms, from hypothesis generation through controlled validation, iterative refinement, and bounded causal attribution.
scienceevolve-title: "Antibody and immune recognition · cellular immune causal attribution workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing and iterating research plans to attribute causal roles to immune cell populations, states, receptor features, or pathway activities across biological compartments and response stages. The workflow enforces necessity/sufficiency/cooperation logic, prespecified controls, and staged interpretation rather than correlational inference alone.

# When to use

Use when the user asks for non-clinical research design, hypothesis generation, or mechanism validation in cellular immunology—including tolerance checkpoints, regulatory function, receptor enrichment, immune network imprinting, or tumor-immune recognition. Do not use for clinical diagnosis, treatment recommendations, patient-specific risk assessment, or operational wet-lab protocols.

# Inputs required

Before producing a plan, request or infer:

- **Target immune outcome**: the response, phenotype, or disease-relevant endpoint to explain.
- **Candidate cellular feature**: the population, state, receptor, pathway, or mediator proposed as causal.
- **Causal question type**: necessity, sufficiency, redundancy, or cooperation.
- **Biological context**: species, tissue, compartment, disease subtype, and relevant developmental or activation stage.
- **Available readouts and comparators**: functional, lineage, sequence, imaging, or computational assays; positive and negative references.
- **Ethical, biosafety, and data-governance constraints**.
- **Intended claim level**: exploratory association, supported mechanism, or causal plausibility.

If inputs are missing, state assumptions explicitly and mark downstream conclusions as provisional.

# Core Workflow

Follow the ordered route below. Treat each decision gate as a hard checkpoint before advancing.

## 1. Frame the mechanistic gap

- Define the immune outcome and the candidate cellular feature.
- Classify the question as necessity, sufficiency, redundancy, or cooperation.
- Identify the relevant biological compartments and response stages (e.g., early activation, intermediate selection, durable output).
- **Decision gate — Operationalization**: Stop and request inputs if the outcome, candidate, or compartment cannot be expressed as measurable readouts.

## 2. Generate competing hypotheses

- **Primary mechanism**: the candidate feature is necessary, sufficient, or cooperative for the outcome.
- **Dissociation**: the outcome persists when the candidate feature is absent or altered.
- **Context dependence**: the effect is restricted to a specific compartment, stage, or signal context.
- **Confounding**: bystander recruitment, nonspecific modulation, technical artifact, surrogate mimicry, or off-target activity.
- **Decision gate — Falsifiability**: Rank hypotheses by discriminating power and evidence strength. Reject any hypothesis for which no conceivable control could distinguish it from alternatives.

## 3. Design minimal viable validation

- Select comparator conditions that isolate the candidate feature while holding other major variables constant.
- Define controls:
  - Baseline/pre-response.
  - Positive assay reference.
  - Negative stimulus or irrelevant context.
  - Specificity/competition or protection condition (where applicable).
  - Compartment-matched and stage-matched reference.
- Prespecify primary endpoint (functional or mechanistic), secondary endpoints (state, temporal, compartment), and stopping criteria.
- **Decision gate — Control adequacy**: Redesign if the control set cannot separate the candidate mechanism from confounders. Stop if ethical or safety boundaries are violated.

## 4. Execute compartment-aware, stage-localized testing

- Measure candidate presence and outcome across relevant compartments (e.g., inductive vs. effector sites, circulating vs. tissue-resident).
- Resolve response stages separately; do not conflate early participation with durable output.
- Track lineage or identity persistence across stages and compartments when readouts allow.
- **Decision gate — Context validity**: If compartment-specific or stage-specific controls fail, flag boundary conditions and halt mechanistic interpretation until resolved.

## 5. Assess specificity and functional linkage

- Test whether candidate enrichment or activity tracks response magnitude in a stimulus- or context-specific manner.
- Compare candidate-elicitor against unrelated stimuli or negative contexts to rule out nonspecific activation.
- Integrate orthogonal readouts to confirm the pattern is not assay-specific.
- **Decision gate — Specificity**: Downgrade the hypothesis to exploratory if the signal lacks specificity, appears only after post-hoc tuning, or disappears under reasonable sensitivity analyses.

## 6. Iterate, redirect, or stop

- **Supported**: If the candidate is necessary and specific, strengthen the claim and proceed to test sufficiency, cooperation with other features, or generalization across contexts.
- **Dissociated**: If the outcome persists without the candidate, prioritize redundancy, alternative mediators, or contact-dependent mechanisms.
- **Context-bound**: If the effect is limited to one compartment or stage, narrow the claim and test boundary conditions rather than asserting a universal rule.
- **Ambiguous**: Identify the weakest assumption (state verification, assay validity, control adequacy) and design the smallest next experiment to resolve it.
- **Stop conditions**: Falsified hypothesis, persistent nonspecificity, unresolvable confounding, failed positive/negative controls, or safety/ethical limits.

## 7. Bound claims and plan next steps

- Classify the conclusion as association, supported mechanism, or causal plausibility.
- State transferability boundaries (species, model, compartment, disease subtype, measurement context).
- Propose orthogonal validation or independent replication before any broader extrapolation.

# Output Format

When using this skill, produce:

1. **Research question** — concise statement of outcome, candidate feature, and causal question.
2. **Mechanism map** — upstream trigger, candidate layer, downstream response, and feedback or alternative paths.
3. **Candidate hypotheses table** — for each hypothesis: claim, evidence strength, key assumptions, predicted observation, and likely failure mode.
4. **Experimental design concept** — comparator conditions, control set, primary/secondary endpoints, and stopping criteria.
5. **Analysis plan** — prespecified comparisons, specificity checks, compartment/stage stratification, and uncertainty reporting.
6. **Iteration plan** — how each possible result updates, narrows, or rejects the hypotheses.
7. **Validity and ethics statement** — confounders, reproducibility checks, boundary conditions, and non-clinical safety limits.

# Validation Gates

- **Operationalization gate**: Candidate and outcome must be expressible as measurable readouts before design proceeds.
- **Falsifiability gate**: Every retained hypothesis must have a conceivable discriminating experiment.
- **Control adequacy gate**: The control set must be able to separate candidate mechanism from confounders and artifacts.
- **Specificity gate**: The signal must survive comparison against unrelated stimuli, negative contexts, and sensitivity analyses.
- **Interpretation gate**: Conclusions must be classified as association, supported mechanism, or causal plausibility, with explicit boundary conditions.

# Claim Boundaries

- Distinguish direct observation from agent-inferred mechanism.
- Do not equate early activation or compartment presence with long-term permissiveness or causal necessity.
- Do not translate animal-model or single-system findings into human disease claims without independent evidence.
- Computational or binding associations are not proof of immune function or therapeutic utility.
- A single cohort, model, or paper does not establish field consensus.

# Failure Modes

- Candidate feature cannot be isolated from correlated variables.
- Positive or negative controls fail, breaking interpretability.
- Nonspecific activation, broad binding, or global modulation dominates the readout.
- Stage or compartment mismatch conflates transient participation with durable output.
- Confounding by competition, technical undersampling, batch effects, or assay artifacts.
- Surrogate mimicry or off-target effects masquerade as specific mechanism.
- Correlation is overinterpreted as causation due to weak or missing controls.

# Validity Checks

- **Confounding**: Check for donor history, prior exposure, immune status, competition, batch/platform effects, and marker loss during differentiation.
- **Reproducibility**: Require independent biological replicates, predefined primary endpoints, effect sizes with uncertainty, and blinded scoring where subjective.
- **Statistical**: Predefine endpoints before inspection; control for multiple comparisons; distinguish absence of evidence from evidence of absence; report sensitivity analyses.
- **Boundary**: Limit claims to the tested species, model, compartment, disease subtype, and measurement context; explicitly flag model-specific findings.

# Provenance

Synthesized from cluster 54 / subcluster 54.0.split0. Derived from source skills: `b-cell-tolerance-checkpoint-exploration`, `early-immune-network-imprinting`, `viral-tumor-immune-complementarity-discovery`, `cd8-regulatory-ige-mechanism-discovery`, `tcr-enrichment-research-planning`, `intracellular-calcium-probe-mechanism`, `tumor-immune-vaccine-design-pattern`, `patient-informed-repertoire-screening`.
