/*global window, jQuery, console*/
window.kbMenu = (
function (window, $, undefined) {
    var KbMenu = function(){
    };

    var regExpEmpty = /^\s*$/;

    var chevronPartClickHandler = function (e) {
        var target = $($(this).attr('data-target'));
        if (!target.data('subMenusLoaded')){ // when interacting with a submenu, check if its submenus are loaded, and if they aren't, go load them.
            kbMenu.fetchSubMenus(target);
        }
        if (!$(this).closest('li').next().hasClass('collapsing')) { // only change if not under transition!
            $('.glyphicon', this).toggleClass('open');
        }
        if (target.hasClass('in')) {
            target.collapse('hide');
            if (!$.support.transition) { // if IE8 or IE9, change chevrons instead of rotating them
                (e.target.tagName === 'SPAN' ? $(e.target) : $('.glyphicon', e.target)) // either user has clicked on the a tag or the span - either way we wanna change the span tag classes
                    .removeClass('glyphicon-chevron-up')
                    .addClass('glyphicon-chevron-down');
            }
        } else  {
            target.collapse('show');
            if (!$.support.transition) { // if IE8 or IE9, change chevrons instead of rotating them
                (e.target.tagName === 'SPAN' ? $(e.target) : $('.glyphicon', e.target)) // same as above
                    .removeClass('glyphicon-chevron-down')
                    .addClass('glyphicon-chevron-up');
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
         * Fetches and injects all submenupoints under elem.
         * Note: We drop a true in elem.data('subMenusLoaded') when submenus for a given element is loaded, to prevent loading the same submenu more than once pr session.
         * @param elem {jQueryElement|String/selector} The element to search for submenus under. Submenus are defined by the presence of a data-src attribute in a .chevronpart
         */
        fetchSubMenus: function (elem) {
            var allChevrons = $('.chevronpart[data-src]', elem),
                chevronsToLoad = allChevrons.length;
            allChevrons.each(function (index, element, allElements) {
                var $element = $(element),
                    url = $element.attr('data-src');
                $.ajax({
                    url: '/system/modules/dk.kb.responsive.menu/elements/localmenu-mobile.jsp?getMenu=' + url,
                    //url: url, // FIXME: This is just for testing - the line above is the correct url!
                    success: function (data, stat) {
                        if (!regExpEmpty.test(data)) { // This clause is here because menus with no subcontent actually returns some empty lines! :-/
                            var submenu = $(data),
                                uid = 'kbSubmenu-' + kbMenu.uidGen(),
                                chevronpart = this.find('.chevronpart'); // FIXME: Might wanna catch event on a parent object, instead of having several listeners!
                            submenu.attr('id', uid);
                            chevronpart.attr('data-target', '#' + uid);
                            this.after(submenu);
                            chevronpart.click(chevronPartClickHandler);
                        }
                    },
                    error: function (xhr, stat, err) {
                        // submenu not fetched - go hide the chevron part!
                        $element.remove(); // This is kind a endlösung - we might wanna go for just trying again next time?
                        if (typeof window.console !== 'undefined'){
                            console.warn(err.message + ': Submenu "' + url + '" not fetched!');
                        }
                    },
                    complete: function (xhr, status) {
                        // count chevronsToLoad down, and remove spinner when the last submenu has loaded.
                        chevronsToLoad -= 1;
                        if (chevronsToLoad === 0) {
                            this.parent().closest('.kbMenuLoading').removeClass('kbMenuLoading');
                        }
                    },
                    context: $element.closest('li'),
                    dataType: 'html'
                });
            });
            elem.data('subMenusLoaded', true);
        }
    };

    return new KbMenu();
}(window, jQuery));
