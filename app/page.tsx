"use client";

import { useMemo, useState } from "react";

type Requirement = { label: string; evidence: string; priority: string };

type JobSpec = {
  id: string;
  role: string;
  seniority: string;
  responsibilities: Requirement[];
  requirements_must: Requirement[];
  requirements_nice: Requirement[];
  stack: string[];
};

type TailoringPlan = {
  jobId: string;
  positioning_summary: string;
  highlight_bullets: string[];
  gaps: string[];
  questions: string[];
  mapping: Array<{
    requirement_label: string;
    requirement_evidence: string;
    user_evidence: string[];
    status: string;
  }>;
};

type GenerateResult = {
  artifact: {
    outputTexPath: string;
    diffReportPath: string;
  };
  preview: {
    latex: string;
    diff: string;
  };
};

const initialProfile = {
  fullName: "",
  headline: "",
  summary: "",
  skillsCsv: "",
  languagesCsv: "",
  experiencesJson: "[]",
  projectsJson: "[]",
  educationJson: "[]"
};

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState(initialProfile);
  const [jobDescription, setJobDescription] = useState("");

  const [jobSpec, setJobSpec] = useState<JobSpec | null>(null);
  const [tailoringPlan, setTailoringPlan] = useState<TailoringPlan | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  const parsedProfile = useMemo(() => {
    try {
      return {
        fullName: profile.fullName,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skillsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: profile.languagesCsv
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [name, level] = entry.split(":").map((x) => x.trim());
            return { name: name || "Unknown", level: level || "Unspecified" };
          }),
        experiences: JSON.parse(profile.experiencesJson || "[]"),
        projects: JSON.parse(profile.projectsJson || "[]"),
        education: JSON.parse(profile.educationJson || "[]"),
        preferences: { locations: [] as string[] }
      };
    } catch {
      return null;
    }
  }, [profile]);

  async function saveProfile() {
    if (!parsedProfile) {
      setMessage("Invalid JSON in profile sections. Please fix before saving.");
      return;
    }

    setBusy(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: parsedProfile })
    });
    const data = await res.json();
    setBusy(false);

    if (!data.ok) {
      setMessage(data.error || "Could not save profile");
      return;
    }

    setMessage("Profile saved to data/user_profile.json");
    setStep(2);
  }

  async function parseJobSpec() {
    setBusy(true);
    setMessage("");

    const res = await fetch("/api/job-spec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText: jobDescription })
    });
    const data = await res.json();
    setBusy(false);

    if (!data.ok) {
      setMessage(data.error || "Failed to parse JD");
      return;
    }

    setJobSpec(data.jobSpec);
    setMessage(`JobSpec saved to data/jobs/${data.jobSpec.id}/job_spec.json`);
    setStep(3);

    const planRes = await fetch("/api/tailoring-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: data.jobSpec.id, answers: [] })
    });
    const planData = await planRes.json();
    if (planData.ok) {
      setTailoringPlan(planData.tailoringPlan);
    }
  }

  async function submitAnswers() {
    if (!jobSpec) return;

    setBusy(true);
    setMessage("");

    const payloadAnswers = Object.entries(answers).map(([question, answer]) => ({
      question,
      answer
    }));

    const res = await fetch("/api/tailoring-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: jobSpec.id, answers: payloadAnswers })
    });

    const data = await res.json();
    setBusy(false);

    if (!data.ok) {
      setMessage(data.error || "Failed to update tailoring plan");
      return;
    }

    setTailoringPlan(data.tailoringPlan);
    setMessage("Tailoring plan updated and stored under data/tailoring_plan.json");
    setStep(4);
  }

  async function generateCV() {
    if (!jobSpec) return;

    setBusy(true);
    setMessage("");

    const res = await fetch("/api/generate-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: jobSpec.id })
    });

    const data = await res.json();
    setBusy(false);

    if (!data.ok) {
      setMessage(data.error || "Failed to generate CV artifacts");
      return;
    }

    setGenerateResult(data);
    setMessage(`Generated ${data.artifact.outputTexPath} and ${data.artifact.diffReportPath}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 card p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Job Finder Assistant (MVP)</h1>
        <p className="mt-2 text-slate-700">
          Deterministic workflow: Profile -> JobSpec extraction (with evidence) -> Tailoring questions -> LaTeX CV + diff report
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${step === n ? "bg-blue-700 text-white" : "bg-white text-slate-700"}`}
            onClick={() => setStep(n)}
          >
            Step {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Step 1: Profile Wizard</h2>
          <input className="w-full rounded border p-2" placeholder="Full name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Headline" value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} />
          <textarea className="w-full rounded border p-2" rows={3} placeholder="Summary" value={profile.summary} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Skills CSV (e.g. TypeScript, Next.js, SQL)" value={profile.skillsCsv} onChange={(e) => setProfile({ ...profile, skillsCsv: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Languages CSV with level (e.g. English:Fluent, Italian:Native)" value={profile.languagesCsv} onChange={(e) => setProfile({ ...profile, languagesCsv: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">Experiences JSON array</label>
          <textarea className="w-full rounded border p-2 font-mono text-sm" rows={6} value={profile.experiencesJson} onChange={(e) => setProfile({ ...profile, experiencesJson: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">Projects JSON array</label>
          <textarea className="w-full rounded border p-2 font-mono text-sm" rows={5} value={profile.projectsJson} onChange={(e) => setProfile({ ...profile, projectsJson: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">Education JSON array</label>
          <textarea className="w-full rounded border p-2 font-mono text-sm" rows={5} value={profile.educationJson} onChange={(e) => setProfile({ ...profile, educationJson: e.target.value })} />
          <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white" onClick={saveProfile} disabled={busy}>
            Save Profile
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Step 2: Paste Job Description</h2>
          <textarea className="w-full rounded border p-2" rows={14} placeholder="Paste full JD text" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
          <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white" onClick={parseJobSpec} disabled={busy}>
            Extract JobSpec
          </button>

          {jobSpec && (
            <div className="rounded border border-slate-200 p-4">
              <p><strong>Role:</strong> {jobSpec.role}</p>
              <p><strong>Seniority:</strong> {jobSpec.seniority}</p>
              <p><strong>Stack:</strong> {jobSpec.stack.join(", ") || "None extracted"}</p>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="card space-y-5 p-6">
          <h2 className="text-xl font-semibold">Step 3: Tailoring Questions</h2>

          {jobSpec && (
            <div>
              <h3 className="mb-2 font-semibold">Extracted Must Requirements + Evidence</h3>
              <ul className="space-y-2">
                {jobSpec.requirements_must.map((req) => (
                  <li key={req.label} className="rounded border p-3">
                    <p className="font-medium">{req.label}</p>
                    <p className="text-sm text-slate-600">Evidence: "{req.evidence}"</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tailoringPlan && tailoringPlan.questions.length > 0 ? (
            <div className="space-y-3">
              {tailoringPlan.questions.map((question) => (
                <div key={question}>
                  <label className="mb-1 block text-sm font-medium">{question}</label>
                  <textarea
                    className="w-full rounded border p-2"
                    rows={2}
                    value={answers[question] || ""}
                    onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                  />
                </div>
              ))}
              <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white" onClick={submitAnswers} disabled={busy}>
                Save Answers and Update Plan
              </button>
            </div>
          ) : (
            <p className="text-slate-700">No open questions generated.</p>
          )}
        </section>
      )}

      {step === 4 && (
        <section className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Step 4: Generate CV + Diff Report</h2>
          <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white" onClick={generateCV} disabled={busy || !jobSpec}>
            Generate CV
          </button>

          {generateResult && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                Output files: <code>{generateResult.artifact.outputTexPath}</code> and <code>{generateResult.artifact.diffReportPath}</code>
              </p>
              <div>
                <h3 className="font-semibold">LaTeX Preview</h3>
                <pre className="max-h-64 overflow-auto rounded border bg-slate-950 p-3 text-xs text-slate-100">
                  {generateResult.preview.latex}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold">Diff Preview</h3>
                <pre className="max-h-64 overflow-auto rounded border bg-white p-3 text-xs">
                  {generateResult.preview.diff}
                </pre>
              </div>
            </div>
          )}
        </section>
      )}

      <p className="mt-4 text-sm text-slate-700">{busy ? "Working..." : message}</p>
    </main>
  );
}
