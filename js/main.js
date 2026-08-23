/* ==========================================================================
   ミンティーズ LP — main.js
   CTA遷移先を一元管理 / CVイベント計測の下地（GTM未導入時も安全に動作）
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
   * CONFIG: 電話・LINE・予約フォームのURLをここで一元管理。
   * 差し替えが必要な場合はこの3行だけ書き換えればサイト全体に反映されます。
   * -------------------------------------------------------------------- */
  var CONFIG = {
    TEL: "0566-77-7772",
    LINE_URL: "https://line.me/ti/p/@luy1644d",
    FORM_URL: "https://lin.ee/RUv8use", // 無料体験予約の窓口（LINE）
  };

  function applyConfig() {
    var telLinks = document.querySelectorAll("[data-role='tel-link']");
    telLinks.forEach(function (el) {
      el.setAttribute("href", "tel:" + CONFIG.TEL.replace(/-/g, ""));
      var label = el.querySelector("[data-role='tel-label']");
      if (label) label.textContent = CONFIG.TEL;
    });

    var lineLinks = document.querySelectorAll("[data-role='line-link']");
    lineLinks.forEach(function (el) {
      el.setAttribute("href", CONFIG.LINE_URL);
    });

    var formLinks = document.querySelectorAll("[data-role='form-link']");
    formLinks.forEach(function (el) {
      el.setAttribute("href", CONFIG.FORM_URL);
    });
  }

  /* ----------------------------------------------------------------------
   * CVイベント計測の下地
   * GTM/GA4導入時は window.dataLayer が存在するため、
   * 存在チェックのみで安全にイベントを積める設計にしている。
   * GTMコンテナを入れる場所は index.html の <!-- GTM PLACEHOLDER --> を参照。
   * -------------------------------------------------------------------- */
  function pushEvent(eventName, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(
      Object.assign({ event: eventName }, params || {})
    );
    // デバッグ用（本番公開前に削除 or console分岐推奨）
    if (window.location.hostname === "localhost") {
      console.log("[CV EVENT]", eventName, params);
    }
  }

  function bindCtaTracking() {
    document.querySelectorAll("[data-cta]").forEach(function (el) {
      el.addEventListener("click", function () {
        pushEvent("cta_click", {
          cta_type: el.getAttribute("data-cta"),
          cta_position: el.getAttribute("data-cta-position") || "unknown",
        });
      });
    });
  }

  /* ----------------------------------------------------------------------
   * スクロール到達率トラッキング（25/50/75/100%）
   * -------------------------------------------------------------------- */
  function bindScrollDepth() {
    var fired = {};
    var thresholds = [25, 50, 75, 100];
    function onScroll() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var pct = Math.round((scrollTop / docHeight) * 100);
      thresholds.forEach(function (t) {
        if (pct >= t && !fired[t]) {
          fired[t] = true;
          pushEvent("scroll_depth", { depth_percent: t });
        }
      });
    }
    window.addEventListener("scroll", throttle(onScroll, 500), {
      passive: true,
    });
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn();
      }
    };
  }

  /* ----------------------------------------------------------------------
   * FAQのdetails要素: 1つ開いたら他を閉じる（任意の挙動／読みやすさ優先）
   * -------------------------------------------------------------------- */
  function bindFaqAccordion() {
    var items = document.querySelectorAll(".faq-item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
   * ヘッダー: ヒーロー上では透明、スクロールしたら白背景に切り替え
   * -------------------------------------------------------------------- */
  function bindHeaderScroll() {
    var header = document.getElementById("site-header");
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 60) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
   * 要素が画面に入ったらふわっと表示する reveal 演出
   * -------------------------------------------------------------------- */
  function bindReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px -2% 0px" }
    );
    targets.forEach(function (el) { observer.observe(el); });

    // フェイルセーフ: 何らかの理由でIntersectionObserverが発火しない場合でも
    // コンテンツが永久に非表示のままにならないよう、一定時間後に強制表示する
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 2500);
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    bindCtaTracking();
    bindScrollDepth();
    bindFaqAccordion();
    bindHeaderScroll();
    bindReveal();
  });
})();
