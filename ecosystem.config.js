module.exports = {
  apps: [
    {
      name: "backend",
      script: "app.js",
      cwd: "./backend",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "frontend",
      script: "server.js",
      cwd: "./frontend",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};