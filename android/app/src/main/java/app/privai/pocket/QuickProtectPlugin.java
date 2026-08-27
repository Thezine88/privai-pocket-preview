package app.privai.pocket;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Il ponte minimo fra app.mjs e QuickProtectActivity: leggere/scrivere gli
 * appunti, mostrare un Toast di conferma (non richiede il permesso delle
 * notifiche, a differenza di una Notification vera) e chiudere l'Activity
 * invisibile. La decisione su cosa fare degli appunti resta tutta in
 * JavaScript — qui non c'è nessuna logica di dominio, solo gli effetti che
 * il JS non può fare da solo.
 *
 * Gli appunti passano da qui e non da @capacitor/clipboard (non installato
 * nel progetto) né da navigator.clipboard.readText(): quest'ultimo richiede
 * il documento a fuoco, che un'Activity invisibile e mai toccata dall'utente
 * non ha mai. ClipboardManager nativo non ha questo vincolo per un'Activity
 * in primo piano.
 */
@CapacitorPlugin(name = "QuickProtect")
public class QuickProtectPlugin extends Plugin {

    private ClipboardManager clipboard() {
        return (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
    }

    @PluginMethod
    public void read(PluginCall call) {
        ClipData clip = clipboard().getPrimaryClip();
        String value = null;
        if (clip != null && clip.getItemCount() > 0) {
            CharSequence text = clip.getItemAt(0).coerceToText(getContext());
            value = text == null ? null : text.toString();
        }
        call.resolve(new JSObject().put("value", value));
    }

    @PluginMethod
    public void write(PluginCall call) {
        String value = call.getString("value", "");
        clipboard().setPrimaryClip(ClipData.newPlainText("PrivAI", value));
        call.resolve();
    }

    @PluginMethod
    public void toast(PluginCall call) {
        String message = call.getString("message", "");
        if (!message.isEmpty()) {
            getActivity().runOnUiThread(() ->
                Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show());
        }
        call.resolve();
    }

    @PluginMethod
    public void finish(PluginCall call) {
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().finish());
    }
}
