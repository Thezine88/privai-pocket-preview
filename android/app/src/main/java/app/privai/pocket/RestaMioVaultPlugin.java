package app.privai.pocket;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RestaMioVault")
public class RestaMioVaultPlugin extends Plugin {
    private RestaMioVaultStore store;

    @Override
    public void load() {
        store = new RestaMioVaultStore(getContext());
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSObject result = new JSObject();
        result.put("keys", new JSArray(store.list()));
        call.resolve(result);
    }

    @PluginMethod
    public void read(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("value", store.read(required(call, "key")));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Impossibile aprire il lavoro protetto");
        }
    }

    @PluginMethod
    public void write(PluginCall call) {
        try {
            store.write(required(call, "key"), required(call, "value"));
            call.resolve();
        } catch (Exception error) {
            call.reject("Impossibile salvare il lavoro protetto");
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        try {
            store.remove(required(call, "key"));
            call.resolve();
        } catch (Exception error) {
            call.reject("Impossibile eliminare il lavoro protetto");
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        store.clear();
        call.resolve();
    }

    private String required(PluginCall call, String name) {
        String value = call.getString(name);
        if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException("Missing value");
        return value;
    }
}
