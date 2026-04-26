<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import EditButton from './buttons/EditButton.vue';

const props = withDefaults(defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
  tag?: string          // display tag (h1, span, etc.)
  showEditButton?: boolean
  selectOnFocus?: boolean
}>(), {
  disabled: false,
  placeholder: '',
  tag: 'span',
  showEditButton: true,
  selectOnFocus: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'start-edit'): void
  (e: 'end-edit'): void
  (e: 'resized'): void
}>()

const isEditing = ref(false)
const localValue = ref(props.modelValue)
const inputRef = ref<HTMLInputElement | null>(null)

// keep local in sync if external changes happen (e.g. Yjs)
watch(() => props.modelValue, (val) => {
  if (!isEditing.value) {
    localValue.value = val
  }
  emit('resized') // TODO - can this be smarter about whether the dimensions of this element actually changed?
})

function startEditing() {
  if (props.disabled) return

  isEditing.value = true
  emit('start-edit')

  nextTick(() => {
    const el = inputRef.value
    if (!el) return
    el.focus()
    if (props.selectOnFocus) el.select()
  })
}

function stopEditing(commit = true) {
  if (commit) {
    emit('update:modelValue', localValue.value.trim())
  } else {
    localValue.value = props.modelValue
  }

  isEditing.value = false
  emit('end-edit')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    stopEditing(true)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    stopEditing(false)
  }
}
</script>

<template>
  <div class="editable-text">
    <component
      :is="tag"
      class="editable-component"
    >
      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="localValue"
        class="input"
        :placeholder="placeholder"
        @keydown="onKeydown"
        @blur="stopEditing(true)"
      />
      {{ modelValue }}
      <EditButton
        v-if="!disabled && showEditButton"
        v-on:edit="startEditing"
      />
    </component>
  </div>
</template>

<style scoped>
.editable-text {
  display: inline-flex;
  align-items: center;
  justify-content: start;
  gap: 0.5rem;
}

.input {
  position: absolute;
  top: 0;
  left: 0;
  width: 20rem;
  height: 2rem;
  font-size: 2rem;
  font-weight: bold;
  border: 0.15rem solid black;
  border-radius: 0.25rem;
  color: black;
  background: white;
}

.editable-component {
  position: relative;
}
</style>