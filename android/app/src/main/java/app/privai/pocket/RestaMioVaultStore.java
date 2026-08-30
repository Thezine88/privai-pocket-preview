package app.privai.pocket;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public final class RestaMioVaultStore {
    private static final String KEY_ALIAS = "restamio_vault_v1";
    private static final String ITEM_PREFIX = "item:";
    private final SharedPreferences preferences;

    public RestaMioVaultStore(Context context) {
        preferences = context.getSharedPreferences("restamio_vault", Context.MODE_PRIVATE);
    }

    public List<String> list() {
        List<String> keys = new ArrayList<>();
        for (String key : preferences.getAll().keySet()) {
            if (key.startsWith(ITEM_PREFIX)) keys.add(key.substring(ITEM_PREFIX.length()));
        }
        Collections.sort(keys);
        return keys;
    }

    public String read(String key) throws Exception {
        String encoded = preferences.getString(storageKey(key), null);
        return encoded == null ? null : decrypt(encoded);
    }

    public void write(String key, String value) throws Exception {
        preferences.edit().putString(storageKey(key), encrypt(value)).apply();
    }

    public void remove(String key) {
        preferences.edit().remove(storageKey(key)).apply();
    }

    public void clear() {
        preferences.edit().clear().apply();
    }

    String rawValue(String key) {
        return preferences.getString(storageKey(key), "");
    }

    private String storageKey(String key) {
        if (key == null || key.trim().isEmpty()) throw new IllegalArgumentException("Invalid vault key");
        return ITEM_PREFIX + key;
    }

    private SecretKey secretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build());
            generator.generateKey();
        }
        return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey());
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        byte[] iv = cipher.getIV();
        ByteBuffer packed = ByteBuffer.allocate(4 + iv.length + encrypted.length);
        packed.putInt(iv.length).put(iv).put(encrypted);
        return Base64.encodeToString(packed.array(), Base64.NO_WRAP);
    }

    private String decrypt(String encoded) throws Exception {
        ByteBuffer packed = ByteBuffer.wrap(Base64.decode(encoded, Base64.NO_WRAP));
        int ivLength = packed.getInt();
        if (ivLength < 12 || ivLength > 16 || packed.remaining() <= ivLength) throw new IllegalArgumentException("Invalid vault payload");
        byte[] iv = new byte[ivLength];
        packed.get(iv);
        byte[] encrypted = new byte[packed.remaining()];
        packed.get(encrypted);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }
}
