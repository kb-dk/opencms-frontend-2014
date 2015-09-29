/*global jQuery, SC*/
var kb_soundcloud = (function (window, $, undefined) {
    var LANGUAGE = 'da'; // Change this to either 'da' or 'en'

    var Kb_soundcloud = function () { };

    Kb_soundcloud.prototype = {
        //CLIENTNAME: 'cortexcowboy',
        //CLIENTID: 'addc49835216955834db7171a0a41411',
        CLIENTNAME: 'pewakb',
        CLIENTID: 'a68ddd70609cc8bf03fe519310cfba01',
        //PLAYLIST: '//soundcloud.com/cortexcowboy/sets/kb-playlist',
        PLAYLISTID: '133593086',
    };

    return new Kb_soundcloud();

})(window, jQuery);

//injecting SoundCloud API
(function(window, $, undefined) {
    var injectionPoint = $('head').find('script').last();
    var SCscript = document.createElement('script');
    var testForAPILoaded = function () {
            if ('undefined' === typeof window.SC) { // poor mans require!
                setTimeout(testForAPILoaded, 200);
            } else {
                window.onSoundcloudAPIReady();
            }
        };
    $(SCscript).ready(function () {
        testForAPILoaded();
    });
    SCscript.src = '//connect.soundcloud.com/sdk-2.0.0.js';
    injectionPoint.after(SCscript);
}(window, jQuery));

window.onSoundcloudAPIReady = function () {
    // Initializing SC
    SC.initialize({
      client_id: kb_soundcloud.CLIENTID
    });

    SC.get('/users/' + kb_soundcloud.CLIENTNAME + '/playlists/' + kb_soundcloud.PLAYLISTID, function (playlist, error) {
        if (!error && playlist && playlist.tracks && playlist.tracks.length) { // No errors, threre is a playlist, and it has tracks - do the rendering
            var sounds = playlist.tracks.map(function (track) {
                    return  '<div class="col-xs-6 col-sm-4 col-md-3">' +
                                '<a href="soundArticle.html?pid=' + track.id + '">' +
                                    '<article class="comp video" style="background-image: url(' + track.artwork_url + ')">' +
                                        '<div class="caption">' +
                                            '<span class="glyphicon glyphicon-play-circle pull-right"></span>' +
                                            '<h3>' + track.title + '</h3>' +
                                        '</div>' +
                                    '</article>' +
                                '</a>' +
                            '</div>';
                });
            $('#soundlist').append('<div class="container"><div class="row"><header class="text-center"><h2>Sounds</h2><p class="lead"></p></header></div></div>');
            $('#soundlist .container .row').append(sounds);
        } else {
            if ('undefined' !== typeof console) {
                console.warn('Error fetching soundcloud playlist.');
            }
        }
    });
}
