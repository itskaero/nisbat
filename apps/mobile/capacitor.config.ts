import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pk.nisbat.home",
  appName: "Nisbat",
  webDir: "dist",
  server: {
    // The app talks to the family's Nisbat server over plain http on the
    // home network (e.g. http://192.168.1.42:3080), so the app's own origin
    // must be http too (an https page can't call an http server).
    androidScheme: "http",
    cleartext: true,
  },
  android: { backgroundColor: "#0b1220" },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: "#0b1220", showSpinner: false },
    StatusBar: { overlaysWebView: true, style: "DARK" },
    LocalNotifications: { smallIcon: "ic_stat_nisbat", iconColor: "#45D49A" },
  },
};

export default config;
