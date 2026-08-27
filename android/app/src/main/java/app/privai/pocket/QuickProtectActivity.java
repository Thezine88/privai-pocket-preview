package app.privai.pocket;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * Host invisibile per il riquadro "Proteggi appunti": nessuna schermata,
 * tema Theme.AppCompat.QuickProtect dichiarato nel manifest. Carica la
 * stessa WebView/bridge dell'app e deposita window.__privaiQuickProtect
 * prima che app.mjs decida cosa disegnare — stesso meccanismo già usato da
 * ShareTargetPlugin per l'avvio a freddo della condivisione (vedi
 * ShareTargetPlugin.deliver()): il deposito arriva mentre lo script del
 * modulo principale è ancora in coda, non dopo.
 *
 * Si chiude da sola tramite QuickProtectPlugin.finish(), mai restando
 * aperta più di quanto serve a decidere cosa fare degli appunti.
 */
public class QuickProtectActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecureStorePlugin.class);
        registerPlugin(QuickProtectPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().post(() -> getBridge().getWebView()
            .evaluateJavascript("window.__privaiQuickProtect=true;", null));
    }
}
