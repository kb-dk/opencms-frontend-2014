/*global window, jQuery, console*/
window.kbMenu = (
function (window, $, undefined) {
    var KbMenu = function(){
    };

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
            //console.log('finding submenus in element: ', (elem.attr('id') || 'outerNav'));
            $('.chevronpart[data-src]', elem).each(function (index, element, allElements) {
                var $element = $(element),
                    url = $element.attr('data-src');
                $.ajax({
                    url: url,
                    success: function (data, stat) {
                        var submenu = $(data),
                            uid = 'kbSubmenu-' + kbMenu.uidGen(),
                            chevronpart = this.find('.chevronpart'); // FIXME: XXX XXX XXX Hvis du indsætter en selector, så kan du vist nøjes med at sætte denne listener på kb-navbar-mobile, så finder den selv ned til de rette elementer? XXX Første level skal IKKE loades på onload, men først når brugeren rent faktisk interagerer med menuen - dvs. første gang der klikkes på menuToggler! :-)
                        submenu.attr('id', uid);
                        chevronpart.attr('data-target', '#' + uid);
                        this.after(submenu);
                        chevronpart.click(chevronPartClickHandler);
                        chevronpart.css('display', 'block'); // turn it on, when submenu is ready
                    },
                    error: function (xhr, stat, err) {
                        // submenu not fetched - go hide the chevron part!
                        $element.remove();
                        console.warn(err.message + ': Submenu "' + url + '" not fetched!');
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
