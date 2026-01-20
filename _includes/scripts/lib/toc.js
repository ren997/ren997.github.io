(function() {
  var SOURCES = window.TEXT_VARIABLES.sources;
  window.Lazyload.js(SOURCES.jquery, function() {
    function toc(options) {
      var $root = this, $window = $(window), $scrollTarget, $scroller, $tocUl = $('<ul class="toc toc--ellipsis"></ul>'), $tocLi, $headings, $activeLast, $activeCur,
        selectors = 'h1,h2,h3', container = 'body', scrollTarget = window, scroller = 'html, body', disabled = false,
        headingsPos, scrolling = false, hasRendered = false, hasInit = false;

      function setOptions(options) {
        var _options = options || {};
        _options.selectors && (selectors = _options.selectors);
        _options.container && (container = _options.container);
        _options.scrollTarget && (scrollTarget = _options.scrollTarget);
        _options.scroller && (scroller = _options.scroller);
        _options.disabled !== undefined && (disabled = _options.disabled);
        $headings = $(container).find(selectors).filter('[id]');
        $scrollTarget = $(scrollTarget);
        $scroller = $(scroller);
      }
      // function calc() {
      //   headingsPos = [];
      //   $headings.each(function() {
      //     headingsPos.push(Math.floor($(this).position().top));
      //   });
      // }
      function calc() {
        headingsPos = [];
        var isWindowScroll = !scrollTarget || scrollTarget === window || $scrollTarget[0] === window;
        $headings.each(function() {
          var $h = $(this);
          var top;
          if (isWindowScroll) {
            // window 滚动：用 offset().top（相对文档顶部）
            top = $h.offset().top;
          } else {
            // 容器内滚动：计算标题在容器内容区的绝对位置
            // = (标题相对文档位置 - 容器相对文档位置) + 容器当前滚动距离
            top = $h.offset().top - $scrollTarget.offset().top + $scrollTarget.scrollTop();
          }
          headingsPos.push(Math.floor(top));
        });
      }
      function setState(element, disabled) {
        var scrollTop = $scrollTarget.scrollTop(), i;
        if (disabled || !headingsPos || headingsPos.length < 1) { return; }
        if (element) {
          $activeCur = element;
        } else {
          for (i = 0; i < headingsPos.length; i++) {
            if (scrollTop >= headingsPos[i]) {
              $activeCur = $tocLi.eq(i);
            } else {
              $activeCur || ($activeCur = $tocLi.eq(i));
              break;
            }
          }
        }
        $activeLast && $activeLast.removeClass('active');
        ($activeLast = $activeCur).addClass('active');
        scrollActiveIntoView();
      }

      function scrollActiveIntoView() {
        if (!$activeCur || !$activeCur.length || !$root || !$root.length) { return; }
        var rootEl = $root[0];
        // root 不可滚动则无需处理
        if (!rootEl || rootEl.scrollHeight <= rootEl.clientHeight) { return; }
        var activeEl = $activeCur[0];
        if (!activeEl || !activeEl.getBoundingClientRect) { return; }

        var padding = 8;
        var rootRect = rootEl.getBoundingClientRect();
        var elRect = activeEl.getBoundingClientRect();
        // 元素在 root 滚动内容中的相对位置
        var elTop = (elRect.top - rootRect.top) + rootEl.scrollTop;
        var elBottom = elTop + elRect.height;
        var viewTop = rootEl.scrollTop;
        var viewBottom = viewTop + rootEl.clientHeight;

        if (elTop < viewTop + padding) {
          rootEl.scrollTop = Math.max(0, elTop - padding);
        } else if (elBottom > viewBottom - padding) {
          rootEl.scrollTop = Math.min(rootEl.scrollHeight, elBottom - rootEl.clientHeight + padding);
        }
      }
      function render() {
        if(!hasRendered) {
          $root.append($tocUl);
          $headings.each(function() {
            var $this = $(this);
            $tocUl.append($('<li></li>').addClass('toc-' + $this.prop('tagName').toLowerCase())
              .append($('<a></a>').text($this.text()).attr('href', '#' + $this.prop('id')).attr('title', $this.text())));
          });
          $tocLi = $tocUl.children('li');
          $tocUl.on('click', 'a', function(e) {
            e.preventDefault();
            var $this = $(this);
            scrolling = true;
            setState($this.parent());
            $scroller.scrollToAnchor($this.attr('href'), 400, function() {
              scrolling = false;
            });
          });
        }
        hasRendered = true;
      }
      function init() {
        var interval, timeout;
        if(!hasInit) {
          render(); calc(); setState(null, scrolling);
          // run calc every 100 millisecond
          interval = setInterval(function() {
            calc();
          }, 100);
          timeout = setTimeout(function() {
            clearInterval(interval);
          }, 45000);
          window.pageLoad.then(function() {
            setTimeout(function() {
              clearInterval(interval);
              clearTimeout(timeout);
            }, 3000);
          });
          $scrollTarget.on('scroll', function() {
            disabled || setState(null, scrolling);
          });
          $window.on('resize', window.throttle(function() {
            if (!disabled) {
              render(); calc(); setState(null, scrolling);
            }
          }, 100));
        }
        hasInit = true;
      }

      setOptions(options);
      if (!disabled) {
        init();
      }
      $window.on('resize', window.throttle(function() {
        init();
      }, 200));
      return {
        setOptions: setOptions
      };
    }
    $.fn.toc = toc;
  });
})();
