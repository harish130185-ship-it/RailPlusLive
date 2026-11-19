package com.railpulse.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
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
    private String allowedHost;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        siteUrl = getString(R.string.website_url).trim();
        Uri uri = Uri.parse(siteUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getHost().endsWith(".example")) {
            TextView setup = new TextView(this);
            setup.setText("RailPulse setup needed:\n\n1. Deploy the website + backend via HTTPS.\n2. Set your real website_url in android/app/src/main/res/values/strings.xml.\n3. Rebuild the APK.");
            setup.setTextSize(18);
            setup.setTextColor(Color.rgb(23, 51, 74));
            setup.setPadding(40, 80, 40, 40);
            setContentView(setup);
            return;
        }
        allowedHost = uri.getHost().toLowerCase();
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(245, 248, 251));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(24, 12, 24, 12);
        toolbar.setBackgroundColor(Color.rgb(13, 39, 69));
        TextView name = new TextView(this);
        name.setText("RailPulse");
        name.setTextSize(20);
        name.setTextColor(Color.WHITE);
        name.setTypeface(null, 1);
        toolbar.addView(name, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        Button refresh = new Button(this);
        refresh.setText("Refresh");
        refresh.setAllCaps(false);
        refresh.setOnClickListener(v -> browser.reload());
        toolbar.addView(refresh);
        root.addView(toolbar);

        browser = new WebView(this);
        browser.setBackgroundColor(Color.WHITE);
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true); // Required for the app UI, only our HTTPS domain is allowed.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri dest = request.getUrl();
                if ("https".equalsIgnoreCase(dest.getScheme()) && allowedHost.equalsIgnoreCase(dest.getHost())) return false;
                if ("https".equalsIgnoreCase(dest.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, dest)); } catch (Exception ignored) {}
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Connection issue")
                        .setMessage("RailPulse website can't be reached. Check mobile internet or try again.")
                        .setPositiveButton("Retry", (dialog, which) -> browser.reload())
                        .setNegativeButton("Close", null)
                        .show();
                }
            }
        });
        root.addView(browser, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        browser.loadUrl(siteUrl);
    }

    @Override
    public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (browser != null) { browser.destroy(); browser = null; }
        super.onDestroy();
    }
}
