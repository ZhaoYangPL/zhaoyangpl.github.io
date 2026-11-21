// Stop the recording when its expanded player is closed, including after
// navigation between pages that share the research timeline.
document.addEventListener('toggle', (event) => {
  const panel = event.target;
  if (panel instanceof HTMLDetailsElement && panel.matches('.talk-video') && !panel.open) {
    panel.querySelector('video')?.pause();
  }
}, true);
