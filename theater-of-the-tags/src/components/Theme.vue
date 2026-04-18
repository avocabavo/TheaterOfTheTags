<script setup lang="ts">
import * as Y from 'yjs'
import Tag from './Tag.vue'
import { createTagShard } from '../lib/Tag';
import { mightOptions } from '../lib/schema';
import { useYMapField, useYArray, useYChildMap } from '../lib/yjsComposables';
import type { TagNature, TagShard, ThemeData } from '../lib/schema';
import DeleteButton from './/buttons/DeleteButton.vue';
import { useMode } from '../lib/modeStore';
import NewTag from './NewTag.vue';
import Quest from './Quest.vue';
import Bubbles from './Bubbles.vue';
import { onBeforeUpdate, ref } from 'vue';
import { useFieldCollector } from '../lib/util';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField<ThemeData, 'might'>(props.shard, 'might', 'origin')
const themeType = useYMapField<ThemeData, 'themeType'>(props.shard, 'themeType', 'circumstance')

const { items: powerTags, push: addPowerTag, remove: removePowerTag } =
  useYArray<TagShard>(props.shard, 'powerTags', ()=> emit('resized'), ()=> emit('resized'))

const { items: weaknessTags, push: addWeaknessTag, remove: removeWeaknessTag } =
  useYArray<TagShard>(props.shard, 'weaknessTags', ()=> emit('resized'), ()=> emit('resized'))

const { child: primaryTag, clear: clearPrimaryTag, set: setPrimaryTag } = useYChildMap(
  props.shard,
  'primaryTag',
  ()=> emit('resized'),
  ()=> emit('resized'),
)

const emit = defineEmits<{
  (e: 'delete'): void,
  (e: 'resized'): void,
}>()

function handleCreateTag(data: {name: string, nature: TagNature, scratched: boolean}) {
  const newShard = createTagShard(data)

  switch (data.nature) {
    case 'primary':
      setPrimaryTag(newShard)
      break;
    case 'power':
      addPowerTag(newShard)
      break;
    case 'weakness':
      addWeaknessTag(newShard)
      break;
  }
}

const { fieldRefs, setFieldRef } = useFieldCollector()

const primaryTagRef = ref<any | null>(null)
const powerTagRefs = ref<any[]>([])
const weaknessTagRefs = ref<any[]>([])

function setPrimaryTagRef(el: any) {
  primaryTagRef.value = el
}
function setPowerTagRef(el: any) {
  if (el) powerTagRefs.value.push(el)
}
function setWeaknessTagRef(el: any) {
  if (el) weaknessTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  powerTagRefs.value = []
  weaknessTagRefs.value = []
})

function toJson() {
  return {
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    might: might.value,
    themeType: themeType.value,
    primaryTag: primaryTagRef.value?.toJson() ?? null,
    powerTags: powerTagRefs.value.map(t=> t.toJson()),
    weaknessTags: weaknessTagRefs.value.map(t=> t.toJson()),
  }
}

function print() {
  console.log(toJson())
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="theme">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

    <p class="static-words" @click="print">THEME CARD</p>
    <div class="might">
      <label
        v-for="option in mightOptions"
        :key="option"
        class="might-option"
      >
        <input
          type="radio"
          :name="`might-${shard.get('uuid')}`"
          :value="option"
          :checked="might === option"
          @change="might = option"
        />
        {{ option }}
      </label>
    </div>
    <p class="theme-type">
      <span class="tiny-static-words">type</span>
      {{ themeType }}
    </p>

    <div class="tag-section">
      <Tag
        v-if="primaryTag"
        :ref="setPrimaryTagRef"
        :shard="primaryTag"
        @delete="clearPrimaryTag"
        @resized="emit('resized')"
      />
      <NewTag
        v-else-if="mode !== 'scene'"
        nature="primary"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in powerTags"
        :key="tag.get('uuid')"
        :ref="setPowerTagRef"
        :shard="tag"
        @delete="removePowerTag(index)"
        @resized="emit('resized')"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="power"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in weaknessTags"
        :key="tag.get('uuid')"
        :ref="setWeaknessTagRef"
        :shard="tag"
        @delete="removeWeaknessTag(index)"
        @resized="emit('resized')"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="weakness"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Quest
        :shard="shard"
        :ref="setFieldRef"
        @resized="emit('resized')"
      />
    </div>

    <div class="tag-section">
      <div class="quest-aim">
        <Bubbles
          v-for="field in ['abandon', 'improve', 'milestone']"
          :key="field"
          :ref="setFieldRef"
          :shard="shard"
          :field="field"
          :max="3"
          :name="field.toUpperCase()"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme {
  position: relative;
  box-sizing: border-box;
  border: 0.25rem solid #764;
  background-color: #dca;

  width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.static-words {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
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
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: baseline;
}

.tiny-static-words {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.quest-aim {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-around;
}
</style>