import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
import * as Y from 'yjs'
import { effectScope, shallowRef } from 'vue'

// Load the TypeScript source without adding a test runner dependency.
async function loadSource(path, replacements = {}) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8')
  for (const name of ['vue', 'yjs']) {
    replacements[name] = import.meta.resolve(name)
  }
  for (const [name, url] of Object.entries(replacements)) {
    source = source.replaceAll(`'${name}'`, `'${url}'`)
  }
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const helpers = await loadSource('../src/lib/yHelpers.ts')
const { useYArray, useYMapField, useYChildMap } = await import(
  await loadSource('../src/lib/yjsComposables.ts', { './yHelpers': helpers })
)
const tag = (name) => new Y.Map(Object.entries({
  uuid: name, name, nature: 'power', scratched: false, usage: 'ready',
}))
function theme(name) {
  const powerTags = new Y.Array()
  powerTags.push([tag(name)])
  return new Y.Map(Object.entries({ uuid: name, powerTags, primaryTag: tag('primary') }))
}

test('theme move rebinds nested tags and all edits to the live clone', () => {
  const doc = new Y.Doc()
  const hero = doc.getMap('hero')
  const themes = new Y.Array()
  themes.push([theme('first'), theme('second')])
  hero.set('themes', themes)
  const shard = shallowRef(themes.get(0))
  const scope = effectScope()
  scope.run(() => {
    const list = useYArray(hero, 'themes')
    const powers = useYArray(() => shard.value, 'powerTags')
    const primary = useYChildMap(shard, 'primaryTag')
    const name = useYMapField(() => powers.items.value[0], 'name', '')
    const nature = useYMapField(() => powers.items.value[0], 'nature', 'power')
    const scratched = useYMapField(() => powers.items.value[0], 'scratched', false)
    const usage = useYMapField(() => powers.items.value[0], 'usage', 'ready')
    const primaryName = useYMapField(() => primary.child.value, 'name', '')
    for (const [from, to] of [[0, 1], [1, 0]]) {
      const old = shard.value
      list.move(from, to)
      shard.value = list.items.value[to]
      assert.notEqual(shard.value, old)
      assert.equal(shard.value.get('uuid'), 'first')
      assert.equal(name.value, 'first')
      assert.equal(nature.value, 'power')
      scratched.value = !scratched.value
      usage.value = 'invoked'
      const live = shard.value.get('powerTags').get(0)
      assert.equal(live.get('scratched'), scratched.value)
      assert.equal(live.get('usage'), 'invoked')
      primaryName.value = 'updated primary'
      assert.equal(shard.value.get('primaryTag').get('name'), 'updated primary')
    }
    powers.push(tag('extra'))
    assert.equal(shard.value.get('powerTags').length, 2)
    powers.remove(1)
    assert.equal(powers.items.value.length, 1)
    primary.set(tag('replacement'))
    assert.equal(primaryName.value, 'replacement')
    scope.stop()
    shard.value.get('powerTags').get(0).set('name', 'after disposal')
    assert.equal(name.value, 'first')
  })
  doc.destroy()
})

test('replacement detaches old observers and follows nested array replacement', () => {
  const doc = new Y.Doc()
  const maps = doc.getArray('maps')
  maps.push([theme('old'), theme('new')])
  const shard = shallowRef(maps.get(0))
  const scope = effectScope()
  scope.run(() => {
    const name = useYMapField(shard, 'uuid', '')
    const powers = useYArray(shard, 'powerTags')
    const primary = useYChildMap(shard, 'primaryTag')
    const old = shard.value
    shard.value = maps.get(1)
    old.set('uuid', 'ignored')
    old.get('powerTags').push([tag('ignored')])
    old.set('primaryTag', tag('ignored'))
    assert.equal(name.value, 'new')
    assert.equal(powers.items.value.length, 1)
    assert.equal(primary.child.value.get('name'), 'primary')
    const replacement = new Y.Array()
    replacement.push([tag('replacement')])
    shard.value.set('powerTags', replacement)
    assert.equal(powers.items.value[0].get('name'), 'replacement')
    primary.clear()
    assert.equal(primary.child.value, null)
    scope.stop()
    replacement.push([tag('after disposal')])
    assert.equal(powers.items.value.length, 1)
  })
  doc.destroy()
})
