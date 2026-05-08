# PTE Command Map Design

## Goal

Replace the current All Modules empty state with an interactive PTE Command Map. Categories, category pages, and module detail pages stay unchanged.

The page should make users feel that the app understands their target, shows the real exam priorities, and gives them a reason to come back. The experience should feel like a precise study control system, not a generic checklist or landing page.

## Source Strategy

The design uses the user's 7炸 and 8炸 research as product logic.

For Australia migration contexts after 2025-08-07:

- 7炸 / Proficient: Listening 58, Reading 59, Writing 69, Speaking 76.
- 8炸 / Superior: Listening 69, Reading 70, Writing 85, Speaking 88.

The page must avoid implying that current 7炸/8炸 only means four equal legacy scores. It can show target-score chips in the order `L / R / W / S`.

Shared preparation consensus:

- Highest-value modules: WFD, RS, DI, RL/SGD, WE, SWT, SST, FIB-RW, FIB-R.
- Support modules: RA, RO, HIW, FIB-L.
- Lower-yield modules: single choice, multiple choice, ASQ, SMW and similar low-return items.
- The main preparation principle is stability under exam pressure: fewer low-level mistakes, fluent output, template familiarity, and calm execution.

7炸 emphasis:

- The page should frame 7炸 as "stable passing".
- The route should prioritize RS, WFD, WE, SST, FIB, RA, DI/RL.
- Coach copy should be practical and reassuring: protect the big modules, avoid blank answers, keep templates smooth, and reduce spelling/grammar loss.

8炸 emphasis:

- The page should frame 8炸 as "high-pressure speaking and writing".
- The route should prioritize RS, WFD, WE, SWT/SST, FIB-RW/FIB-R, DI/RL/SGD.
- Coach copy should stress Speaking 88 and Writing 85 as the real bottlenecks, with WFD/RS and writing accuracy as the core chain.

## Experience Principles

- Interactive first: the user should hover, click, complete, and see the map respond.
- Guided, not forced: the map recommends the next move without hiding other modules.
- Growth without clutter: use visual completion and coach feedback more than numbers.
- Premium and calm: no childish badges, noisy gamification, or giant marketing hero.
- Categories remain the knowledge library; All Modules becomes the command layer.

## Page Structure

### Sidebar

Keep the existing sidebar behavior.

- `All Modules` opens the new Command Map.
- `Categories` and nested module links behave exactly as they do now.
- Existing category views and module detail views remain unchanged.

### Top Command Bar

The top of the All Modules page contains:

- A segmented target switch: `7炸` and `8炸`.
- Target-score chips:
  - 7炸: `L58`, `R59`, `W69`, `S76`.
  - 8炸: `L69`, `R70`, `W85`, `S88`.
- A coach sentence that updates by target and progress.

Example 7炸 coach copy:

> Start with RS and WFD. Keep the big modules stable, then use WE/SST/FIB to protect the score line.

Example 8炸 coach copy:

> Speaking 88 and Writing 85 are the pressure points. Hold RS + WFD first, then tighten WE/SST/FIB accuracy.

### Command Map

The central area is a tactical map of PTE modules.

Node behavior:

- Each module is a node.
- Node color follows the existing category color language.
- Node size reflects target-specific priority.
- Node glow reflects current focus or progress.
- Hover highlights related route lines and shows a short reason.
- Click selects the node and opens the Action Panel.

Route behavior:

- The selected target controls the primary route.
- Primary route nodes are larger, brighter, and connected by stronger lines.
- Support nodes sit near the route but remain quieter.
- Lower-yield nodes sit around the perimeter.
- Switching target should animate highlight, priority, and coach copy. It does not need to physically reorganize every node.

7炸 primary route:

`RS -> WFD -> WE -> SST -> FIB -> RA -> DI/RL`

8炸 primary route:

`RS -> WFD -> WE -> SWT/SST -> FIB-RW/FIB-R -> DI/RL/SGD`

### Action Panel

Selecting a node opens a right-side panel inside the All Modules page.

Panel content:

- Module name and category.
- Target-specific role: why this module matters for 7炸 or 8炸.
- Suggested daily volume.
- Common failure points.
- Skill contribution chips, such as `Speaking`, `Writing`, `Listening`, `Reading`.
- Primary action: `Mark practiced today`.
- Secondary action: open the existing module detail view.

