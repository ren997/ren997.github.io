(function() {
  var SOURCES = window.TEXT_VARIABLES.sources;

  window.Lazyload.js(SOURCES.jquery, function() {
    var $pageMask = $('.js-page-mask');
    var $pageRoot = $('.js-page-root');
    var $sidebarShow = $('.js-sidebar-show');
    var $sidebarHide = $('.js-sidebar-hide');
    var $sidebarToggleDesktop = $('.js-sidebar-toggle-desktop');
    var $sidebarExpandDesktop = $('.js-sidebar-expand-desktop');
    var $tocToggles = $('.js-toc-toggle');

    function freeze(e) {
      if (e.target === $pageMask[0]) {
        e.preventDefault();
      }
    }
    function stopBodyScrolling(bool) {
      if (bool === true) {
        window.addEventListener('touchmove', freeze, { passive: false });
      } else {
        window.removeEventListener('touchmove', freeze, { passive: false });
      }
    }
    function syncDesktopSidebar() {
      var collapsed = $pageRoot.hasClass('is-sidebar-collapsed');
      $sidebarExpandDesktop.toggleClass('is-visible', collapsed);
    }

    $sidebarShow.on('click', function() {
      stopBodyScrolling(true); $pageRoot.addClass('show-sidebar');
    });
    $sidebarHide.on('click', function() {
      stopBodyScrolling(false); $pageRoot.removeClass('show-sidebar');
    });
    $sidebarToggleDesktop.on('click', function() {
      $pageRoot.addClass('is-sidebar-collapsed');
      syncDesktopSidebar();
    });
    $sidebarExpandDesktop.on('click', function() {
      $pageRoot.removeClass('is-sidebar-collapsed');
      syncDesktopSidebar();
    });
    syncDesktopSidebar();

    $tocToggles.on('click', function() {
      var $toggle = $(this);
      var $group = $toggle.closest('.toc-group');
      var expanded = $group.hasClass('is-expanded');

      $group.toggleClass('is-expanded', !expanded);
      $toggle.attr('aria-expanded', expanded ? 'false' : 'true');
    });
  });
})();