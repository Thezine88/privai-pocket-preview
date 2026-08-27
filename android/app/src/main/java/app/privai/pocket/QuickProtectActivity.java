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
 * Il segnale verso app.mjs usa la stessa stretta di mano a due vie già
 * provata su device per la condivisione in ingresso (vedi
 * ShareTargetPlugin.deliver() e src/domain/intake.mjs): se lo script del
 * modulo principale non ha ancora controllato il segnale quando arriva
 * questa chiamata, lo depositiamo su window e lui lo troverà al controllo
 * sincrono in cima a init(); se invece il modulo è già partito e si è messo
 * in ascolto (window.__privaiQuickProtectReady), gli mandiamo l'evento
 * invece di un deposito che nessuno rileggerebbe più. Un semplice deposito
 * "e basta" lascerebbe una finestra di corsa reale: qui non ce n'è, perché
 * fra il controllo del deposito e la messa in ascolto in app.mjs non passa
 * nessun'altra istruzione asincrona.
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

        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(
            "(function(){"
          + "if(window.__privaiQuickProtectReady){window.dispatchEvent(new CustomEvent('privai:quickprotect'));}"
          + "else{window.__privaiQuickProtect=true;}"
          + "})();", null));
    }
}
