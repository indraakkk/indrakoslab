<script setup lang="ts">
const colorMode = useColorMode();
const theme = ref({
  dark() {
    colorMode.preference = 'dark';
  },
  light() {
    colorMode.preference = 'light';
  },
  active: false,
});

const handleChange = (state: boolean) => {
  if (state) {
    theme.value.light();
    theme.value.active = true;
  } else {
    theme.value.dark();
    theme.value.active = false;
  }
};
</script>

<template>
  <header>
    <div class="flex gap-3 justify-center">
      <div
        class="flex border border-white shadow-md rounded-full px-6 py-3 m-3 gap-3"
      >
        <p>indrakoslab</p>
        <span>|</span>
        <nav>
          <ul class="flex flex-row gap-6">
            <li>Home</li>
            <li>About</li>
            <li>Blog</li>
          </ul>
        </nav>
        <span>|</span>
        <p>Dark</p>
        <Switch :checked="theme.active" @update:checked="handleChange" />
        <p>Light</p>
      </div>
    </div>
  </header>
</template>
