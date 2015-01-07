/*global window, jQuery, console*/
window.kbMenu = (
function (window, $, undefined) {
    var KbMenu = function(){
    };

    var regExpEmpty = /^\s*$/;

    /**
     * toggle chevron / expand/collapse submenu
     * param chevElem {jQueryElement} the chevronPart element that shall be toggled
     */
    var toggleChevron = function (chevElem) {
        var target = $(chevElem.attr('data-target'));
        if (!target.length) { // there's no target submenu = this submenu hasn't been loaded yet
            kbMenu.fetchSubMenu(chevElem);
        } else {
            if (!chevElem.closest('li').next().hasClass('collapsing')) { // only change if not under transition!
                $('.glyphicon', chevElem).toggleClass('open');
            }
            if (target.hasClass('in')) {
                target.collapse('hide');
                if (!$.support.transition) { // if IE8 or IE9, change chevrons instead of rotating them
                    chevElem.find('span')
                        .removeClass('glyphicon-chevron-up')
                        .addClass('glyphicon-chevron-down');
                }
            } else  {
                target.collapse('show');
                if (!$.support.transition) { // if IE8 or IE9, change chevrons instead of rotating them
                    chevElem.find('span')
                        .removeClass('glyphicon-chevron-down')
                        .addClass('glyphicon-chevron-up');
                }
            }
        }
    };

    KbMenu.prototype = {
        uidGen: (
            function () {
                var index = 0;
                return function () {
                    return index++;
                };
            }()),
        /**
         * Run through the element, and set up all chevron handlers
         * @param elem {jQueryElement|String/selector} The element to set up chevron handlers under
         */
        setChevronHandlers: function (elem) {
            var allChevrons = $('.chevronpart[data-src]', elem);
            allChevrons.each(function (index, element, allElements) {
                var $element = $(element);
                $element.click(function (e) {
                    toggleChevron($element);
                });
            });
        },

        /**
         * Fetch a submenu, and set overlay/spinner while fetching
         * @param chevElem {jQueryElement|String/selector} The chevron clicked for opening a submenu
         */
        fetchSubMenu: function (chevElem) {
            chevElem = (chevElem instanceof jQuery) ? chevElem : $(chevElem);
            var liElem = chevElem.closest('li'),
                url = chevElem.attr('data-src'),
                delayedSpinner = setTimeout(function () { liElem.addClass('showSpinner'); }, 500); // set spinner with a minor delay (so it will first appear when users gets impatient)
            liElem.addClass('overlay');
            $.ajax({
                url: '/system/modules/dk.kb.responsive.menu/elements/localmenu-mobile.jsp?getMenu=' + url,
                //url: url, // FIXME: only for testing - change to the line above before pushing this code into opencms!
                success: function (data, stat) {
                    if (!regExpEmpty.test(data)) { // This clause is here because menus with no subcontent actually returns some empty lines! :-/
                        var submenu = $(data),
                            uid = 'kbSubmenu-' + kbMenu.uidGen();
                        submenu.attr('id', uid);
                        chevElem.attr('data-target', '#' + uid);
                        liElem.after(submenu);
                        kbMenu.setChevronHandlers(submenu);
                        toggleChevron(chevElem); // this time the submenu IS loaded, so only the expand thing will trigger;
                    }
                },
                error: function () {
                    // submenu not fetched - go hide the chevron part!
                    $element.remove(); // This is kind a endlösung - we might wanna go for just trying again next time?
                    if (typeof window.console !== 'undefined'){
                        console.warn(err.message + ': Submenu "' + url + '" not fetched!');
                    }
                },
                complete: function () {
                    clearTimeout(delayedSpinner);
                    liElem.removeClass('overlay showSpinner');
                },
                context: liElem,
                dataType: 'html'
            });
        }
    };

    return new KbMenu();
}(window, jQuery));
