package app.privai.pocket;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Condivisione in ingresso: è la strada principale dell'app, non un extra.
 *
 * Due casi che vanno gestiti diversamente:
 *  - avvio a freddo — l'interfaccia non esiste ancora, quindi il testo si
 *    deposita in window.__privaiShared e intake.mjs lo raccoglie all'avvio;
 *  - app già viva — si emette l'evento 'privai:shared', che intake.mjs ascolta.
 * Gestirne uno solo fa funzionare la condivisione a giorni alterni.
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    private static final int MAX_CHARS = 400_000;

    public static void deliver(Intent intent, Bridge bridge) {
        if (intent == null || bridge == null) return;

        String text = extract(intent, bridge);
        if (text == null || text.trim().isEmpty()) return;
        if (text.length() > MAX_CHARS) text = text.substring(0, MAX_CHARS);

        // Il contenuto arriva da un'altra app: è un dato, non del codice.
        // JSONObject.quote fa l'escape di virgolette, ritorni a capo e
        // caratteri di controllo, così nulla può uscire dalla stringa.
        final String payload = JSONObject.quote(text);

        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(
            "(function(){var t=" + payload + ";"
          + "if(window.__privaiReady){window.dispatchEvent(new CustomEvent('privai:shared',{detail:{text:t}}));}"
          + "else{window.__privaiShared=t;}})();", null));
    }

    private static String extract(Intent intent, Bridge bridge) {
        String action = intent.getAction();
        if (action == null) return null;

        // Testo selezionato in un'altra app ("Elabora testo").
        if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            CharSequence selected = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            return selected == null ? null : selected.toString();
        }

        if (!Intent.ACTION_SEND.equals(action)) return null;

        String shared = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (shared != null) return shared;

        Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return null;

        // I PDF li legge il lato web con pdf.js, che gira nella WebView e non
        // manda niente fuori: qui si leggono solo i file di testo.
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return null;

        try (InputStream stream = bridge.getContext().getContentResolver().openInputStream(uri)) {
            if (stream == null) return null;
            BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null && builder.length() < MAX_CHARS) {
                builder.append(line).append('\n');
            }
            return builder.toString();
        } catch (Exception error) {
            return null;
        }
    }

    /** L'interfaccia dichiara di essere pronta a ricevere gli eventi. */
    @PluginMethod
    public void ready(PluginCall call) {
        bridge.getWebView().post(() -> bridge.getWebView()
            .evaluateJavascript("window.__privaiReady=true;", null));
        call.resolve(new JSObject().put("ok", true));
    }
}
