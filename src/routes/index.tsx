import { createFileRoute } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import { PlugZap, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditorMonaco = lazy(() =>
  import("@/components/editor-monaco").then((m) => ({
    default: m.EditorMonaco,
  })),
);

const masterData = {
  profile: `{
  "name": "Indra Putra",
  "github": "indraakkk",
  "experiences": [
    {
      "company": "A Life By Design",
      "role": "Software Developer",
      "startDate": "August 2023",
      "endDate": "January 2024",
      "description": "Contributed actively to a 4-day inception meeting, fostering a collaborative environment for ideation in kickstarting an ecommerce ecosystem. Implemented agile methodologies and functioned as a Scrum Master within a team of three developers. Translated designs into highly maintainable and scalable code, maintaining a commitment to thorough local testing. I follow coding best practice and based on code standard"
    },
    {
      "company": "CPR Vision",
      "role": "Software Developer",
      "startDate": "October 2022",
      "endDate": "August 2023",
      "description": "Building multiple websites for clients seasonal campaigns to highlight the product's unique selling points and engage with customers."
    },
    {
      "company": "Others",
      "role": ["Full-stack Developer", "Backend Developer"],
      "startDate": "October 2018",
      "endDate": "September 2022",
      "description": "Gained experience in diverse projects across various industries and companies. Examples include Chatbot, B2B Marketplace, Logistics, and Payment Gateway development."
    }
  ]
}`,
  mainStack: `{
  "lang": ["Javascript", "Typescript"],
  "meta-framework": "NextJs",
  "db": ["MySQL", "MariaDB", "PostgreSQL", "SQLite", "MongoDB"],
  "orm": ["DrizzleORM", "Prisma"],
  "style": ["TailwindCSS", "CSS"],
  "server": "ExpressJs",
  "tooling": ["pnpm", "bunJs", "NodeJs"]
}`,
  secondaryStack: `{
  "lang": "PHP",
  "meta-framework": "Laravel",
  "server": ["Lumen", "SlimPHP"]
}`,
} as const;

const fileNames = [
  "profile.json",
  "main-stack.json",
  "secondary-stack.json",
] as const;

type TabKey = "profile" | "mainStack" | "secondaryStack";

const tabKeyMap: Record<(typeof fileNames)[number], TabKey> = {
  "profile.json": "profile",
  "main-stack.json": "mainStack",
  "secondary-stack.json": "secondaryStack",
};

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [selectedTab, setSelectedTab] =
    useState<(typeof fileNames)[number]>("profile.json");
  const text = masterData[tabKeyMap[selectedTab]];

  return (
    <div className="container mx-auto px-4 md:px-8">
      <div className="min-h-full flex flex-col md:flex-row items-center justify-center gap-3">
        <div className="flex flex-col gap-6 w-full md:w-1/2">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-balance">
            Hi, I am Fullstack Developer
          </h1>
          <span className="text-balance">
            I'm frontend-leaning software developer with 5 years of experience,
            have worked for multiple companies based in Singapore. I'm passionate
            to translate designs into code for web development, ensuring
            high-quality results withing specific timelines.
          </span>
        </div>
        <div className="flex flex-col w-full md:w-1/2 h-fit rounded-lg border dark:border-white">
          <div className="w-full flex overflow-x-auto scroll-hidden">
            {fileNames.map((fn, index) => (
              <Button
                key={fn}
                variant="ghost"
                className={`flex items-center gap-1 rounded-none ${
                  fn === selectedTab ? "bg-accent" : ""
                } ${index === 0 ? "rounded-tl-md" : ""}`}
                onClick={() => setSelectedTab(fn)}
              >
                <Braces className="w-4 h-4" />
                {fn}
              </Button>
            ))}
          </div>
          <Suspense
            fallback={
              <div className="w-full min-h-[500px] flex items-center justify-center text-muted-foreground">
                Loading editor...
              </div>
            }
          >
            <EditorMonaco value={text} className="w-full min-h-[500px]" />
          </Suspense>
          <div>
            <PlugZap className="w-5 h-5 m-1 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
