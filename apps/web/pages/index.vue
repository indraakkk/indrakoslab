<script setup lang="ts">
import { PlugZap, Braces } from 'lucide-vue-next';
const masterData = {
  profile: `{
  "name": "Indra Putra",
  "github": "indraakkk",
  "experiences": [
    {
      "company": "A Life By Design",
      "role": "Software Developer",
      "startDate": "August 2023",
      "endDate": "January 2024",
      "description": "Contributed actively to a 4-day inception meeting, fostering a collaborative environment for ideation in kickstarting an ecommerce ecosystem. Implemented agile methodologies and functioned as a Scrum Master within a team of three developers. Translated designs into highly maintainable and scalable code, maintaining a commitment to thorough local testing. I follow coding best practice and based on code standard"
    },
    {
      "company": "CPR Vision",
      "role": "Software Developer",
      "startDate": "October 2022",
      "endDate": "August 2023",
      "description": "Building multiple websites for clients seasonal campaigns to highlight the product's unique selling points and engage with customers."
    },
    {
      "company": "Others",
      "role": ["Full-stack Developer", "Backend Developer"],
      "startDate": "October 2018",
      "endDate": "September 2022",
      "description": "Gained experience in diverse projects across various industries and companies. Examples include Chatbot, B2B Marketplace, Logistics, and Payment Gateway development."
    },
  ]
}`,
  mainStack: `{
  "lang": ["Javascript", "Typescript"],
  "meta-framework": "NextJs",
  "db": ["MySQL", "MariaDB", "PostgreSQL", "SQLite", "MongoDB"],
  "orm": ["DrizzleORM", "Prisma"],
  "style": ["TailwindCSS", "CSS"],
  "server": "ExpressJs",
  "tooling": ["pnpm", "bunJs", "NodeJs"]
}`,
  secondaryStack: `{
  "lang": "PHP",
  "meta-framework": "Laravel",
  "server": ["Lumen", "SlimPHP"],
}`,
};

const fileNames = ['profile.json', 'main-stack.json', 'secondary-stack.json'];
const selectedTab = ref(fileNames[0]);
const text = ref(masterData.profile);

const changeTab = (fn: string) => {
  selectedTab.value = fn;

  const returnSelect = (
    fn: string
  ): 'profile' | 'mainStack' | 'secondaryStack' => {
    return fn
      .replace('.json', '')
      .replace('-', '')
      .replace('stack', 'Stack') as 'profile' | 'mainStack' | 'secondaryStack';
  };

  const setObj = returnSelect(fn);
  console.log(setObj);
  text.value = masterData[setObj];
};
</script>

<template>
  <div class="container mx-auto">
    <div
      class="min-h-full flex flex-col md:flex-row items-center justify-center gap-3"
    >
      <div class="flex flex-col gap-6 w-full md:w-1/2">
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold text-balance">
          Hi, I am Fullstack Developer
        </h1>
        <span class="text-balance"
          >I'm frontend-leaning software developer with 5 years of experience,
          have worked for multiple companies based in Singapore. I'm passionate
          to translate designs into code for web development, ensuring
          high-quality results withing specific timelines.</span
        >
      </div>
      <div
        class="flex flex-col w-full md:w-1/2 h-fit rounded-lg border dark:border-white"
      >
        <div class="w-full flex overflow-x-auto scroll-hidden">
          <Button
            :variant="'ghost'"
            v-for="(fn, index) in fileNames"
            class="flex items-center rounded-none"
            :class="{
              'bg-accent': fn === selectedTab,
              'rounded-tl-md': index === 0,
            }"
            @click="changeTab(fn)"
            ><Braces class="w-4 h-4" />{{ fn }}</Button
          >
        </div>
        <LazyEditorMonaco v-model="text" class="w-full min-h-[500px]" />
        <div><PlugZap class="w-5 h-5 m-1 opacity-50" /></div>
      </div>
    </div>
  </div>
</template>
