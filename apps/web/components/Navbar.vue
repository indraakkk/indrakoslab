<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';

const colorMode = useColorMode();
const handleChange = () => {
  colorMode.value === 'dark'
    ? (colorMode.preference = 'light')
    : (colorMode.preference = 'dark');
};
</script>

<template>
  <header>
    <div class="flex gap-3 justify-center">
      <div
        class="flex items-center border dark:border-white border-black shadow-lg rounded-full px-4 py-2 m-3 gap-3"
      >
        <p>indrakoslab</p>
        <span>|</span>
        <nav>
          <ul class="flex flex-row gap-6">
            <li>Home</li>
            <li>Blog</li>
          </ul>
        </nav>

        <span>|</span>

        <ColorScheme>
          <Button :variant="'ghost'" :size="'icon'" @click="handleChange()">
            <component
              :is="colorMode.value == 'dark' ? Moon : Sun"
              class="w-5 h-5"
            />
          </Button>
        </ColorScheme>
      </div>
    </div>
  </header>
</template>
