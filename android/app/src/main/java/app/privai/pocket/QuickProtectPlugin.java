package app.privai.pocket;

import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Il ponte minimo fra app.mjs e QuickProtectActivity: un Toast di conferma
 * (non richiede il permesso delle notifiche, a differenza di una
 * Notification vera) e la chiusura dell'Activity invisibile. La decisione
 * su cosa fare degli appunti resta tutta in JavaScript — qui non c'è
 * nessuna logica di dominio, solo i due effetti che il JS non può fare da
 * solo.
 */
@CapacitorPlugin(name = "QuickProtect")
public class QuickProtectPlugin extends Plugin {

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
        getActivity().finish();
    }
}
