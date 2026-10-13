# Savvy Social Media

Brand kits, content calendar, and the **savvy-social** Claude skill for Savvy Financial (Leah Williams, WMCP®, ChFC®, CLU®).

| Folder | What's inside |
|---|---|
| `savvy-playbook/` | The Savvy Playbook kit (.docx + markdown) and `posts/`, one folder per post with copy and visuals |
| `wealth-code/` | Wealth Code: Women's Edition kit (.docx + markdown) and `posts/`, one folder per post with copy and visuals |
| `brand/` | Savvy Financial 2026 Brand Voice Guide (.docx + markdown) and `photos/` for portraits |
| `calendar/` | Oct 2026 to Apr 2027 content calendar, plus `calendar-review.md` with fixes and deadlines |
| `.claude/skills/savvy-social/` | The skill: brand voice + StoryBrand + viral hooks + SEC/FINRA compliance and disclosures |
| `dist/savvy-social.skill` | The same skill packaged for upload to claude.ai (Settings → Capabilities → Skills) |

## Using the skill
In Claude Code in this repo, just ask: "Write Wednesday's Wealth Code post," "Give me 5 hooks for the Roth conversion window," or "Is this caption compliant?" The skill loads automatically.

Every post comes back as a package: story map, 3 hook options, carousel slides, caption with disclosures, visual direction, facts to verify, compliance notes, the pre-post checklist, **and the finished images** (carousel slides, story frames, reel cover and end card, newsletter banner, LinkedIn cover).

Each post lives in its own folder:

```
savvy-playbook/posts/2026-10-23-medicare-windows/
  post.md         copy + compliance package
  visuals.json    visual spec
  visuals/        PNGs ready to post (after compliance approval)
```

Check copy or re-render images with:

```bash
python3 .claude/skills/savvy-social/scripts/compliance_check.py savvy-playbook/posts/<post>/post.md
node .claude/skills/savvy-social/scripts/render_visuals.mjs savvy-playbook/posts/<post>/visuals.json
```

To tune the viral voice to a specific creator, paste examples into `.claude/skills/savvy-social/references/viral-voice-samples.md`.

**Every post still goes to compliance (Maplewood Investments / Blueprint Financial Advisors) before it goes live.**
