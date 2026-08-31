package app.privai.pocket;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RestaMioVaultPlugin.class);
        registerPlugin(RestaMioSharePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
