package app.privai.pocket;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * I plugin vanno registrati PRIMA di super.onCreate(): dopo, il bridge è già
 * partito e non li vedrebbe.
 *
 * L'intento va gestito due volte perché Android lo consegna in due modi
 * diversi: in onCreate se l'app non era in memoria, in onNewIntent se era già
 * aperta. Trattarne uno solo fa funzionare la condivisione a giorni alterni.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OutboundSharePlugin.class);
        registerPlugin(ShareTargetPlugin.class);
        registerPlugin(SecureStorePlugin.class);
        registerPlugin(BridgeServerPlugin.class);
        super.onCreate(savedInstanceState);
        ShareTargetPlugin.deliver(getIntent(), getBridge());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ShareTargetPlugin.deliver(intent, getBridge());
    }
}
