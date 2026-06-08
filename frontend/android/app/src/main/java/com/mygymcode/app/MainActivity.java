package com.mygymcode.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Evita que a WebView desenhe por baixo da barra de navegação do sistema (Android 15+).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }

    @Override
    public void onResume() {
        super.onResume();
        attachWindowInsetsListener();
    }

    private void attachWindowInsetsListener() {
        View content = findViewById(android.R.id.content);
        if (content == null) {
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
            Insets navigationBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
            pushInsetsToWebView(statusBars.top, navigationBars.bottom);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(content);
    }

    private void pushInsetsToWebView(int topPx, int bottomPx) {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }

        String js =
            "document.documentElement.classList.add('capacitor-native','capacitor-android');"
                + "document.documentElement.style.setProperty('--safe-top-env','"
                + topPx
                + "px');"
                + "document.documentElement.style.setProperty('--safe-bottom-env','"
                + bottomPx
                + "px');"
                + "document.querySelectorAll('.native-bottom-nav').forEach(function(el){"
                + "el.style.paddingBottom=(Math.max("
                + bottomPx
                + ",48)+4)+'px';"
                + "});";

        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
