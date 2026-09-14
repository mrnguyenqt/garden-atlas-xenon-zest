package vn.rungvang.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.media.MediaScannerConnection;
import android.os.Environment;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Thư mục RungVang trên bộ nhớ máy: ảnh loài, icon, ảnh hiện trường, xuất file. */
public class AppFolder {
    public static final String DIR = "RungVang";
    private static final String PACK = ".pack-v2";
    private final Activity activity;

    public AppFolder(Activity activity) {
        this.activity = activity;
    }

    File root() {
        File docs = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
        File a = new File(docs, DIR);
        if (mkdirs(a)) return a;
        File sd = Environment.getExternalStorageDirectory();
        File b = new File(sd, DIR);
        if (mkdirs(b)) return b;
        File ext = activity.getExternalFilesDir(null);
        File c = new File(ext != null ? ext : activity.getFilesDir(), DIR);
        mkdirs(c);
        return c;
    }

    static boolean mkdirs(File dir) {
        try {
            if (dir.exists()) return dir.isDirectory() && dir.canWrite();
            return dir.mkdirs();
        } catch (Exception e) {
            return false;
        }
    }

    void ensureDirs(File root) {
        File loai = new File(root, "anh-loai");
        File icon = new File(root, "icon");
        mkdirs(loai);
        mkdirs(icon);
        mkdirs(new File(root, "anh-hien-truong"));
        mkdirs(new File(root, "xuat"));
        mkdirs(new File(root, "tracklog"));
        writeNomedia(loai);
        writeNomedia(icon);
    }

    @JavascriptInterface
    public String rootPath() {
        try {
            return root().getAbsolutePath();
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public String ensure() {
        try {
            final File root = root();
            ensureDirs(root);
            writeReadme(root);
            new Thread(new Runnable() {
                public void run() {
                    packAssets(root);
                }
            }, "rv-pack").start();
            return root.getAbsolutePath();
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public String saveBase64(String folder, String name, String mime, String b64) {
        try {
            File root = root();
            ensureDirs(root);
            String sub = safeSeg(folder);
            String file = safeName(name);
            if (file.length() == 0) file = "file.bin";
            File dest = new File(new File(root, sub), file);
            dest.getParentFile().mkdirs();
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            FileOutputStream out = new FileOutputStream(dest);
            out.write(bytes);
            out.close();
            if (sub.equals("anh-hien-truong")) scan(dest);
            return dest.getAbsolutePath();
        } catch (Exception e) {
            return "fail";
        }
    }

    void packAssets(File root) {
        File stamp = new File(root, PACK);
        if (stamp.exists()) return;
        try {
            AssetManager am = activity.getAssets();
            copyAssetFile(am, "public/icon-512.png", new File(root, "icon/icon-512.png"));
            copyAssetFile(am, "public/logo.png", new File(root, "icon/logo.png"));
            copyAssetFile(am, "public/favicon.png", new File(root, "icon/favicon.png"));
            copyAssetFile(am, "public/og.jpg", new File(root, "icon/og.jpg"));
            String[] names = am.list("public/images/sp");
            File loai = new File(root, "anh-loai");
            if (names != null) {
                for (int i = 0; i < names.length; i++) {
                    String n = names[i];
                    if (n == null) continue;
                    String lower = n.toLowerCase();
                    if (!(lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png"))) continue;
                    copyAssetFile(am, "public/images/sp/" + n, new File(loai, n));
                }
            }
            FileOutputStream out = new FileOutputStream(stamp);
            out.write("ok".getBytes(StandardCharsets.UTF_8));
            out.close();
        } catch (Exception ignored) {
        }
    }

    void copyAssetFile(AssetManager am, String src, File dest) {
        if (dest.exists() && dest.length() > 0) return;
        InputStream in = null;
        OutputStream out = null;
        try {
            dest.getParentFile().mkdirs();
            in = am.open(src);
            out = new FileOutputStream(dest);
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            out.close();
            out = null;
        } catch (Exception ignored) {
        } finally {
            try { if (in != null) in.close(); } catch (Exception ignored) {}
            try { if (out != null) out.close(); } catch (Exception ignored) {}
        }
    }

    void writeNomedia(File dir) {
        File f = new File(dir, ".nomedia");
        if (f.exists()) return;
        try {
            FileOutputStream out = new FileOutputStream(f);
            out.close();
        } catch (Exception ignored) {
        }
    }

    void writeReadme(File root) {
        File f = new File(root, "DOC.txt");
        if (f.exists()) return;
        String text =
            "Rừng vàng — thư mục dữ liệu trên máy\n"
            + "\n"
            + "anh-loai          Ảnh cây và lá trong danh lục\n"
            + "icon              Biểu tượng ứng dụng\n"
            + "anh-hien-truong   Ảnh chụp khi lập ô tiêu chuẩn\n"
            + "xuat              File Excel đã xuất\n"
            + "tracklog          File KML đường đi\n";
        try {
            FileOutputStream out = new FileOutputStream(f);
            out.write(text.getBytes(StandardCharsets.UTF_8));
            out.close();
        } catch (Exception ignored) {
        }
    }

    void scan(File file) {
        try {
            String path = file.getAbsolutePath();
            if (path.contains("/anh-loai/") || path.contains("/icon/")) return;
            if (!file.getName().matches("(?i).+\\.(jpe?g|png|webp|gif)$")) return;
            MediaScannerConnection.scanFile(activity, new String[] { path }, null, null);
        } catch (Exception ignored) {
        }
    }

    static String safeSeg(String s) {
        if (s == null) return "xuat";
        String t = s.trim().replace("\\", "/");
        if (t.contains("..") || t.startsWith("/") || t.contains(":")) return "xuat";
        if (t.equals("anh-loai") || t.equals("icon") || t.equals("anh-hien-truong") || t.equals("xuat") || t.equals("tracklog")) {
            return t;
        }
        return "xuat";
    }

    static String safeName(String s) {
        if (s == null) return "";
        String t = s.replace("\\", "/");
        int i = t.lastIndexOf('/');
        if (i >= 0) t = t.substring(i + 1);
        t = t.replaceAll("[\\\\/:*?\"<>|]", "-").trim();
        return t;
    }
}
