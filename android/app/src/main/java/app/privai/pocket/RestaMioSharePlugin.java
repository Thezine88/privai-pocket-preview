package app.privai.pocket;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@CapacitorPlugin(name = "RestaMioShare")
public class RestaMioSharePlugin extends Plugin {
    static final long MAX_BYTES = 20L * 1024L * 1024L;
    private JSObject pending;

    @Override public void load() { accept(getActivity().getIntent()); }
    @Override protected void handleOnNewIntent(Intent intent) { accept(intent); }

    @PluginMethod public void getPending(PluginCall call) {
        JSObject result = new JSObject();
        result.put("item", pending);
        pending = null;
        call.resolve(result);
    }

    @PluginMethod public void read(PluginCall call) {
        try {
            File file = cached(requiredId(call));
            if (!file.isFile() || file.length() > MAX_BYTES) throw new IllegalArgumentException();
            try (InputStream input = new FileInputStream(file); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                copyLimited(input, output);
                JSObject result = new JSObject();
                result.put("base64", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
                call.resolve(result);
            }
        } catch (Exception error) { call.reject("Impossibile leggere il contenuto condiviso"); }
    }

    @PluginMethod public void recognize(PluginCall call) {
        final TextRecognizer recognizer;
        try {
            File file = cached(requiredId(call));
            if (!file.isFile() || file.length() > MAX_BYTES) throw new IllegalArgumentException();
            InputImage image = InputImage.fromFilePath(getContext(), Uri.fromFile(file));
            recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            recognizer.process(image)
                .addOnSuccessListener(result -> {
                    JSObject response = new JSObject();
                    response.put("text", result.getText());
                    call.resolve(response);
                })
                .addOnFailureListener(error -> call.reject("Impossibile riconoscere il testo nell’immagine"))
                .addOnCompleteListener(task -> recognizer.close());
        } catch (Exception error) { call.reject("Impossibile riconoscere il testo nell’immagine"); }
    }

    @PluginMethod public void discard(PluginCall call) {
        try {
            File file = cached(requiredId(call));
            if (file.exists() && !file.delete()) throw new IllegalStateException();
            call.resolve();
        } catch (Exception error) { call.reject("Impossibile eliminare il contenuto temporaneo"); }
    }

    private void accept(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        File staged = null;
        try {
            String mime = intent.getType();
            Uri uri = shareUri(intent);
            String name = uri == null ? "testo-condiviso.txt" : displayName(uri);
            IncomingShare.Kind kind = IncomingShare.classify(mime, name);
            if (kind == IncomingShare.Kind.UNSUPPORTED) return;
            String id = UUID.randomUUID().toString();
            File file = cached(id);
            staged = file;
            if (!file.getParentFile().exists() && !file.getParentFile().mkdirs()) throw new IllegalStateException();
            if (uri != null) {
                try (InputStream input = getContext().getContentResolver().openInputStream(uri); FileOutputStream output = new FileOutputStream(file)) {
                    if (input == null) throw new IllegalArgumentException();
                    copyLimited(input, output);
                }
            } else {
                String text = intent.getStringExtra(Intent.EXTRA_TEXT);
                if (text == null) return;
                byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > MAX_BYTES) throw new IllegalArgumentException();
                try (FileOutputStream output = new FileOutputStream(file)) { output.write(bytes); }
            }
            pending = new JSObject();
            pending.put("kind", kind.name()); pending.put("mimeType", mime == null ? "" : mime);
            pending.put("name", cleanName(name)); pending.put("size", file.length()); pending.put("cacheId", id);
            notifyListeners("incomingShare", pending, true);
        } catch (Exception ignored) {
            if (staged != null && staged.exists()) staged.delete();
        }
    }

    private File directory() { return new File(getContext().getCacheDir(), "incoming-share"); }
    private File cached(String id) { return new File(directory(), id); }
    @SuppressWarnings("deprecation")
    private Uri shareUri(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        return intent.getParcelableExtra(Intent.EXTRA_STREAM);
    }
    private String requiredId(PluginCall call) {
        String id = call.getString("cacheId");
        if (id == null || !id.matches("[a-zA-Z0-9-]+")) throw new IllegalArgumentException();
        return id;
    }
    private String displayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        }
        return "contenuto-condiviso";
    }
    private String cleanName(String name) {
        String safe = name == null ? "contenuto-condiviso" : name;
        String cleaned = safe.replaceAll("[\\p{Cntrl}\\r\\n]", "").trim();
        return cleaned.isEmpty() ? "contenuto-condiviso" : cleaned;
    }
    private void copyLimited(InputStream input, java.io.OutputStream output) throws Exception {
        byte[] buffer = new byte[8192]; long total = 0; int count;
        while ((count = input.read(buffer)) != -1) {
            total += count; if (total > MAX_BYTES) throw new IllegalArgumentException();
            output.write(buffer, 0, count);
        }
    }
}
