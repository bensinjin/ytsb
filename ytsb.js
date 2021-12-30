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
    <div class="video-item">
      <div class="configuration">
        <input id="videoId${videoItemID}" maxlength="15" size="15" placeholder="YoutTube video id">
        <input id="buttonLabel${videoItemID}" maxlength="20" size="20" placeholder="Button label">
        <button id="loadButton${videoItemID}" data-controls-container-id="controls${videoItemID}" data-player-container-id="player${videoItemID}">
          Load
        </button>
      </div>
      <div class="controls" id="controls${videoItemID}"></div>
      <div class="player" id="player${videoItemID}" style="display: none;"></div>
    </div>
  `);
}

/**
 *
 */
function addVideoItemConfigurationHandlers(videoItemID) {
  $(`#loadButton${videoItemID}`).on("click", function () {
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
      },
    });
  });
}

/**
 * Called when an individual player is ready.
 */
function onPlayerReady(event) {
  const player = event.target;
  // Add controls.
  const videoItemID = getVideoItemIDByPlayerID(player.id);
  const controlsContainer = $(`#controls${videoItemID}`);
  buildVideoItemControls(controlsContainer, videoItemID);
  addVideoItemControlsHandlers(videoItemID);
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
    <button id="playButton${videoItemID}">Play${label}</button>
    <button id="pauseButton${videoItemID}">Pause${label}</button>
    <button id="muteButton${videoItemID}">Mute${label}</button>
    <label>Start from:</label>
    <input id="start${videoItemID}" maxlength="10" size="10">
    <label>Volume:</label>
    <input id="volumeSlider${videoItemID}" type="range" min="0" max="100" value="100"></input>
    <button id="showHidePlayerButton${videoItemID}">Show video</button>
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
  const showHidePlayerButton = $(`#showHidePlayerButton${videoItemID}`);
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
  // Show/hide video on click.
  showHidePlayerButton.on("click", function () {
    const playerContainer = $(`#player${videoItemID}`);
    if (playerContainer.is(":hidden")) {
      playerContainer.show();
      showHidePlayerButton.text("Hide video");
    } else {
      playerContainer.hide();
      showHidePlayerButton.text("Show video");
    }
  });
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
