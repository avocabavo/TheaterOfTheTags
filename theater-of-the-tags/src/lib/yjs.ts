import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

export const doc = new Y.Doc()

export const roomName = window.location.pathname ?? '/'
export const room = doc.getMap<any>('room')

export const provider = new WebsocketProvider(
  import.meta.env.VITE_YJS_WS_URL,
  roomName,
  doc,
)

export const powerTags = doc.getMap<number>('powerTags')
export const statusTags = doc.getMap<Y.Map<any>>('statusTags')
export const tags = doc.getMap<Y.Map<any>>('tags')
export const themes = doc.getMap<Y.Map<any>>('themes')
export const situations = doc.getMap<Y.Map<any>>('situations')
export const fellowships = doc.getMap<Y.Map<any>>('fellowships')
export const heroes = doc.getMap<Y.Map<any>>('heroes')

export const situationOrder = doc.getArray<string>('situationOrder')
export const fellowshipOrder = doc.getArray<string>('fellowshipOrder')
export const heroOrder = doc.getArray<string>('heroOrder')
