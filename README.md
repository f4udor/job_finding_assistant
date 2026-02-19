# job_finder_assistant (MVP)

Deterministic job application assistant built with Next.js + TypeScript.

## What it does

1. Collects a user professional profile via a step-by-step UI wizard.
2. Ingests pasted job description text (no scraping).
3. Extracts a structured `JobSpec` with verbatim `evidence` for each requirement.
4. Compares `UserProfile` vs `JobSpec` to build a `TailoringPlan` and targeted questions.
5. Generates a tailored CV in LaTeX from a fixed template (`templates/cv_base.tex`).
6. Produces a readable diff report explaining CV changes.

## Non-negotiable guarantees enforced

- No fabricated experience/employers/skills/metrics in generation logic.
- Missing info creates questions instead of guesses.
- Extracted requirements include evidence quotes from JD.
- Deterministic, step-based workflow writes JSON outputs under `data/`.
- LaTeX template is fixed and only populated through renderer placeholders.

## Stack

- Frontend: Next.js App Router + TypeScript + TailwindCSS
- Backend: Next.js API routes
- Storage: local JSON files
- Validation: Zod schemas
- LLM: abstract provider interface + mock provider (no API key required)
- Tests: Vitest

## Required structure

- `app/` UI + API routes
- `lib/` parser/pipeline/rendering logic
- `schemas/` Zod schemas
- `templates/cv_base.tex` fixed template
- `data/` deterministic step outputs
- `outputs/` generated `.tex` and diff markdown
- `tests/` unit tests

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Wizard flow

1. **Step 1: Profile**
- Fill profile fields.
- For MVP, `experiences`, `projects`, `education` are accepted as JSON arrays.
- Saves `data/user_profile.json`.

2. **Step 2: Job Description**
- Paste JD text and click extract.
- Writes:
- `data/jobs/<jobId>/job_spec.json`
- `data/jobs/<jobId>/job_description.txt`

3. **Step 3: Tailoring Questions**
- Displays extracted must requirements with evidence.
- Generates and collects clarification answers.
- Writes:
- `data/tailoring_plan.json`
- `data/jobs/<jobId>/tailoring_plan.json`

4. **Step 4: Generate CV**
- Renders tailored LaTeX CV.
- Generates markdown diff report from base CV to tailored CV.
- Writes:
- `outputs/cv_<jobId>.tex`
- `outputs/diff_<jobId>.md`
- `data/jobs/<jobId>/cv_artifact.json`

## Schemas

- `UserProfile`: experiences/projects/education/skills/languages/preferences
- `JobSpec`: role/seniority/responsibilities/requirements/stack with requirement `label + evidence + priority`
- `TailoringPlan`: positioning summary, highlights, gaps, questions, requirement mapping
- `CVArtifact`: metadata + artifact file paths
- `InterviewSession`: stub schema for future interview coaching

## Pipeline functions

- `parseJobDescription(jdText) -> JobSpec`
- `buildTailoringPlan(userProfile, jobSpec) -> TailoringPlan`
- `generateQuestions(tailoringPlan) -> string[]`
- `renderLatexCV(userProfile, tailoringPlan) -> cv_<id>.tex`
- `generateDiffReport(baseCV, tailoredCV, tailoringPlan) -> diff_<id>.md`

## API routes

- `POST /api/profile`
- `POST /api/job-spec`
- `POST /api/tailoring-plan`
- `POST /api/generate-cv`

## Tests

Run:

```bash
npm test
```

Coverage focus:
- schema validation
- JD parsing evidence requirement
- tailoring plan generation and missing-gap questions
- LaTeX rendering and template immutability

## Notes for extension

- Replace `MockLLMProvider` with a real provider implementation behind the same interface.
- Persist to a database when moving beyond MVP.
- Add PDF compilation and richer diff heuristics if needed.
