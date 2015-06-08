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
        /**
         * The official KB YouTube Channel Id
         */
        KBCHANNELID : 'UCPYYQwMYGrAfJhyO3t4n-Mg',
        /**
         * Hardcoded list of playlist id's of the KB playlists that are to enter the mediachannel (handpicked by Uffe and Jytte)
         */
        ALLOWEDPLAYLISTS : ['PL-kGrXuGF9C0Qsog3lm_Kpf8KEmK-eM8m', 'PL-kGrXuGF9C33B1PBlg6yJsb58X9sKno2', 'PL-kGrXuGF9C1fI19BhkUaRbPu02wKBVo2', 'PL-kGrXuGF9C1S1g4d6KlmDNk1CH0AG11M'],
        /**
         * Fetches a list of all playlists for a given YouTube Channel thru ajax call
         * Note that a call to this function also will populate the kb_youtube.allPlaylists array with all the playlists ids and the
         * playlistTitle hashtable.
         * @param channelId {String/YouTubeChannelId} The channel id
         * @param cb {Function} Callback function that will be called with an Array of the playlists (id + snippet) when they are returned from YouTube.
         */
        fetchAllPlaylists : function (channelId, cb) {
            var request = gapi.client.request({
                'path': '/youtube/v3/playlists',
                'method': 'get',
                'params': {
                    'part': 'id, snippet',
                    'channelId': 'UCPYYQwMYGrAfJhyO3t4n-Mg',
                    'maxResults': 50
                }
            });
            var that = this;
            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    that.log('Error fetching playlists: ', jsonResp.error);
                } else {
                    that.allPlaylists = jsonResp.items.map(function (playlist) { // save id's of followed playlists in kb_youtube.allPlaylists
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
        /**
         * Fetch the latest videos of a given playlist.
         * Note that the kb_youtube.latestVideo will get updated if a video that is newer is loaded in this method.
         * @param playlistId {String/YouTubePlaylistId} Id of the playlist
         * @param numberOfItems {Number} Optional The max number of videos to fetch. If omitted it defaults to 50.
         * @param cb {Function} Callback method that is called with an array of video objects (id + snippet) when the ajax response has returned.
         */
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
                        if (that.allPlaylists && (that.loadedPlaylists.length === that.ALLOWEDPLAYLISTS.length)) { // When we have loaded the last playlist, show the latest video in top
                            that.onAllPlaylistsLoaded(that.loadedPlaylists);
                        }
                    } else {
                        cb([]);
                    }
                }
            });
        },
        /**
         * Format a text blob as the description is fromatted in YoutTube. This implies all urls converted to <a>-tags, all timestamps made clickable, and linefeeds converted to <br>-tags
         */
        formatDescription : function (desc) {
            desc = desc.replace(/\b(https?\:\/\/\S*)\b/g, url2href);
            desc = desc.replace(/(\d?\d?:?\d?\d:\d\d)(\b)/g, '<a href="javascript: kb_youtube.setCurrentTime(\'$1\');">$1</a>$2');
            return desc.replace(/\n/g, '<br>\n');
        },
        /**
         * Get the name and description of a playlist (lightweight version of getAllPlaylists for use when you are only interested in one particular playlist).
         * Note that this call implies an ajax call to look up the information at YouTube.
         * @param playlistId {String/YoutubePlaylistId} Playlist id.
         * @param cb {Function} Callback function that is called with following two parameters on ajax response:
         * - title {String} Playlist title.
         * - description {String} Playlist description.
         */
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
        /**
         * Sets the window.player current time to any given time of the format HH:mm:SS | mm:SS | SS
         * Also it scrolls to the top of the page (where the player is)
         * @param time {String} Time stamp of the format "HH:mm:SS", "mm:SS" or "SS"
         */
        setCurrentTime : function (time) {
            if ('undefined' !== typeof window.player) {
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
                    $('body, html').animate({scrollTop: 0}, 'fast');
                } catch (e) {
                    this.log('Unknown error occured when trying to set currentTime of video player', e);
                }
            } else {
                this.log('Should have moved to', time, 'but no player was available?');
            }
        },
        /**
         * Print out a message to the JS console.
         * The messages is prefixed with "KB_youtube: " and it takes care of <IE9 problems with console.
         */
        log : function () {
            if ('undefined' !== typeof window.console) {
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

    window.player = null; // FIXME: Perhaps this shouldn't be global?

    window.onYouTubeIframeAPIReady = function () {
        if (!kb_youtube.featuredVideo) {
            // We haven't recieved data on the featuredVideo from the dataAPI yet, wait just a bit and try again
            setTimeout(onYouTubeIframeAPIReady, 300); // TODO: Poor mans dependency control
            return;
        }
        var maxres = kb_youtube.featuredVideo.snippet.thumbnails.maxres || kb_youtube.featuredVideo.snippet.thumbnails.high || kb_youtube.featuredVideo.snippet.thumbnails['default'];
        window.player = new YT.Player('player', {
            playerVars: {
                showinfo:0
            },
            height: maxres.height,
            width: maxres.width,
            videoId: kb_youtube.featuredVideo.snippet.resourceId.videoId,
            events: {
                'onReady': function () {
                    if (getParams.t) {
                        window.player.seekTo(getParams.t);
                    }
                    if (kb_youtube.autoplay) {
                        window.player.playVideo(); // FIXME: this ought to be event driven! Emmit an event here, and let the pages listen for it instead!
                    };
                }
            }
        });
        // Setting the correct publishedAt date.
        var publishedStr = datestamp2Text(kb_youtube.featuredVideo.snippet.publishedAt);
        $('#featuredPublishedAt')
            .attr('datetime', kb_youtube.featuredVideo.snippet.publishedAt)
            .text(publishedStr);
        $('#featuredPublishedAtMeta').attr('content', kb_youtube.featuredVideo.snippet.publishedAt);
    };

    $(document).ready(function () { // Do we have to wait until doc ready here?
        var YTDtag = document.createElement('script'),
            YTItag = document.createElement('script');
        YTDtag.src = "https://apis.google.com/js/client.js?onload=apiReady"; // load YouTube data API
        YTItag.src = "https://www.youtube.com/iframe_api"; // load YouTube Iframe API
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(YTDtag, firstScriptTag);
        firstScriptTag.parentNode.insertBefore(YTItag, firstScriptTag);
    });

    return kb_youtube;
})(window, jQuery);


