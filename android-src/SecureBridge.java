package vn.rungvang.app;

import android.app.Activity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

/** FLAG_SECURE — chặn chụp màn hình và ghi hình. */
public class SecureBridge {
    private final Activity activity;

    public SecureBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void setScreenshotBlock(boolean on) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (on) {
                    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                } else {
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
            }
        });
    }
}
