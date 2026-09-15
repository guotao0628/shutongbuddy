/**
 * ShuTongBuddy 在线书交互脚本
 * 由 src/components/Head.astro 以 <script> 方式引入，全站生效。
 *
 * window.__STB__     = { base, repo }
 * window.__STB_HOT__ = [热门搜索词]
 *
 * 本地数据全部存放在 localStorage，键名统一前缀 stb-：
 *   stb-read            已读章节 { path: 1 }
 *   stb-bookmarks       书签 [{ path, title, ts }]
 *   stb-recent          最近阅读 [{ path, title, ts }]
 *   stb-scroll:<path>   阅读位置
 *   stb-time:<path>     学习时长（秒）
 *   stb-hl:<path>       划线摘录 [text]
 *   stb-quiz:<path>     练习题掌握状态 { index: 1 }
 *   stb-liked:<path>    点赞
 *   stb-font-size       正文字号
 *   stb-searches        最近搜索词
 */
(function () {
  'use strict';

  var CFG = window.__STB__ || {};
  var BASE = CFG.base || '/';
  var REPO = CFG.repo || 'guotao0628/shutongbuddy';
  var GITHUB = 'https://github.com/' + REPO;
  var IS_EN = location.pathname.indexOf(BASE + 'en/') === 0;
  var LOCALE = IS_EN ? 'en/' : '';

  var T = IS_EN
    ? {
        copied: 'Link copied',
        download: 'Download this snippet',
        expand: 'Show all code',
        bookmarked: 'Bookmarked',
        unbookmarked: 'Bookmark removed',
        highlight: 'Saved to My Highlights',
        font: 'Font size',
        read: 'Progress',
        chapters: 'chapters',
        minRead: 'min read',
        continueTitle: 'Continue reading',
        resume: 'Jump to saved position',
        dismiss: 'Dismiss',
        showAnswer: 'Show answer',
        hideAnswer: 'Hide answer',
        quiz: '✓ Got it',
        quizDone: '✓ Mastered',
        errata: '✍ Report erratum',
        share: '🔗 Share',
        print: '🖨 Print',
        like: '👍 Like',
        liked: '👍 Liked',
        code: '⌨ Companion code',
        shortcuts: 'Shortcuts: [ previous · ] next · / search · - / = font size · ? help',
        noData: 'No local data yet.',
        emptyNotes: 'You have not highlighted anything yet.',
        total: 'Total',
        chapter: 'Chapter',
        minutes: 'min',
        clear: 'Clear all local reading data?',
        cleared: 'Cleared',
        remove: 'Remove',
        markRead: 'Mark as read',
        decrease: 'Decrease font size',
        increase: 'Increase font size',
        backTop: 'Back to top',
      }
    : {
        copied: '链接已复制，可分享',
        download: '下载这段代码',
        expand: '展开全部代码',
        bookmarked: '已加入书签',
        unbookmarked: '已取消收藏',
        highlight: '已加入「我的划线」',
        font: '字号',
        read: '阅读进度',
        chapters: '章',
        minRead: '分钟',
        continueTitle: '继续阅读',
        resume: '跳转到上次位置',
        dismiss: '忽略',
        showAnswer: '显示参考答案',
        hideAnswer: '隐藏参考答案',
        quiz: '✓ 会了',
        quizDone: '✓ 已掌握',
        errata: '✍ 提交勘误',
        share: '🔗 分享本章',
        print: '🖨 打印本章',
        like: '👍 赞本章',
        liked: '👍 已赞',
        code: '⌨ 配套代码',
        shortcuts: '快捷键：[ 上一章 · ] 下一章 · / 搜索 · - / = 字号 · ? 帮助',
        noData: '还没有本地数据。',
        emptyNotes: '你还没有划过重点。',
        total: '合计',
        chapter: '章节',
        minutes: '分钟',
        clear: '确定清空全部本地阅读数据？',
        cleared: '已清空',
        remove: '删除',
        markRead: '标记为已读',
        decrease: '缩小字号',
        increase: '放大字号',
        backTop: '返回顶部',
      };

  /* ==================== 本地存储工具 ==================== */
  var S = {
    get: function (k, d) {
      try {
        var raw = localStorage.getItem(k);
        return raw === null ? d : JSON.parse(raw);
      } catch (e) {
        return d;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
    del: function (k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
    raw: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v === null ? d : v;
      } catch (e) {
        return d;
      }
    },
    rawSet: function (k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
    keys: function (prefix) {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) out.push(k);
        }
      } catch (e) {}
      return out;
    },
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function url(p) {
    return BASE + String(p || '').replace(/^\//, '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pageTitle() {
    var h1 = document.querySelector('main h1');
    return (h1 && h1.textContent.trim()) || document.title;
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  }

  ready(function () {
    var content =
      document.querySelector('.sl-markdown-content') || document.querySelector('main');
    var main = document.querySelector('main') || content;
    var mount = (content && content.parentElement) || main;
    var sidebar =
      document.querySelector('#starlight__sidebar') || document.querySelector('.sidebar');

    /* ============ 提示条 ============ */
    var toast = el('div', 'stb-toast');
    document.body.appendChild(toast);
    var toastTimer;
    function showToast(msg, ms) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove('show');
      }, ms || 1800);
    }

    /* ============ 1. 阅读进度条 ============ */
    var bar = el('div', 'reading-progress');
    document.body.appendChild(bar);
    window.addEventListener(
      'scroll',
      function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      },
      { passive: true }
    );

    /* ============ 2. 跨会话恢复阅读位置 ============ */
    var SCROLL_KEY = 'stb-scroll:' + location.pathname;
    var savedY = parseInt(S.raw(SCROLL_KEY, '0'), 10) || 0;
    var scrollTimer;
    window.addEventListener(
      'scroll',
      function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          S.rawSet(SCROLL_KEY, String(Math.round(window.scrollY)));
        }, 300);
      },
      { passive: true }
    );

    if (savedY > 600 && content && !document.getElementById('stb-reading-page')) {
      var resumeBar = el('div', 'stb-resume');
      resumeBar.innerHTML =
        '<span>' +
        T.continueTitle +
        '</span><button type="button" class="stb-tool-btn stb-resume-go">' +
        T.resume +
        '</button><button type="button" class="stb-resume-x" aria-label="' +
        T.dismiss +
        '">×</button>';
      resumeBar.querySelector('.stb-resume-go').addEventListener('click', function () {
        window.scrollTo({ top: savedY, behavior: 'smooth' });
        resumeBar.remove();
      });
      resumeBar.querySelector('.stb-resume-x').addEventListener('click', function () {
        resumeBar.remove();
      });
      content.insertBefore(resumeBar, content.firstChild);
    }

    /* ============ 3. 章节元信息：阅读时长 + 图表编号 ============ */
    var h1 = document.querySelector('main h1');
    var chMatch = h1 && h1.textContent.match(/第\s*(\d+)\s*章/);
    var chNum = chMatch ? chMatch[1] : null;
    if (!chNum && h1) {
      var enMatch = h1.textContent.match(/Chapter\s*(\d+)/i);
      if (enMatch) chNum = enMatch[1];
    }

    // splash 页面（封面）不是正文，不显示阅读时长
    var isSplash = !!document.querySelector('.hero');
    if (content && h1 && !isSplash) {
      var textAll = content.textContent || '';
      var cjk = (textAll.match(/[\u4e00-\u9fff]/g) || []).length;
      var words = (textAll.match(/[A-Za-z0-9]+/g) || []).length;
      var minutes = Math.max(1, Math.round(cjk / 400 + words / 220));
      var meta = el('p', 'stb-chapter-meta', '≈ ' + minutes + ' ' + T.minRead);
      h1.insertAdjacentElement('afterend', meta);
    }

    var figureIds = {};
    if (content) {
      var figures = [];
      content.querySelectorAll('img').forEach(function (im) {
        if (!im.closest('pre')) figures.push(im);
      });
      content.querySelectorAll('svg').forEach(function (sv) {
        if (sv.closest('.stb-tool-btn, a, button, pre, .stb-glossary')) return;
        figures.push(sv);
      });
      figures.forEach(function (f, i) {
        var no = (chNum ? chNum + '-' : '') + (i + 1);
        var id = 'fig-' + no;
        f.id = id;
        figureIds[no] = id;
        var alt = f.getAttribute('alt') || f.getAttribute('aria-label') || '';
        f.insertAdjacentElement(
          'afterend',
          el('span', 'stb-figure-caption', (IS_EN ? 'Figure ' : '图 ') + no + (alt ? '　' + alt : ''))
        );
      });
      if (Object.keys(figureIds).length) {
        var reFig = new RegExp((IS_EN ? 'Figure\\s*' : '图\\s*') + '(\\d+-\\d+)', 'g');
        var w1 = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        var n1 = [];
        while (w1.nextNode()) n1.push(w1.currentNode);
        n1.forEach(function (node) {
          var p = node.parentElement;
          if (!p || p.closest('pre, code, a, .stb-figure-caption, h1, h2, h3, h4')) return;
          if (!reFig.test(node.nodeValue)) {
            reFig.lastIndex = 0;
            return;
          }
          reFig.lastIndex = 0;
          var frag = document.createDocumentFragment();
          var t = node.nodeValue;
          var last = 0;
          var m;
          while ((m = reFig.exec(t)) !== null) {
            if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
            if (figureIds[m[1]]) {
              var a = el('a', 'stb-figref', m[0]);
              a.href = '#' + figureIds[m[1]];
              frag.appendChild(a);
            } else {
              frag.appendChild(document.createTextNode(m[0]));
            }
            last = m.index + m[0].length;
          }
          if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
          p.replaceChild(frag, node);
        });
      }
    }

    /* ============ 4. 代码块 ============ */
    var CODE_EXT = {
      bash: 'sh', shell: 'sh', sh: 'sh', zsh: 'sh', powershell: 'ps1', ps1: 'ps1',
      typescript: 'ts', ts: 'ts', javascript: 'js', js: 'js', json: 'json',
      yaml: 'yml', yml: 'yml', python: 'py', text: 'txt', md: 'md', markdown: 'md',
      html: 'html', css: 'css', toml: 'toml', ini: 'ini', sql: 'sql', mermaid: 'mmd',
    };

    document.querySelectorAll('pre').forEach(function (pre, idx) {
      var figure = pre.closest('figure') || pre.parentElement;
      var lang =
        pre.getAttribute('data-language') ||
        (figure && figure.getAttribute('data-language')) ||
        '';
      if (!lang) {
        var c0 = pre.querySelector('code');
        var m0 = c0 && (c0.className || '').match(/language-([a-z0-9+#]+)/i);
        if (m0) lang = m0[1];
      }

      if (lang) pre.appendChild(el('span', 'code-lang-tag', lang));

      var codeEl = pre.querySelector('code');
      if (codeEl) {
        var dl = el('button', 'code-download-btn', '⬇');
        dl.type = 'button';
        dl.title = T.download;
        dl.addEventListener('click', function () {
          var ext = CODE_EXT[String(lang || '').toLowerCase()] || 'txt';
          download('code-' + (idx + 1) + '.' + ext, codeEl.textContent, 'text/plain');
        });
        pre.appendChild(dl);
      }

      if (pre.scrollHeight > 560 && pre.clientHeight > 0) {
        pre.classList.add('code-collapsed');
        var btn = el('button', 'code-expand-btn', T.expand);
        btn.type = 'button';
        pre.parentNode.insertBefore(btn, pre.nextSibling);
        btn.addEventListener('click', function () {
          pre.classList.remove('code-collapsed');
          btn.remove();
        });
      }
    });

    /* ============ 5. 图片懒加载 ============ */
    document.querySelectorAll('main img').forEach(function (img) {
      img.loading = 'lazy';
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

    /* ============ 7. 字号调节 ============ */
    var FONT_KEY = 'stb-font-size';
    var FONT_STEPS = [12, 13, 14, 15, 16, 17, 18, 20];
    var FONT_DEFAULT = 14;
    var fontCtl = el('div', 'font-ctl');
    var decBtn = el('button', null, 'A-');
    decBtn.type = 'button';
    decBtn.title = T.decrease;
    var incBtn = el('button', null, 'A+');
    incBtn.type = 'button';
    incBtn.title = T.increase;
    fontCtl.appendChild(decBtn);
    fontCtl.appendChild(incBtn);
    document.body.appendChild(fontCtl);

    function getFont() {
      var v = parseInt(S.raw(FONT_KEY, String(FONT_DEFAULT)), 10);
      return FONT_STEPS.indexOf(v) >= 0 ? v : FONT_DEFAULT;
    }
    function applyFont() {
      var saved = S.raw(FONT_KEY, null);
      if (saved) document.documentElement.style.setProperty('--stb-font-size', saved + 'px');
      else document.documentElement.style.removeProperty('--stb-font-size');
    }
    function stepFont(delta) {
      var i = Math.max(0, Math.min(FONT_STEPS.length - 1, FONT_STEPS.indexOf(getFont()) + delta));
      S.rawSet(FONT_KEY, String(FONT_STEPS[i]));
      applyFont();
      showToast(T.font + ' ' + FONT_STEPS[i] + 'px');
    }
    applyFont();
    decBtn.addEventListener('click', function () {
      stepFont(-1);
    });
    incBtn.addEventListener('click', function () {
      stepFont(1);
    });

    /* ============ 8. 返回顶部 ============ */
    var topBtn = el('button', 'back-to-top', '↑');
    topBtn.type = 'button';
    topBtn.title = T.backTop;
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

    /* ============ 9. 侧边栏已读 + 进度 ============ */
    var READ_KEY = 'stb-read';
    var BK_KEY = 'stb-bookmarks';
    var REC_KEY = 'stb-recent';

    var sidebarLinks = sidebar
      ? sidebar.querySelectorAll('a[href]')
      : document.querySelectorAll('nav a[href]');

    function keyOf(href) {
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
      var lab = document.getElementById('stb-progress');
      if (!lab) {
        var navList =
          (sidebar && sidebar.querySelector('ul.top-level')) ||
          (sidebar && sidebar.querySelector('ul'));
        if (!navList) return;
        lab = el('div', 'stb-progress-label');
        lab.id = 'stb-progress';
        navList.insertAdjacentElement('afterend', lab);
      }
      lab.textContent = total ? T.read + ' ' + done + ' / ' + total + ' ' + T.chapters : '';
    }

    var readMap = S.get(READ_KEY, {});
    sidebarLinks.forEach(function (a) {
      var key = keyOf(a.getAttribute('href'));
      if (!key || key === BASE) return;
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'chapter-check';
      cb.checked = !!readMap[key];
      cb.title = T.markRead;
      cb.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      });
      cb.addEventListener('change', function () {
        var m = S.get(READ_KEY, {});
        if (cb.checked) m[key] = 1;
        else delete m[key];
        S.set(READ_KEY, m);
        updateProgress();
      });
      a.insertBefore(cb, a.firstChild);
    });
    updateProgress();

    /* ============ 10. 最近阅读记录 ============ */
    try {
      var rec = S.get(REC_KEY, []).filter(function (x) {
        return x.path !== location.pathname;
      });
      rec.unshift({ path: location.pathname, title: pageTitle(), ts: Date.now() });
      S.set(REC_KEY, rec.slice(0, 12));
    } catch (e) {}

    function getBookmarks() {
      return S.get(BK_KEY, []);
    }

    /* ============ 11. 练习题 ============ */
    if (content) {
      // 参考答案：支持两种写法
      //   a) 独占一段的 **参考答案**，其后到下一个标题之间的内容整块折叠
      //   b) 以「参考答案：」开头的单段
      content.querySelectorAll('p').forEach(function (p) {
        if (p.dataset.stbAnswer) return;
        var txt = (p.textContent || '').trim();
        var isBlock = /^(参考答案|Answer)$/.test(txt);
        var isInline = /^(参考答案|Answer)[:：]/.test(txt);
        if (!isBlock && !isInline) return;
        p.dataset.stbAnswer = '1';

        var group = [p];
        if (isBlock) {
          var cursor = p.nextElementSibling;
          while (cursor) {
            if (
              cursor.tagName === 'H2' ||
              cursor.tagName === 'H3' ||
              (cursor.classList && cursor.classList.contains('sl-heading-wrapper'))
            ) {
              break;
            }
            group.push(cursor);
            cursor = cursor.nextElementSibling;
          }
        }

        var panel = el('div', 'exercise-answer');
        p.parentNode.insertBefore(panel, p);
        group.forEach(function (n) {
          panel.appendChild(n);
        });

        var sb = el('button', 'stb-tool-btn exercise-toggle', T.showAnswer);
        sb.type = 'button';
        panel.parentNode.insertBefore(sb, panel);
        sb.addEventListener('click', function () {
          panel.classList.toggle('show');
          sb.textContent = panel.classList.contains('show') ? T.hideAnswer : T.showAnswer;
        });
      });

      var quizItems = [];
      content.querySelectorAll('h2').forEach(function (h) {
        if (!/(练习题|Exercises)/.test(h.textContent)) return;
        var wrapper = h.closest('.sl-heading-wrapper') || h;
        var node = wrapper.nextElementSibling;
        while (node && node.tagName !== 'H2' && !(node.querySelector && node.querySelector('h2'))) {
          // 碰到参考答案就停止，别给答案也加上「会了」按钮
          if (node.tagName === 'P' && /^(参考答案|Answer)/.test((node.textContent || '').trim())) break;
          if (node.tagName === 'OL' || node.tagName === 'UL') {
            node.querySelectorAll(':scope > li').forEach(function (li) {
              quizItems.push(li);
            });
          }
          node = node.nextElementSibling;
        }
      });
      var QK = 'stb-quiz:' + location.pathname;
      var qState = S.get(QK, {});
      quizItems.forEach(function (li, i) {
        var qb = el('button', 'stb-tool-btn quiz-btn');
        qb.type = 'button';
        (function (idx) {
          function paint() {
            qb.textContent = qState[idx] ? T.quizDone : T.quiz;
            qb.classList.toggle('on', !!qState[idx]);
          }
          paint();
          qb.addEventListener('click', function () {
            qState[idx] = qState[idx] ? 0 : 1;
            S.set(QK, qState);
            paint();
          });
        })(i);
        li.appendChild(qb);
      });
    }

    /* ============ 12. 术语表 tooltip + 双链 ============ */
    var GLOSSARY = {
      Plugin: ['#plugin', '导出 apply 函数的模块，向共享上下文注册能力'],
      Context: ['#context', 'Cordis 的共享上下文，插件通过它注册服务、监听事件、声明效果'],
      Session: ['#session', '一次持续的人机协作；底层是一份只追加的事件日志'],
      Turn: ['#turn', '从零到多个 Step 构成；在“不再欠任何工作”时关闭'],
      Step: ['#step', '一次模型请求加上它所触发的工具调用'],
      Tool: ['#tool', '面向模型的能力单元，注册到 ctx.tools'],
      Profile: ['#profile', '一组命名好的插件树组合：web、headless、sdk、sdk-minimal、acp'],
      Bundle: ['#bundle', '可被 Profile 叠加的一组插件与补丁'],
      Patch: ['#patch', '覆盖层，按层序替换插件树中的配置'],
      Seam: ['#seam', '能力接缝：一个可替换能力的三角色契约'],
      Microkernel: ['#microkernel', '没有特权核心的架构，一切皆插件'],
      Cordis: ['#cordis', 'DeepSeek Harness 的插件框架底座'],
      PTC: ['#ptc', '程序化工具调用（Programmatic Tool Calls）'],
      Projection: ['#projection', '从会话日志派生模型上下文'],
      Injection: ['#injection', 'agent.inject() 追加持久上下文'],
      Compaction: ['#compaction', '上下文压缩，一个可替换的能力接缝'],
      Subagent: ['#subagent', '通过 ctx.subagents 委托的智能体分身'],
      Harness: ['#harness', '承载大模型的运行底座'],
    };
    if (content) {
      var terms = Object.keys(GLOSSARY);
      var reAll = new RegExp('\\b(' + terms.join('|') + ')\\b', 'g');
      var w2 = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var n2 = [];
      while (w2.nextNode()) n2.push(w2.currentNode);
      n2.forEach(function (node) {
        if (!reAll.test(node.nodeValue)) {
          reAll.lastIndex = 0;
          return;
        }
        reAll.lastIndex = 0;
        var p = node.parentElement;
        if (!p || p.closest('pre, code, a, mark, .glossary-term, h1, h2, h3, h4, .stb-glossary')) return;
        var frag = document.createDocumentFragment();
        var t = node.nodeValue;
        var last = 0;
        var m;
        while ((m = reAll.exec(t)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
          var info = GLOSSARY[m[0]];
          var a = el('a', 'glossary-term', m[0]);
          a.href = url(LOCALE + 'glossary/') + info[0];
          a.title = info[1];
          frag.appendChild(a);
          last = m.index + m[0].length;
        }
        if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
        p.replaceChild(frag, node);
      });
    }

    /* ============ 13. 学习时长 ============ */
    var TIME_KEY = 'stb-time:' + location.pathname;
    var tStart = Date.now();
    function flushTime() {
      var acc = parseInt(S.raw(TIME_KEY, '0'), 10) || 0;
      acc += Math.round((Date.now() - tStart) / 1000);
      S.rawSet(TIME_KEY, String(acc));
      tStart = Date.now();
    }
    window.addEventListener('beforeunload', flushTime);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushTime();
    });

    /* ============ 14. 划重点 ============ */
    var HL_KEY = 'stb-hl:' + location.pathname;
    function getHl() {
      return S.get(HL_KEY, []);
    }
    if (content) {
      document.addEventListener('mouseup', function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        var text = sel.toString().trim();
        if (text.length < 2 || text.length > 200) return;
        var range = sel.getRangeAt(0);
        if (!content.contains(range.commonAncestorContainer)) return;
        var host = range.commonAncestorContainer.parentElement;
        if (!host || host.closest('pre, code, mark, a')) return;
        try {
          var mark = el('mark', 'stb-hl', text);
          mark.title = IS_EN ? 'Click to remove' : '点击取消高亮';
          range.surroundContents(mark);
          S.set(HL_KEY, getHl().concat([text]).slice(0, 300));
          sel.removeAllRanges();
          showToast(T.highlight);
        } catch (e) {}
      });
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains('stb-hl')) {
          var txt = t.textContent;
          t.replaceWith(document.createTextNode(txt));
          S.set(
            HL_KEY,
            getHl().filter(function (x) {
              return x !== txt;
            })
          );
        }
      });
    }

    /* ============ 15. 章末工具栏 ============ */
    var CHAPTER_CODE = {
      '/part3/ch5/': 'plugins/shu-tong-buddy',
      '/part4/ch7/': 'examples/scratch-plugin',
      '/part4/ch8/': 'examples/shu-tong-buddy-studio',
    };

    var toolbar = el('div', 'page-toolbar');

    var bkBtn = el('button', 'stb-tool-btn bookmark-btn');
    bkBtn.type = 'button';
    var bkOn = getBookmarks().some(function (b) {
      return b.path === location.pathname;
    });
    function paintBookmark() {
      bkBtn.textContent = bkOn
        ? IS_EN
          ? '★ Bookmarked'
          : '★ 已收藏'
        : IS_EN
          ? '☆ Bookmark'
          : '☆ 收藏本章';
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
        showToast(T.unbookmarked);
      } else {
        list.unshift({ path: location.pathname, title: pageTitle(), ts: Date.now() });
        bkOn = true;
        showToast(T.bookmarked);
      }
      S.set(BK_KEY, list.slice(0, 50));
      paintBookmark();
    });
    toolbar.appendChild(bkBtn);

    var errata = el('a', 'stb-tool-btn', T.errata);
    errata.target = '_blank';
    errata.rel = 'noopener';
    errata.href =
      GITHUB +
      '/issues/new?title=' +
      encodeURIComponent((IS_EN ? 'Errata: ' : '勘误：') + pageTitle()) +
      '&body=' +
      encodeURIComponent((IS_EN ? 'Page: ' : '章节：') + location.href + '\n\n');
    toolbar.appendChild(errata);

    var share = el('button', 'stb-tool-btn', T.share);
    share.type = 'button';
    share.addEventListener('click', function () {
      var u = location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(u).then(
          function () {
            showToast(T.copied);
          },
          function () {
            showToast(u, 4000);
          }
        );
      } else {
        showToast(u, 4000);
      }
    });
    toolbar.appendChild(share);

    Object.keys(CHAPTER_CODE).forEach(function (k) {
      if (location.pathname.indexOf(k) < 0) return;
      var codeLink = el('a', 'stb-tool-btn', T.code);
      codeLink.href = GITHUB + '/tree/main/' + CHAPTER_CODE[k];
      codeLink.target = '_blank';
      codeLink.rel = 'noopener';
      toolbar.appendChild(codeLink);
    });

    var printBtn = el('button', 'stb-tool-btn', T.print);
    printBtn.type = 'button';
    printBtn.addEventListener('click', function () {
      window.print();
    });
    toolbar.appendChild(printBtn);

    var LIKE_KEY = 'stb-liked:' + location.pathname;
    var liked = S.raw(LIKE_KEY, '0') === '1';
    var likeBtn = el('button', 'stb-tool-btn like-btn');
    likeBtn.type = 'button';
    function paintLike() {
      likeBtn.textContent = liked ? T.liked : T.like;
      likeBtn.classList.toggle('on', liked);
    }
    paintLike();
    likeBtn.addEventListener('click', function () {
      liked = !liked;
      S.rawSet(LIKE_KEY, liked ? '1' : '0');
      paintLike();
    });
    toolbar.appendChild(likeBtn);

    if (mount) mount.appendChild(toolbar);

    /* ============ 16. 订阅 ============ */
    if (mount) {
      var SUB_KEY = 'stb-subscribed';
      var endpoint = CFG.subscribe || '';
      var subBox = el('div', 'subscribe-box');
      subBox.appendChild(el('div', 'stb-section-title', IS_EN ? '📬 Get updates' : '📬 订阅更新'));

      var already = S.raw(SUB_KEY, null);
      if (already) {
        subBox.appendChild(
          el(
            'p',
            'stb-note',
            IS_EN ? 'Thanks — you are on the list.' : '你已在订阅列表中，谢谢！'
          )
        );
      } else {
        var subForm = document.createElement('form');
        subForm.className = 'stb-subscribe-form';
        subForm.noValidate = false;

        var subInput = document.createElement('input');
        subInput.type = 'email';
        subInput.required = true;
        subInput.autocomplete = 'email';
        subInput.placeholder = IS_EN ? 'you@example.com' : '你的邮箱';
        subInput.setAttribute('aria-label', IS_EN ? 'Email address' : '邮箱地址');

        var subBtn = el('button', 'stb-tool-btn', IS_EN ? 'Subscribe' : '订阅');
        subBtn.type = 'submit';

        var subMsg = el('p', 'stb-note');
        subForm.appendChild(subInput);
        subForm.appendChild(subBtn);
        subBox.appendChild(subForm);
        subBox.appendChild(subMsg);

        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        subForm.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var email = (subInput.value || '').trim();
          if (!EMAIL_RE.test(email)) {
            subMsg.textContent = IS_EN ? 'Please enter a valid email address.' : '请输入有效的邮箱地址。';
            subMsg.className = 'stb-note stb-error';
            subInput.focus();
            return;
          }

          if (endpoint) {
            // 配置了订阅服务端点：POST JSON（Buttondown / Formspree / 自建 webhook 均可）
            subBtn.disabled = true;
            subMsg.className = 'stb-note';
            subMsg.textContent = IS_EN ? 'Submitting…' : '提交中…';
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, source: location.href, book: 'dsh-in-practice' }),
            })
              .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                S.rawSet(SUB_KEY, email);
                subMsg.textContent = IS_EN ? 'Subscribed. Thank you!' : '订阅成功，谢谢！';
                subForm.remove();
              })
              .catch(function (err) {
                subBtn.disabled = false;
                subMsg.className = 'stb-note stb-error';
                subMsg.textContent =
                  (IS_EN ? 'Failed to submit: ' : '提交失败：') +
                  err.message +
                  (IS_EN ? ' — please email guotao3s@163.com instead.' : '，请改为发送邮件至 guotao3s@163.com。');
              });
            return;
          }

          // 未配置端点：退化为预填好的邮件（仍然比裸链友好）
          var subject = IS_EN
            ? 'Subscribe: DeepSeek Harness in Practice'
            : '订阅《DeepSeek Harness 应用开发实践》更新';
          var body = IS_EN
            ? 'Please add this address to the update list: ' + email
            : '请把这个邮箱加入更新通知列表：' + email;
          location.href =
            'mailto:guotao3s@163.com?subject=' +
            encodeURIComponent(subject) +
            '&body=' +
            encodeURIComponent(body);
          subMsg.className = 'stb-note';
          subMsg.textContent = IS_EN
            ? 'Opening your mail app — send the pre-filled message to finish.'
            : '正在打开你的邮件客户端，直接发送预填好的邮件即可完成订阅。';
        });
      }

      mount.appendChild(subBox);
    }

    /* ============ 17. giscus ============ */
    (function loadGiscus() {
      var repoId = 'R_kgDOUaBS6w';
      var categoryId = 'DIC_kwDOUaBS684DFkpJ';
      if (!repoId || !categoryId || !mount) return;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
      var container = el('div');
      container.id = 'giscus-container';
      container.appendChild(el('div', 'stb-section-title', IS_EN ? 'Discussion' : '读者讨论'));
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
      s.setAttribute('data-lang', IS_EN ? 'en' : 'zh-CN');
      s.setAttribute('crossorigin', 'anonymous');
      s.async = true;
      s.addEventListener('error', function () {
        container.appendChild(
          el('p', 'stb-note', IS_EN ? 'Comments failed to load.' : '评论区加载失败。')
        );
      });
      container.appendChild(s);
    })();

    /* ============ 18. Mermaid ============ */
    (function mermaidRender() {
      if (!content) return;
      var blocks = content.querySelectorAll('pre[data-language="mermaid"]');
      if (!blocks.length) return;
      // 本地按需加载（Vite 会拆成独立 chunk，只在含图的页面下载）
      import('mermaid')
        .then(function (mod) {
          var mm = mod.default || mod;
          var dark = document.documentElement.dataset.theme === 'dark';
          mm.initialize({
            startOnLoad: false,
            theme: dark ? 'dark' : 'default',
            securityLevel: 'loose',
          });
          blocks.forEach(function (pre) {
            var codeEl = pre.querySelector('code');
            var div = el('div', 'mermaid');
            div.textContent = codeEl ? codeEl.textContent : pre.textContent;
            var host = pre.closest('figure') || pre;
            host.replaceWith(div);
          });
          return mm.run({ querySelector: '.mermaid' });
        })
        .catch(function (err) {
          if (window.console) console.warn('[stb] mermaid failed:', err);
        });
    })();

    /* ============ 19. 键盘快捷键 ============ */
    function isTyping(node) {
      if (!node) return false;
      var tag = (node.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || node.isContentEditable;
    }
    function findSearchInput() {
      return document.querySelector(
        '.pagefind-ui__search-input, site-search input, input[type="search"]'
      );
    }
    function openSearch(term, tries) {
      tries = tries || 0;
      if (tries === 0) {
        var openBtn = document.querySelector('button[data-open-modal]');
        if (openBtn) openBtn.click();
      }
      var input = findSearchInput();
      if (!input) {
        // Pagefind UI 是异步挂载的，轮询等待最多 2 秒
        if (tries < 20) setTimeout(function () { openSearch(term, tries + 1); }, 100);
        return;
      }
      if (term && input.value !== term) {
        input.value = term;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      input.focus();
    }
    document.addEventListener('keydown', function (e) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        openSearch('');
      } else if (e.key === '[') {
        var prev = document.querySelector('a[rel="prev"]');
        if (prev) location.href = prev.href;
      } else if (e.key === ']') {
        var next = document.querySelector('a[rel="next"]');
        if (next) location.href = next.href;
      } else if (e.key === '-') {
        stepFont(-1);
      } else if (e.key === '=') {
        stepFont(1);
      } else if (e.key === '?') {
        showToast(T.shortcuts, 4200);
      }
    });

    /* ============ 20. 通用工具 ============ */
    function fmtDuration(sec) {
      var m = Math.floor(sec / 60);
      if (m < 60) return m + ' ' + T.minutes;
      return Math.floor(m / 60) + ' h ' + (m % 60) + ' m';
    }

    function chapterEntries() {
      var map = {};
      if (sidebar) {
        sidebar.querySelectorAll('a[href]').forEach(function (a) {
          var k = keyOf(a.getAttribute('href'));
          if (!k || k === BASE || k.indexOf(BASE + 'en/') === 0) return;
          var label = a.textContent.replace(/^[^A-Za-z\u4e00-\u9fff]*/, '').trim();
          map[k] = label || k;
        });
      }
      return map;
    }

    function groupedHighlights() {
      var groups = [];
      S.keys('stb-hl:').forEach(function (k) {
        var list = S.get(k, []);
        if (!list || !list.length) return;
        groups.push({ path: k.slice('stb-hl:'.length), items: list });
      });
      return groups;
    }

    /* ============ 21. 「我的阅读」页 ============ */
    var readingPage = document.getElementById('stb-reading-page');
    if (readingPage) renderReadingPage();

    function renderReadingPage() {
      var labels = chapterEntries();
      var read = S.get(READ_KEY, {});
      var recent = S.get(REC_KEY, []);
      var marks = getBookmarks();
      var paths = Object.keys(labels);
      var doneCount = paths.filter(function (p) {
        return read[p];
      }).length;
      var html = [];

      var last = recent[0];
      if (last) {
        html.push('<h2>' + T.continueTitle + '</h2>');
        html.push(
          '<p class="stb-continue-card"><a href="' +
            last.path +
            '">' +
            escapeHtml(last.title) +
            '</a></p>'
        );
      }

      var pct = paths.length ? Math.round((doneCount / paths.length) * 100) : 0;
      html.push('<h2>' + T.read + '</h2>');
      html.push(
        '<div class="stb-progressbar"><span style="width:' +
          pct +
          '%"></span></div><p class="stb-note">' +
          doneCount +
          ' / ' +
          paths.length +
          ' ' +
          T.chapters +
          '（' +
          pct +
          '%）</p><ul class="stb-chapter-status">'
      );
      paths.forEach(function (p) {
        html.push(
          '<li class="' +
            (read[p] ? 'is-read' : '') +
            '"><a href="' +
            p +
            '">' +
            escapeHtml(labels[p]) +
            '</a><span class="stb-mark">' +
            (read[p] ? '✓' : '○') +
            '</span></li>'
        );
      });
      html.push('</ul>');

      html.push('<h2>' + (IS_EN ? 'Recently read' : '最近阅读') + '</h2>');
      if (recent.length) {
        html.push('<ul class="stb-link-list">');
        recent.forEach(function (r) {
          html.push('<li><a href="' + r.path + '">' + escapeHtml(r.title) + '</a></li>');
        });
        html.push('</ul>');
      } else {
        html.push('<p class="stb-note">' + T.noData + '</p>');
      }

      html.push('<h2>' + (IS_EN ? 'Bookmarks' : '我的书签') + '</h2>');
      if (marks.length) {
        html.push('<ul class="stb-link-list">');
        marks.forEach(function (b) {
          html.push('<li><a href="' + b.path + '">' + escapeHtml(b.title) + '</a></li>');
        });
        html.push('</ul>');
      } else {
        html.push('<p class="stb-note">' + T.noData + '</p>');
      }

      var total = 0;
      var rows = [];
      S.keys('stb-time:').forEach(function (k) {
        var sec = parseInt(S.raw(k, '0'), 10) || 0;
        if (!sec) return;
        total += sec;
        rows.push({ p: k.slice('stb-time:'.length), sec: sec });
      });
      rows.sort(function (a, b) {
        return b.sec - a.sec;
      });
      html.push('<h2>' + (IS_EN ? 'Time spent' : '学习时长') + '</h2>');
      if (rows.length) {
        html.push('<p class="stb-note">' + T.total + '：<strong>' + fmtDuration(total) + '</strong></p>');
        html.push('<table><thead><tr><th>' + T.chapter + '</th><th>' + T.total + '</th></tr></thead><tbody>');
        rows.forEach(function (r) {
          html.push(
            '<tr><td><a href="' +
              r.p +
              '">' +
              escapeHtml(labels[r.p] || r.p) +
              '</a></td><td>' +
              fmtDuration(r.sec) +
              '</td></tr>'
          );
        });
        html.push('</tbody></table>');
      } else {
        html.push('<p class="stb-note">' + T.noData + '</p>');
      }

      html.push(
        '<h2>' + (IS_EN ? 'Reset' : '重置') + '</h2>' +
          '<p><button type="button" class="stb-tool-btn" id="stb-reset-progress">' +
          (IS_EN ? 'Clear all local reading data' : '清空全部本地阅读数据') +
          '</button></p>'
      );

      readingPage.innerHTML = html.join('\n');

      var resetBtn = document.getElementById('stb-reset-progress');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          if (!confirm(T.clear)) return;
          ['stb-read', BK_KEY, REC_KEY, 'stb-searches'].forEach(S.del);
          ['stb-time:', 'stb-hl:', 'stb-quiz:', 'stb-scroll:', 'stb-liked:'].forEach(function (pre) {
            S.keys(pre).forEach(S.del);
          });
          showToast(T.cleared);
          setTimeout(function () {
            location.reload();
          }, 600);
        });
      }
    }

    /* ============ 22. 「我的划线」页 ============ */
    function renderNotesPage() {
      var notesPage = document.getElementById('stb-notes-page');
      if (!notesPage) return;
      var groups = groupedHighlights();
      var totalN = groups.reduce(function (n, g) {
        return n + g.items.length;
      }, 0);
      if (!totalN) {
        notesPage.innerHTML = '<p class="stb-note">' + T.emptyNotes + '</p>';
        return;
      }
      var html = [
        '<p class="stb-note">' +
          (IS_EN ? 'Total ' : '共 ') +
          totalN +
          (IS_EN ? ' highlights' : ' 条划线') +
          '</p>',
      ];
      groups.forEach(function (g) {
        html.push('<h2>' + escapeHtml(g.path) + '</h2><ul class="stb-hl-list">');
        g.items.forEach(function (txt) {
          html.push(
            '<li><a href="' +
              g.path +
              '">' +
              escapeHtml(txt) +
              '</a><button type="button" class="stb-hl-del" data-path="' +
              g.path +
              '" data-text="' +
              escapeHtml(txt) +
              '" aria-label="' +
              T.remove +
              '">×</button></li>'
          );
        });
        html.push('</ul>');
      });
      notesPage.innerHTML = html.join('\n');
      notesPage.querySelectorAll('.stb-hl-del').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = 'stb-hl:' + btn.getAttribute('data-path');
          var t = btn.getAttribute('data-text');
          S.set(
            key,
            S.get(key, []).filter(function (x) {
              return x !== t;
            })
          );
          renderNotesPage();
        });
      });
    }

    if (document.getElementById('stb-notes-page')) renderNotesPage();

    function exportMarkdown() {
      var groups = groupedHighlights();
      var lines = ['# ' + (IS_EN ? 'My Highlights' : '我的划线'), ''];
      groups.forEach(function (g) {
        lines.push('## ' + g.path, '');
        g.items.forEach(function (t) {
          lines.push('- ' + t);
        });
        lines.push('');
      });
      download('my-highlights.md', lines.join('\n'), 'text/markdown');
    }
    function exportAnki() {
      var lines = [];
      groupedHighlights().forEach(function (g) {
        g.items.forEach(function (t) {
          lines.push(g.path + '\t' + t.replace(/[\t\n]/g, ' '));
        });
      });
      download('my-highlights-anki.tsv', lines.join('\n'), 'text/tab-separated-values');
    }
    function exportJson() {
      download(
        'my-highlights.json',
        JSON.stringify(
          { exportedAt: new Date().toISOString(), groups: groupedHighlights() },
          null,
          2
        ),
        'application/json'
      );
    }

    function wire(id, fn) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    }
    wire('stb-export-md', exportMarkdown);
    wire('stb-export-anki', exportAnki);
    wire('stb-export-json', exportJson);
    wire('stb-notes-sync', function () {
      renderNotesPage();
      showToast(IS_EN ? 'Reloaded' : '已重新载入');
    });
    wire('stb-notes-clear', function () {
      if (!confirm(T.clear)) return;
      S.keys('stb-hl:').forEach(S.del);
      renderNotesPage();
      showToast(T.cleared);
    });

    /* ============ 23. 首页：继续阅读 + 热门搜索 ============ */
    var cta = document.querySelector('.stb-cta');
    if (cta) {
      var recent0 = S.get(REC_KEY, []).filter(function (r) {
        return r.path !== location.pathname && r.path !== BASE && r.path !== BASE + 'en/';
      })[0];
      if (recent0) {
        var box = el('div', 'stb-home-continue');
        box.innerHTML =
          '<span class="stb-home-continue-label">' +
          T.continueTitle +
          '</span><a href="' +
          recent0.path +
          '">' +
          escapeHtml(recent0.title) +
          ' →</a>';
        cta.insertAdjacentElement('afterend', box);
      }

      function renderChips(label, terms, extraClass) {
        if (!terms.length) return null;
        var row = el('div', 'stb-chips' + (extraClass ? ' ' + extraClass : ''));
        row.appendChild(el('span', 'stb-chips-label', label));
        terms.forEach(function (term) {
          var c = el('button', 'stb-chip', term);
          c.type = 'button';
          c.addEventListener('click', function (ev) {
            // 阻止冒泡：Starlight 的「点击外部关闭」监听在 document 上，
            // 否则会在弹窗打开后立刻把它关掉
            ev.preventDefault();
            ev.stopPropagation();
            var s = S.get('stb-searches', []);
            S.set(
              'stb-searches',
              [term]
                .concat(
                  s.filter(function (x) {
                    return x !== term;
                  })
                )
                .slice(0, 10)
            );
            openSearch(term);
          });
          row.appendChild(c);
        });
        return row;
      }

      var anchorEl = document.querySelector('.stb-home-continue') || cta;

      // 第一行：本书高频概念（构建期从书稿词频统计）
      var hotRow = renderChips(
        IS_EN ? 'Frequent concepts' : '本书高频概念',
        (window.__STB_HOT__ || []).slice(0, 10)
      );
      if (hotRow) {
        anchorEl.insertAdjacentElement('afterend', hotRow);
        anchorEl = hotRow;
      }

      // 第二行：你这台机器上搜过的词（本地保存，不上传）
      var mineRow = renderChips(
        IS_EN ? 'Your recent searches' : '你搜过',
        S.get('stb-searches', []).slice(0, 8),
        'stb-chips-mine'
      );
      if (mineRow) anchorEl.insertAdjacentElement('afterend', mineRow);
    }

    /* ============ 24. 搜索词记录 ============ */
    var lastSearchInput = null;
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'INPUT') return;
      var hint = (t.type || '') + ' ' + (t.getAttribute('aria-label') || '') + ' ' + (t.id || '');
      if (/search|搜索/i.test(hint)) lastSearchInput = t;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !lastSearchInput) return;
      var term = (lastSearchInput.value || '').trim();
      if (term.length < 2) return;
      var s = S.get('stb-searches', []);
      S.set(
        'stb-searches',
        [term]
          .concat(
            s.filter(function (x) {
              return x !== term;
            })
          )
          .slice(0, 10)
      );
    });

    /* ============ 25. PWA ============ */
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(BASE + 'service-worker.js').catch(function () {});
    }
  });
})();
