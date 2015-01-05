$(document).ready(function() {
    // on the very first click of the kbMenuToggler, fetch all submenus
    $('#kbMenuToggler').one('click', function () {
        kbMenu.fetchSubMenus($('.kb-navbar-mobile'));
        $('body').toggleClass('showMenu');
        // kbMenuToggler click slide mobile menu into view
        $('#kbMenuToggler').click(function () {
            $('body').toggleClass('showMenu');
        });
    });

    //setTimeout(function () { $('#kbMenuToggler').click(); }, 500); // FIXME: only for test!

    // focusing sliding search bar on search clicks
    $('.kbSearchToggler').click(function () {
        setTimeout(function () { $('#search-slidedown input').focus(); }, 0);
    });

    var searchSlidedown = $('#search-slidedown'),
        searchInput = $('.kb-search-box input', searchSlidedown),
        searchButton = $('.kb-search-box button', searchSlidedown);
    // hide searchbar on blur
    $('.kb-search-box input, .kb-search-box button', searchSlidedown).blur(function () {
        setTimeout(function () {
            if (document.activeElement !== searchInput[0] && document.activeElement !== searchButton[0]) {
                searchSlidedown.collapse('hide');
            }
        }, 0);
    });

    var KbList = function (list) {
        var that = this,
            listPager = list.closest('article.list').find('nav .pager');
        that.nextElem = $('.next', listPager);
        that.prevElem = $('.previous', listPager);
        that.list = list;
        that.index = 0; // initial showing first page
        //initializing click event handlers
        that.nextElem.click(function (e) { that.next.call(that, e); });
        that.prevElem.click(function (e) { that.prev.call(that, e); });
    };

    KbList.prototype = {
        next : function (e) {
            e.preventDefault();
            if (!this.nextElem.hasClass('disabled')) {
                $(this.list[this.index]).css('left', '-100%');
                this.index += 1;
                $(this.list[this.index]).css('left', 0);
                this.prevElem.removeClass('disabled'); // no matter what, if you successfully have pressed next, prev should be an option.
                if (this.index < this.list.length - 1) {
                    this.nextElem.removeClass('disabled');
                } else {
                    this.nextElem.addClass('disabled');
                }
            }
        },
        prev : function (e) {
            e.preventDefault();
            if (!this.prevElem.hasClass('disabled')) {
                $(this.list[this.index]).css('left', '100%');
                this.index -= 1;
                $(this.list[this.index]).css('left', 0);
                this.nextElem.removeClass('disabled'); // no matter what, if you successfully have pressed prev, next should be an option.
                if (this.index > 0) {
                    this.prevElem.removeClass('disabled');
                } else {
                    this.prevElem.addClass('disabled');
                }
            }
        }
    };

    var initializeLists = function() {
        var allLists = $('.listContent');
        $.each(allLists, function (index, list, allLists) {
            var pages = $('.listPage', list);
            if (pages.length > 1) {
                window.kbLists = window.kbLists || new Array();
                window.kbLists.push(new KbList(pages));
            } else {
                $(list).closest('article.list').find('.pager').remove(); // there is only one page in this list - no need for navigation panel
            }
        });
    }

    var PX_FROM_TOP_TO_COLLAPSE_MENU = 100,
        BODY_TOP_PADDING = 30,
        INITIAL_BODY_MARGIN_TOP = 120 + BODY_TOP_PADDING,
        SCREEN_SM_STR = 'mobile',
        SCREEN_MD_STR = 'tablet',
        SCREEN_LG_STR = 'desktop',
        $body = $('body'),
        $topnavigation = $('.topnavigation'),
        $kbNavbarContainer = $('.kb-navbar-container'),
        SCREEN_SM = 752, // magic-number 752 = 768 - 2 * 8px (window-borders?)
        SCREEN_MD = 977, // magic-number 976 = 992 - 2 * 8px
        initialWidth = $(window).innerWidth(); // FIXME: switch to outerWidth instead?
    window.kbModus = initialWidth < SCREEN_SM ? SCREEN_SM_STR : initialWidth < SCREEN_MD ? SCREEN_MD_STR : SCREEN_LG_STR; // in window.kbModus we keep track of mobile/tablet/desktop width

    var setModus = function (modus) {
        $('body').removeClass(window.kbModus);
        window.kbModus = modus;
        $('body').addClass(window.kbModus);
    };

    var ajustBodyMarginTop = function () {
        // ajust top margin to fit alert + header
        var alertHeight = $('section.alert', $topnavigation).outerHeight(),
            allNavHeaderHeight =  alertHeight + $('section.kb-navbar-container .navbar-header', $topnavigation).outerHeight() + BODY_TOP_PADDING; // used to be without .navbar-header
        if ($body.hasClass('desktop')) { // body.desktop
            if (allNavHeaderHeight !== $('body').data('margin-top')) {
                $body.css('margin-top', allNavHeaderHeight);
                $body.data('margin-top', allNavHeaderHeight);
            }
        } else { // body.tablet or body.mobile
            if ($('body').data('margin-top') !== 0) {
                $body.css('margin-top', 0);
                $body.data('margin-top', 0);
            }
        }
    }

    /**
     * Ajust header height according to scrollTop and screen width
     * We have 3 different sizes of headers: normal (big), mini and micro
     * normal is with huge logo, logotype and horizontal menu
     * mini is with little logo, logotype and a menu button, and
     * micro is with little logo and horizontal menu
     * if the screen is desktop width, the header should be normal until 100px down scrolled, where it should change to micro
     * if the screen is tablet or mobile width, the header should be mini (it won't get micro when scrolling down, since it is no longer fixed at top
     */
    var ajustHeaderHeight = function () {
        var scrollTop = $(window).scrollTop(),
            $body = $('body');
        if (kbModus === SCREEN_LG_STR) {
            if (scrollTop <= PX_FROM_TOP_TO_COLLAPSE_MENU) {
                if ($kbNavbarContainer.hasClass('micro')) {
                    $kbNavbarContainer.removeClass('micro');
                }
            } else {
                if (!$kbNavbarContainer.hasClass('micro')) {
                    $kbNavbarContainer.addClass('micro');
                }
            }
        } else {
            if (!$kbNavbarContainer.hasClass('mini')) {
                $kbNavbarContainer.addClass('mini');
            }
        }
    }

    $body.addClass(kbModus); // Set the initial class on body

    $(window).resize(function (){
        var innerWidth = $(window).innerWidth();
        if (innerWidth < SCREEN_SM) {
            if (kbModus !== SCREEN_SM_STR) {
                setModus(SCREEN_SM_STR);
                ajustHeaderHeight();
            }
        } else if (innerWidth < SCREEN_MD) {
            if (kbModus !== SCREEN_MD_STR) {
                $kbNavbarContainer.removeClass('micro').addClass('mini');
                setModus(SCREEN_MD_STR);
                ajustHeaderHeight();
            }
        } else {
            if (kbModus !== SCREEN_LG_STR) {
                if (kbModus === SCREEN_MD_STR) { // if we come from the tablet view, close menu (if it is present).
                    $body.removeClass('showMenu');
                }
                $kbNavbarContainer.removeClass('mini');
                setModus(SCREEN_LG_STR);
                ajustHeaderHeight();
            }
        }
        ajustBodyMarginTop();
    });

    // initialize the header size
    $('body')
        .css('margin-top', INITIAL_BODY_MARGIN_TOP)
        .data('margin-top', INITIAL_BODY_MARGIN_TOP);
    ajustHeaderHeight();
    ajustBodyMarginTop();

    initializeLists();

    $('.topnavigation .alert button[class=close]').click(function () { setTimeout(ajustBodyMarginTop, 0);}); // When alert is dismissed (AFTER the alert has gone) - recalculate body margin-top

    //scrollspy
    $(window).scroll(ajustHeaderHeight);

    // preloading spinner image (yeah - aarghh!)
    kbMenu.spinnerImg = new Image();
    kbMenu.spinnerImg.src = "/system/modules/dk.kb.responsive.local/resources/img/spinner.gif"; // FIXME: This doesn't seem to help?

});

