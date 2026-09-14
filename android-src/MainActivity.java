package vn.rungvang.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    private boolean bridged;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (versionChanged()) {
            wipeWebCache();
            getSharedPreferences("rungvang", MODE_PRIVATE).edit().putInt("ver", packageCode()).apply();
        }
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        Bridge b = getBridge();
        if (b == null) return;
        WebView w = b.getWebView();
        if (w == null) return;
        harden(w);
        if (bridged) return;
        bridged = true;
        w.addJavascriptInterface(new FileSaver(this), "RungVangFiles");
        w.addJavascriptInterface(new TrackBridge(this), "RungVangTrack");
        AppFolder folder = new AppFolder(this);
        w.addJavascriptInterface(folder, "RungVangFolder");
        w.addJavascriptInterface(new SecureBridge(this), "RungVangSecure");
        folder.ensure();
    }

    static void harden(WebView w) {
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings s = w.getSettings();
        s.setDomStorageEnabled(true);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        if (Build.VERSION.SDK_INT >= 21) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
    }

    boolean versionChanged() {
        int code = packageCode();
        if (code == 0) return false;
        return getSharedPreferences("rungvang", MODE_PRIVATE).getInt("ver", 0) != code;
    }

    int packageCode() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= 28) return (int) info.getLongVersionCode();
            return info.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    void wipeWebCache() {
        File data = new File(getApplicationInfo().dataDir);
        deleteRec(new File(data, "cache/WebView"));
        deleteRec(new File(data, "app_webview/Default/Cache"));
        deleteRec(new File(data, "app_webview/Default/Code Cache"));
        deleteRec(new File(data, "app_webview/Default/GPUCache"));
        deleteRec(new File(data, "app_webview/Default/Service Worker"));
        File cache = getCacheDir();
        if (cache != null) {
            deleteRec(new File(cache, "WebView"));
            deleteRec(new File(cache, "org.chromium.android_webview"));
        }
    }

    static void deleteRec(File f) {
        if (f == null || !f.exists()) return;
        File[] kids = f.listFiles();
        if (kids != null) {
            for (int i = 0; i < kids.length; i++) deleteRec(kids[i]);
        }
        f.delete();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        FileSaver.onResult(this, requestCode, resultCode, data);
    }
}
