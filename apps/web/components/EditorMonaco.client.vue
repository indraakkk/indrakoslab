<script setup lang="ts">
import { createHighlighter } from 'shiki';
import { shikiToMonaco } from '@shikijs/monaco';
import * as monaco from 'monaco-editor-core';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'change', value: string): void;
}>();

const el = ref<HTMLDivElement>();

const colorMode = useColorMode();

const theme = computed(() =>
  colorMode.value === 'dark' ? 'vitesse-dark' : 'vitesse-light'
);

// Create the highlighter, it can be reused
const highlighter = await createHighlighter({
  themes: ['vitesse-dark', 'vitesse-light'],
  langs: ['json'],
});

monaco.languages.register({ id: 'json' });

watch(
  () => el.value,
  async (value) => {
    if (!value) return;

    shikiToMonaco(highlighter, monaco);

    const editor = monaco.editor.create(value, {
      language: 'json',
      theme: theme.value,
      fontSize: 14,
      bracketPairColorization: {
        enabled: false,
      },
      glyphMargin: false,
      automaticLayout: true,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      minimap: {
        enabled: false,
      },
      padding: {
        top: 8,
      },
      overviewRulerLanes: 0,
      fixedOverflowWidgets: true,
      value: props.modelValue,
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      emit('update:modelValue', value);
      emit('change', value);
    });

    watch(theme, () => monaco.editor.setTheme(theme.value));
  }
);

monaco;
</script>

<template>
  <div ref="el" />
</template>
