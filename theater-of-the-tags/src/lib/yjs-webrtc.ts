import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export const doc = new Y.Doc()

export function getProvider(roomName: string): WebrtcProvider {
  const provider = new WebrtcProvider(roomName, doc)
  return provider
}

export const powerTags = doc.getMap<number>('powerTags')
export const statusTags = doc.getMap<Y.Map<any>>('statusTags')
export const tags = doc.getMap<Y.Map<any>>('tags')
export const themes = doc.getMap<Y.Map<any>>('themes')
export const heroes = doc.getMap<Y.Map<any>>('heroes')
