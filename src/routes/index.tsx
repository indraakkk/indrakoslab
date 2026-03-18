import { createFileRoute } from "@tanstack/react-router";
import { Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NpmInstallTerminal,
  type NpmInstallTerminalProps,
} from "@/components/npm-install-terminal";

const BLOG_URL =
  import.meta.env.PROD
    ? "https://indrakoslab-blog.vercel.app"
    : "http://localhost:3001";

const profileData: NpmInstallTerminalProps["profile"] = {
  name: "Indra Putra",
  github: "indraakkk",
  experiences: [
    {
      company: "A Life By Design",
      role: "Software Developer",
      startDate: "August 2023",
      endDate: "January 2024",
    },
    {
      company: "CPR Vision",
      role: "Software Developer",
      startDate: "October 2022",
      endDate: "August 2023",
    },
    {
      company: "Others",
      role: ["Full-stack Developer", "Backend Developer"],
      startDate: "October 2018",
      endDate: "September 2022",
    },
  ],
};

const mainStackData: NpmInstallTerminalProps["mainStack"] = {
  lang: ["Javascript", "Typescript"],
  "meta-framework": "NextJs",
  db: ["MySQL", "MariaDB", "PostgreSQL", "SQLite", "MongoDB"],
  orm: ["DrizzleORM", "Prisma"],
  style: ["TailwindCSS", "CSS"],
  server: "ExpressJs",
  tooling: ["pnpm", "bunJs", "NodeJs"],
};

const secondaryStackData: NpmInstallTerminalProps["secondaryStack"] = {
  lang: "PHP",
  "meta-framework": "Laravel",
  server: ["Lumen", "SlimPHP"],
};

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const scrollToWork = () => {
    document.getElementById("my-work")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100svh-80px)] flex items-center justify-center px-4 md:px-8">
        {/* Background layers */}
        <div className="hero-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="hero-glow absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-2xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Hey, I'm Indra Putra
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg text-balance">
            Fullstack Developer based in Singapore with 5+ years of experience
            building for the web.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" onClick={scrollToWork}>
              View My Work
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={BLOG_URL} target="_blank" rel="noopener noreferrer">
                Read My Blog
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
          <a
            href="https://github.com/indraakkk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors mt-2"
            aria-label="GitHub profile"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Terminal Section */}
      <section id="my-work" className="py-16 md:py-24 px-4 md:px-8">
        <NpmInstallTerminal
          profile={profileData}
          mainStack={mainStackData}
          secondaryStack={secondaryStackData}
        />
      </section>
    </div>
  );
}
