package app.privai.pocket;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

/**
 * Condivisione in uscita.
 *
 * Riscritto: il sorgente originale non è mai stato committato ed esisteva solo
 * dentro l'APK compilato. Il contratto è quello che il lato web già si aspetta
 * (`share` e `shareWithAI`), quindi non serve toccare il JavaScript.
 *
 * `shareWithAI` restringe il selettore alle app IA installate. Perché funzioni
 * su Android 11 e successivi il manifest deve dichiarare i pacchetti in
 * <queries>: senza quel blocco il sistema li nasconde e l'elenco risulta
 * sempre vuoto, senza alcun errore.
 */
@CapacitorPlugin(name = "OutboundShare")
public class OutboundSharePlugin extends Plugin {

    private static final String[] AI_PACKAGES = {
        "com.openai.chatgpt",
        "com.anthropic.claude",
        "com.google.android.apps.bard",
        "com.microsoft.copilot",
        "ai.perplexity.app.android",
    };

    private Intent sendIntent(String text, String title) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, text);
        if (title != null) intent.putExtra(Intent.EXTRA_SUBJECT, title);
        return intent;
    }

    @PluginMethod
    public void share(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.isEmpty()) { call.reject("testo mancante"); return; }
        Intent chooser = Intent.createChooser(sendIntent(text, call.getString("title")), call.getString("title"));
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(chooser);
        call.resolve();
    }

    @PluginMethod
    public void shareWithAI(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.isEmpty()) { call.reject("testo mancante"); return; }
        String title = call.getString("title");

        PackageManager packages = getContext().getPackageManager();
        List<Intent> mirati = new ArrayList<>();

        for (String nome : AI_PACKAGES) {
            Intent intent = sendIntent(text, title);
            intent.setPackage(nome);
            List<ResolveInfo> risolti = packages.queryIntentActivities(intent, 0);
            if (!risolti.isEmpty()) mirati.add(intent);
        }

        if (mirati.isEmpty()) {
            // Nessuna app IA installata: si apre il selettore completo e si
            // avvisa il lato web, che lo dice all'utente invece di lasciarlo
            // davanti a un elenco inatteso.
            Intent chooser = Intent.createChooser(sendIntent(text, title), title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve(new JSObject().put("fallback", true));
            return;
        }

        Intent chooser = Intent.createChooser(mirati.remove(0), title);
        if (!mirati.isEmpty()) {
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, mirati.toArray(new Intent[0]));
        }
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(chooser);
        call.resolve(new JSObject().put("fallback", false));
    }
}
