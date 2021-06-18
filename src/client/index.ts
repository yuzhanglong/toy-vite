/**
 * File: index.ts
 * Description: dev server 客户端
 * Created: 2021-06-18 01:03:38
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

const socket = new WebSocket(`ws://${location.host}`);

socket.addEventListener('message', ({ data }) => {
  const { type } = JSON.parse(data);

  switch (type) {
    case 'connected':
      console.log('[toy-vite] connected.');
      break;
    case 'full-reload':
      location.reload();
  }
});

// server close handler
socket.addEventListener('close', () => {
  console.log(`[toy-vite] server connection lost. polling for restart...`);
  setInterval(() => {
    new WebSocket(`ws://${location.host}`).addEventListener('open', () => {
      location.reload();
    });
  }, 2000);
});
