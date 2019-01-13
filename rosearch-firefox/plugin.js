// constants
const TEXT_TIMEOUT = 500;

// blah
var runningGames = document.getElementById("rbx-running-games");
var currentInput = "";
var isLoading = false;
Roblox = window.Roblox;

function onNewInput(input){
    if(input.trim() === '')
        return displayAddonServerContainer(false);
    else
        displayAddonServerContainer(true);

    addonError(null);
    clearAddonServerContainer();
    addonGameServerContainerHasItems(false);
    loadingAddonServerContainer(true);

    isLoading = true;
    getAvatar(input, (r) => {
        if(r.ok) {
            console.log(`%c[Server Searcher] User avatar ${r.url}`,"color: #424242; font-size:16px;");
            findServer(r.url, input, (success, server) => {
                isLoading = false;
                if(success){
                    console.log(`%c[Server Searcher] User found! ${JSON.stringify(server)}`,"color: #424242; font-size:16px;");
                    displayServer(server);
                } else {
                    console.log(`%c[Server Searcher] Couldn't find user`,"color: #424242; font-size:16px;");
                    addonError('could not find user in server');
                }
            });
        } else {
            isLoading = false;
            console.log(`%c[Server Searcher] Couldn't get user avatar`,"color: #424242; font-size:16px;");
            addonError('could not find user');
        }
    });
}

function displayServer(server){
    loadingAddonServerContainer(false);
    addonError(null);
    addonGameServerContainerHasItems(true);
    clearAddonServerContainer();

    var container = document.getElementById('rbx-addon-server-search');
    if(container === null) throw 'could not find rbx-addon-search container';

    // creating elements
    var li = document.createElement('li');
    var sectionHeader = document.createElement('div');
    // section left content
    var sectionLeft = document.createElement('div');
    var sectionStatus = document.createElement('div');
    var sectionJoin = document.createElement('a');
    // section right content
    var sectionRight = document.createElement('div');


    // set element data
    li.className = 'stack-row rbx-game-server-item';
    li.setAttribute('data-gameid', server.guid);
    sectionHeader.innerHTML = '<div class="link-menu rbx-game-server-menu"></div>';
    // sectionLeft stuff
    sectionLeft.className = 'section-left rbx-game-server-details';
    sectionStatus.className = 'rbx-game-status rbx-game-server-status';
    sectionStatus.innerText = server.PlayersCapacity;
    sectionJoin.className = 'btn-full-width btn-control-xs rbx-game-server-join';
    sectionJoin.href = '#';
    sectionJoin.setAttribute('data-placeid', getPlaceId());
    sectionJoin.onclick = (e) => {
        var script = document.createElement('script');
        var obj = (document.body || document.head || document.documentElement);
        script.id = 'tmpScript';
        script.type = 'text/javascript';
        script.innerHTML = server.JoinScript + `;document.currentScript.remove();`;
        obj.appendChild(script);
    };
    sectionJoin.innerText = 'Join';
    //sectionRight stuff
    sectionRight.className = 'section-right rbx-game-server-players';
    server.CurrentPlayers.forEach((val, idx) => {
        var span = document.createElement('span');
        var link = document.createElement('a');
        var img = document.createElement('img');
        span.className = 'avatar avatar-headshot-sm player-avatar';
        link.className = 'avatar-card-link';
        img.className = 'avatar-card-image';
        img.src = val.Thumbnail.Url;
        link.appendChild(img);
        span.appendChild(link);
        sectionRight.appendChild(span);
    });

    sectionLeft.appendChild(sectionStatus);
    sectionLeft.appendChild(sectionJoin);    
    li.appendChild(sectionHeader);
    li.appendChild(sectionLeft);
    li.appendChild(sectionRight);
    container.appendChild(li);
}

