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
      <span>Made with ❤️ from SUB</span>
    </footer>
  </div>
</template>
