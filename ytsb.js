// Add iframe API library, see https://developers.google.com/youtube/iframe_api_reference.
let tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// To store our players.
let playersMap = {};
// Entry point.
function onYouTubeIframeAPIReady() {
  addNumberOfVideosValue();
  addBuildButtonOnClick();
}

/**
 * Add number of videos value taken from the number of videos slider.
 */
function addNumberOfVideosValue() {
  $("#numberOfVideosValue").text($("#numberOfVideosSlider").val());
  $("#numberOfVideosSlider").on("change", function (e) {
    $("#numberOfVideosValue").text(e.target.value);
  });
}

/**
 * Add the build button click handler.
 */
function addBuildButtonOnClick() {
  $("#buildButton").on("click", function () {
    const videoItemsContainer = $("#videoItems");
    const numberOfVideoItems = $("#numberOfVideosSlider").val();
    // Clear video items.
    videoItemsContainer.empty();
    // Build video items.
    for (let videoItemID = 0; videoItemID < numberOfVideoItems; videoItemID++) {
      buildVideoItem(videoItemsContainer, videoItemID);
      addVideoItemConfigurationHandlers(videoItemID);
    }
  });
}

/**
 *  Build a video item.
 */
function buildVideoItem(container, videoItemID) {
  container.append(`
    <div class="col-md-4 mt-2">
      <div class="configuration mb-1">
        <div class="form-control">
          <input id="videoId${videoItemID}" class="form-control mb-1" maxlength="15" placeholder="YouTube video id">
          <input id="buttonLabel${videoItemID}" class="form-control mb-1" maxlength="20" placeholder="Button label">
          <button id="loadButton${videoItemID}" class="btn btn-primary" data-controls-container-id="controls${videoItemID}" data-player-container-id="player${videoItemID}">
            Load
          </button>
        </div>
      </div>
      <div class="controls mb-1" id="controls${videoItemID}"></div>
      <div class="player collapse" id="player${videoItemID}"></div>
    </div>
  `);
}

/**
 * Add video configuration event handlers.
 */
function addVideoItemConfigurationHandlers(videoItemID) {
  const loadButton = $(`#loadButton${videoItemID}`);
  // Add load button on click.
  loadButton.on("click", function () {
    const button = $(this);
    const containerId = button.attr("data-player-container-id");
    const videoId = $(`#videoId${videoItemID}`).val();
    // Add player to players map. When the player is ready we'll add the controls, see onPlayerReady().
    playersMap[videoItemID] = new YT.Player(containerId, {
      videoId,
      playerVars: {
        playsInline: 1,
        controls: 0,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  });
}

/**
 * Called when an individual player is ready.
 */
function onPlayerReady(event) {
  const player = event.target;
  const videoItemID = getVideoItemIDByPlayerID(player.id);
  // Add controls.
  const controlsContainer = $(`#controls${videoItemID}`);
  // Clear controls. (this is necessary if there was an error)
  controlsContainer.empty();
  buildVideoItemControls(controlsContainer, videoItemID);
  addVideoItemControlsHandlers(videoItemID);
}

/**
 * Called when the player's state changes.
 */
function onPlayerStateChange(event) {
  const player = event.target;
  const videoItemID = getVideoItemIDByPlayerID(player.id);
  const playerState = player.getPlayerState();
  const playButton = $(`#playButton${videoItemID}`);
  if (playerState === YT.PlayerState.ENDED) {
    playButton.removeAttr("disabled");
  }
}

/**
 * Called when there's an error with the player.
 */
function onPlayerError(event) {
  const player = event.target;
  const videoItemID = getVideoItemIDByPlayerID(player.id);
  console.error(
    "An error occured. The video will be removed. Please re-add a valid video id."
  );
  delete playersMap[videoItemID];
  player.destroy();
}

/**
 * Helper, given a playerID retrieve the associated videoItemID from the playersMap.
 */
function getVideoItemIDByPlayerID(playerID) {
  for (const [key, value] of Object.entries(playersMap)) {
    if (value.id === playerID) {
      return key;
    }
  }
  return null;
}

/**
 * Build video item controls.
 */
function buildVideoItemControls(container, videoItemID) {
  const label = $(`#buttonLabel${videoItemID}`).val()
    ? ` ${$(`#buttonLabel${videoItemID}`).val()}`
    : "";
  container.append(`
    <div class="form-control">
      <div class="form-control mb-1">
        <button id="playButton${videoItemID}" class="btn btn-success">Play${label}</button>
        <button id="pauseButton${videoItemID}" class="btn btn-danger">Pause${label}</button>
        <button id="muteButton${videoItemID}" class="btn btn-warning">Mute${label}</button>
      </div>
      <div class="form-control mb-1">
        <label>Start from second:</label>
        <input id="start${videoItemID}" class="form-control" maxlength="10" size="10">
      </div>
      <div class="form-control mb-1">
        <label>Volume:</label>
        <input id="volumeSlider${videoItemID}" class="form-control" type="range" min="0" max="100" value="100"></input>
      </div>
      <button id="showHidePlayerButton${videoItemID}" type="button" class="btn btn-outline-primary" data-bs-toggle="collapse" data-bs-target="#player${videoItemID}">
        Show video
      </button>
    </div>
  `);
}

/**
 * Add video control event handlers.
 */
function addVideoItemControlsHandlers(videoItemID) {
  const playButton = $(`#playButton${videoItemID}`);
  const pauseButton = $(`#pauseButton${videoItemID}`);
  const muteButton = $(`#muteButton${videoItemID}`);
  const volume = $(`#volumeSlider${videoItemID}`);
  const player = playersMap[videoItemID];
  const playerState = player.getPlayerState();
  // Play button on click.
  playButton.on("click", function () {
    if (playerState !== YT.PlayerState.PLAYING) {
      const start = $(`#start${videoItemID}`).val();
      if (Number.isInteger(parseInt(start))) {
        player.seekTo(start);
      }
      player.playVideo();
      playButton.attr("disabled", "disabled");
      pauseButton.removeAttr("disabled");
    }
  });
  // Pause button on click.
  pauseButton.on("click", function () {
    if (playerState !== YT.PlayerState.PAUSED) {
      player.pauseVideo();
      pauseButton.attr("disabled", "disabled");
      playButton.removeAttr("disabled");
    }
  });
  // Mute button on click.
  muteButton.on("click", function () {
    if (player.isMuted()) {
      player.unMute();
      volume.val(player.getVolume());
      muteButton.text("Mute");
    } else {
      player.mute();
      volume.val(0);
      muteButton.html("<del>Mute</del>");
    }
  });
  // Volume on change.
  volume.on("change", function () {
    player.setVolume(volume.val());
  });
}
