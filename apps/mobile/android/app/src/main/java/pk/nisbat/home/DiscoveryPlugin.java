package pk.nisbat.home;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Finds the family's Nisbat server on the Wi-Fi. The server's autocast
 * service announces itself as "_nisbat._tcp" (mDNS); Android's NsdManager
 * browses for it. Also reports this phone's Wi-Fi address so the app can
 * fall back to sweeping its own subnet.
 */
@CapacitorPlugin(name = "NisbatDiscovery")
public class DiscoveryPlugin extends Plugin {

    private static final String SERVICE_TYPE = "_nisbat._tcp.";

    @PluginMethod
    public void discover(final PluginCall call) {
        final int timeoutMs = Math.max(1000, Math.min(15000, call.getInt("timeoutMs", 4000)));
        final Context ctx = getContext();
        final NsdManager nsd = (NsdManager) ctx.getSystemService(Context.NSD_SERVICE);
        final WifiManager wifi = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        // Some phones drop multicast packets unless an app holds this lock.
        final WifiManager.MulticastLock lock = wifi != null ? wifi.createMulticastLock("nisbat-discovery") : null;
        if (lock != null) {
            lock.setReferenceCounted(false);
            lock.acquire();
        }

        final Map<String, JSObject> found = new LinkedHashMap<>();
        final ConcurrentLinkedQueue<NsdServiceInfo> toResolve = new ConcurrentLinkedQueue<>();
        final AtomicBoolean resolving = new AtomicBoolean(false);
        final AtomicBoolean finished = new AtomicBoolean(false);
        final Handler main = new Handler(Looper.getMainLooper());

        final Runnable[] resolveNext = new Runnable[1];
        resolveNext[0] = () -> {
            if (finished.get() || !resolving.compareAndSet(false, true)) return;
            NsdServiceInfo info = toResolve.poll();
            if (info == null) {
                resolving.set(false);
                return;
            }
            // NsdManager resolves one service at a time.
            nsd.resolveService(info, new NsdManager.ResolveListener() {
                @Override
                public void onResolveFailed(NsdServiceInfo s, int errorCode) {
                    resolving.set(false);
                    main.post(resolveNext[0]);
                }

                @Override
                public void onServiceResolved(NsdServiceInfo s) {
                    InetAddress host = s.getHost();
                    if (host instanceof Inet4Address) {
                        JSObject o = new JSObject();
                        o.put("name", s.getServiceName());
                        o.put("host", host.getHostAddress());
                        o.put("port", s.getPort());
                        synchronized (found) {
                            found.put(host.getHostAddress() + ":" + s.getPort(), o);
                        }
                    }
                    resolving.set(false);
                    main.post(resolveNext[0]);
                }
            });
        };

        final NsdManager.DiscoveryListener listener = new NsdManager.DiscoveryListener() {
            @Override
            public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                finish(call, found, lock, finished);
            }

            @Override
            public void onStopDiscoveryFailed(String serviceType, int errorCode) {}

            @Override
            public void onDiscoveryStarted(String serviceType) {}

            @Override
            public void onDiscoveryStopped(String serviceType) {}

            @Override
            public void onServiceFound(NsdServiceInfo info) {
                toResolve.add(info);
                main.post(resolveNext[0]);
            }

            @Override
            public void onServiceLost(NsdServiceInfo info) {}
        };

        try {
            nsd.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, listener);
        } catch (Exception e) {
            finish(call, found, lock, finished);
            return;
        }
        main.postDelayed(() -> {
            try {
                nsd.stopServiceDiscovery(listener);
            } catch (Exception ignored) {
            }
            finish(call, found, lock, finished);
        }, timeoutMs);
    }

    private void finish(PluginCall call, Map<String, JSObject> found, WifiManager.MulticastLock lock, AtomicBoolean finished) {
        if (!finished.compareAndSet(false, true)) return;
        if (lock != null && lock.isHeld()) lock.release();
        JSArray list = new JSArray();
        synchronized (found) {
            for (JSObject o : found.values()) list.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("services", list);
        call.resolve(ret);
    }

    /** This phone's IPv4 address on the current network (for the subnet sweep). */
    @PluginMethod
    public void localAddress(PluginCall call) {
        JSObject ret = new JSObject();
        String ip = null;
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network net = cm.getActiveNetwork();
            LinkProperties lp = net != null ? cm.getLinkProperties(net) : null;
            if (lp != null) {
                for (LinkAddress la : lp.getLinkAddresses()) {
                    if (la.getAddress() instanceof Inet4Address && !la.getAddress().isLoopbackAddress()) {
                        ip = la.getAddress().getHostAddress();
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        ret.put("ip", ip);
        call.resolve(ret);
    }
}
