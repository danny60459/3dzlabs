import TerminalHeader from "@/components/TerminalHeader";

export const metadata = {
  title: "AI Learning Hub — 3DZLABS",
  description:
    "The best AI courses, certifications, and learning resources to level up your skills in 2026.",
};

const courses = [
  {
    name: "Google AI Essentials",
    platform: "Coursera",
    level: "Beginner",
    pricing: "Free to audit",
    url: "https://www.coursera.org",
  },
  {
    name: "Prompt Engineering for Everyone",
    platform: "Coursera",
    level: "Beginner",
    pricing: "Free to audit",
    url: "https://www.coursera.org",
  },
  {
    name: "Machine Learning Specialization",
    platform: "Coursera",
    level: "Intermediate",
    pricing: "Paid",
    url: "https://www.coursera.org",
  },
  {
    name: "Generative AI with Large Language Models",
    platform: "Coursera",
    level: "Intermediate",
    pricing: "Paid",
    url: "https://www.coursera.org",
  },
  {
    name: "AI For Beginners",
    platform: "Skillshare",
    level: "Beginner",
    pricing: "Free trial",
    url: "https://www.skillshare.com",
  },
  {
    name: "ChatGPT Complete Guide",
    platform: "Udemy",
    level: "Beginner",
    pricing: "Paid",
    url: "https://www.udemy.com",
  },
  {
    name: "Deep Learning Specialization",
    platform: "Coursera",
    level: "Advanced",
    pricing: "Paid",
    url: "https://www.coursera.org",
  },
  {
    name: "Google Data Analytics Certificate",
    platform: "Coursera",
    level: "Beginner",
    pricing: "Paid",
    url: "https://www.coursera.org",
  },
];

const levelColors = {
  Beginner: { text: "text-brand-green", border: "border-brand-green" },
  Intermediate: { text: "text-yellow-400", border: "border-yellow-400" },
  Advanced: { text: "text-red-400", border: "border-red-400" },
};

const pricingColors = {
  "Free to audit": "text-brand-green",
  "Free trial": "text-brand-green",
  Paid: "text-brand-text",
};

export default function LearningPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-mono">
      <TerminalHeader />

      <main className="flex-1 px-6 py-4 max-w-7xl mx-auto w-full">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="border-b border-brand-border mb-10 py-16">
          <p className="text-xs text-brand-text tracking-widest mb-2 uppercase">
            // system.ai.learning
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-green leading-tight mb-4">
            AI Learning Hub
          </h1>
          <p className="text-brand-text max-w-2xl text-sm leading-relaxed">
            The best AI courses, certifications, and learning resources to level
            up your skills in 2026. Curated from top platforms so you can find
            the right path fast.
          </p>
        </section>

        {/* ── Article intro ────────────────────────────────────────────────── */}
        <section className="mb-12 max-w-3xl">
          <p className="text-xs text-brand-text tracking-widest uppercase mb-6">
            // why it matters
          </p>

          <div className="space-y-5 text-sm text-brand-text leading-relaxed">
            <p>
              AI is no longer a niche discipline reserved for researchers and
              data scientists. In 2026 it has become the defining skill layer
              across virtually every industry — from marketing and finance to
              healthcare and software engineering. Professionals who understand
              how to work alongside AI systems, prompt them effectively, and
              interpret their outputs are consistently landing better roles and
              commanding higher salaries. The window to get ahead of this curve
              is still open, but it is closing fast.
            </p>
            <p>
              This page is for anyone at any stage of the journey:{" "}
              <span className="text-brand-green">complete beginners</span> who
              have never written a line of code and want to understand what all
              the noise is about;{" "}
              <span className="text-brand-green">career changers</span> looking
              to pivot into AI, machine learning, or data roles; and{" "}
              <span className="text-brand-green">working professionals</span>{" "}
              who already use AI tools day-to-day and want to deepen their
              technical foundations or earn a credential that signals expertise
              to employers.
            </p>
            <p>
              Choosing the right course comes down to three questions: What is
              your current skill level? Do you need a formal certificate or just
              practical know-how? And how much time can you commit per week? A
              short beginner course like{" "}
              <em>Google AI Essentials</em> can be completed in a weekend and
              gives you a solid mental model with no prior experience required.
              A specialization like Andrew Ng&apos;s{" "}
              <em>Deep Learning Specialization</em> is a multi-month commitment
              that will genuinely transform your technical depth. Match the
              course to the goal, not the other way around.
            </p>
            <p>
              Every course listed below has been hand-picked from platforms
              including <span className="text-brand-green">Coursera</span>,{" "}
              <span className="text-brand-green">Skillshare</span>, and{" "}
              <span className="text-brand-green">Udemy</span> — the three
              largest online learning providers for AI and tech education.
              Where possible we have noted whether the course can be audited for
              free, so you can evaluate the content before committing to a paid
              plan or certificate track.
            </p>
          </div>
        </section>

        {/* ── Course cards ─────────────────────────────────────────────────── */}
        <section className="mb-16">
          <p className="text-xs text-brand-text tracking-widest uppercase mb-2">
            // curated courses
          </p>
          <h2 className="text-2xl font-bold text-brand-green mb-8">
            Featured Courses &amp; Certifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const lvl = levelColors[course.level] ?? levelColors.Beginner;
              const prc = pricingColors[course.pricing] ?? "text-brand-text";
              return (
                <div
                  key={course.name}
                  className="group relative flex flex-col bg-brand-surface border border-brand-border hover:border-brand-green transition-colors duration-200 p-5"
                >
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Platform + level row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-widest text-brand-text uppercase">
                      {course.platform}
                    </span>
                    <span
                      className={`text-xs border px-2 py-0.5 tracking-wider uppercase ${lvl.text} ${lvl.border}`}
                    >
                      {course.level}
                    </span>
                  </div>

                  {/* Course name */}
                  <h3 className="text-sm font-bold text-brand-green group-hover:text-white transition-colors duration-200 leading-snug mb-3 flex-1">
                    {course.name}
                  </h3>

                  {/* Pricing */}
                  <p className={`text-xs mb-4 ${prc}`}>{course.pricing}</p>

                  {/* CTA */}
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green transition-colors duration-200 px-3 py-2 text-center tracking-widest"
                  >
                    &gt; view course &rarr;
                  </a>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <footer className="border-t border-brand-border px-6 py-4 text-xs text-brand-text flex justify-between">
        <span>3DZLABS.COM — AI Tools Hub</span>
        <span className="text-brand-green">v0.1.0</span>
      </footer>
    </div>
  );
}
