kb_mediaChannel = (function (window, $, undefined) {
    var Kb_mediaChannel = function () {};

    Kb_mediaChannel.prototype = {
        COLUMNS: [[0,4],[480,7],[768,10],[992,13]], // How many elements are there room for at what screenwidths (used to calculate the need for a showmore button) - header + thumbs/row x 3 rows
        init: function () {
            var that = this,
                decks = $('.deck');
            this.decks = [];
            this.oldSlots = 0;
            this.checkColumns();
        },
        countDecksAndThumbs: function () {
            var that = this,
                decks = $('.mediadeck');
            that.decks = []; // flush the old decks object
            $.each(decks, function (index, deck) {
                that.decks.push({
                    thumbCount: $(deck).find('.thumb').length,
                    moreButton: $(deck).find('.moreThumbs')
                });
            });
            return decks.length;
        },
        getAvailableSlots: function (width) {
            var tmpSlots = kb_mediaChannel.COLUMNS[0][1];
            for (var i=1;i<kb_mediaChannel.COLUMNS.length;i++) {
                if (width >= kb_mediaChannel.COLUMNS[i][0]) {
                    tmpSlots = kb_mediaChannel.COLUMNS[i][1];
                } else {
                    break;
                }
            }
            return tmpSlots;
        },
        checkColumns: function (forceReset) {
            var width = $('body').outerWidth();
            var slots = this.getAvailableSlots(width);
            if ((slots !== this.oldSlots) || forceReset) {
                // slots has changes - change show more buttons accordingly
                $.each(this.decks, function (index, deck) {
                    if (deck.thumbCount >= slots) {
                        deck.moreButton.addClass('in');
                    } else {
                        deck.moreButton.removeClass('in');
                    }
                });
                this.oldSlots = slots;
            }
        }
    };

    return new Kb_mediaChannel();
}(window,jQuery));

$(document).ready(function () {
    kb_mediaChannel.init();
    $(window).resize(function () { kb_mediaChannel.checkColumns.call(kb_mediaChannel); });
});
