import path from "path";
import type { TailoringPlan, UserProfile } from "@/schemas";
import { absPath, readTextFile, writeTextFile } from "@/lib/io";

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");
}

function toItemize(items: string[]): string {
  if (items.length === 0) return "\\item No details provided";
  return items.map((item) => `\\item ${esc(item)}`).join("\n");
}

function renderExperience(user: UserProfile): string {
  return user.experiences
    .map((exp) => {
      const bullets = toItemize(exp.bullets);
      return `\\textbf{${esc(exp.role)}} at ${esc(exp.company)} (${esc(exp.startDate)} -- ${esc(exp.endDate ?? "Present")})\\\\
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");
}

function renderProjects(user: UserProfile): string {
  return user.projects
    .map((p) => {
      const parts = [p.description, p.impact].filter(Boolean).join(" ");
      return `\\item \\textbf{${esc(p.name)}}: ${esc(parts || "No description provided")}`;
    })
    .join("\n");
}

function renderEducation(user: UserProfile): string {
  return user.education
    .map(
      (e) =>
        `\\item \\textbf{${esc(e.degree)}} ${e.field ? `in ${esc(e.field)}` : ""}, ${esc(e.institution)} ${e.endDate ? `(${esc(e.endDate)})` : ""}`
    )
    .join("\n");
}

export async function renderLatexCV(
  userProfile: UserProfile,
  tailoringPlan: TailoringPlan,
  options?: { outputId?: string; persist?: boolean }
): Promise<{ filePath: string; content: string; baseTemplatePath: string }> {
  const templatePath = absPath("templates", "cv_base.tex");
  const template = await readTextFile(templatePath);

  const compiled = compileLatexCV(template, userProfile, tailoringPlan);

  const outputId = options?.outputId ?? tailoringPlan.jobId;
  const outputPath = absPath("outputs", `cv_${outputId}.tex`);
  if (options?.persist !== false) {
    await writeTextFile(outputPath, compiled);
  }

  return {
    filePath: path.relative(absPath(), outputPath),
    content: compiled,
    baseTemplatePath: path.relative(absPath(), templatePath)
  };
}

export function compileLatexCV(
  template: string,
  userProfile: UserProfile,
  tailoringPlan: TailoringPlan
): string {
  return template
    .replace(/\{\{FULL_NAME\}\}/g, esc(userProfile.fullName))
    .replace(/\{\{HEADLINE\}\}/g, esc(userProfile.headline ?? "Candidate"))
    .replace(/\{\{SUMMARY\}\}/g, esc(userProfile.summary ?? tailoringPlan.positioning_summary))
    .replace(/\{\{SKILLS\}\}/g, esc(userProfile.skills.join(", ") || "Not provided"))
    .replace(/\{\{HIGHLIGHTS\}\}/g, toItemize(tailoringPlan.highlight_bullets))
    .replace(/\{\{EXPERIENCE\}\}/g, renderExperience(userProfile) || "No professional experience provided")
    .replace(/\{\{PROJECTS\}\}/g, renderProjects(userProfile) || "\\item No projects provided")
    .replace(/\{\{EDUCATION\}\}/g, renderEducation(userProfile) || "\\item No education entries provided")
    .replace(/\{\{LANGUAGES\}\}/g, esc(userProfile.languages.map((l) => `${l.name} (${l.level})`).join(", ") || "Not provided"));
}