function getAvatar(userId, callback){
    if(!isLoading) return;

    fetch(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=48&height=48&format=png`)
        .then((v) => {
            if(isLoading)
                callback(v);
        })
        .catch(exc => {
            console.error(exc);
            isLoading = false;
            addonError('error occured during callback');
        });
}

function getPlaceId() {
    //ghetto way of doin it lol
    var playButton = document.getElementById('MultiplayerVisitButton');
    if(playButton === null) return addonError('unable to get placeid');

    return playButton.getAttribute('placeid');
}

function findServer(avatar, userId, callback, startIndex = 0) {
    if(!isLoading) return;
    
    const placeId = getPlaceId();
    fetch(`https://www.roblox.com/games/getgameinstancesjson?placeId=${placeId}&startIndex=${startIndex}`)
        .then(r => {
            if(!r.ok) throw 'invalid response';
            return r.json()
        })
        .then(r => {
            if(!isLoading) return;
            var count = r['Collection'].length;
            if(count > 0) {
                for(var index = 0; index < count; ++index) {
                    var item = r['Collection'][index];
                    if(typeof item === 'object' && typeof item['CurrentPlayers'] === 'object' && isLoading) {
                        var idx, cnt;
                        for(idx = 0, cnt = item['CurrentPlayers'].length; idx < cnt; ++idx) {
                            var player = item['CurrentPlayers'][idx];
                            if(typeof player['Thumbnail'] === 'object' && player['Thumbnail']['Url'] === avatar
                                && isLoading){
                                return callback(true, item);
                            }
                        }
                    }
                }
                return findServer(avatar, userId, callback, startIndex + count);
            }
            callback(false, null);
        })
        .catch(ex => {
            console.error(exc);
            isLoading = false;
            addonError('error occured during callback');
        });
}


function clearAddonServerContainer(){
    var thing = document.getElementById('rbx-addon-server-search');
    if(thing === null) return;
    while (thing.firstChild) {
        thing.removeChild(thing.firstChild);
    }
}

function addonError(err){
    loadingAddonServerContainer(false);
    var thing = document.getElementById('rbx-addon-server-search');
    var msg = document.getElementById('rbx-addon-search-err');
    if(msg !== null) msg.remove();
    if(typeof err === 'string')
    {
        addonGameServerContainerHasItems(false);
        var p = document.createElement('p');
        p.className = 'no-servers-message';
        p.id = 'rbx-addon-search-err';
        p.innerText = err;
        thing.appendChild(p);
    }
}

function loadingAddonServerContainer(i){
    var thing = document.getElementById('rbx-addon-server-search');
    if(thing === null) throw 'could not find addon server container';

    var loading = document.getElementById('rbx-addon-loading');
    if(loading !== null)
        loading.remove();

    if(i === true){
        var spinner = document.createElement('span');
        spinner.className = "spinner spinner-default";
        spinner.id = 'rbx-addon-loading';
        thing.appendChild(spinner);
    }
}

function displayAddonServerContainer(i){
    var thing = document.getElementById('rbx-addon-server-search');
    var rbxSrvCont = document.getElementById('rbx-game-server-item-container');
    var loadMore = document.getElementsByClassName('rbx-running-games-footer');
    if(rbxSrvCont === null) throw 'could not find server container';

    if(thing === null)
    {
        createGameServerContainer();
        return displayAddonServerContainer(i);
    }

    if(i === true){
        rbxSrvCont.style="display: none";
        thing.style="display: block";
        if(loadMore.length !== 0)
            loadMore[0].style = "display: none";
    } else {
        rbxSrvCont.style="display: block";
        thing.style="display:none";
        if(loadMore.length !== 0)
            loadMore[0].style = "display: block";
    }
}

function addonGameServerContainerHasItems(i){
    var thing = document.getElementById('rbx-addon-server-search');
    if(thing === null) throw 'could not find server container';

    if(i === true){
        thing.className = 'section rbx-game-server-item-container stack-list';
    } else {
        thing.className = 'section rbx-game-server-item-container stack-list section-content-off';
    }
}

function createGameServerContainer(){
    var rbxSrvCont = document.getElementById('rbx-game-server-item-container');
    if(rbxSrvCont === null) throw 'could not find server container';

    var newNode = rbxSrvCont.cloneNode(false);
    newNode.id = "rbx-addon-server-search"

    rbxSrvCont.parentNode.appendChild(newNode);
    displayAddonServerContainer(false);
    addonGameServerContainerHasItems(false);
}

function createInput(node){
    var container = document.createElement('div');
    var input = document.createElement('input');
    input.className = "addMainInput";
    input.placeholder = "User Id";
    container.className = "addInputContainer";
    
    setInputFilter(input, function(value) {
        return /^\d*$/.test(value);
    });

    var timeout = null;
    input.addEventListener('keyup', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            onNewInput(input.value);
        }, TEXT_TIMEOUT);
    });

    container.appendChild(input);
    node.appendChild(container);
}

// credit: https://stackoverflow.com/questions/469357/html-text-input-allows-only-numeric-input
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
      textbox.addEventListener(event, function() {
        if (inputFilter(this.value)) {
          this.oldValue = this.value;
          this.oldSelectionStart = this.selectionStart;
          this.oldSelectionEnd = this.selectionEnd;
        } else if (this.hasOwnProperty("oldValue")) {
          this.value = this.oldValue;
          this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
        }
      });
    });
  }


if(runningGames !== null) {
    console.log(window.origin);
    console.log("%cServer Searcher has LOADED!","color: #424242; font-size:16px;");
    createInput(runningGames.firstChild);
}