The panel should feel operational and compact, not like another long article.

## Progress Model

Use `localStorage` for the first version. No account binding or backend is needed.

Store:

- Selected target: `seven` or `eight`.
- Per-module practice count.
- Per-module last practiced date.
- Per-module practiced-today state.
- Optional streak metadata.

Derived states:

- `New`: no practice yet.
- `Practicing`: practiced at least once.
- `Stable`: practiced on 3 distinct days or 5 total times.
- `Mastered`: practiced on 7 distinct days or 10 total times.

Decay should be subtle. If a stable/mastered node has not been practiced for several days, show it as needing maintenance rather than punishing the user.

## Feedback Design

The user chose visual feedback plus coach feedback, with only light numerical support.

After `Mark practiced today`:

- The node receives a completed-today check state.
- The connected route line advances or brightens.
- The coach sentence changes to the next recommended module.
- The Action Panel confirms completion without a disruptive modal.
- The map can show a soft pulse along the route.

Light numerical feedback:

- Today's focus completion: for example `2 / 5`.
- Core Chain Stability as a small progress indicator.
- No leaderboards, badge walls, or heavy score simulation.

## Coach Logic

Coach recommendations should follow target-specific route order.

For 7炸:

1. RS
2. WFD
3. WE
4. SST
5. FIB
6. RA
7. DI/RL

For 8炸:

1. RS
2. WFD
3. WE
4. SWT/SST
5. FIB-RW/FIB-R
6. DI/RL/SGD

If the user completes a focus node, recommend the next uncompleted focus node. If all focus nodes are complete for today, recommend maintaining one support node or reviewing mistakes.

Coach tone:

- Direct, specific, and concise.
- Avoid generic motivation.
- Mention exam pressure and common mistakes when useful.
- Keep copy bilingual-ready through the existing translation pattern.

## Data Shape

Add a new command-map data module rather than changing the existing PTE module content.

Recommended data concepts:

- `targetProfiles`: score chips, coach intro, focus route, support route.
- `commandNodes`: module id, map coordinates, priority per target, daily volume per target, short rationale per target, failure points.
- `commandEdges`: route connections by target.

This keeps the current category/module detail data stable.

## Interaction Details

Hover state:

- Slight node lift.
- Related route lines brighten.
- A compact tooltip shows the target-specific reason.

Selected state:

- Node remains highlighted.
- Action Panel updates.
- If the user selects a grouped node such as `DI/RL/SGD`, the panel can present the group as one route step with links to individual modules where available.

Target switch:

- Persist selected target.
- Update score chips, coach copy, route emphasis, node priority, and daily volume.
- Do not reset progress.

Completion:

- One completion per module per day counts toward today's progress.
- Re-clicking a completed module should not inflate today's completion count.
- Practice count may either increment once per day or once per click. Prefer once per day for cleaner behavior.

## Visual Direction

Use the current clean Apple-like base, but make the All Modules page more tactical.

Recommended style:

- Light surface, restrained contrast, crisp borders.
- Category colors reused as accents.
- Fine route lines, not heavy neon lines.
- Small animated energy flow after completion.
- Icon buttons where appropriate.
- Compact chips and tooltips.
- No giant marketing hero, no decorative blobs, no nested card stacks.

The map should feel like a professional control interface: lively enough to invite play, calm enough to trust.

## Accessibility And Responsiveness

- The map must still work with keyboard focus.
- Hover information must be available through selection/focus as well.
- On mobile, the map can become a scrollable vertical route with nodes and the Action Panel below.
- Text must not overlap nodes, route lines, or buttons.
- Motion should be subtle and avoid disorienting layout jumps.

## Testing Expectations

When implemented, verify:

- `All Modules` loads the Command Map.
- Category pages still render unchanged.
- Module detail pages still render unchanged.
- Switching 7炸/8炸 updates route, scores, coach copy, and priority styling.
- Practice completion persists after refresh.
- Today's completion does not double-count.
- Mobile layout remains readable.
- Build and lint pass.

## Out Of Scope For First Version

- Backend persistence.
- User account binding.
- Real AI scoring.
- Full study calendar.
- Actual exercise player.
- Leaderboards, badges, or social sharing.
- Rewriting category pages.

