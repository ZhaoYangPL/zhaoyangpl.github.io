---
layout: page
icon: fas fa-microphone
order: 2
title: Talks
description: Research talks, recordings, and lessons learned along the way.
---

<div class="research-page">
  {% if site.data.talks.size > 0 %}
    <p>Research talks, recordings, and lessons learned along the way.</p>
    {% include research-timeline.html entries=site.data.talks label="Research talks in chronological order" %}
  {% else %}
    <div class="content-placeholder">
      <p>No talks posted yet. I&rsquo;ll share recordings, slides, and related notes here as I give research talks.</p>
    </div>
  {% endif %}
</div>
