/**
 * ShuTongBuddy 在线书交互脚本
 * 由 src/components/Head.astro 以 <script> 方式引入，全站生效。
 *
 * 约定：window.__STB__ = { base, repo, owner }  由此前的内联脚本注入。
 */
(function () {
  'use strict';

  var CFG = window.__STB__ || {};
  var BASE = CFG.base || '/';
  var REPO = CFG.repo || 'guotao0628/shutongbuddy';
  var GITHUB = 'https://github.com/' + REPO;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var content =
      document.querySelector('.sl-markdown-content') || document.querySelector('main');
    var main = document.querySelector('main') || content;
    // 章末工具栏/评论挂到内容容器上，以继承 Starlight 的内边距
    var mount = (content && content.parentElement) || main;
    var sidebar =
      document.querySelector('#starlight__sidebar') || document.querySelector('.sidebar');

    /* ============ 1. 阅读进度条 ============ */
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    document.body.appendChild(bar);
    window.addEventListener(
      'scroll',
      function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
        bar.style.width = pct + '%';
      },
      { passive: true }
    );

    /* ============ 2. 阅读位置记忆 ============ */
    var SCROLL_KEY = 'stb-scroll:' + location.pathname;
    try {
      var savedY = sessionStorage.getItem(SCROLL_KEY);
      if (savedY !== null && Number(savedY) > 200) {
        requestAnimationFrame(function () {
          window.scrollTo(0, parseInt(savedY, 10));
        });
      }
    } catch (e) {}
    var scrollTimer;
    window.addEventListener(
      'scroll',
      function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          try {
            sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
          } catch (e) {}
        }, 250);
      },
      { passive: true }
    );

    /* ============ 3. 轻提示 ============ */
    var toast = document.createElement('div');
    toast.className = 'stb-toast';
    document.body.appendChild(toast);
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(function () {
        toast.classList.remove('show');
      }, 1600);
    }

    /* ============ 4. 代码块：语言标签 / 下载 / 折叠 ============ */
    var CODE_EXT = {
      bash: 'sh', shell: 'sh', sh: 'sh', zsh: 'sh',
      typescript: 'ts', ts: 'ts', javascript: 'js', js: 'js',
      json: 'json', yaml: 'yml', yml: 'yml', python: 'py',
      text: 'txt', md: 'md', markdown: 'md', html: 'html',
      css: 'css', toml: 'toml', ini: 'ini', sql: 'sql',
    };

    document.querySelectorAll('pre').forEach(function (pre, idx) {
      var figure = pre.closest('figure') || pre.parentElement;
      var lang =
        pre.getAttribute('data-language') ||
        (figure && figure.getAttribute('data-language')) ||
        '';
      if (!lang) {
        var code = pre.querySelector('code');
        var m = code && (code.className || '').match(/language-([a-z0-9+#]+)/i);
        if (m) lang = m[1];
      }

      if (lang) {
        var tag = document.createElement('span');
        tag.className = 'code-lang-tag';
        tag.textContent = lang;
        pre.appendChild(tag);
      }

      // 下载
      var codeEl = pre.querySelector('code');
      if (codeEl) {
        var dl = document.createElement('button');
        dl.className = 'code-download-btn';
        dl.type = 'button';
        dl.textContent = '⬇';
        dl.title = '下载这段代码';
        dl.addEventListener('click', function () {
          var ext = CODE_EXT[(lang || '').toLowerCase()] || 'txt';
          var blob = new Blob([codeEl.textContent], { type: 'text/plain;charset=utf-8' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'code-' + (idx + 1) + '.' + ext;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(a.href);
          }, 1000);
        });
        pre.appendChild(dl);
      }

      // 折叠超长代码
      if (pre.scrollHeight > 560 && pre.clientHeight > 0) {
        pre.classList.add('code-collapsed');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-expand-btn';
        btn.textContent = '展开全部代码';
        pre.parentNode.insertBefore(btn, pre.nextSibling);
        btn.addEventListener('click', function () {
          pre.classList.remove('code-collapsed');
          btn.remove();
        });
      }
    });

    /* ============ 5. 图片题注 + 懒加载 ============ */
    document.querySelectorAll('main img').forEach(function (img) {
      img.loading = 'lazy';
      var alt = img.getAttribute('alt');
      if (alt && alt.trim() && !img.closest('pre')) {
        var cap = document.createElement('span');
        cap.className = 'img-caption';
        cap.textContent = alt;
        img.insertAdjacentElement('afterend', cap);
      }
    });

    /* ============ 6. 移动端表格卡片化 ============ */
    document.querySelectorAll('main table').forEach(function (table) {
      var headers = [];
      table.querySelectorAll('thead th').forEach(function (th) {
        headers.push(th.textContent.trim());
      });
      if (!headers.length) return;
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        tr.querySelectorAll('td').forEach(function (td, i) {
          if (headers[i]) td.setAttribute('data-label', headers[i]);
        });
      });
    });

    /* ============ 7. 字号调节 A- / A+ ============ */
    var FONT_KEY = 'stb-font-size';
    var FONT_STEPS = [12, 13, 14, 15, 16, 17, 18, 20];
    var FONT_DEFAULT = 14;
    var fontCtl = document.createElement('div');
    fontCtl.className = 'font-ctl';
    var decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.textContent = 'A-';
    decBtn.title = '缩小字号';
    var incBtn = document.createElement('button');
    incBtn.type = 'button';
    incBtn.textContent = 'A+';
    incBtn.title = '放大字号';
    fontCtl.appendChild(decBtn);
    fontCtl.appendChild(incBtn);
    document.body.appendChild(fontCtl);

    function getFont() {
      var v = parseInt(localStorage.getItem(FONT_KEY) || String(FONT_DEFAULT), 10);
      return FONT_STEPS.indexOf(v) >= 0 ? v : FONT_DEFAULT;
    }
    function applyFont() {
      var saved = localStorage.getItem(FONT_KEY);
      if (saved) document.documentElement.style.setProperty('--stb-font-size', saved + 'px');
      else document.documentElement.style.removeProperty('--stb-font-size');
    }
    applyFont();
    decBtn.addEventListener('click', function () {
      var i = Math.max(0, FONT_STEPS.indexOf(getFont()) - 1);
      localStorage.setItem(FONT_KEY, String(FONT_STEPS[i]));
      applyFont();
      showToast('字号 ' + FONT_STEPS[i] + 'px');
    });
    incBtn.addEventListener('click', function () {
      var i = Math.min(FONT_STEPS.length - 1, FONT_STEPS.indexOf(getFont()) + 1);
      localStorage.setItem(FONT_KEY, String(FONT_STEPS[i]));
      applyFont();
      showToast('字号 ' + FONT_STEPS[i] + 'px');
    });

    /* ============ 8. 返回顶部 ============ */
    var topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'back-to-top';
    topBtn.textContent = '↑';
    topBtn.title = '返回顶部';
    document.body.appendChild(topBtn);
    window.addEventListener(
      'scroll',
      function () {
        topBtn.classList.toggle('show', window.scrollY > 400);
      },
      { passive: true }
    );
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ============ 9. 侧边栏：已读勾选 + 进度 ============ */
    var READ_KEY = 'stb-read';
    function getRead() {
      try {
        return JSON.parse(localStorage.getItem(READ_KEY) || '{}');
      } catch (e) {
        return {};
      }
    }
    var sidebarLinks = sidebar
      ? sidebar.querySelectorAll('a[href]')
      : document.querySelectorAll('nav a[href]');
    function chapterKey(href) {
      try {
        return new URL(href, location.origin).pathname;
      } catch (e) {
        return null;
      }
    }
    function updateProgress() {
      var boxes = document.querySelectorAll('.chapter-check');
      var total = boxes.length;
      var done = 0;
      boxes.forEach(function (b) {
        if (b.checked) done++;
      });
      var el = document.getElementById('stb-progress');
      if (!el) {
        var navList =
          (sidebar && sidebar.querySelector('ul.top-level')) ||
          (sidebar && sidebar.querySelector('ul'));
        if (!navList) return;
        el = document.createElement('div');
        el.id = 'stb-progress';
        el.className = 'stb-progress-label';
        navList.insertAdjacentElement('afterend', el);
      }
      el.textContent = total ? '阅读进度 ' + done + ' / ' + total + ' 章' : '';
    }
    var readMap = getRead();
    sidebarLinks.forEach(function (a) {
      var key = chapterKey(a.getAttribute('href'));
      if (!key || key === BASE) return;
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'chapter-check';
      cb.checked = !!readMap[key];
      cb.title = '标记为已读';
      cb.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      });
      cb.addEventListener('change', function () {
        var m = getRead();
        if (cb.checked) m[key] = 1;
        else delete m[key];
        localStorage.setItem(READ_KEY, JSON.stringify(m));
        updateProgress();
      });
      a.insertBefore(cb, a.firstChild);
    });
    updateProgress();

    /* ============ 10. 书签 ============ */
    var BK_KEY = 'stb-bookmarks';
    function getBookmarks() {
      try {
        return JSON.parse(localStorage.getItem(BK_KEY) || '[]');
      } catch (e) {
        return [];
      }
    }
    function pageTitle() {
      var h1 = document.querySelector('main h1');
      return (h1 && h1.textContent.trim()) || document.title;
    }
    var bkBtn = document.createElement('button');
    bkBtn.type = 'button';
    bkBtn.className = 'stb-tool-btn bookmark-btn';
    var bkOn = getBookmarks().some(function (b) {
      return b.path === location.pathname;
    });
    function paintBookmark() {
      bkBtn.textContent = bkOn ? '★ 已收藏' : '☆ 收藏本章';
      bkBtn.classList.toggle('on', bkOn);
    }
    paintBookmark();
    bkBtn.addEventListener('click', function () {
      var list = getBookmarks();
      var i = list.findIndex(function (b) {
        return b.path === location.pathname;
      });
      if (i >= 0) {
        list.splice(i, 1);
        bkOn = false;
        showToast('已取消收藏');
      } else {
        list.unshift({ path: location.pathname, title: pageTitle() });
        bkOn = true;
        showToast('已加入书签');
      }
      localStorage.setItem(BK_KEY, JSON.stringify(list.slice(0, 30)));
      paintBookmark();
    });

    /* ============ 11. 最近阅读 ============ */
    try {
      var REC_KEY = 'stb-recent';
      var recList = [];
      try {
        recList = JSON.parse(localStorage.getItem(REC_KEY) || '[]');
      } catch (e) {}
      recList = recList.filter(function (x) {
        return x.path !== location.pathname;
      });
      recList.unshift({ path: location.pathname, title: pageTitle() });
      localStorage.setItem(REC_KEY, JSON.stringify(recList.slice(0, 8)));
    } catch (e) {}

    /* ============ 12. 练习题：参考答案折叠 + 会了 ============ */
    if (content) {
      content.querySelectorAll('p, li').forEach(function (el) {
        if (el.dataset.stbDone) return;
        var txt = el.textContent || '';
        if (/^参考答案[:：]/.test(txt.trim()) && txt.length < 400) {
          el.dataset.stbDone = '1';
          el.classList.add('exercise-answer');
          var sb = document.createElement('button');
          sb.type = 'button';
          sb.className = 'stb-tool-btn exercise-toggle';
          sb.textContent = '显示参考答案';
          el.parentNode.insertBefore(sb, el);
          sb.addEventListener('click', function () {
            el.classList.toggle('show');
            sb.textContent = el.classList.contains('show') ? '隐藏参考答案' : '显示参考答案';
          });
        }
      });
    }

    /* ============ 13. 练习题「会了」标记 ============ */
    if (content) {
      var quizItems = [];
      content.querySelectorAll('h2').forEach(function (h) {
        if (!/练习题/.test(h.textContent)) return;
        // Starlight 会把标题包进 .sl-heading-wrapper，必须从包裹层继续往后走
        var wrapper = h.closest('.sl-heading-wrapper') || h;
        var node = wrapper.nextElementSibling;
        while (node && node.tagName !== 'H2' && !node.querySelector?.('h2')) {
          if (node.tagName === 'OL' || node.tagName === 'UL') {
            node.querySelectorAll(':scope > li').forEach(function (li) {
              quizItems.push(li);
            });
          }
          node = node.nextElementSibling;
        }
      });
      var QK = 'stb-quiz:' + location.pathname;
      var qState = {};
      try {
        qState = JSON.parse(localStorage.getItem(QK) || '{}');
      } catch (e) {}
      quizItems.forEach(function (li, i) {
        var qb = document.createElement('button');
        qb.type = 'button';
        qb.className = 'stb-tool-btn quiz-btn';
        function paintQuiz() {
          qb.textContent = qState[i] ? '✓ 已掌握' : '✓ 会了';
          qb.classList.toggle('on', !!qState[i]);
        }
        paintQuiz();
        qb.addEventListener('click', function () {
          qState[i] = qState[i] ? 0 : 1;
          try {
            localStorage.setItem(QK, JSON.stringify(qState));
          } catch (e) {}
          paintQuiz();
        });
        li.appendChild(qb);
      });
    }

    /* ============ 14. 术语表 tooltip ============ */
    var GLOSSARY = {
      Profile: '一组命名好的插件树组合（web / headless / sdk / sdk-minimal / acp）',
      Seam: '能力接缝：一个可替换能力的三角色契约',
      PTC: '程序化工具调用（Programmatic Tool Calls）',
      Turn: '轮次：由零到多个 Step 构成',
      Step: '步骤：一次模型请求加上它触发的工具调用',
      Session: '会话：一次持续的人机协作',
      Cordis: 'DeepSeek Harness 的插件框架底座',
      Compaction: '上下文压缩',
    };
    if (content) {
      var terms = Object.keys(GLOSSARY);
      var reAll = new RegExp('\\b(' + terms.join('|') + ')\\b', 'g');
      var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach(function (node) {
        if (!reAll.test(node.nodeValue)) {
          reAll.lastIndex = 0;
          return;
        }
        reAll.lastIndex = 0;
        var p = node.parentElement;
        if (!p || p.closest('pre, code, a, mark, .glossary-term, h1, h2, h3, h4')) return;
        var frag = document.createDocumentFragment();
        var text = node.nodeValue;
        var last = 0;
        var m;
        while ((m = reAll.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var span = document.createElement('span');
          span.className = 'glossary-term';
          span.textContent = m[0];
          span.title = GLOSSARY[m[0]];
          frag.appendChild(span);
          last = m.index + m[0].length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        p.replaceChild(frag, node);
      });
    }

    /* ============ 14. 学习时长统计 ============ */
    var TIME_KEY = 'stb-time:' + location.pathname;
    var tStart = Date.now();
    window.addEventListener('beforeunload', function () {
      var acc = parseInt(localStorage.getItem(TIME_KEY) || '0', 10);
      acc += Math.round((Date.now() - tStart) / 1000);
      try {
        localStorage.setItem(TIME_KEY, String(acc));
      } catch (e) {}
    });

    /* ============ 15. 划重点（选中即高亮） ============ */
    if (content) {
      var HL_KEY = 'stb-hl:' + location.pathname;
      function getHl() {
        try {
          return JSON.parse(localStorage.getItem(HL_KEY) || '[]');
        } catch (e) {
          return [];
        }
      }
      document.addEventListener('mouseup', function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        var text = sel.toString().trim();
        if (text.length < 2 || text.length > 200) return;
        var range = sel.getRangeAt(0);
        if (!content.contains(range.commonAncestorContainer)) return;
        if (range.commonAncestorContainer.parentElement.closest('pre, code, mark')) return;
        try {
          var mark = document.createElement('mark');
          mark.className = 'stb-hl';
          mark.title = '点击取消高亮';
          range.surroundContents(mark);
          var list = getHl();
          list.push(text);
          localStorage.setItem(HL_KEY, JSON.stringify(list.slice(0, 200)));
          sel.removeAllRanges();
        } catch (e) {}
      });
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains('stb-hl')) {
          var txt = t.textContent;
          t.replaceWith(document.createTextNode(txt));
          var list = getHl().filter(function (x) {
            return x !== txt;
          });
          localStorage.setItem(HL_KEY, JSON.stringify(list));
        }
      });
    }

    /* ============ 16. 页脚工具栏 ============ */
    var toolbar = document.createElement('div');
    toolbar.className = 'page-toolbar';

    var errata = document.createElement('a');
    errata.className = 'stb-tool-btn';
    errata.textContent = '✍ 提交勘误';
    errata.target = '_blank';
    errata.rel = 'noopener';
    errata.href =
      GITHUB +
      '/issues/new?title=' +
      encodeURIComponent('勘误：' + pageTitle()) +
      '&body=' +
      encodeURIComponent('章节：' + location.href + '\n\n问题描述：\n');

    var share = document.createElement('button');
    share.type = 'button';
    share.className = 'stb-tool-btn';
    share.textContent = '🔗 分享本章';
    share.addEventListener('click', function () {
      var url = location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(
          function () {
            showToast('链接已复制，可分享');
          },
          function () {
            showToast(url);
          }
        );
      } else {
        showToast(url);
      }
    });

    var printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'stb-tool-btn';
    printBtn.textContent = '🖨 打印本章';
    printBtn.addEventListener('click', function () {
      window.print();
    });

    var LIKE_KEY = 'stb-like:' + location.pathname;
    var liked = localStorage.getItem(LIKE_KEY) === '1';
    var likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'stb-tool-btn like-btn';
    function paintLike() {
      likeBtn.textContent = liked ? '👍 已赞' : '👍 赞本章';
      likeBtn.classList.toggle('on', liked);
    }
    paintLike();
    likeBtn.addEventListener('click', function () {
      liked = !liked;
      localStorage.setItem(LIKE_KEY, liked ? '1' : '0');
      paintLike();
    });

    toolbar.appendChild(bkBtn);
    toolbar.appendChild(errata);
    toolbar.appendChild(share);
    toolbar.appendChild(printBtn);
    toolbar.appendChild(likeBtn);
    if (mount) mount.appendChild(toolbar);

    /* ============ 17. 订阅提示 ============ */
    var subBox = document.createElement('div');
    subBox.className = 'subscribe-box';
    subBox.innerHTML =
      '📬 订阅更新：发送邮件至 <a href="mailto:guotao3s@163.com?subject=' +
      encodeURIComponent('订阅《DeepSeek Harness 应用开发实践》更新') +
      '">guotao3s@163.com</a>，主题注明「订阅更新」';
    if (mount) mount.appendChild(subBox);

    /* ============ 18. giscus 评论 ============ */
    (function loadGiscus() {
      var repoId = 'R_kgDOUaBS6w';
      var categoryId = 'DIC_kwDOUaBS684DFkpJ';
      if (!repoId || !categoryId || !mount) return;
      var container = document.createElement('div');
      container.id = 'giscus-container';
      var title = document.createElement('div');
      title.className = 'stb-section-title';
      title.textContent = '读者讨论';
      container.appendChild(title);
      mount.appendChild(container);
      var s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.setAttribute('data-repo', REPO);
      s.setAttribute('data-repo-id', repoId);
      s.setAttribute('data-category', 'Announcements');
      s.setAttribute('data-category-id', categoryId);
      s.setAttribute('data-mapping', 'pathname');
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-input-position', 'bottom');
      s.setAttribute('data-theme', 'preferred_color_scheme');
      s.setAttribute('data-lang', 'zh-CN');
      s.setAttribute('crossorigin', 'anonymous');
      s.async = true;
      container.appendChild(s);
    })();

    /* ============ 19. PWA ============ */
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(BASE + 'service-worker.js').catch(function () {});
    }
  });
})();
