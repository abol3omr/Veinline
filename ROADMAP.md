# Veinline Roadmap

Stone slab kitchen visualizer and vein-aligned cutting planner.
Three modes on one engine: **Showroom** (shop screen), **Preview** (customer's phone), **Fabrication** (workshop).

Tick a box by changing `[ ]` to `[x]`.

---

## Phase 0 — Setup
- [x] Tools installed: Node, Python, Git, Docker
- [x] Repo on GitHub
- [x] Frontend: Vite + React + TypeScript + Three.js
- [x] Backend: FastAPI with `/health`
- [x] Database: PostgreSQL in Docker
- [ ] Deploy to a live URL

## Phase 1 — Slab library
- [x] Slabs table: name, type, width, height, thickness
- [x] `GET /slabs` and `POST /slabs`
- [x] Slab list on the page
- [x] Upload a photo per slab (`POST /slabs/{id}/image`)
- [ ] Edit and delete slabs
- [ ] Add slabs from the page, not only from `/docs`
- [ ] Filter by type: quartz, natural, porcelain
- [ ] Straighten yard photos: mark 4 corners, perspective correction, scale to mm
- [ ] Bookmatch pairs: link slab A and B, generate the mirror automatically
- [ ] Better photos: full-slab, high resolution for Macabus Aqua and Statuario Maximus

## Phase 2 — Kitchen editor
- [ ] Sizes from a form instead of the code: length, depth, counter height, wall height
- [ ] Kitchen shapes: straight, L, U
- [ ] Island
- [ ] Sink and hob cutouts
- [ ] Window and other wall openings
- [ ] Edge profiles: straight, mitered (40 / 60 mm look), rounded
- [ ] Visible edge thickness separate from slab thickness
- [ ] Save and load kitchens in the database

## Phase 3 — Realistic look
- [x] Slab photo on countertop and back wall at real scale
- [ ] Use each slab's real thickness in 3D
- [ ] Lighting that shows the stone's true color
- [ ] Finish: polished vs matte (reflections, roughness)
- [ ] Day and night modes
- [ ] Warm vs cold lamps, under-cabinet lights
- [ ] Cabinet, wall and floor colors the customer can pick
- [ ] Room around the kitchen (floor, walls, upper cabinets)

## Phase 4 — Showroom
- [ ] Full-screen kiosk view for the shop PC and TV
- [ ] Phone or tablet as remote control (WebSocket)
- [ ] QR code: customer takes their kitchen home as a link

## Phase 5 — Real pieces
- [ ] Split long runs into pieces that fit the slab
- [ ] Seams placed where they would really be
- [ ] Drag pieces on a 2D slab view, with overlap checks
- [ ] 3D updates live when a piece moves on the slab

## Phase 6 — Auto layout
- [ ] Greedy placement of pieces on slabs, minimizing waste
- [ ] Several slabs per kitchen
- [ ] Respect fixed / already-cut pieces

## Phase 7 — Vein alignment (ML)
- [ ] Score how well two edges continue each other's veins
- [ ] Vein continuity across seams and corners (countertop → wall)
- [ ] Bookmatch-aware placement for A/B pairs
- [ ] Detect slab outline and defects to avoid
- [ ] Layout search driven by the vein score

## Phase 8 — Fabrication output and finish
- [ ] Cut sheet with coordinates
- [ ] DXF export for the saw
- [ ] Login for the shop
- [ ] README with screenshots, demo video
