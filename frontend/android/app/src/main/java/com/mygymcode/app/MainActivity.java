package com.mygymcode.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final Handler insetHandler = new Handler(Looper.getMainLooper());
    private int lastTopPx = 0;
    private int lastBottomPx = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        attachWindowInsetsListener();
    }

    @Override
    public void onResume() {
        super.onResume();
        scheduleInsetPush();
    }

    private void attachWindowInsetsListener() {
        View content = findViewById(android.R.id.content);
        if (content == null) {
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
            Insets navigationBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
            lastTopPx = statusBars.top;
            lastBottomPx = navigationBars.bottom;
            if (lastBottomPx <= 0) {
                lastBottomPx = getNavigationBarHeightPx();
            }
            scheduleInsetPush();
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(content);
    }

    private int getNavigationBarHeightPx() {
        int resourceId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        if (resourceId > 0) {
            return getResources().getDimensionPixelSize(resourceId);
        }
        return 48;
    }

    private void scheduleInsetPush() {
        int[] delays = {0, 100, 300, 600, 1200, 2500};
        for (int delay : delays) {
            insetHandler.postDelayed(this::pushInsetsToWebView, delay);
        }
    }

    private void pushInsetsToWebView() {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }

        int bottom = lastBottomPx > 0 ? lastBottomPx : getNavigationBarHeightPx();
        int top = lastTopPx;

        String js =
            "(function(){"
                + "document.documentElement.classList.add('capacitor-native','capacitor-android');"
                + "if(window.gymCodeApplySafeArea){"
                + "window.gymCodeApplySafeArea("
                + top
                + ","
                + bottom
                + ");"
                + "}else{"
                + "document.documentElement.style.setProperty('--safe-bottom-env','"
                + bottom
                + "px');"
                + "document.documentElement.style.setProperty('--safe-top-env','"
                + top
                + "px');"
                + "}"
                + "})();";

        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
