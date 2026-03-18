import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const BLOG_URL =
  import.meta.env.PROD
    ? "https://indrakoslab-blog.vercel.app"
    : "http://localhost:3001";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header>
      {/* Desktop: top center | Mobile: fixed bottom center */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center md:static md:bottom-auto md:mt-0">
        <div className="flex items-center border dark:border-white border-black shadow-lg rounded-full px-4 py-2 m-3 gap-3 bg-background/80 backdrop-blur-sm">
          <p className="font-medium">indrakoslab</p>
          <span className="text-muted-foreground">|</span>
          <nav>
            <ul className="flex flex-row gap-6">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a href={BLOG_URL} target="_blank" rel="noopener noreferrer">
                  Blog
                </a>
              </li>
            </ul>
          </nav>
          <span className="text-muted-foreground">|</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
