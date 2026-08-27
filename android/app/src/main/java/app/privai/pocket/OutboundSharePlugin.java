package app.privai.pocket;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Parcelable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "OutboundShare")
public class OutboundSharePlugin extends Plugin {
    private static final String[] AI_PACKAGES = {
        "com.openai.chatgpt",
        "com.anthropic.claude",
        "com.google.android.apps.bard",
        "com.microsoft.copilot",
        "ai.perplexity.app.android"
    };

    @PluginMethod
    public void share(PluginCall call) {
        Intent send = buildSendIntent(call);
        if (send == null) return;
        launch(Intent.createChooser(send, call.getString("title", "Condividi")), call, false);
    }

    @PluginMethod
    public void shareWithAI(PluginCall call) {
        Intent send = buildSendIntent(call);
        if (send == null) return;

        PackageManager manager = getContext().getPackageManager();
        List<Intent> targets = new ArrayList<>();
        for (String packageName : AI_PACKAGES) {
            Intent target = new Intent(send).setPackage(packageName);
            if (target.resolveActivity(manager) != null) targets.add(target);
        }

        if (targets.isEmpty()) {
            launch(Intent.createChooser(send, call.getString("title", "Condividi")), call, true);
            return;
        }

        Intent chooser = Intent.createChooser(targets.remove(0), call.getString("title", "Scegli un’IA"));
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, targets.toArray(new Parcelable[0]));
        launch(chooser, call, false);
    }

    private Intent buildSendIntent(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.trim().isEmpty()) {
            call.reject("Missing text");
            return null;
        }
        return new Intent(Intent.ACTION_SEND)
            .setType("text/plain")
            .putExtra(Intent.EXTRA_TEXT, text);
    }

    private void launch(Intent chooser, PluginCall call, boolean fallback) {
        getActivity().runOnUiThread(() -> {
            getActivity().startActivity(chooser);
            JSObject result = new JSObject();
            result.put("fallback", fallback);
            call.resolve(result);
        });
    }
}
