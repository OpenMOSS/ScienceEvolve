---
name: sci-chromatin-methylation-regulatory-mechanism-discover-29590ee8
description: Reusable end-to-end workflow for designing research questions, experiments, and analyses to discover and validate chromatin, epigenetic, or methylation-based regulatory mechanisms while maintaining strict claim boundaries and iterative falsification.
scienceevolve-title: "Chromatin and epigenomic regulation · methylation regulatory mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Turn a chromatin, epigenetic, or regulatory observation into a falsifiable mechanistic research plan. The workflow layers hypothesis generation, controlled perturbation design, multi-omic analysis, and iterative refinement without reproducing any single paper's specific system, parameters, or conclusions.

# When to use

Use this skill when a user asks to:
- Generate mechanistic hypotheses about chromatin state, DNA methylation, histone modifications, accessibility, or transcription-factor regulation.
- Design experiments that distinguish regulator binding from regulatory function, correlation from causation, or local chromatin effects from global cell-state changes.
- Plan multi-layer regulatory genomics studies linking epigenetic marks to transcription, chromatin architecture, or dynamic output.
- Iterate after ambiguous, negative, or discordant results in chromatin or epigenetic data.

Do not use this skill for clinical decision-making, patient-specific recommendations, operational wet-lab execution protocols, or broad claims that a single study establishes field-wide consensus.

# Inputs required

Collect or state assumptions for:
- **Target system:** organism, tissue, cell type, developmental stage, or disease context.
- **Observed pattern:** the chromatin, methylation, accessibility, or expression pattern to be explained.
- **Candidate regulator or feature:** the factor, mark, or architectural element hypothesized to mediate the pattern.
- **Available molecular layers:** e.g., DNA methylation, histone modifications, chromatin accessibility, transcription-factor occupancy, nascent transcription, or steady-state expression.
- **Perturbation concept:** intended directional change (loss, reduction, rescue, comparison) at a non-operational design level.
- **Comparator/baseline:** matched control condition or appropriate reference state.
- **Known confounders:** batch, ancestry, sex, age, cell composition, tissue heterogeneity, sample quality, and environmental history.
- **Constraints:** ethical approvals, data governance, biosafety boundaries, and assay feasibility.

If any input is missing, state assumptions explicitly and label downstream conclusions as provisional.

# Core Workflow

Follow this ordered route from ambiguity to bounded mechanistic claim. Do not skip decision gates.

## 1. Frame the mechanistic ambiguity
- Convert the observed pattern into a specific question about how a candidate regulator or feature produces, maintains, or restores a chromatin or transcriptional state.
- Define the gap between correlation and mechanism.
- **Decision gate:** If the observation cannot be framed as a falsifiable mechanistic question, stop and refine the scope.

## 2. Generate competing, falsifiable hypotheses
- Propose at least three competing mechanisms (e.g., the candidate changes activation timing, activation probability, post-activation rate, chromatin accessibility, or local methylation state).
- For each hypothesis specify:
  - Predicted molecular signature across layers.
  - Key assumptions.
  - Most likely failure mode.
  - Boundary condition where the hypothesis may not apply.
  - Evidence strength (strong, moderate, weak, speculative).
- **Decision gate:** If the hypotheses are not mutually distinguishable with the available readouts, redesign the measurement plan before proceeding.

## 3. Design a minimum viable layered experiment
- Define conditions:
  - Reference/baseline.
  - Perturbed regulator or feature condition.
  - Negative control for nonspecific effects.
  - Positive control if a known route exists.
  - Specificity or rescue/reversal condition when appropriate and safe.
  - Background/batch control to estimate confounding.
- Define variables:
  - Perturbation variable.
  - Temporal or state-transition variable.
  - Architectural or context variable (e.g., binding-site organization, regulatory element class).
  - Output variables spanning at least two layers (e.g., methylation + expression, accessibility + occupancy).
- Predefine evaluation metrics and stop conditions:
  - Stop if perturbation specificity fails.
  - Stop if temporal or spatial resolution cannot resolve required features.
  - Stop if controls show systematic bias.
  - Stop if model predictions are underdetermined.
  - Stop if conclusions would depend on a single unreplicated observation.
- **Decision gate:** If matched controls are inadequate or confounders are unaddressed, do not proceed to data collection or analysis.

## 4. Separate and quality-check each molecular layer
- Assess comparability across samples: batch, source, handling, platform, and annotation.
- Evaluate feature quality: coverage, missingness, artifact-prone regions, technical consistency.
- Analyze each layer independently before cross-layer integration.
- Flag or exclude low-confidence measurements using transparent criteria.
- **Decision gate:** If a layer fails quality thresholds, is confounded, or key regulatory regions are removed by filtering, flag it and do not integrate it into mechanistic claims.

## 5. Integrate layers and test mechanistic predictions
- Align features across all layers to a common locus or region set.
- Compare perturbation-sensitive features against pattern-associated features using the tested-feature background, not an inappropriate genomic background.
- Distinguish exact overlap, proximity, enrichment, and correlation.
- Check directional consistency and temporal ordering.
- Separate perturbation effects from mediation:
  - A real effect on a readout does not prove the candidate explains the original pattern.
  - Require overlap/concordance plus coherent directionality.
- **Decision gate:** If orthogonal layers disagree without a plausible biological explanation (e.g., methylation changes without expression change, or localization without perturbation effect), classify the result as unresolved and require additional readouts or controls.

