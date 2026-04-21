import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

export const doc = new Y.Doc()

const roomName = window.location.pathname ?? '/'

export const provider = new WebsocketProvider(
  import.meta.env.VITE_YJS_WS_URL,
  roomName,
  doc,
)

export const powerTags = doc.getMap<number>('powerTags')
export const statusTags = doc.getMap<Y.Map<any>>('statusTags')
export const tags = doc.getMap<Y.Map<any>>('tags')
export const themes = doc.getMap<Y.Map<any>>('themes')
export const heroes = doc.getMap<Y.Map<any>>('heroes')
