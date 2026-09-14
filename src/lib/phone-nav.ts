import { useEffect, useRef } from "react";

const overlayStack: Array<() => void> = [];

/** Đóng lớp phủ trên cùng. Trả về true nếu đã đóng overlay (Back không lùi trang). */
export function closeTopOverlay() {
  const fn = overlayStack.pop();
  if (!fn) return false;
  fn();
  return true;
}

/** Nút Back hệ thống đóng lớp phủ trước, rồi mới lùi trang. Không dùng history.pushState — WebView Android sẽ khoá ô nhập lần 2. */
export function useBackToClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const fn = () => closeRef.current();
    overlayStack.push(fn);
    return () => {
      const i = overlayStack.lastIndexOf(fn);
      if (i >= 0) overlayStack.splice(i, 1);
    };
  }, [open]);
}

function readEnvBottom() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)";
  document.body.append(probe);
  const pad = Number.parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return pad;
}

/** Chỉ chừa đáy khi máy báo thanh điều hướng (safe-area > 0). */
export function applySystemNavInset() {
  const inset = readEnvBottom();
  document.documentElement.style.setProperty("--sys-nav", `${inset}px`);
}

export function installPhoneBack() {
  applySystemNavInset();
  window.visualViewport?.addEventListener("resize", applySystemNavInset);

  const cap = (window as unknown as { Capacitor?: { Plugins?: { App?: { addListener?: Function; exitApp?: Function } } } }).Capacitor;
  const app = cap?.Plugins?.App;
  let handle: { remove?: () => void } | undefined;
  if (app?.addListener) {
    void Promise.resolve(
      app.addListener("backButton", (ev: { canGoBack?: boolean }) => {
        if (closeTopOverlay()) return;
        if (ev?.canGoBack || window.history.length > 1) history.back();
        else app.exitApp?.();
      }),
    ).then((h) => {
      handle = h as { remove?: () => void };
    });
  }

  const onCordovaBack = (e: Event) => {
    e.preventDefault();
    if (closeTopOverlay()) return;
    if (window.history.length > 1) history.back();
  };
  document.addEventListener("backbutton", onCordovaBack);

  return () => {
    window.visualViewport?.removeEventListener("resize", applySystemNavInset);
    handle?.remove?.();
    document.removeEventListener("backbutton", onCordovaBack);
  };
}
