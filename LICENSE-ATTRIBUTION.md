# Attribution Requirements for Atria

This document outlines the attribution requirements for Atria under the GNU Affero General Public License version 3.0 (AGPL-3.0).

## Required Attribution

In accordance with Section 7(b) of the AGPL-3.0 license, all deployments and modifications of Atria MUST retain the following attribution in the Event Navigation sidebar:

### Attribution Text and Location

The attribution must appear in the event navigation sidebar (`/app/events/*/` routes) with the following specifications:

**Text:** `atria is made with ❤️ by sbtl`

**Location:** Bottom of the event navigation sidebar, approximately 40px from the bottom edge

**Links:**
- "atria" must link to: https://atria.gg
- "sbtl" must link to: https://sbtl.dev

**Styling:**
- Links must be clearly visible (purple color: #8b5cf6)
- Heart icon must be displayed (purple color: #8b5cf6)
- Text color: #94a3b8
- Font size: 0.75rem

### Implementation Reference

The attribution is implemented in:
- Component: `/frontend/src/pages/Navigation/EventNav/index.jsx`
- Styles: `/frontend/src/pages/Navigation/EventNav/EventNav.module.css`

## Modifications

If you modify Atria, you may add additional attribution (e.g., "Modified by [Your Name]") but you MUST NOT:
- Remove the original attribution
- Modify the links
- Make the attribution less visible
- Move it to a less prominent location

## Commercial License

Organizations wishing to remove this attribution requirement may purchase a commercial license. Please contact steven@sbtl.dev for more information.

## Enforcement

Failure to comply with these attribution requirements constitutes a violation of the AGPL-3.0 license and may result in legal action.

---

*This attribution requirement is added under Section 7(b) of the AGPL-3.0 license, which permits additional terms that require preservation of specified reasonable legal notices.*