## 6. Classify evidence strength and bound claims
- **Strong:** robust perturbation effect, coherent cross-layer overlap, matched controls pass, and independent validation or orthogonal readout supports the link.
- **Moderate:** robust effect and suggestive overlap, but one validation layer is missing.
- **Weak:** effect exists but overlap is absent, untested, or confounded.
- **Negative for primary mechanism:** perturbation effects are robust but non-overlapping with the original pattern under adequate controls.
- **Decision gate:** If evidence is weak or negative, either narrow the claim to a subset of features or contexts, or pivot to alternative mechanisms (e.g., the candidate acts as a modifier, cofactor, or downstream responder rather than the primary mediator).

## 7. Iterate or terminate
- **If supported:** Narrow the mechanism to the overlapping feature class or regulatory context; add orthogonal perturbation or boundary-condition experiments; test whether the molecular change propagates to downstream function.
- **If non-overlapping:** Reframe the candidate as a modifier of another program or a context-specific cofactor; preserve the narrower claim that the candidate affects the readout.
- **If confounded:** Redesign with tighter matching, blocking, or paired sampling; treat current results as exploratory.
- **If unresolved:** Add an orthogonal assay, refine locus classes, or test a different regulatory architecture before strengthening conclusions.
- **Terminate if:** positive controls fail; perturbation is nonspecific; results depend on a single assay without orthogonal support; required safety or ethics constraints are unmet; or the claim would require causal or clinical inference beyond the design.

# Output Format

Return a structured research plan containing:

1. **Research question and scope** — concise mechanistic question, target system, and boundary conditions.
2. **Mechanistic model** — layered model showing predicted transitions (e.g., recognition → chromatin marking → accessibility → initiation → output, or methylation → expression).
3. **Hypotheses table** — for each hypothesis: predicted signature, evidence strength, key assumptions, failure mode, and boundary.
4. **Experimental design** — conditions, variables, controls, measurements, metrics, and stop conditions.
5. **Analysis plan** — quality control, layer-separation strategy, integration logic, overlap/concordance testing, sensitivity checks, and confounder assessment.
6. **Iteration plan** — explicit update rules for supported, partial, negative, ambiguous, and confounded outcomes.
7. **Validity and ethics statement** — main confounders, reproducibility checks, claim boundaries, and governance constraints.

# Validation Gates

Before accepting any conclusion, confirm:
- **Reproducibility:** Effects replicate across biological replicates or independent datasets with predefined feature-extraction rules.
- **Control adequacy:** Matched-source, negative, positive, background, and specificity controls are specified and pass.
- **Confounder separation:** Perturbation, context, source, batch, sex, age, cell type, ancestry, and tissue composition are not aliased.
- **Feature-space validity:** Quality filtering does not remove the regulatory regions needed to answer the question; excluded features and their impact are reported.
- **Statistical validity:** Primary metrics are predefined; multiple-testing correction, effect sizes, and uncertainty are reported; metrics are not selected after seeing results.
- **Mechanistic validity:** The design can distinguish competing mechanisms (e.g., binding vs. function, timing vs. rate, local vs. global) rather than collapsing them into a single aggregate readout.
- **Perturbation specificity:** The perturbation affects the intended target without collapsing global cell state, architecture, or broad transcriptional programs.

# Claim Boundaries

- Distinguish **association** from **causation**; localization from direct binding; perturbation effect from primary mediation.
- Distinguish **source-paper method patterns** from **new inferences** for the user's target system.
- Limit claims to the tested context (cell type, locus class, developmental stage, disease state, or organism).
- Do not present single-system results as field-wide consensus.
- Do not generate clinical advice, diagnostic claims, prognostic claims, or treatment recommendations.
- Label extrapolations, generalizations, and agent-inferred mechanisms as hypotheses requiring independent validation.

# Failure Modes

- The observed pattern is an artifact of batch, ancestry, cell composition, or technical variation.
- Perturbation changes global cell state, proliferation, or stress responses before the proposed local mechanism can be assessed.
- Co-localization is driven by shared genomic annotation, open chromatin, transcriptional activity, or assay bias rather than direct mechanistic linkage.
- Overlap or concordance is absent, weak, unstable across analysis choices, or explained by background structure.
- Discordant layers (e.g., methylation changes without expression change, or accessibility without transcriptional output) indicate missing variables, wrong regulatory regions, or compensation.
- Assay-specific biases (antibody cross-reactivity, mappability, GC content, detection thresholds) produce spurious patterns.
- Compensation, redundancy, or feedback masks the perturbation effect.
- Conclusions depend on arbitrary thresholds, normalization choices, or a single unreplicated observation.

# Validity Checks

Before finalizing a plan or conclusion, verify:
- Does the question distinguish regulator binding from regulatory function?
- Are all regulatory layers explicitly mapped to measurements?
- Are positive, negative, specificity, and background controls defined?
- Are baseline chromatin state, genomic context, and comparator validity included?
- Are assay-specific biases and artifact-prone regions considered?
- Are effect sizes, uncertainty, replication, and multiple-testing correction reported?
- Are downstream gene or functional assignments supported by local regulatory evidence and linkage information?
- Are source-paper-specific numerical cutoffs, objects, and parameters excluded from the new design?
- Are claims limited to the tested system rather than treated as consensus?
- Are clinical, diagnostic, and therapeutic claims avoided?
- Is each hypothesis falsifiable with a stated observation that would weaken or reject it?

# Provenance

Derived from **cluster 13 / subcluster 13.0**. Synthesized from source skills: `dynamic-gene-regulation-workflow`, `candidate-mediator-methylation-exploration`, `chromatin-state-sensor-research`, `chromatin-regulatory-productivity-workflow`, `chromatin-restart-research-design`, `epigenetic-regulatory-chromatin-exploration`, `tumor-suppressor-methylation-expression-design`, and `circadian-epigenetic-cancer-exploration`. Paper-specific systems, materials, parameters, numerical results, and operational protocols have been removed; only the shared method pattern and reasoning structure are retained.
