package app.privai.pocket;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * La cassaforte: qui vive la corrispondenza fra segnaposto e dato originale.
 *
 * La chiave sta in Android Keystore, cioè in un'area che l'app stessa non può
 * leggere: può solo chiedere al sistema di cifrare e decifrare. Nemmeno un
 * backup del telefono o l'accesso ai file dell'app restituisce i dati.
 *
 * Volutamente senza androidx.security:security-crypto: quella libreria è ancora
 * in alpha, e per il pezzo che custodisce i dati degli utenti una dipendenza
 * instabile non vale le sessanta righe risparmiate.
 */
@CapacitorPlugin(name = "SecureStore")
public class SecureStorePlugin extends Plugin {

    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String ALIAS = "privai_vault_key";
    private static final String PREFS = "privai_vault";
    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private static final int TAG_BITS = 128;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Crea la chiave al primo uso e poi la riusa. Non esce mai dal Keystore. */
    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance(KEYSTORE);
        store.load(null);
        KeyStore.Entry entry = store.getEntry(ALIAS, null);
        if (entry instanceof KeyStore.SecretKeyEntry) {
            return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(
                ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build());
        return generator.generateKey();
    }

    private String encrypt(String plain) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORM);
        cipher.init(Cipher.ENCRYPT_MODE, key());
        byte[] iv = cipher.getIV();
        byte[] body = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
        // Il vettore di inizializzazione non è segreto, ma serve a decifrare:
        // viaggia davanti al testo cifrato, separato da due punti.
        return Base64.encodeToString(iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(body, Base64.NO_WRAP);
    }

    private String decrypt(String stored) throws Exception {
        int cut = stored.indexOf(':');
        if (cut < 0) return null;
        byte[] iv = Base64.decode(stored.substring(0, cut), Base64.NO_WRAP);
        byte[] body = Base64.decode(stored.substring(cut + 1), Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance(TRANSFORM);
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
        return new String(cipher.doFinal(body), StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void get(PluginCall call) {
        String name = call.getString("key");
        if (name == null) { call.reject("key mancante"); return; }
        String stored = prefs().getString(name, null);
        if (stored == null) { call.resolve(new JSObject().put("value", null)); return; }
        try {
            call.resolve(new JSObject().put("value", decrypt(stored)));
        } catch (Exception error) {
            // Chiave ruotata o dato corrotto: si toglie di mezzo la voce
            // illeggibile invece di lasciare l'app bloccata su un errore.
            prefs().edit().remove(name).apply();
            call.resolve(new JSObject().put("value", null));
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String name = call.getString("key");
        String value = call.getString("value");
        if (name == null || value == null) { call.reject("key o value mancanti"); return; }
        try {
            prefs().edit().putString(name, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("cassaforte non disponibile", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String name = call.getString("key");
        if (name == null) { call.reject("key mancante"); return; }
        prefs().edit().remove(name).apply();
        call.resolve();
    }
}
