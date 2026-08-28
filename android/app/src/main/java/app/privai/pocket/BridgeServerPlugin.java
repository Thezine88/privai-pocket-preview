package app.privai.pocket;

import android.content.res.AssetManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.Locale;

import fi.iki.elonen.NanoHTTPD;

/**
 * Il ponte desktop: un server HTTP minimo sulla rete locale, niente altro.
 * Due compiti, nessuna logica di dominio:
 *  1. Serve gli stessi file che la WebView nativa carica già (assets/public,
 *     dove Capacitor bundla index.html/styles.css/src/**), così il computer
 *     vede la STESSA app, non una seconda interfaccia da mantenere.
 *  2. Espone /api/store/:key, che rispecchia createSecureStore (get/set/
 *     remove) — ogni richiesta autenticata dal token della sessione
 *     attiva, mai un accesso silenzioso.
 *
 * La cassaforte resta SecureStorePlugin: questo plugin non la implementa
 * di nuovo, la richiama.
 */
@CapacitorPlugin(name = "BridgeServer")
public class BridgeServerPlugin extends Plugin {

    /** Stesso prefisso di PREFIX in src/domain/vault.mjs. Lì viene aggiunto
     *  lato JS prima di chiamare native.get/set/remove; SecureStorePlugin
     *  non lo aggiunge mai da solo. Le chiavi che arrivano qui da
     *  /api/store/:key sono "nude" (le manda createRemoteStore così come
     *  sono), quindi tocca a questo plugin aggiungere lo stesso prefisso
     *  prima di richiamare readRaw/writeRaw/removeRaw, per restare
     *  coerente con lo schema esistente. */
    private static final String PREFIX = "privai:";

    private Server server;
    private volatile String activeToken;
    private volatile long activeEndsAt;

    private class Server extends NanoHTTPD {

        Server(int port) {
            super(port);
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();

            if (uri.startsWith("/api/store/")) {
                return serveStore(session, uri.substring("/api/store/".length()));
            }
            return serveStatic(uri);
        }

        private boolean authorized(IHTTPSession session) {
            String header = session.getHeaders().get("authorization");
            if (header == null || !header.startsWith("Bearer ")) return false;
            String token = header.substring("Bearer ".length());
            return token.equals(activeToken) && System.currentTimeMillis() < activeEndsAt;
        }

        private Response serveStore(IHTTPSession session, String key) {
            if (!authorized(session)) {
                return newFixedLengthResponse(Response.Status.UNAUTHORIZED, "application/json", "{}");
            }

            SecureStorePlugin secureStore = getBridge().getPlugin("SecureStore") != null
                ? (SecureStorePlugin) getBridge().getPlugin("SecureStore").getInstance()
                : null;
            if (secureStore == null) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{}");
            }

            String prefixedKey = PREFIX + key;

