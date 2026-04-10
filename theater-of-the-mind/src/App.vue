<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import PowerTag from './components/PowerTag.vue'
</script>

<template>
  <main>
    <NavigationBar />
    <div class="tag-holder">
      <PowerTag id="hero" />
      <PowerTag id="villain" />
      <PowerTag id="hero2" />
      <PowerTag id="villain2" />
      <PowerTag id="hero3" />
      <PowerTag id="villain3" />
      <PowerTag id="hero4" />
      <PowerTag id="villain4" />
      <PowerTag id="hero5" />
      <PowerTag id="villain5" />
    </div>
  </main>
</template>

<style>
.tag-holder {
  display: flex;
  flex-wrap: wrap;
}
</style>