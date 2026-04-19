<script setup lang="ts">
import { ref } from 'vue';


const importedText = ref<string>('')

function importFromText() {
  //todo
}

</script>

<template>
  <textarea v-model="importedText" placeholder="Paste YAML here..." />
  <button @click="importFromText">Import</button>
</template>