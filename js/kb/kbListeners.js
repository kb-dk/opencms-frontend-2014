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

    var PX_FROM_TOP_TO_COLLAPSE_MENU = 100,
        INITIAL_BODY_MARGIN_TOP = 120,
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
            allNavHeaderHeight =  alertHeight + $('section.kb-navbar-container .navbar-header', $topnavigation).outerHeight(); // used to be without .navbar-header
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
    $('body').data('margin-top', INITIAL_BODY_MARGIN_TOP);
    ajustHeaderHeight();

    ajustBodyMarginTop();

    $('.topnavigation .alert button[class=close]').click(function () { setTimeout(ajustBodyMarginTop, 0);}); // When alert is dismissed (AFTER the alert has gone) - recalculate body margin-top

    //scrollspy
    $(window).scroll(ajustHeaderHeight);
});

