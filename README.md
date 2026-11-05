# Race Percentage Calculator

Work out your race and heritage percentages from your family tree. Enter each parent's mix (and, if you know them, your grandparents' and great-grandparents'), and the calculator shows your breakdown as a chart you can share.

Live at **[race-calculator.dankoresoft.com](https://race-calculator.dankoresoft.com/)**. It got about 1,200 visits from Google search in August to October 2026, and there is an Android app (Trusted Web Activity) built from the same site.

## Who it's for

Anyone curious about their mixed heritage: people with parents or grandparents from different backgrounds, people filling in a family history, and people who want to compare what their family knows with a DNA test result.

## Features

- Three generations: parents, grandparents and great-grandparents, each weighted correctly
- Several races or heritages per person, with checks that each person adds up to 100%
- Chart of the result (Chart.js), confetti, and a downloadable image (html2canvas)
- **Story cards:** a styled card of your result with colour palettes and embeddable markup
- **DNA kit import** (`/dna-import/`): paste or drop the ancestry breakdown exported from 23andMe, AncestryDNA, MyHeritage or a generic CSV/JSON file, preview it, apply it to a parent, and compare it with the calculator's result. The file is read in your browser and is never uploaded.
- Share to Facebook and X
- Blog pages on genealogy research, DNA tests and heritage resources
- Light and dark themes, PWA with a Workbox service worker

## Built with

- Vanilla JavaScript ES modules, bundled with webpack 5 and Babel
- Tailwind CSS 3 with PostCSS and Autoprefixer
- Chart.js and html2canvas, lazy-loaded only when needed
- nginx in Docker, deployed to CapRover by GitHub Actions through [`dankore/github-to-caprover`](https://github.com/dankore/github-to-caprover)
- Google AdSense and Google Analytics, loaded on first interaction (Lighthouse 100)

## Run it locally

You need Node.js 24 or newer and Yarn 1.

```bash
git clone https://github.com/dankore/race-percentage-calculator.git
cd race-percentage-calculator
yarn install
yarn build          # Tailwind + webpack production build into dist/
yarn dev            # dev server with live reload
```

Run `yarn tailwind` in a second terminal while editing classes in the HTML.

### With Docker

```bash
docker build -t race-percentage-calculator .
docker run --rm -p 8080:80 race-percentage-calculator
# open http://localhost:8080
```

## Project layout

| Path | What it is |
| --- | --- |
| `src/html/` | Calculator page, DNA import page and blog posts |
| `src/js/modules/raceCalculator.js` | Generations, weights and the result |
| `src/js/modules/dnaKitImport.js` | DNA kit parsing, preview and comparison |
| `src/js/modules/storyCards.js` | Shareable story cards |
| `src/assets/` | Tailwind source, images and icons |
| `webpack.config.js` | Pages, sitemap and service worker |
| `twa-manifest.json` | Bubblewrap config for the Android app |
| `.github/workflows/deploy.yaml` | Builds the Docker image and deploys to CapRover |

## Deployment

Every push to `main` builds a Docker image, pushes it to GitHub Container Registry, and deploys it to CapRover. The workflow reads its CapRover settings from GitHub Actions secrets; no secrets live in this repository.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

[MIT](./LICENSE) © Dankore Software LLC