            try {
                switch (session.getMethod()) {
                    case GET: {
                        String value = secureStore.readRaw(prefixedKey);
                        if (value == null) {
                            return newFixedLengthResponse(Response.Status.NOT_FOUND, "application/json", "{}");
                        }
                        return newFixedLengthResponse(Response.Status.OK, "application/json",
                            "{\"value\":" + value + "}");
                    }
                    case PUT: {
                        String body = readBody(session);
                        org.json.JSONObject json = new org.json.JSONObject(body);
                        Object value = json.get("value");
                        String serialized = value instanceof String
                            ? org.json.JSONObject.quote((String) value)
                            : String.valueOf(value);
                        secureStore.writeRaw(prefixedKey, serialized);
                        return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
                    }
                    case DELETE: {
                        secureStore.removeRaw(prefixedKey);
                        return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
                    }
                    default:
                        return newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "application/json", "{}");
                }
            } catch (Exception error) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{}");
            }
        }

        private String readBody(IHTTPSession session) throws IOException {
            String contentLength = session.getHeaders().get("content-length");
            int len = contentLength != null ? Integer.parseInt(contentLength) : 0;
            if (len < 0 || len > 1_000_000) return "";
            byte[] buffer = new byte[len];
            int offset = 0;
            while (offset < len) {
                int read = session.getInputStream().read(buffer, offset, len - offset);
                if (read < 0) break;
                offset += read;
            }
            return new String(buffer, 0, offset, java.nio.charset.StandardCharsets.UTF_8);
        }

        private Response serveStatic(String uri) {
            String path = "public" + (uri.equals("/") ? "/index.html" : uri);
            if (path.contains("..")) {
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "non trovato");
            }
            try {
                AssetManager assets = getContext().getAssets();
                InputStream input = assets.open(path);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int read;
                while ((read = input.read(buffer)) != -1) out.write(buffer, 0, read);
                input.close();
                return newFixedLengthResponse(Response.Status.OK, mimeFor(path),
                    new java.io.ByteArrayInputStream(out.toByteArray()), out.size());
            } catch (IOException error) {
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "non trovato");
            }
        }

        private String mimeFor(String path) {
            if (path.endsWith(".html")) return "text/html; charset=utf-8";
            if (path.endsWith(".css")) return "text/css; charset=utf-8";
            if (path.endsWith(".mjs") || path.endsWith(".js")) return "text/javascript; charset=utf-8";
            if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json; charset=utf-8";
            if (path.endsWith(".svg")) return "image/svg+xml";
            if (path.endsWith(".webp")) return "image/webp";
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".otf")) return "font/otf";
            return "application/octet-stream";
        }
    }

    /** Nessun permesso speciale richiesto: enumera le interfacce di rete
     *  già visibili all'app, valido sia su Wi-Fi sia sull'hotspot del
     *  telefono. */
    private static String localIpAddress() {
        String ripiego = null;
        try {
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            while (ifaces.hasMoreElements()) {
                NetworkInterface iface = ifaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;

                String nome = iface.getName() == null ? "" : iface.getName().toLowerCase(Locale.US);
                if (datiMobiliOVpn(nome)) continue;

                String ipv4 = primoIpv4(iface);
                if (ipv4 == null) continue;

                // wlan0 e simili: il caso normale, i due dispositivi sulla
                // stessa rete Wi-Fi. Vince sempre, appena lo si trova.
                if (nome.startsWith("wlan")) return ipv4;

                // Altrimenti teniamo da parte la prima interfaccia buona
                // (hotspot del telefono, ethernet USB) e continuiamo a
                // cercare il Wi-Fi, che ha comunque la precedenza.
                if (ripiego == null) ripiego = ipv4;
            }
        } catch (Exception ignored) { }
        return ripiego;
    }

    /**
     * Dati mobili e VPN: indirizzi che esistono, rispondono a isUp() e sono
     * pure in un intervallo privato (10.x.x.x), ma dal computer non sono
     * raggiungibili in nessun modo. Scartarli per nome è l'unico modo
     * affidabile: isSiteLocalAddress() dice "sì" anche al 10.x.x.x
     * dell'operatore, quindi non distingue nulla.
     */
    private static boolean datiMobiliOVpn(String nome) {
        return nome.startsWith("rmnet")   // Qualcomm, la maggior parte degli Android
            || nome.startsWith("ccmni")   // MediaTek
            || nome.startsWith("pdp")     // dati mobili, nomenclatura vecchia
            || nome.startsWith("clat")    // traduzione 464XLAT sopra i dati mobili
            || nome.startsWith("tun")     // VPN
            || nome.startsWith("ppp")     // VPN / tethering seriale
            || nome.startsWith("ipsec");  // VPN
    }

    private static String primoIpv4(NetworkInterface iface) {
        Enumeration<InetAddress> addrs = iface.getInetAddresses();
        while (addrs.hasMoreElements()) {
            InetAddress addr = addrs.nextElement();
            if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                return addr.getHostAddress();
            }
        }
        return null;
    }

    @PluginMethod
    public void start(PluginCall call) {
        String token = call.getString("token");
        Long endsAt = call.getLong("endsAt");
        if (token == null || token.isEmpty() || endsAt == null || endsAt <= System.currentTimeMillis()) {
            call.reject("token o endsAt non validi");
            return;
        }
        String ip = localIpAddress();
        if (ip == null) {
            // Codice riconoscibile dal lato JS: è l'unico errore che l'utente
            // può risolvere da solo, e merita un messaggio suo invece del
            // generico "non disponibile su questo dispositivo".
            call.reject("NO_WIFI");
            return;
        }
        try {
            if (server != null) server.stop();
            server = new Server(0); // 0 = il sistema assegna una porta libera
            server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
            activeToken = token;
            activeEndsAt = endsAt;
            call.resolve(new JSObject().put("ip", ip).put("port", server.getListeningPort()));
        } catch (IOException error) {
            call.reject("impossibile avviare il server locale", error);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (server != null) {
            server.stop();
            server = null;
        }
        activeToken = null;
        activeEndsAt = 0;
        call.resolve();
    }

    @Override
    public void handleOnDestroy() {
        if (server != null) {
            server.stop();
            server = null;
        }
    }
}
