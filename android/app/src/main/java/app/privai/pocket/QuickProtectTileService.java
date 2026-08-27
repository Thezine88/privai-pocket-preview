package app.privai.pocket;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Il riquadro "Proteggi appunti" nelle Impostazioni Rapide. Non ha uno
 * stato acceso/spento: è un'azione istantanea, resta sempre INACTIVE.
 * Ogni tocco apre QuickProtectActivity, che decide da sola se mascherare o
 * ripristinare gli appunti e si chiude senza mai mostrarsi.
 */
public class QuickProtectTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setState(Tile.STATE_INACTIVE);
        tile.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        Intent intent = new Intent(this, QuickProtectActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startActivityAndCollapse(PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        } else {
            startActivityLegacy(intent);
        }
    }

    // API precedenti alla 34: startActivityAndCollapse(Intent) è deprecato
    // ma è l'unica firma disponibile prima del PendingIntent.
    @SuppressWarnings("deprecation")
    private void startActivityLegacy(Intent intent) {
        startActivityAndCollapse(intent);
    }
}
