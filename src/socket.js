import ReconnectingWebsocket from 'reconnecting-websocket'

import store from '@/store'
import { types } from '@/store/modules/auth'

export const WEBSOCKET_ENDPOINT = [
  window.location.protocol.replace(/^http/, 'ws'),
  '//',
  window.location.host,
  '/api/ws'
].join('')

export const options = {
  reconnectInterval: 500
}

let ws

const socket = {
  connect () {
    if (socket) return
    ws = new ReconnectingWebsocket(WEBSOCKET_ENDPOINT, undefined, options)

    ws.addEventListener('open', () => {
      console.info('socket opened!')
    })

    ws.addEventListener('close', () => {
      console.log('socket closed!')
    })

    ws.addEventListener('message', (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      }
      catch (err) {
        console.error('socket message was not json', event.data)
        return
      }
      receiveMessage(data)
    })
  },
  disconnect () {
    if (ws) {
      ws.close(undefined, undefined, { keepClosed: true })
      ws = null
    }
  }
}

export function receiveMessage ({ topic, payload }) {
  if (topic === 'conversations:message') {
    store.dispatch('conversations/receiveMessage', { message: payload })
  }
}

store.subscribe(mutation => {
  console.log('mutation!', mutation)
  switch (mutation.type) {
    case `auth/${types.RECEIVE_LOGIN_STATUS}`:
    case `auth/${types.RECEIVE_LOGIN_SUCCESS}`:
      socket.connect()
      break
    case `auth/${types.RECEIVE_LOGIN_FAILURE}`:
    case `auth/${types.RECEIVE_LOGIN_STATUS_ERROR}`:
    case `auth/${types.RECEIVE_LOGOUT_SUCCESS}`:
      socket.disconnect()
      break
  }
})