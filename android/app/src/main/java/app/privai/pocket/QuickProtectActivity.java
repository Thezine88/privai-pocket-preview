package app.privai.pocket;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

/**
 * Host invisibile per il riquadro "Proteggi appunti": nessuna schermata,
 * tema Theme.AppCompat.QuickProtect dichiarato nel manifest. Il tema rende
 * trasparente solo la finestra: la WebView dentro dipingerebbe comunque la
 * pagina se non la nascondiamo esplicitamente, quindi qui la mettiamo
 * INVISIBLE e a sfondo trasparente prima che carichi qualunque contenuto.
 *
 * Nessun segnale da iniettare nella pagina, e quindi nessuna corsa da
 * gestire: QuickProtectPlugin è registrato SOLO qui, mai in MainActivity,
 * quindi la sua sola presenza su window.Capacitor.Plugins.QuickProtect
 * basta ad app.mjs per riconoscere l'avvio headless — lo stesso modo in
 * cui ogni altro plugin nativo di questo progetto viene rilevato (vedi
 * nativePlugin() in src/domain/vault.mjs). Una prima versione di questo
 * file usava un deposito su window scritto con evaluateJavascript, con la
 * motivazione (sbagliata) che ricalcasse un meccanismo già provato su
 * device: non lo era, e soffriva della stessa corsa fra l'iniezione e
 * l'esecuzione dello script della pagina. Controllare la presenza del
 * plugin invece elimina la corsa alla radice, senza inventare nulla.
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

        getBridge().getWebView().setBackgroundColor(Color.TRANSPARENT);
        getBridge().getWebView().setVisibility(View.INVISIBLE);
    }
}
