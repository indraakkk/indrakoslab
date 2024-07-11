<script setup lang="ts">
import { Heart } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-svh flex flex-col justify-between">
    <!-- layout -->
    <Navbar />
    <!-- content -->

    <main>
      <slot />
    </main>

    <!-- footer -->
    <footer class="flex justify-center py-10">
      <span class="flex items-center"
        >Made with <Heart class="w-4 h-4 mx-3" /> from SUB</span
      >
    </footer>
  </div>
</template>
