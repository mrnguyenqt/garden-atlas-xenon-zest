package vn.rungvang.app;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class TrackService extends Service implements LocationListener {
    public static final String ACTION_START = "vn.rungvang.app.TRACK_START";
    public static final String ACTION_STOP = "vn.rungvang.app.TRACK_STOP";
    public static Activity activity;
    private static final List<JSONObject> BUFFER = new ArrayList<>();
    private LocationManager loc;
    private PowerManager.WakeLock wake;

    public static JSONArray drain() {
        JSONArray arr = new JSONArray();
        synchronized (BUFFER) {
            for (JSONObject o : BUFFER) arr.put(o);
            BUFFER.clear();
        }
        return arr;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        startFg();
        acquireWake();
        startGps();
        return START_STICKY;
    }

    private void startFg() {
        String id = "tracklog";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(id, "Tracklog", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Ghi GPS khi khoa man hinh");
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(this, activity != null ? activity.getClass() : TrackService.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, id)
            : new Notification.Builder(this);
        Notification n = b.setContentTitle("Rung vang")
            .setContentText("Dang ghi tracklog")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pi)
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(17, n, 8);
        } else {
            startForeground(17, n);
        }
    }

    private void acquireWake() {
        if (wake != null && wake.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "rungvang:track");
        wake.acquire();
    }

    private void startGps() {
        if (loc != null) return;
        loc = (LocationManager) getSystemService(LOCATION_SERVICE);
        try {
            loc.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 2f, this);
        } catch (SecurityException ignored) {
        }
        try {
            loc.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 2000, 5f, this);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        try {
            JSONObject o = new JSONObject();
            o.put("lat", location.getLatitude());
            o.put("lng", location.getLongitude());
            o.put("acc", location.hasAccuracy() ? location.getAccuracy() : 0);
            if (location.hasAltitude()) o.put("ele", location.getAltitude());
            o.put("at", System.currentTimeMillis());
            synchronized (BUFFER) {
                BUFFER.add(o);
                if (BUFFER.size() > 4000) BUFFER.remove(0);
            }
            final String js = "window.__rvTrackFix&&window.__rvTrackFix(" + o.toString() + ")";
            final Activity a = activity;
            if (a == null) return;
            a.runOnUiThread(new Runnable() {
                public void run() {
                    WebView w = a.findViewById(a.getResources().getIdentifier("webview", "id", a.getPackageName()));
                    if (w != null) w.evaluateJavascript(js, null);
                }
            });
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onDestroy() {
        if (loc != null) {
            try { loc.removeUpdates(this); } catch (Exception ignored) {}
            loc = null;
        }
        if (wake != null && wake.isHeld()) wake.release();
        wake = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override public void onProviderEnabled(String p) {}
    @Override public void onProviderDisabled(String p) {}
    @Override public void onStatusChanged(String p, int s, android.os.Bundle b) {}
}
