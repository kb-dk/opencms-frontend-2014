/*global jQuery, gapi, YT, onYouTubeIframeAPIReady*/
var kb_youtube = (function (window, $, undefined) {
    var Kb_youtube = function () { };
    //var loadedPlaylists = [];

    /**
     * Converts an url to a html a tag
     * @param url {String} The url
     * @param maxLength {Number} The maximum length of the url to show in the link. Chars beyond this will be cutted off in the text (not the href) and an ellipsis will be appended.
     * @return {String/html} The a-tag
     */
    var url2href = function (url, maxLength) {
            maxLength = maxLength || 37;
            var shortUrl = url.length > maxLength ? url.substr(0, maxLength) + '&hellip;' : url;
            return '<a href="' + url + '" target="_blank">' + shortUrl + '</a>';
        };
    /**
     * Converts a datestamp to a text "Offentliggjort d. DD/MM YYYY"
     * @param datestamp {String/date} Might be of any kind readable for Date - in this case it probably will be of the form YYYY/MM/DDTHH:mm:SS:ttttZ" or something like that?
     * @return {String} "Offentliggjort d. DD/MM YYYY"
     */
    var datestamp2Text = function (datestamp) {
            var tmpDate = new Date(datestamp);
            return 'Offentliggjort d. ' + tmpDate.getUTCDate() + '/' + (tmpDate.getUTCMonth()+1) + ' ' + tmpDate.getUTCFullYear(); // FIXME: i18n
        };
    Kb_youtube.prototype = {
        KBCHANNELID : 'UCPYYQwMYGrAfJhyO3t4n-Mg',
        fetchAllPlaylists : function (channelId, cb) {
            var request = gapi.client.request({
                'path': '/youtube/v3/playlists',
                'method': 'get',
                'params': {
                    'part': 'id, snippet',
                    'channelId': 'UCPYYQwMYGrAfJhyO3t4n-Mg'
                }
            });
            var that = this;
            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    that.log('Error fetching playlists: ', jsonResp.error);
                } else {
                    that.allFollowedPlaylists = jsonResp.items.map(function (playlist) { // save id's of followed playlists in kb_youtube.allFollowedPlaylists
                        that.playlistTitle[playlist.id] = playlist.snippet.title;
                        return playlist.id;
                    });
                    cb(jsonResp.items);
                }
            });
        },
        /**
         * Override this method to have code executed when all playlists are loaded.
         */
        // FIXME: Consider replacing this with an event system!
        onAllPlaylistsLoaded: function () {},
        /**
         * Hash table to lookup playlist titles having the playlist id as key. This is populated by the fetchAllPlaylists method.
         */
        playlistTitle: {}, // FIXME: A lot of these vars should just be vars in the closure, and not polluting the kb_youtube.prototype! (but it isn't important since we only have one obj)
        /**
         * List of id's that is populated on every ajax response - used to acknowledge when all playlists has been loaded.
         * This is important because we first know the latest video across all playlists, when the last playlist has loaded.
         */
        loadedPlaylists: [],
        fetchLatestVideos : function (playlistId, numberOfItems, cb) {
            var request = gapi.client.request({
                'path': '/youtube/v3/playlistItems',
                'method': 'get',
                'params': {
                    'part': 'id, snippet',
                    'maxResults': numberOfItems || 50, // either fetch the requested number, or fetch as many as possible (api sets a 50 video max limit)
                    'playlistId': playlistId,
                    'order': 'date'
                }
            });
            var that = this;
            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    that.log('Error fetching playlist: ', jsonResp.error);
                } else {
                    if (jsonResp.items.length) {
                        var videosNewestFirst = jsonResp.items.reverse();
                        // find the latest video from all lists, and save it in latestVideo
                        if (!!!that.latestVideo || new Date(that.latestVideo.snippet.publishedAt) < new Date(videosNewestFirst[0].snippet.publishedAt)){
                            that.latestVideo = videosNewestFirst[0];
                        }
                        cb(videosNewestFirst);
                        that.loadedPlaylists.push(jsonResp.items[0].snippet.playlistId);
                        if (that.allFollowedPlaylists && (that.loadedPlaylists.length === that.allFollowedPlaylists.length)) {
                            that.onAllPlaylistsLoaded(that.loadedPlaylists);
                        }
                    } else {
                        cb([]);
                    }
                }
            });
        },
        formatDescription : function (desc) {
            desc = desc.replace(/\b(https?\:\/\/\S*)\b/g, url2href);
            desc = desc.replace(/(\d?\d?:?\d?\d:\d\d)(\b)/g, '<a href="javascript: kb_youtube.setCurrentTime(\'$1\');">$1</a>$2');
            return desc.replace(/\n/g, '<br>\n');
        },
        getPlaylistNameAndDescription : function (playlistId, cb) {
            var request = gapi.client.request({
                'path': '/youtube/v3/playlists',
                'method': 'get',
                'params': {
                    'part': 'id, snippet',
                    'id': playlistId
                }
            });
            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    this.log('Error fetching playlist name: ', jsonResp.error);
                } else {
                    if (jsonResp.items.length && jsonResp.items[0].snippet) {
                        cb(jsonResp.items[0].snippet.title, jsonResp.items[0].snippet.description);
                    } else {
                        cb('');
                    }
                }
            });
        },
        setCurrentTime : function (time) {
            if (undefined !== window.player) {
                var numbers = time.split(':');
                try {
                    switch (numbers.length) {
                    case 1 :
                        window.player.seekTo(parseInt(numbers[0], 10), true);
                        break;
                    case 2 :
                        window.player.seekTo(parseInt(numbers[1], 10) + (parseInt(numbers[0], 10) * 60), true);
                        break;
                    case 3 :
                        window.player.seekTo(parseInt(numbers[2], 10) + (parseInt(numbers[1], 10) * 60) + (parseInt(numbers[0], 10) * 3600), true);
                        break;
                    default :
                        this.log('Unknown time format', time);
                    }
                    $('body').animate({scrollTop: 0});
                } catch (e) {
                    this.log('Unknown error occured when trying to set currentTime of video player', e);
                }
            } else {
                this.log('Should have moved to',time, 'but no player was available?');
            }
        },
        /**
         * Print out a message to the JS console.
         * The messages is prefixed with "KB_youtube: " and it takes care of <IE9 problems with console.
         */
        log : function () {
            if (undefined !== window.console) {
                console.log('KB_youtube: ', arguments);
            }
        }
    };

    var kb_youtube = new Kb_youtube();    

    // stuff that needs to be done at start or page ready
    var getParams = location.search.substr(1).split('&');
    getParams = getParams.map(function (p) { return p.split('='); });
    getParams.forEach(function (p) { getParams[p[0]] = p[1]; }); // TODO: A bit of a hack, but it will do fine here since we only look for vid and pid.
    kb_youtube.playlistId = getParams.pid;
    kb_youtube.videoId = getParams.vid;

    window.apiReady = function ()  {
    console.log('IframeAPI loaded');
        gapi.client.setApiKey('AIzaSyDFxu8aPIl2RM5UBHupA-ryqdbsudkwU9I');
        gapi.client.load('youtube', 'v3', function () {
            try {
                kb_youtube.fetchLatestVideos(kb_youtube.playlistId, null, function (videos) {
                    if (videos && videos.length) {
                        // figure out the featured video
                        var featuredVideo = videos[0];
                        if (kb_youtube.videoId) {
                            videos.some(function (video) { // FIXME: IE8 nocando - rewrite as a for loop with break, and everything will work in IE8 too!
                                if (video.snippet.resourceId.videoId === kb_youtube.videoId) {
                                    featuredVideo = video;
                                    return true;
                                }
                                return false;
                            });
                        }
                        kb_youtube.featuredVideo = featuredVideo; // this is used by the player when the YouTubeIframeAPI has loaded
                        // Markup building starts here
                        // Featured video iframe goes here
                        var playerMarkup = $('<div class="thePlayer" />');
                        if (featuredVideo.snippet.channelId === kb_youtube.KBCHANNELID) {
                            $('#featuredTitle').append(featuredVideo.snippet.title);
                            $('#featuredDescription').append(kb_youtube.formatDescription(featuredVideo.snippet.description));
                        } else {
                            playerMarkup('<div>Something is wrong - the requested video is not sanctioned by KB!</div>');
                        }
                        // List goes here
                        var playlistMarkup = $('<div class="xlist" />');
                        //playlistMarkup.append('<h2 class="playlistTitle"></h2>');
                        playlistMarkup.append(videos.map(function (video) {
                            return  '<div class="col-xs-6 col-sm-4 col-md-3">' +
                                        '<a href="?pid=' + video.snippet.playlistId + '&vid=' + video.snippet.resourceId.videoId + '">' +
                                            '<article class="comp video" style="background-image: url(' + video.snippet.thumbnails.medium.url + ')">' +
                                                '<div class="caption">' +
                                                    '<span class="glyphicon glyphicon-play-circle pull-right"></span>' +
                                                    '<time class="text-uppercase" datetime="20:00">4:18</time>' +
                                                    '<h3>' + video.snippet.title + '</h3>' +
                                                '</div>' +
                                            '</article>' +
                                        '</a>' +
                                    '</div>';
                        }));
                        $('#playlists').append(playlistMarkup);
                        kb_youtube.getPlaylistNameAndDescription(videos[0].snippet.playlistId, function (playlistName, playlistDescription) {
                            $('.playlistTitle').html(playlistName);
                            $('.playlistDescription').html(playlistDescription);
                        });
                    }
                });
            } catch (e) {
                kb_youtube.log('Something went wrong loading the youtube playlists.');
            }
        });
    };

    window.player = null; // FIXME: Perhaps this shouldn't be global?

    window.onYouTubeIframeAPIReady = function () {
        if (!kb_youtube.featuredVideo) {
            // We haven't recieved data on the featuredVideo from the dataAPI yet, wait just a bit and try again
            setTimeout(onYouTubeIframeAPIReady, 300); // TODO: Poor mans dependency control
            return;
        }
        window.player = new YT.Player('player', {
            playerVars: {
                modestbranding: true
            },
            height: kb_youtube.featuredVideo.snippet.thumbnails.maxres.height,
            width: kb_youtube.featuredVideo.snippet.thumbnails.maxres.width,
            videoId: kb_youtube.featuredVideo.snippet.resourceId.videoId,
            events: {
                'onReady': function () {
                    kb_youtube.log('Player ready!');
                    window.player.playVideo();
                }
            }
        });
    };

    $(document).ready(function () { // Do we have to wait until doc ready here?
        var YTDtag = document.createElement('script'),
            YTItag = document.createElement('script');
        YTDtag.src = "https://apis.google.com/js/client.js?onload=apiReady";
        YTItag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(YTDtag, firstScriptTag);
        firstScriptTag.parentNode.insertBefore(YTItag, firstScriptTag);
    });




    return kb_youtube;
})(window, jQuery);


