$(document).ready(function() {
    $('#kbMenuToggler').click(function () {
        $('body').toggleClass('showMenu');
    });

    //setTimeout(function () { $('#kbMenuToggler').click(); }, 500); // FIXME: only for test!

    var MOBILESTR = 'mobile',
        TABLETSTR = 'tablet',
        DESKTOPSTR = 'desktop',
        $body = $('body'),
        $topnavigation = $('.topnavigation'),
        MOBILE = 752, // magic-number 752 = 768 - 2 * 8px (window-borders?)
        TABLET = 1008, // magic-number 1008 = 1024 - 2 * 8px
        initialWidth = $(window).innerWidth(); // FIXME: switch to outerWidth instead?
    kbModus = initialWidth < MOBILE ? MOBILESTR : initialWidth < TABLET ? TABLETSTR : DESKTOPSTR;

    var setModus = function (modus) {
        $('body').removeClass(kbModus);
        kbModus = modus;
        $('body').addClass(kbModus);
    };

    var ajustHeaderHeight = function () {
        var scrollTop = $(window).scrollTop();
        if ((kbModus === DESKTOPSTR) && (scrollTop <= 100)) {
            if ($topnavigation.hasClass('minified')) {
                $topnavigation.removeClass('minified');
            }
        } else {
            if (!$topnavigation.hasClass('minified')) {
                $topnavigation.addClass('minified');
            }
        }
    }

    $body.addClass(kbModus); // Set the initial class on body

    $(window).resize(function (){
        var innerWidth = $(window).innerWidth();
        if (innerWidth < MOBILE) {
            if (kbModus !== MOBILESTR) {
                setModus(MOBILESTR);
                ajustHeaderHeight();
            }
        } else if (innerWidth < TABLET) {
            if (kbModus !== TABLETSTR) {
                if (kbModus === MOBILESTR) { // if we come from the mobile view, close menu (if it is present).
                    $body.removeClass('showMenu');
                }
                setModus(TABLETSTR);
                ajustHeaderHeight();
            }
        } else {
            if (kbModus !== DESKTOPSTR) {
                setModus(DESKTOPSTR);
                ajustHeaderHeight();
            }
        }
    });

    // initialize the header size
    ajustHeaderHeight();

    //scrollspy
    $(window).scroll(ajustHeaderHeight);
});

