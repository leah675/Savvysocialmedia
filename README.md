# Savvy Social Media

Brand kits, content calendar, and the **savvy-social** Claude skill for Savvy Financial (Leah Williams, WMCP®, ChFC®, CLU®).

| Folder | What's inside |
|---|---|
| `savvy-playbook/` | The Savvy Playbook Social Media Brain Kit (original .docx + searchable markdown) |
| `wealth-code/` | Wealth Code: Women's Edition Social Media Kit (original .docx + markdown) |
| `brand/` | Savvy Financial 2026 Brand Voice Guide (original .docx + markdown) |
| `calendar/` | Oct 2026 to Apr 2027 content calendar, plus `calendar-review.md` with fixes and deadlines |
| `drafts/` | Compliance-ready post packages written with the skill |
| `.claude/skills/savvy-social/` | The skill: brand voice + StoryBrand + viral hooks + SEC/FINRA compliance and disclosures |
| `dist/savvy-social.skill` | The same skill packaged for upload to claude.ai (Settings → Capabilities → Skills) |

## Using the skill
In Claude Code in this repo, just ask: "Write Wednesday's Wealth Code post," "Give me 5 hooks for the Roth conversion window," or "Is this caption compliant?" The skill loads automatically.

Every post comes back as a package: story map, 3 hook options, carousel slides, caption with disclosures, visual direction, facts to verify, compliance notes, and the pre-post checklist. Check any draft with:

```bash
python3 .claude/skills/savvy-social/scripts/compliance_check.py drafts/your-post.md
```

To tune the viral voice to a specific creator, paste examples into `.claude/skills/savvy-social/references/viral-voice-samples.md`.

**Every post still goes to compliance (Maplewood Investments / Blueprint Financial Advisors) before it goes live.**
