/*global jQuery, gapi, YT, onYouTubeIframeAPIReady*/
var kb_youtube = (function (window, $, undefined) {
    var Kb_youtube = function () { };

    var url2href = function (url, maxLength) {
            maxLength = maxLength || 37;
            var shortUrl = url.length > maxLength ? url.substr(0, maxLength) + '&hellip;' : url;
            return '<a href="' + url + '" target="_blank">' + shortUrl + '</a>';
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
            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    this.log('Error fetching playlists: ', jsonResp.error);
                } else {
                    cb(jsonResp.items);
                }
            });
        },
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

            request.execute(function (jsonResp) {
                if (jsonResp.error) {
                    debugger;
                    kb_youtube.log('Error fetching playlist: ', jsonResp.error);
                } else {
                    cb(jsonResp.items);
                }
            });
        },
        formatDescription : function (desc) {
            desc = desc.replace(/\b(https?\:\/\/\S*)\b/g, url2href);
            desc = desc.replace(/(\d?\d?:?\d?\d:\d\d)(\b)/g, '<a href="javascript: kb_youtube.setCurrentTime(\'$1\');">$1</a>$2');
            return desc.replace(/\n/g, '<br>\n');
        },
        getPlaylistName : function (playlistId, cb) {
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
                        cb(jsonResp.items[0].snippet.title);
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
        log : function (msg) {
            if (undefined !== window.console) {
                console.log('KB_youtube: ' + msg);
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
                            $('#featuredDescription').css('width', featuredVideo.snippet.thumbnails.maxres.width)
                                .append(kb_youtube.formatDescription(featuredVideo.snippet.description));
                        } else {
                            playerMarkup('<div>Something is wrong - the requested video is not sanctioned by KB!</div>');
                        }
                        // List goes here
                        var playlistMarkup = $('<div class="list" />');
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
                        kb_youtube.getPlaylistName(videos[0].snippet.playlistId, function (playlistName) {
                            $('.playlistTitle').html(playlistName);
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
    console.log('onYoutubeIframeAPI loaded');
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


