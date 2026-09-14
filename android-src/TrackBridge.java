package vn.rungvang.app;

import android.app.Activity;
import android.content.Intent;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;

/** GPS nền khi khóa màn hình. Gắn window.RungVangTrack. */
public class TrackBridge {
    private final Activity activity;

    public TrackBridge(Activity activity) {
        this.activity = activity;
        TrackService.activity = activity;
    }

    @JavascriptInterface
    public String start() {
        try {
            Intent i = new Intent(activity, TrackService.class);
            i.setAction(TrackService.ACTION_START);
            activity.startForegroundService(i);
            return "ok";
        } catch (Exception e) {
            return "fail";
        }
    }

    @JavascriptInterface
    public String stop() {
        try {
            Intent i = new Intent(activity, TrackService.class);
            i.setAction(TrackService.ACTION_STOP);
            activity.startService(i);
            return "ok";
        } catch (Exception e) {
            return "fail";
        }
    }

    @JavascriptInterface
    public String drain() {
        JSONArray arr = TrackService.drain();
        return arr == null ? "[]" : arr.toString();
    }
}
