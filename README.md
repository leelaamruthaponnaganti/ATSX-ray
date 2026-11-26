# ATSXray — Smart ATS Resume Checker

A free, transparent, single-page ATS analyzer. Semantic keyword matching, a raw-text "Recruiter's Eye" X-Ray view, and bullet-impact / anti-stuffing analysis — no sign-up, no paywall, no API key required.

## Run it

```powershell
npm.cmd install
npm.cmd run dev
```

Open <http://localhost:3000>. Click **Load demo resume** and **Load sample JD**, then **Analyze resume** — the whole flow is ready in one click.

Other commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run smoke   # with the dev server running
```

## What makes it different

1. **Semantic + exact matching** — canonical synonym groups make `ReactJS` → `React`, `managed teams` → `project management`, `JS` → `JavaScript`. Stemming and fuzzy matching add partial credit instead of false negatives.
2. **Recruiter's Eye X-Ray** — a split view of structure checks, metadata and the verbatim raw text produced by the parser, so broken columns, tables and image-only PDFs are immediately visible.
3. **Anti-stuffing & impact** — metrics (`%`, `$`, counts), action verbs, weak phrasing, repeated bullet openers and keyword density are checked explicitly. Stuffing *reduces* the score.
4. **One uninterrupted page** — input → animated progress → interactive bento-style results, with responsive layouts and reduced-motion support.

## Architecture

```text
app/api/analyze/route.ts   Multipart upload (pdf-parse / mammoth) or JSON pasted text
lib/parsing/               Magic-byte validation, friendly error taxonomy
lib/text/                  Normalization, tokenization, synonym dictionary, fuzzy matching
lib/analysis/              JD keyword ranking, TF-IDF cosine, matching, impact, structure, scoring
lib/providers/             Hybrid-local engine + optional OpenAI/Gemini hook
components/                Input, progress and results dashboard UI
lib/sample-data.ts         One-click demo resume + job description
```

### Scoring

`hard skills 30% + role alignment 25% + soft skills 15% + bullet impact 15% + structure 15% − stuffing penalty (max 10)`.

Hard/soft skill scores are weighted coverage: exact matches earn full credit, synonym matches 0.78, partial/fuzzy matches ~0.55–0.72. Role alignment combines TF-IDF cosine similarity, critical-requirement coverage and exact-match ratio. Every pill in the UI has a tooltip explaining why it was classified that way.

### Error handling

Empty, oversized (>10 MB), unsupported, encrypted, corrupt and image-only files all return friendly `{ error: { code, message } }` responses with the correct HTTP status instead of crashing.

### Optional LLM hook

The app is fully functional offline. To add AI coaching on top of the deterministic score:

```powershell
copy .env.example .env.local
```

Then set `ATS_LLM_PROVIDER=openai` with `OPENAI_API_KEY`, or `gemini` with `GEMINI_API_KEY`, and restart. If the key is missing or the request fails, `LlmProvider` silently falls back to the hybrid engine. The numeric score always stays explainable and reproducible.

## API

`POST /api/analyze`

- `multipart/form-data`: `resume` (PDF/DOCX) + `jobDescription`
- `application/json`: `{ resumeText, jobDescription, fileName?, fileType? }`

Returns `AnalysisResult` (see `lib/types.ts`). `GET /api/health` reports engine availability.
