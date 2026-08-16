import {
  animate,
  stagger
} from "https://cdn.jsdelivr.net/npm/animejs/+esm";


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (
  selector,
  scope = document
) =>
  scope.querySelector(selector);


const $$ = (
  selector,
  scope = document
) =>
  [...scope.querySelectorAll(selector)];


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* Footer year */
    const year = $("#year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }


    /* Nepal time */
    updateTime();

    setInterval(
      updateTime,
      1000
    );


    /* Existing functionality */
    initTheme();

    initCommandPalette();

    initPronounce();

    initExpanders();


    /* GitHub */
    initGitHubContributions();


    /* Anime */
    initAnimeMotion();

    /* About typing animation */
    initAboutTyping();

  }
);


/* =========================================================
   ABOUT TYPING ANIMATION
   ========================================================= */

function initAboutTyping() {
  const lines = document.querySelectorAll("#about-typing .about-line");
  if (!lines.length) return;

  let currentLine = 0;

  function typeLine(element, callback) {
    const originalHTML = element.innerHTML;

    // Get the plain text without destroying the original HTML
    const temp = document.createElement("div");
    temp.innerHTML = originalHTML;
    const text = temp.textContent;

    // Store original HTML
    element.dataset.originalHTML = originalHTML;

    // Start empty
    element.textContent = "";
    element.classList.add("typing");

    let index = 0;

    function typeCharacter() {
      if (index < text.length) {
        element.textContent += text[index];
        index++;

        let delay = 14;

        if (text[index - 1] === ".") {
          delay = 120;
        } else if (text[index - 1] === ",") {
          delay = 60;
        } else if (text[index - 1] === " ") {
          delay = 8;
        }

        setTimeout(typeCharacter, delay);
      } else {
        /*
         * IMPORTANT:
         * Restore the formatted HTML permanently.
         */
        element.innerHTML = element.dataset.originalHTML;
        element.classList.remove("typing");
        element.classList.add("done");

        if (callback) {
          setTimeout(callback, 180);
        }
      }
    }

    typeCharacter();
  }

  function nextLine() {
    if (currentLine >= lines.length) return;

    const line = lines[currentLine];
    typeLine(line, () => {
      currentLine++;
      nextLine();
    });
  }

  setTimeout(nextLine, 500);
}


/* =========================================================
   NEPAL TIME
   ========================================================= */

