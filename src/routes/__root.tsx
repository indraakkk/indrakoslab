import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Heart, Github } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { getTheme } from "@/lib/theme";
import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Indrakoslab" },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,200..900;1,200..700&display=swap",
      },
    ],
  }),
  loader: () => getTheme(),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const theme = Route.useLoaderData();

  return (
    <html lang="en" className={theme} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans">
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-svh flex flex-col justify-between">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="flex flex-col items-center gap-3 py-10 pb-24 md:pb-10">
        <span className="flex items-center text-sm text-muted-foreground">
          Made with <Heart className="w-4 h-4 mx-2" /> from SUB
        </span>
        <div className="flex gap-4">
          <a
            href="https://github.com/indraakkk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
