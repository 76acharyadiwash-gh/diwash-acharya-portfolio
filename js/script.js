import {
  animate,
  stagger
} from "https://cdn.jsdelivr.net/npm/animejs/+esm";


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (s, scope = document) =>
  scope.querySelector(s);

const $$ = (s, scope = document) =>
  [...scope.querySelectorAll(s)];


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // Footer year
  const year = $("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  // Nepal time
  updateTime();

  setInterval(updateTime, 1000);


  // Existing portfolio functionality
  initTheme();
  initCommandPalette();
  initPronounce();
  initExpanders();


  // New custom GitHub contribution calendar
  initGitHubContributions();


  // Anime.js animations
  initAnimeMotion();

});


/* =========================================================
   NEPAL TIME
   ========================================================= */

function updateTime() {

  const el = $("#local-time");

  if (!el) return;

  el.textContent =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());

}


/* =========================================================
   GITHUB CONTRIBUTIONS
   ========================================================= */

async function initGitHubContributions() {

  const container =
    $("#github-contribution-calendar");

  const totalElement =
    $("#github-total");

  const rangeElement =
    $("#github-date-range");

  const errorElement =
    $("#github-error");


  if (!container) {
    return;
  }


  const username =
    "76acharyadiwash-gh";


  /*
   * Public contribution API.
   *
   * No GitHub token.
   * No backend.
   */

  const apiURL =
    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`;


  try {

    const response =
      await fetch(apiURL, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {
      throw new Error(
        `GitHub contribution API returned ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      !data ||
      !Array.isArray(data.contributions)
    ) {
      throw new Error(
        "Invalid contribution data received."
      );
    }


    renderGitHubCalendar(
      container,
      data.contributions
    );


    updateGitHubSummary(
      data.contributions,
      totalElement,
      rangeElement
    );


  } catch (error) {

    console.error(
      "GitHub contributions could not be loaded:",
      error
    );


    /*
     * Show fallback message.
     */

    if (errorElement) {
      errorElement.hidden = false;
    }


    container.innerHTML = "";

  }

}


/* =========================================================
   RENDER GITHUB CALENDAR
   ========================================================= */

