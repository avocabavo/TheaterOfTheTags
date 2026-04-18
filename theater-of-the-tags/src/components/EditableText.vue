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
}>()

const isEditing = ref(false)
const localValue = ref(props.modelValue)
const inputRef = ref<HTMLInputElement | null>(null)

// keep local in sync if external changes happen (e.g. Yjs)
watch(() => props.modelValue, (val) => {
  if (!isEditing.value) {
    localValue.value = val
  }
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
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="localValue"
      class="input"
      :placeholder="placeholder"
      @keydown="onKeydown"
      @blur="stopEditing(true)"
    />
    <component
      :is="tag"
      v-else
      class="editable-component"
    >
      {{ modelValue  }}
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
  justify-content: center;
  gap: 0.5rem;
}

.input {
  width: 80%;
  box-sizing: border-box;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  outline: none;
  color: black;
  background: rgba(255, 255, 255, 0.25);
}

.editable-component {
  position: relative;
}
</style>