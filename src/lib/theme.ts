import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const themeSchema = z.union([z.literal("light"), z.literal("dark")]);
export type Theme = z.infer<typeof themeSchema>;

const STORAGE_KEY = "theme";

export const getTheme = createServerFn().handler(
  async () => (getCookie(STORAGE_KEY) || "light") as Theme,
);

export const setTheme = createServerFn({ method: "POST" })
  .validator(themeSchema)
  .handler(async ({ data }) => {
    setCookie(STORAGE_KEY, data);
  });
