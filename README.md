<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Mingzhu666/pte-study-hub">
    <img src="docs/screenshots/logo.svg" alt="PTE Study Hub logo" width="80" height="80">
  </a>

<h3 align="center">PTE Study Hub</h3>

  <p align="center">
    A bilingual, AI-assisted study companion for the PTE Academic exam — 20 task types, high-ROI strategy guidance, and AI-graded Read Aloud &amp; Write Essay scoring.
    <br />
    <br />
    <a href="https://github.com/Mingzhu666/pte-study-hub/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/Mingzhu666/pte-study-hub/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![PTE Study Hub Screenshot][product-screenshot]](docs/screenshots/skill-field.png)

Most PTE prep tools treat every task type equally. **PTE Study Hub** scores each of the 20 official task types by band-score impact, surfaces a target-aware **Skill Field** map (PTE 65 vs. 79), and grades the two most opaque modules — **Read Aloud** and **Write Essay** — with an LLM-backed scorer. Full bilingual content (English / Simplified Chinese).

**Highlights**
- Skill Field map weighting all 20 task types by ROI + skill coverage
- 8 focused practice mini-games for the highest-yield modules
- AI-graded RA &amp; Essay scoring with schema-validated JSON output
- Summit Mastery progress system, target-aware (PTE 65 / 79), persisted to `localStorage`
- Pure domain logic isolated in `lib/` and covered by unit tests

### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind CSS][TailwindCSS]][TailwindCSS-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ARCHITECTURE -->
## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                    Learner (Browser)                     │
│      Skill Field · Module Detail · Practice Games        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│            Next.js 16 App Router + React 19              │
│    app/page.tsx · components/* · context/* providers     │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Pure Logic    │  │  Authored Data  │  │   API Routes    │
│   lib/          │  │  data/          │  │   app/api/      │
│                 │  │                 │  │                 │
│   scoring       │  │  20 PTE tasks   │  │   ra-mirror     │
│   mastery       │  │  EN / ZH        │  │   we-essay      │
│   tokenization  │  │  ROI weights    │  │   schema-valid  │
└────────┬────────┘  └─────────────────┘  └────────┬────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────┐                       ┌─────────────────┐
│  localStorage   │                       │  MiniMax M2.7   │
│  shape-valid    │                       │   (external)    │
└─────────────────┘                       └─────────────────┘
```

The UI reads from pure, framework-free logic in `lib/` and static authored content in `data/`. Side effects are confined to two boundaries: AI scoring goes through edge API routes that **validate the LLM response against a JSON schema before returning**, and persisted progress in `localStorage` is **shape-checked on load** — an invalid blob falls back to a clean initial state instead of crashing the shell.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

- Node.js ≥ 20.x
- A [MiniMax API key](https://www.minimaxi.com/) (only required to exercise the AI scoring endpoints)

### Installation

1. Clone and install
   ```sh
   git clone https://github.com/Mingzhu666/pte-study-hub.git
   cd pte-study-app
   npm install
   ```
2. Add `MINIMAX_API_KEY=...` to `.env.local`
3. Run the dev server
   ```sh
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE -->
## Usage

The app opens on the **Skill Field** view — a single-screen map of all 20 task types sorted by score impact. Pick a target band (PTE 65 / 79), open a module to see its bilingual overview, strategy, and common mistakes, then run a practice mini-game or submit a Read Aloud recording / Essay draft to the AI scorer.

AI scoring routes (`POST /api/ra-mirror`, `POST /api/we-essay`) return strictly-validated JSON; see [lib/raAiMirror.ts](lib/raAiMirror.ts) and [lib/weAiEssay.ts](lib/weAiEssay.ts) for the response shape.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[product-screenshot]: docs/screenshots/skill-field.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
