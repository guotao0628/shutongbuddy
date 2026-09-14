// giscus 评论：在每页底部加载 GitHub Discussions 评论
// 配置说明见 README 的「评论功能」章节；repo-id / category-id 需从 https://giscus.app 获取后填入
(function () {
  var container = document.createElement('div');
  container.id = 'giscus-container';
  container.style.marginTop = '2.5rem';
  container.style.borderTop = '1px solid var(--border, #e5e5e5)';
  container.style.paddingTop = '1.5rem';

  function mount() {
    var main = document.querySelector('main');
    if (!main) return;
    var prev = document.getElementById('giscus-container');
    if (prev) prev.remove();
    main.appendChild(container);

    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.setAttribute('data-repo', 'guotao0628/shutongbuddy');
    s.setAttribute('data-repo-id', 'YOUR_REPO_ID');          // TODO: 替换
    s.setAttribute('data-category', 'Announcements');
    s.setAttribute('data-category-id', 'YOUR_CATEGORY_ID');  // TODO: 替换
    s.setAttribute('data-mapping', 'pathname');
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'bottom');
    s.setAttribute('data-theme', 'preferred_color_scheme');
    s.setAttribute('data-lang', 'zh-CN');
    s.setAttribute('crossorigin', 'anonymous');
    s.async = true;
    container.appendChild(s);
  }

  // 首次加载与 mdBook 主题切换时重新挂载
  window.addEventListener('load', mount);
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && (t.id === 'theme-toggle' || (t.closest && t.closest('#theme-toggle')))) {
      setTimeout(mount, 100);
    }
  });
})();
