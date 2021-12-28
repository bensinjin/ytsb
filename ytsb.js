let playersMap = {};
function onYouTubeIframeAPIReady() {
  // Add numberOfVideosValue.
  $("#numberOfVideosValue").text($("#numberOfVideos").val());
  $("#numberOfVideos").on("change", function (e) {
    $("#numberOfVideosValue").text(e.target.value);
  });
  // Add click handler to generate players.
  $("#generatePlayers").on("click", function () {
    const players = $("#players");
    const numberOfVideos = $("#numberOfVideos").val();
    // Clear players.
    players.empty();
    // Create a create player form per video.
    for (let i = 0; i < numberOfVideos; i++) {
      const buildButtonId = `buildButton${i}`;
      const playerContainerId = `player${i}`;
      players.append(`
        <div class="player-wrapper">
          <label>${i + 1}.</label>
          <input name="videoId" data-build-button="${buildButtonId}" maxlength="15" size="15" placeholder="YoutTube video id">
          <input name="buttonLabel" data-build-button="${buildButtonId}" maxlength="20" size="20" placeholder="Button label">
          <input name="start" data-build-button="${buildButtonId}" maxlength="10" size="10" placeholder="Start from sec.">
          <button id=${buildButtonId} data-player-container-id="${playerContainerId}" data-state="build">Build</button>
          <div class="player-container" id="${playerContainerId}"></div>
        </div>
      `);
      // Add click handler for player build buttons.
      $(`#${buildButtonId}`).on("click", function (e) {
        let btn = $(this);
        // Build settings.
        let settings = {
          playerContainerId: btn.attr("data-player-container-id"),
        };
        $(`input[data-build-button="${buildButtonId}"]`).each(function () {
          settings[$(this).attr("name")] = $(this).val();
        });
        // Return early if we don't have a video id.
        if (!settings.videoId) {
          $("#error").text("You must provide a video id!");
          return setTimeout(function () {
            $("#error").empty();
          }, 2000);
        }
        const buttonState = btn.attr("data-state");
        switch (buttonState) {
          case "build":
            // Build player and add it to the map.
            playersMap[i] = new YT.Player(settings.playerContainerId, {
              videoId: settings.videoId,
              playerVars: {
                start: settings.start,
              },
            });
            // Set state.
            btn.attr("data-state", "play");
            // Set label.
            btn.text(
              `Play${settings.buttonLabel ? ` ${settings.buttonLabel}` : ""}`
            );
            break;
          case "play": {
            const player = playersMap[i];
            if (Number.isInteger(parseInt(settings.start))) {
              player.seekTo(settings.start);
            }
            player.playVideo();
            // Set state.
            btn.attr("data-state", "stop");
            // Set label.
            btn.text(
              `Stop${settings.buttonLabel ? ` ${settings.buttonLabel}` : ""}`
            );
            break;
          }
          case "stop": {
            const player = playersMap[i];
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
              // TODO: investigate, currently we need to pause or seekTo is not respected.
              player.pauseVideo();
            }
            // Set state.
            btn.attr("data-state", "play");
            // Set label.
            btn.text(
              `Play${settings.buttonLabel ? ` ${settings.buttonLabel}` : ""}`
            );
            break;
          }
        }
      });
    }
  });
}
