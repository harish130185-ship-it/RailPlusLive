package com.railplus.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private WebView browser;
    private String siteUrl;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        siteUrl = getString(R.string.website_url).trim();
        Uri uri = Uri.parse(siteUrl);

        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getHost().endsWith(".example")) {
            TextView setup = new TextView(this);
            setup.setText("RailPlus setup needed:\n\n1. Deploy the website + backend via HTTPS.\n2. Set your real website_url in android/app/src/main/res/values/strings.xml.\n3. Rebuild the APK.");
            setup.setTextSize(18);
            setup.setTextColor(Color.rgb(15, 41, 74));
            setup.setPadding(40, 80, 40, 40);
            setContentView(setup);
            return;
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(245, 248, 251));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(24, 14, 24, 14);
        toolbar.setBackgroundColor(Color.rgb(15, 41, 74));

        TextView name = new TextView(this);
        name.setText("RailPlus");
        name.setTextSize(20);
        name.setTextColor(Color.WHITE);
        name.setTypeface(null, 1);
        toolbar.addView(name, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        Button refresh = new Button(this);
        refresh.setText("⟳ Refresh");
        refresh.setAllCaps(false);
        refresh.setTextColor(Color.WHITE);
        refresh.setBackgroundColor(Color.argb(40, 255, 255, 255));
        refresh.setOnClickListener(v -> {
            if (browser != null) browser.reload();
        });
        toolbar.addView(refresh);
        root.addView(toolbar);

        browser = new WebView(this);
        browser.setBackgroundColor(Color.WHITE);

        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);
        browser.setWebChromeClient(new WebChromeClient());

        browser.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri dest = request.getUrl();
                String host = dest.getHost();
                if ("https".equalsIgnoreCase(dest.getScheme()) && isAllowedHost(host)) {
                    return false;
                }
                // Open external links (IRCTC, Railways, Payment, Social) in external browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, dest);
                    startActivity(intent);
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Connection Issue")
                        .setMessage("Unable to connect to RailPlus. Please check your internet connection and try again.")
                        .setPositiveButton("Retry", (dialog, which) -> {
                            if (browser != null) browser.reload();
                        })
                        .setNegativeButton("Close", null)
                        .show();
                }
            }
        });

        // Handle external downloads (e.g. ticket receipt, PDF)
        browser.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(url));
                startActivity(i);
            } catch (Exception ignored) {}
        });

        root.addView(browser, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        browser.loadUrl(siteUrl);
    }

    private boolean isAllowedHost(String host) {
        if (host == null) return false;
        String h = host.toLowerCase();
        return h.equals("railplus.in") || h.endsWith(".railplus.in") || h.contains("vercel.app") || h.equals("localhost") || h.equals("127.0.0.1");
    }

    @Override
    public void onBackPressed() {
        if (browser != null && browser.canGoBack()) {
            browser.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (browser != null) {
            browser.destroy();
            browser = null;
        }
        super.onDestroy();
    }
}
