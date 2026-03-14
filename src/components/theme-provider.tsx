import { useRouter } from "@tanstack/react-router";
import { createContext, use, type PropsWithChildren } from "react";
import { setTheme as setThemeServerFn, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (val: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  theme,
}: PropsWithChildren<{ theme: Theme }>) {
  const router = useRouter();

  function handleSetTheme(val: Theme) {
    setThemeServerFn({ data: val }).then(() => router.invalidate());
  }

  return (
    <ThemeContext value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const val = use(ThemeContext);
  if (!val) throw new Error("useTheme must be used within ThemeProvider");
  return val;
}
