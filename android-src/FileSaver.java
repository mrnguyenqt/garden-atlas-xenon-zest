package vn.rungvang.app;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.io.OutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FileSaver {
    public static final int REQ = 9173;
    private static byte[] pending;
    private static String pendingExt = ".xlsx";
    private final Activity activity;
    private static final Pattern DUP = Pattern.compile(
        "(?i)^(.+?)\\.(xlsx|csv|xls|kml)\\s*\\((\\d+)\\)\\s*$"
    );

    public FileSaver(Activity activity) {
        this.activity = activity;
    }

    static String extOf(String name, String mime) {
        String lower = name == null ? "" : name.toLowerCase();
        if (lower.endsWith(".kml")) return ".kml";
        if (lower.endsWith(".csv")) return ".csv";
        if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) return ".xls";
        if (lower.endsWith(".xlsx")) return ".xlsx";
        String m = mime == null ? "" : mime.toLowerCase();
        if (m.contains("kml") || m.contains("google-earth")) return ".kml";
        if (m.contains("csv")) return ".csv";
        return ".xlsx";
    }

    static String fixName(String name, String mime) {
        if (name == null || name.trim().length() == 0) return "export" + extOf("", mime);
        name = name.trim();
        Matcher m = DUP.matcher(name);
        if (m.matches()) {
            return m.group(1).trim() + " (" + m.group(3) + ")." + m.group(2).toLowerCase();
        }
        String ext = extOf(name, mime);
        String lower = name.toLowerCase();
        if (lower.endsWith(ext)) return name;
        return name + ext;
    }

    @JavascriptInterface
    public String saveBase64(String name, String mime, String b64) {
        try {
            if (name == null || name.length() == 0) name = "export.xlsx";
            name = fixName(name, mime);
            pendingExt = extOf(name, mime);
            if (mime == null || mime.length() == 0) {
                mime = pendingExt.equals(".kml")
                    ? "application/vnd.google-earth.kml+xml"
                    : pendingExt.equals(".csv")
                        ? "text/csv"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }
            pending = Base64.decode(b64, Base64.DEFAULT);
            final String title = name;
            final String type = mime;
            activity.runOnUiThread(new Runnable() {
                public void run() {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(type);
                    intent.putExtra(Intent.EXTRA_TITLE, title);
                    activity.startActivityForResult(intent, REQ);
                }
            });
            return "ok";
        } catch (Exception e) {
            return "fail";
        }
    }

    public static void onResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ) return;
        byte[] bytes = pending;
        pending = null;
        if (resultCode != Activity.RESULT_OK || data == null || bytes == null) return;
        Uri uri = data.getData();
        if (uri == null) return;
        String display = queryName(activity, uri);
        String fixed = fixName(display == null || display.length() == 0 ? "export" + pendingExt : display, "");
        if (display != null && !fixed.equals(display)) {
            try {
                Uri renamed = DocumentsContract.renameDocument(activity.getContentResolver(), uri, fixed);
                if (renamed != null) uri = renamed;
            } catch (Exception ignored) {
            }
        }
        try {
            OutputStream out = activity.getContentResolver().openOutputStream(uri);
            if (out == null) return;
            out.write(bytes);
            out.close();
        } catch (Exception ignored) {
        }
    }

    static String queryName(Activity activity, Uri uri) {
        Cursor c = null;
        try {
            c = activity.getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null);
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (i >= 0) return c.getString(i);
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return null;
    }
}
