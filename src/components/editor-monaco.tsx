import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";

interface EditorMonacoProps {
  value: string;
  className?: string;
}

export function EditorMonaco({ value, className }: EditorMonacoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import("monaco-editor-core").editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();

  const monacoTheme = theme === "dark" ? "tokyo-night" : "one-light";

  useEffect(() => {
    let disposed = false;

    async function init() {
      if (!containerRef.current) return;

      const monaco = await import("monaco-editor-core");
      const { createHighlighter } = await import("shiki");
      const { shikiToMonaco } = await import("@shikijs/monaco");

      if (disposed) return;

      const highlighter = await createHighlighter({
        themes: ["tokyo-night", "one-light"],
        langs: ["json"],
      });

      if (disposed) return;

      monaco.languages.register({ id: "json" });
      shikiToMonaco(highlighter, monaco);

      const editor = monaco.editor.create(containerRef.current!, {
        language: "json",
        theme: monacoTheme,
        fontSize: 16,
        bracketPairColorization: { enabled: false },
        glyphMargin: false,
        automaticLayout: true,
        wordWrap: "on",
        folding: false,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        minimap: { enabled: false },
        padding: { top: 8 },
        overviewRulerLanes: 0,
        fixedOverflowWidgets: true,
        value,
        readOnly: true,
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {},
      );

      editorRef.current = editor;
    }

    init();

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update value when it changes
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      import("monaco-editor-core").then((monaco) => {
        monaco.editor.setTheme(monacoTheme);
      });
    }
  }, [monacoTheme]);

  return <div ref={containerRef} className={className} />;
}