function updateTime() {

  const element =
    $("#local-time");

  if (!element) {
    return;
  }


  element.textContent =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Kathmandu",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false
      }
    ).format(
      new Date()
    );

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
      await fetch(
        apiURL,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `GitHub contribution API returned ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      !Array.isArray(
        data.contributions
      )
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


    if (errorElement) {
      errorElement.hidden = false;
    }


    container.innerHTML = "";

  }

}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderGitHubCalendar(
  container,
  contributions
) {

  container.innerHTML = "";


  /*
   * Tooltip
   */

  let tooltip =
    document.querySelector(
      ".github-tooltip"
    );


  if (!tooltip) {

    tooltip =
      document.createElement(
        "div"
      );

    tooltip.className =
      "github-tooltip";

    document.body.appendChild(
      tooltip
    );

  }


  /*
   * Date -> contribution count
   */

  const contributionMap =
    new Map(
      contributions.map(
        item => [
          item.date,
          Number(
            item.count || 0
          )
        ]
      )
    );


  /*
   * Dates
   */

  const dates =
    contributions
      .map(
        item =>
          new Date(item.date)
      )
      .sort(
        (a, b) =>
          a - b
      );


  if (!dates.length) {
    return;
  }


  /*
   * First date
   */

  const firstDate =
    new Date(
      dates[0]
    );


  /*
   * Move to Sunday
   */

  firstDate.setDate(
    firstDate.getDate() -
    firstDate.getDay()
  );


  /*
   * Last date
   */

  const lastDate =
    new Date(
      dates[
        dates.length - 1
      ]
    );


  /*
   * Move to Saturday
   */

  lastDate.setDate(
    lastDate.getDate() +
    (
      6 -
      lastDate.getDay()
    )
  );


  /*
   * Build weeks
   */

  const weeks = [];

  let current =
    new Date(
      firstDate
    );


  while (
    current <= lastDate
  ) {

    const week = [];


    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(
          current
        );


      const iso =
        formatDate(
          date
        );


      week.push({
        date: iso,

        count:
          contributionMap.get(
            iso
          ) || 0
      });


      current.setDate(
        current.getDate() + 1
      );

    }


    weeks.push(
      week
    );

  }


  /*
   * Main wrapper
   */

  const calendar =
    document.createElement(
      "div"
    );

  calendar.className =
    "github-calendar-inner";


  /*
   * Month labels
   */

  const months =
    document.createElement(
      "div"
    );

  months.className =
    "github-months";


  const monthPositions =
    getMonthPositions(
      weeks
    );


  monthPositions.forEach(
    ({ name, column }) => {

      const label =
        document.createElement(
          "span"
        );

      label.className =
        "github-month";

      label.textContent =
        name;

      label.style.left =
        `${column * 15}px`;


      months.appendChild(
        label
      );

    }
  );


  calendar.appendChild(
    months
  );


  /*
   * Weekdays
   */

  const weekdays =
    document.createElement(
      "div"
    );

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
  ].forEach(
    day => {

      const span =
        document.createElement(
          "span"
        );

      span.textContent =
        day;

      weekdays.appendChild(
        span
      );

    }
  );


  calendar.appendChild(
    weekdays
  );


  /*
   * Grid
   */

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "github-grid";


  weeks.forEach(
    week => {

      week.forEach(
        day => {

          const square =
            document.createElement(
              "div"
            );


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
           * Tooltip
           */

          square.addEventListener(
            "mouseenter",
            event => {

              const count =
                Number(
                  event.currentTarget
                    .dataset
                    .count
                );


              const date =
                event.currentTarget
                  .dataset
                  .date;


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

        }
      );

    }
  );


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

function getContributionLevel(
  count
) {

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

function getMonthPositions(
  weeks
) {

  const positions = [];

  let lastMonth =
    null;


  weeks.forEach(
    (week, index) => {

      const firstDay =
        new Date(
          `${week[0].date}T00:00:00`
        );


      const month =
        firstDay.getMonth();


      if (
        month !== lastMonth
      ) {

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
   DATE
   ========================================================= */

function formatDate(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


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
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric"
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

  const padding =
    12;


  let x =
    event.clientX + 12;


  let y =
    event.clientY - 48;


  const rect =
    tooltip.getBoundingClientRect();


  if (
    x + rect.width >
    window.innerWidth -
    padding
  ) {

    x =
      event.clientX -
      rect.width -
      12;

  }


  if (
    y < padding
  ) {

    y =
      event.clientY +
      18;

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
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.count || 0
        ),
      0
    );


  if (totalElement) {

    totalElement.textContent =
      `${total.toLocaleString()} contributions in the last year`;

  }


  if (
    rangeElement &&
    contributions.length
  ) {

    const first =
      contributions[0]
        .date;


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


  if (
    saved === "light"
  ) {

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
        !(
          "speechSynthesis"
          in window
        )
      ) {

        return;

      }


      speechSynthesis.cancel();


      const utterance =
        new SpeechSynthesisUtterance(
          "Diwash Acharya"
        );


      utterance.rate =
        0.85;


      speechSynthesis.speak(
        utterance
      );

    }
  );

}


/* =========================================================
   EXPANDERS
   ========================================================= */

function initExpanders() {

  $$(".expandable").forEach(
    item => {

      const button =
        $(".expand", item);


      const main =
        $(".list-main", item);


      if (!button) {
        return;
      }


      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          toggleExpander(
            item,
            button
          );

        }
      );


      if (main) {

        main.addEventListener(
          "click",
          () => {

            toggleExpander(
              item,
              button
            );

          }
        );

      }

    }
  );

}


/* =========================================================
   TOGGLE EXPANDER
   ========================================================= */

function toggleExpander(
  item,
  button
) {

  item.classList.toggle(
    "open"
  );


  const svg =
    button.querySelector(
      "svg"
    );


  if (!svg) {
    return;
  }


  if (
    item.classList.contains(
      "open"
    )
  ) {

    svg.innerHTML =
      `<path d="m6 15 6-6 6 6" />`;

  } else {

    svg.innerHTML =
      `<path d="m6 9 6 6 6-6" />`;

  }

}


/* =========================================================
   COMMANDS
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
  ],

  [
    "GitHub Contributions",
    "Contribution activity",
    "contributions"
  ]

];


/* =========================================================
   COMMAND PALETTE
   ========================================================= */

function initCommandPalette() {

  const overlay =
    $("#command-overlay");

  const input =
    $("#command-input");

  const results =
    $("#command-results");


  if (
    !overlay ||
    !input ||
    !results
  ) {

    return;

  }


  const open =
    () => {

      overlay.classList.add(
        "open"
      );


      overlay.setAttribute(
        "aria-hidden",
        "false"
      );


      input.value =
        "";


      render(
        ""
      );


      setTimeout(
        () =>
          input.focus(),
        0
      );

    };


  const close =
    () => {

      overlay.classList.remove(
        "open"
      );


      overlay.setAttribute(
        "aria-hidden",
        "true"
      );

    };


  const searchTrigger =
    $(".search-trigger");


  if (searchTrigger) {

    searchTrigger.addEventListener(
      "click",
      open
    );

  }


  /*
   * Ctrl/Command + K
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        (
          event.metaKey ||
          event.ctrlKey
        ) &&
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
   * Outside click
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
   * Search input
   */

  input.addEventListener(
    "input",
    () => {

      render(
        input.value
      );

    }
  );


  /*
   * Render
   */

  function render(
    query
  ) {

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
              (
                command,
                index
              ) => `

                <div
                  class="command-result
                  ${index === 0
                    ? "selected"
                    : ""}"
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
      .forEach(
        result => {

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
                  behavior:
                    "smooth",

                  block:
                    "start"
                });

              }

            }
          );

        }
      );

  }


  /*
   * Enter
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
   ANIME.JS
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
     NAME
     ------------------------------------------------------- */

  const name =
    $(".anime-name");


  if (name) {

    animate(
      name,
      {
        y: [
          16,
          0
        ],

        scale: [
          0.97,
          1
        ],

        duration:
          900,

        ease:
          "out(4)"
      }
    );


    /*
     * Glow loop
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

        duration:
          2400,

        ease:
          "inOutSine",

        loop:
          true

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
        y: [
          15,
          0
        ],

        duration:
          700,

        ease:
          "out(4)"
      }
    );

  }


  /* -------------------------------------------------------
     TECHNOLOGIES
     ------------------------------------------------------- */

  const technologies =
    $$(".tech");


  if (
    technologies.length
  ) {

    animate(
      technologies,
      {
        y: [
          15,
          0
        ],

        scale: [
          0.96,
          1
        ],

        delay:
          stagger(40),

        duration:
          500,

        ease:
          "out(4)"
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


  if (
    cards.length
  ) {

    animate(
      cards,
      {
        y: [
          15,
          0
        ],

        delay:
          stagger(35),

        duration:
          550,

        ease:
          "out(4)"
      }
    );

  }

}