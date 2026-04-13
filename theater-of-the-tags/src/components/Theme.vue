<script setup lang="ts">
import * as Y from 'yjs'
import Tag from './Tag.vue'
import { type ThemeType, type Might } from '../lib/Theme';
import { useYMapField, useYArray, useYChildMap } from '../lib/yjsComposables';
import { computed } from 'vue';

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField(props.shard, 'might', 'origin')
const themeType = useYMapField(props.shard, 'themeType', 'circumstance')
const quest = useYMapField(props.shard, 'quest', '')
const abandon = useYMapField(props.shard, 'abandon', 0)
const improve = useYMapField(props.shard, 'improve', 0)
const milestone = useYMapField(props.shard, 'milestone', 0)

const { items: powerTags, push: addPowerTag } =
  useYArray<Y.Map<any>>(props.shard, 'powerTags')

const { items: weaknessTags, push: addWeaknessTag } =
  useYArray<Y.Map<any>>(props.shard, 'weaknessTags')

const themeTag = useYChildMap(props.shard, 'themeTag', () => {
  const tag = new Y.Map()
  tag.set('name', 'Theme')
  tag.set('nature', 'power')
  tag.set('scratched', false)
  return tag
})

const mightOptions: Might[] = ['origin', 'adventure', 'greatness']

const emit = defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="theme">
    <button type="button" @click="emit('delete')">
      delete
    </button>

    <p class="the-words-theme-card">THEME CARD</p>
    <div class="might">
      <label
        v-for="option in mightOptions"
        :key="option"
        class="might-option"
      >
        <input
          type="radio"
          name="might"
          :value="option"
          :checked="might === option"
          @change="might = option"
        />
        {{ option }}
      </label>
    </div>
    <p class="theme-type">
      <span class="the-word-type">type</span>
      {{ themeType }}
    </p>

    <Tag v-if="themeTag" :shard="themeTag" />

    <div class="tag-section">
      <Tag
        v-for="tag in powerTags"
        :key="tag.get('uuid')"
        :shard="tag"
      />
      <button @click="addPowerTag(new Y.Map())">+ Add</button>
    </div>

    <div class="tag-section">
      <Tag
        v-for="tag in weaknessTags"
        :key="tag.get('uuid')"
        :shard="tag"
      />
      <button @click="addWeaknessTag(new Y.Map())">+ Add</button>
    </div>
  </div>
</template>

<style scoped>
.theme {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.the-words-theme-card {
  font-size: small;
  color: gray;
}

.might {
  display: flex;
  gap: 0.75rem;
}

.might-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.theme-type {
  display: flex;
  align-items: baseline;
}

.the-word-type {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.tag-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
</style>