function renderGitHubCalendar(
  container,
  contributions
) {

  container.innerHTML = "";


  /*
   * Create tooltip.
   */

  let tooltip =
    document.querySelector(
      ".github-tooltip"
    );


  if (!tooltip) {

    tooltip =
      document.createElement("div");

    tooltip.className =
      "github-tooltip";

    document.body.appendChild(
      tooltip
    );

  }


  /*
   * Convert contributions into
   * date -> count.
   */

  const contributionMap =
    new Map(
      contributions.map(item => [
        item.date,
        Number(item.count || 0)
      ])
    );


  /*
   * Get dates.
   */

  const dates =
    contributions
      .map(item => new Date(item.date))
      .sort((a, b) => a - b);


  if (!dates.length) {
    return;
  }


  /*
   * First date.
   */

  const firstDate =
    new Date(dates[0]);


  /*
   * Move first date to Sunday.
   */

  firstDate.setDate(
    firstDate.getDate() -
    firstDate.getDay()
  );


  /*
   * Last date.
   */

  const lastDate =
    new Date(dates[dates.length - 1]);


  /*
   * Move last date to Saturday.
   */

  lastDate.setDate(
    lastDate.getDate() +
    (6 - lastDate.getDay())
  );


  /*
   * Generate weeks.
   */

  const weeks = [];

  let current =
    new Date(firstDate);


  while (current <= lastDate) {

    const week = [];


    for (let i = 0; i < 7; i++) {

      const date =
        new Date(current);


      const iso =
        formatDate(date);


      week.push({
        date: iso,
        count:
          contributionMap.get(iso) || 0
      });


      current.setDate(
        current.getDate() + 1
      );

    }


    weeks.push(week);

  }


  /*
   * Main calendar container.
   */

  const calendar =
    document.createElement("div");

  calendar.className =
    "github-calendar-inner";


  /* -------------------------------------------------------
     MONTH LABELS
     ------------------------------------------------------- */

  const months =
    document.createElement("div");

  months.className =
    "github-months";


  const monthPositions =
    getMonthPositions(weeks);


  monthPositions.forEach(
    ({ name, column }) => {

      const label =
        document.createElement("span");

      label.className =
        "github-month";

      label.textContent =
        name;

      label.style.left =
        `${column * 15}px`;


      months.appendChild(label);

    }
  );


  calendar.appendChild(
    months
  );


  /* -------------------------------------------------------
     WEEKDAY LABELS
     ------------------------------------------------------- */

  const weekdays =
    document.createElement("div");

  weekdays.className =
    "github-weekdays";


  [
    "",
    "Mon",
    "",
    "Wed",
    "",
    "Fri",
    ""
  ].forEach(day => {

    const span =
      document.createElement("span");

    span.textContent =
      day;

    weekdays.appendChild(span);

  });


  calendar.appendChild(
    weekdays
  );


  /* -------------------------------------------------------
     CONTRIBUTION GRID
     ------------------------------------------------------- */

  const grid =
    document.createElement("div");

  grid.className =
    "github-grid";


  weeks.forEach(week => {

    week.forEach(day => {

      const square =
        document.createElement("div");


      const level =
        getContributionLevel(
          day.count
        );


      square.className =
        `github-day level-${level}`;


      square.dataset.date =
        day.date;


      square.dataset.count =
        day.count;


      /*
       * Tooltip on hover.
       */

      square.addEventListener(
        "mouseenter",
        event => {

          const count =
            Number(
              event.currentTarget.dataset.count
            );


          const date =
            event.currentTarget.dataset.date;


          tooltip.innerHTML = `
            <strong>
              ${count}
              contribution${count === 1 ? "" : "s"}
            </strong>

            <br>

            <span class="tooltip-date">
              ${formatReadableDate(date)}
            </span>
          `;


          tooltip.classList.add(
            "visible"
          );


          positionTooltip(
            tooltip,
            event
          );

        }
      );


      square.addEventListener(
        "mousemove",
        event => {

          positionTooltip(
            tooltip,
            event
          );

        }
      );


      square.addEventListener(
        "mouseleave",
        () => {

          tooltip.classList.remove(
            "visible"
          );

        }
      );


      grid.appendChild(
        square
      );

    });

  });


  calendar.appendChild(
    grid
  );


  container.appendChild(
    calendar
  );

}


/* =========================================================
   CONTRIBUTION LEVEL
   ========================================================= */

function getContributionLevel(count) {

  if (count <= 0) {
    return 0;
  }

  if (count <= 2) {
    return 1;
  }

  if (count <= 5) {
    return 2;
  }

  if (count <= 9) {
    return 3;
  }

  return 4;

}


/* =========================================================
   MONTH POSITIONS
   ========================================================= */

