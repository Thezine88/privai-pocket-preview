package app.privai.pocket;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import android.content.Context;
import androidx.test.core.app.ApplicationProvider;
import org.junit.Before;
import org.junit.Test;

public class RestaMioVaultStoreTest {
    private RestaMioVaultStore store;

    @Before
    public void setUp() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        store = new RestaMioVaultStore(context);
        store.clear();
    }

    @Test
    public void storesOnlyCiphertextAndRestoresTheOriginalValue() throws Exception {
        String original = "Simone 338123456 mario@example.com";
        store.write("job-1", original);

        assertFalse(store.rawValue("job-1").contains(original));
        assertEquals(original, store.read("job-1"));
    }
}
