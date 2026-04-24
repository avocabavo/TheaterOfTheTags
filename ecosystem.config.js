module.exports = {
  apps: [
    {
      name: "yjs",
      script: "/usr/bin/y-websocket-server",

      env: {
        PORT: 1234,
      },
    },
  ],
}