function getMonthPositions(weeks) {

  const positions = [];

  let lastMonth = null;


  weeks.forEach(
    (week, index) => {

      const firstDay =
        new Date(
          `${week[0].date}T00:00:00`
        );


      const month =
        firstDay.getMonth();


      if (month !== lastMonth) {

        positions.push({

          name:
            firstDay.toLocaleString(
              "en-US",
              {
                month: "short"
              }
            ),

          column:
            index

        });


        lastMonth =
          month;

      }

    }
  );


  return positions;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


/* =========================================================
   READABLE DATE
   ========================================================= */

function formatReadableDate(
  dateString
) {

  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* =========================================================
   TOOLTIP POSITION
   ========================================================= */

function positionTooltip(
  tooltip,
  event
) {

  const padding = 12;


  let x =
    event.clientX + 12;


  let y =
    event.clientY - 48;


  const rect =
    tooltip.getBoundingClientRect();


  /*
   * Prevent tooltip from going
   * outside right edge.
   */

  if (
    x + rect.width >
    window.innerWidth - padding
  ) {

    x =
      event.clientX -
      rect.width -
      12;

  }


  /*
   * Prevent tooltip from going
   * above viewport.
   */

  if (y < padding) {

    y =
      event.clientY + 18;

  }


  tooltip.style.left =
    `${x}px`;


  tooltip.style.top =
    `${y}px`;

}


/* =========================================================
   GITHUB SUMMARY
   ========================================================= */

function updateGitHubSummary(
  contributions,
  totalElement,
  rangeElement
) {

  const total =
    contributions.reduce(
      (sum, item) =>
        sum +
        Number(item.count || 0),
      0
    );


  /*
   * Total contributions.
   */

  if (totalElement) {

    totalElement.textContent =
      `${total.toLocaleString()} contributions in the last year`;

  }


  /*
   * Date range.
   */

  if (
    rangeElement &&
    contributions.length
  ) {

    const first =
      contributions[0].date;


    const last =
      contributions[
        contributions.length - 1
      ].date;


    rangeElement.textContent =
      `${formatReadableDate(first)} – ${formatReadableDate(last)}`;

  }

}


/* =========================================================
   THEME
   ========================================================= */

function initTheme() {

  const button =
    $(".theme-toggle");


  if (!button) {
    return;
  }


  const saved =
    localStorage.getItem(
      "diwash-theme"
    );


  if (saved === "light") {

    document.body.classList.add(
      "light"
    );

  }


  button.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light"
      );


      localStorage.setItem(
        "diwash-theme",

        document.body.classList.contains(
          "light"
        )
          ? "light"
          : "dark"
      );

    }
  );

}


/* =========================================================
   PRONOUNCE
   ========================================================= */

function initPronounce() {

  const button =
    $(".pronounce");


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      if (
        !("speechSynthesis" in window)
      ) {
        return;
      }


      speechSynthesis.cancel();


      const u =
        new SpeechSynthesisUtterance(
          "Diwash Acharya"
        );


      u.rate =
        0.85;


      speechSynthesis.speak(u);

    }
  );

}


/* =========================================================
   EXPANDABLE ITEMS
   ========================================================= */

function initExpanders() {

  $$(".expandable").forEach(
    item => {

      const button =
        $(".expand", item);


      if (!button) {
        return;
      }


      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          item.classList.toggle(
            "open"
          );


          button.textContent =
            item.classList.contains(
              "open"
            )
              ? "⌃"
              : "⌄";

        }
      );


      const main =
        $(".list-main", item);


      if (main) {

        main.addEventListener(
          "click",
          () => {

            item.classList.toggle(
              "open"
            );


            button.textContent =
              item.classList.contains(
                "open"
              )
                ? "⌃"
                : "⌄";

          }
        );

      }

    }
  );

}


/* =========================================================
   COMMAND PALETTE
   ========================================================= */

const commands = [

  [
    "About",
    "Read the profile",
    "about"
  ],

  [
    "Stack",
    "Technologies & tools",
    "stack"
  ],

  [
    "Projects",
    "Selected work",
    "projects"
  ],

  [
    "Achievements",
    "Highlights",
    "achievements"
  ],

  [
    "Products",
    "Things I'm building",
    "products"
  ]

];


