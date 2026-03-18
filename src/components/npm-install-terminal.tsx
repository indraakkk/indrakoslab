import { useState, useEffect, useCallback } from "react";
import { useInView } from "@/hooks/use-in-view";

interface Experience {
  company: string;
  role: string | string[];
  startDate: string;
  endDate: string;
}

interface MainStack {
  lang: string[];
  "meta-framework": string;
  db: string[];
  orm: string[];
  style: string[];
  server: string;
  tooling: string[];
}

interface SecondaryStack {
  lang: string;
  "meta-framework": string;
  server: string[];
}

export interface NpmInstallTerminalProps {
  profile: {
    name: string;
    github: string;
    experiences: Experience[];
  };
  mainStack: MainStack;
  secondaryStack: SecondaryStack;
}

type Phase = "idle" | "typing" | "loading" | "revealed";

const COMMAND = "npm install indra-putra";
const TYPING_SPEED = 60;
const LOADING_DURATION = 1500;

export function NpmInstallTerminal({
  profile,
  mainStack,
  secondaryStack,
}: NpmInstallTerminalProps) {
  const [ref, isInView] = useInView({ threshold: 0.2 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
      setPhase("revealed");
      setTypedChars(COMMAND.length);
    }
  }, []);

  // Start typing when in view
  useEffect(() => {
    if (isInView && phase === "idle" && !reducedMotion) {
      setPhase("typing");
    }
  }, [isInView, phase, reducedMotion]);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;

    if (typedChars < COMMAND.length) {
      const timeout = setTimeout(() => {
        setTypedChars((c) => c + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    }

    // Typing done, move to loading
    const pause = setTimeout(() => setPhase("loading"), 300);
    return () => clearTimeout(pause);
  }, [phase, typedChars]);

  // Loading phase
  useEffect(() => {
    if (phase !== "loading") return;

    const timeout = setTimeout(() => setPhase("revealed"), LOADING_DURATION);
    return () => clearTimeout(timeout);
  }, [phase]);

  const formatDate = useCallback((date: string) => {
    const parts = date.split(" ");
    return parts[0].slice(0, 3) + " " + parts[1].slice(-2);
  }, []);

  const totalSkills = [
    ...mainStack.lang,
    mainStack["meta-framework"],
    ...mainStack.db,
    ...mainStack.orm,
    ...mainStack.style,
    mainStack.server,
    ...mainStack.tooling,
  ].length;

  const dependencies: Record<string, string> = {};
  for (const lang of mainStack.lang)
    dependencies[lang.toLowerCase()] =
      lang === "Javascript" ? '"^ES2024"' : '"^5.x"';
  dependencies[mainStack["meta-framework"].toLowerCase()] = '"latest"';
  for (const style of mainStack.style)
    dependencies[style.toLowerCase()] =
      style === "TailwindCSS" ? '"^4.x"' : '"latest"';
  for (const db of mainStack.db)
    dependencies[db.toLowerCase()] =
      db === "PostgreSQL" ? '"^16"' : '"latest"';
  for (const orm of mainStack.orm)
    dependencies[orm.toLowerCase()] = '"latest"';
  dependencies[mainStack.server.toLowerCase()] = '"^4.x"';

  const peerDeps: Record<string, string> = {
    [secondaryStack.lang.toLowerCase()]: '"^8.x"',
    [secondaryStack["meta-framework"].toLowerCase()]: '"^10.x"',
  };
  for (const s of secondaryStack.server) {
    peerDeps[s.toLowerCase()] = '"latest"';
  }

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto">
      {/* Terminal window */}
      <div className="rounded-lg overflow-hidden shadow-2xl border border-[#313244]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#181825]">
          <span className="w-3 h-3 rounded-full bg-[#f38ba8]" />
          <span className="w-3 h-3 rounded-full bg-[#f9e2af]" />
          <span className="w-3 h-3 rounded-full bg-[#a6e3a1]" />
          <span className="ml-2 text-xs text-[#6c7086] font-mono">
            indra@dev ~ zsh
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-[#1e1e2e] p-4 md:p-6 font-mono text-sm md:text-base min-h-[200px]">
          {/* Command line */}
          <div className="flex flex-wrap">
            <span className="text-[#a6e3a1]">$</span>
            <span className="ml-2 text-[#cdd6f4]">
              {COMMAND.slice(0, typedChars)}
            </span>
            {phase === "idle" || phase === "typing" ? (
              <span className="animate-blink text-[#cdd6f4]">▌</span>
            ) : null}
          </div>

          {/* Loading phase */}
          {(phase === "loading" || phase === "revealed") && (
            <div className="mt-4">
              {phase === "loading" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#313244] rounded-full overflow-hidden">
                      <div className="h-full bg-[#a6e3a1] rounded-full animate-progress" />
                    </div>
                  </div>
                  <p className="text-[#6c7086] text-xs mt-1">
                    resolving dependencies...
                  </p>
                </>
              )}

              {/* Revealed content */}
              {phase === "revealed" && (
                <div className="animate-fade-in">
                  <p className="text-[#a6e3a1]">+ indra-putra@5.0.0</p>

                  {/* Package card */}
                  <div className="mt-4 border border-[#313244] rounded-md p-4 md:p-5">
                    <p className="text-[#cba6f7] font-bold text-base md:text-lg">
                      indra-putra{" "}
                      <span className="text-[#6c7086] font-normal text-sm">
                        v5.0.0
                      </span>
                    </p>
                    <p className="text-[#6c7086] text-xs mt-1">
                      &quot;Fullstack Developer based in Singapore&quot;
                    </p>

                    <div className="mt-4 space-y-1 text-xs md:text-sm">
                      <Line label="homepage" value="github.com/indraakkk" />
                      <Line label="license" value="Open to Opportunities" />
                      <Line
                        label="maintained"
                        value="✓ actively"
                        valueClass="text-[#a6e3a1]"
                      />
                    </div>

                    {/* Dependencies */}
                    <div className="mt-4">
                      <p className="text-[#f9e2af] text-xs md:text-sm">
                        dependencies &#123;
                      </p>
                      <div className="pl-4 space-y-0.5 mt-1">
                        {Object.entries(dependencies).map(([name, ver]) => (
                          <p
                            key={name}
                            className="text-xs md:text-sm text-[#cdd6f4]"
                          >
                            <span className="text-[#89b4fa]">
                              &quot;{name}&quot;
                            </span>
                            <span className="text-[#6c7086]"> : </span>
                            <span className="text-[#a6e3a1]">{ver}</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-[#f9e2af] text-xs md:text-sm mt-1">
                        &#125;
                      </p>
                    </div>

                    {/* Peer Dependencies */}
                    <div className="mt-3">
                      <p className="text-[#f9e2af] text-xs md:text-sm">
                        peerDependencies &#123;
                      </p>
                      <div className="pl-4 space-y-0.5 mt-1">
                        {Object.entries(peerDeps).map(([name, ver]) => (
                          <p
                            key={name}
                            className="text-xs md:text-sm text-[#cdd6f4]"
                          >
                            <span className="text-[#89b4fa]">
                              &quot;{name}&quot;
                            </span>
                            <span className="text-[#6c7086]"> : </span>
                            <span className="text-[#a6e3a1]">{ver}</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-[#f9e2af] text-xs md:text-sm mt-1">
                        &#125;
                      </p>
                    </div>

                    {/* Changelog */}
                    <div className="mt-3">
                      <p className="text-[#f9e2af] text-xs md:text-sm">
                        changelog &#123;
                      </p>
                      <div className="pl-4 space-y-0.5 mt-1">
                        {profile.experiences.map((exp, i) => {
                          const version = `${5 - i}.0`;
                          const role = Array.isArray(exp.role)
                            ? exp.role[0]
                            : exp.role;
                          return (
                            <p
                              key={exp.company}
                              className="text-xs md:text-sm text-[#cdd6f4]"
                            >
                              <span className="text-[#cba6f7]">{version}</span>
                              <span className="text-[#6c7086]"> </span>
                              <span>
                                {exp.company} &mdash; {role.split(" ")[0]}
                              </span>
                              <span className="text-[#6c7086] ml-2">
                                {formatDate(exp.startDate)} &ndash;{" "}
                                {formatDate(exp.endDate)}
                              </span>
                            </p>
                          );
                        })}
                      </div>
                      <p className="text-[#f9e2af] text-xs md:text-sm mt-1">
                        &#125;
                      </p>
                    </div>

                    {/* Summary stats */}
                    <div className="mt-4 space-y-0.5 text-xs md:text-sm">
                      <p className="text-[#a6e3a1]">
                        ✓ {totalSkills} skills installed
                      </p>
                      <p className="text-[#a6e3a1]">
                        ✓ {profile.experiences.length} companies contributed to
                      </p>
                      <p className="text-[#a6e3a1]">✓ 0 vulnerabilities</p>
                    </div>
                  </div>

                  {/* Final prompt */}
                  <div className="mt-4 flex">
                    <span className="text-[#a6e3a1]">$</span>
                    <span className="ml-2 animate-blink text-[#cdd6f4]">
                      ▌
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  valueClass = "text-[#cdd6f4]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <p className="text-[#cdd6f4]">
      <span className="text-[#6c7086]">{label.padEnd(12)}</span>
      <span className="text-[#6c7086]">: </span>
      <span className={valueClass}>{value}</span>
    </p>
  );
}
