import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const roomName = window.location.pathname ?? '/'

export const doc = new Y.Doc()

export const provider = new WebsocketProvider(
  'ws://localhost:1234',
  roomName,
  doc,
)

export const powerTags = doc.getMap<number>('powerTags')
export const statusTags = doc.getMap<Y.Map<any>>('statusTags')
export const tags = doc.getMap<Y.Map<any>>('tags')
