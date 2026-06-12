import { app } from 'nitron'

app.init({
  name: "天天爱听",
  packageId: "com.example.app",
  version: "1.0.0",
  entry: "mc.html",
  orientation: "portrait",
  statusBar: true,
  permissions: ["INTERNET"],
  icon: "./icon.png",
  android: {
    usesCleartextTraffic: true  // 这一行就够了，全局允许HTTP
  }
})