function initCommandPalette() {

  const overlay =
    $("#command-overlay");


  const input =
    $("#command-input");


  const results =
    $("#command-results");


  /*
   * If the command palette
   * doesn't exist, don't crash
   * the rest of the website.
   */

  if (
    !overlay ||
    !input ||
    !results
  ) {
    return;
  }


  const open = () => {

    overlay.classList.add(
      "open"
    );


    overlay.setAttribute(
      "aria-hidden",
      "false"
    );


    input.value =
      "";


    render("");


    setTimeout(
      () => input.focus(),
      0
    );

  };


  const close = () => {

    overlay.classList.remove(
      "open"
    );


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );

  };


  /*
   * Search button
   */

  const searchTrigger =
    $(".search-trigger");


  if (searchTrigger) {

    searchTrigger.addEventListener(
      "click",
      open
    );

  }


  /*
   * Keyboard shortcuts
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        open();

      }


      if (
        event.key === "Escape"
      ) {

        close();

      }

    }
  );


  /*
   * Click outside
   */

  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        close();

      }

    }
  );


  /*
   * Search
   */

  input.addEventListener(
    "input",
    () => {

      render(
        input.value
      );

    }
  );


  function render(query) {

    const q =
      query
        .trim()
        .toLowerCase();


    const filtered =
      commands.filter(
        command =>
          command
            .join(" ")
            .toLowerCase()
            .includes(q)
      );


    results.innerHTML =
      filtered.length

        ? filtered
            .map(
              (command, index) => `

                <div
                  class="command-result
                  ${index === 0 ? "selected" : ""}"
                  data-target="${command[2]}"
                >

                  <span>

                    <strong>
                      ${command[0]}
                    </strong>

                    <br>

                    <small>
                      ${command[1]}
                    </small>

                  </span>

                  <span>
                    ↵
                  </span>

                </div>

              `
            )
            .join("")

        : `
            <div class="command-result">
              <span>
                No results
              </span>
            </div>
          `;


    $$(".command-result[data-target]", results)
      .forEach(result => {

        result.addEventListener(
          "click",
          () => {

            close();


            const target =
              document.getElementById(
                result.dataset.target
              );


            if (target) {

              target.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            }

          }
        );

      });

  }


  /*
   * Enter = select result
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        !overlay.classList.contains(
          "open"
        )
      ) {
        return;
      }


      if (
        event.key === "Enter"
      ) {

        const selected =
          $(".command-result.selected", results);


        if (selected) {
          selected.click();
        }

      }

    }
  );

}


/* =========================================================
   ANIME.JS ANIMATIONS
   ========================================================= */

function initAnimeMotion() {

  /*
   * Respect reduced motion.
   */

  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }


  /* -------------------------------------------------------
     NAME ENTRANCE
     ------------------------------------------------------- */

  const name =
    $(".anime-name");


  if (name) {

    animate(
      name,
      {
        y: [16, 0],
        scale: [0.97, 1],
        duration: 900,
        ease: "out(4)"
      }
    );


    /*
     * Continuous glow.
     */

    animate(
      name,
      {

        textShadow: [

          "0 0 5px rgba(66,245,123,.18), 0 0 12px rgba(66,245,123,.08)",

          "0 0 13px rgba(66,245,123,.48), 0 0 34px rgba(66,245,123,.20)",

          "0 0 5px rgba(66,245,123,.18), 0 0 12px rgba(66,245,123,.08)"

        ],

        scale: [
          1,
          1.012,
          1
        ],

        duration: 2400,

        ease: "inOutSine",

        loop: true

      }
    );

  }


  /* -------------------------------------------------------
     ABOUT
     ------------------------------------------------------- */

  const about =
    $(".about-copy");


  if (about) {

    animate(
      about,
      {
        y: [15, 0],
        duration: 700,
        ease: "out(4)"
      }
    );

  }


  /* -------------------------------------------------------
     TECHNOLOGY STACK
     ------------------------------------------------------- */

  const technologies =
    $$(".tech");


  if (technologies.length) {

    animate(
      technologies,
      {
        y: [15, 0],
        scale: [0.96, 1],
        delay: stagger(40),
        duration: 500,
        ease: "out(4)"
      }
    );

  }


  /* -------------------------------------------------------
     CARDS
     ------------------------------------------------------- */

  const cards =
    $$(
      ".social-card, .list-item, .simple-item, .mini-card"
    );


  if (cards.length) {

    animate(
      cards,
      {
        y: [15, 0],
        delay: stagger(35),
        duration: 550,
        ease: "out(4)"
      }
    );

  }

}