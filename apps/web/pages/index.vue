<script setup lang="ts">
import { PlugZap } from 'lucide-vue-next';

const value = ref('');
const editor = ref({
  lang: 'json',
  options: {
    minimap: {
      enabled: false,
    },
    theme: 'vs-dark',
  },
  value: value,
});

value.value = `{
  "name": "Indra Putra",
  "github": "indraakkk"
}`;
</script>

<template>
  <div class="container mx-auto">
    <div
      class="min-h-full flex flex-col md:flex-row items-center justify-center gap-3"
    >
      <div class="w-full md:w-1/2">
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold">
          Hi, I am Fullstack Developer
        </h1>
        <span
          >Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam
          praesentium reiciendis excepturi nesciunt! Tempora quo suscipit vitae,
          aliquam perspiciatis dolorum ipsa iusto repellat optio fuga nobis?
          Fugit labore minima deserunt.</span
        >
      </div>
      <div
        class="flex flex-col w-full md:w-1/2 h-fit rounded-lg border border-white"
      >
        <ColorScheme :placeholder="'loading...'">
          <div class="flex gap-3">
            <span>profile.json</span>
            <span>main-stack.json</span>
            <span>secondary-stack.json</span>
          </div>

          <MonacoEditor
            class="w-full min-h-96 rounded-lg!"
            v-model="editor.value"
            :lang="editor.lang"
            :options="editor.options"
          />
          <div><PlugZap class="w-5 h-5 m-1" /></div>
        </ColorScheme>
      </div>
    </div>
  </div>
</template>
