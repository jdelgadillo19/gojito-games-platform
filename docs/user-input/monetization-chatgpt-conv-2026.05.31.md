-----
User
-----

reference the gojito suite of projects

What benchmark should I meet before offering purchases/subscripions/implementing monetization? What would be a fair price?

-----
ChatGPT
-----

For Gojito, I would **not wait until the platform feels “complete”** before monetizing. But I would separate monetization into three stages:

1. **Interest validation** — email waitlist, “coming soon” paid tier, teacher/parent feedback.
2. **Pre-monetization beta** — free accounts, persistent saves, limited game access, feedback collection.
3. **Actual payments** — only after the product is stable enough that a parent/teacher does not feel like they bought a prototype.

The uploaded Cakery Bakery design samples are part of the current visual baseline for the suite, though the PDF text/images were not extractable through the file reader. 

## The benchmark I’d use before charging

You should be willing to charge when Gojito has a **clear, repeatable value loop**:

> A child can sign up, play a polished free math game, save progress, understand what is locked, and have a parent/teacher reasonably believe the paid version will create more useful math practice.

For your current suite, that means the benchmark should be:

### Minimum before accepting real payments

You should have:

**1. A polished free demo loop**
Cakery Bakery should feel like a real product, not a dev build. One complete free flow is enough: account or guest start → play → score/result → retry → clear locked-content CTA.

**2. At least two games visible in the platform**
Cakery Bakery can be the flagship, but Calculator Cove should at least exist as a playable preview or “beta module.” A subscription to one tiny game feels thin. A subscription to a growing math-game arcade feels plausible.

**3. Accounts and saves working reliably**
Since Gojito already has Supabase Auth, profiles, `game_saves`, and access tiers in progress, this is a must before Stripe. If a kid loses progress after payment, trust collapses.

**4. Clear free vs paid boundaries**
Locked buttons are fine, but they need to say exactly what paid users get. For example: “Full Cakery Bakery Story Mode,” “All difficulties,” “More locales,” “Calculator Cove full game,” “Progress tracking,” “Printable practice sheets,” etc.

**5. A parent-facing explanation**
Not a whole homeschool platform. Just a simple page that says:
“Gojito helps kids practice arithmetic through actual gameplay. No worksheets disguised as games. The math is the mechanic.”

**6. A refund/support path**
Even if it is just “email me within 7 days.” For a solo project, this matters more than fancy infrastructure.

**7. No major bugs in the first 10 minutes**
Your first paid benchmark should be brutal and practical: give the site to 5–10 people and watch whether they can complete the first session without you explaining anything.

## My recommended “go/no-go” monetization test

Before taking payments, I’d want this:

| Benchmark                                 |                        Target |
| ----------------------------------------- | ----------------------------: |
| New user can make account                 |                  95%+ success |
| First game session completed without help |                          80%+ |
| Save/progress works across refresh/login  |                          95%+ |
| Parent understands paid value             |       80%+ after landing page |
| Child willingly replays                   | At least 2 sessions in a week |
| No game-breaking bugs                     |         0 in first 10 minutes |
| Paid CTA gets clicks                      |    5–10% of active free users |

That last one is important. You can add a **fake-door monetization CTA** before Stripe: “Unlock full version — coming soon.” Track clicks. If nobody clicks, do not build complex monetization yet.

## What should be paid?

For Gojito specifically, I would avoid charging for “math access.” Free competitors exist, including Khan Academy Kids, which offers thousands of free activities, games, books, and lessons. ([Khan Academy][1])

Instead, charge for:

**More game content**
Full Cakery Bakery Story Mode, extra locales, Calculator Cove full version, future Fraction Frogger, Exponent Match, Drink Mixing, etc.

**Progress and customization**
Cloud saves, player profile, cosmetics, unlocks, parent-visible progress summaries.

**Convenience for adults**
Printable worksheets, practice reports, classroom packs, assignment codes, downloadable activities.

**Ongoing arcade access**
The pitch is not “pay to learn math.” It is “pay for a growing library of math games kids actually want to replay.”

## Fair pricing

Current market context: Prodigy lists a Core annual membership at **$58.95/year** and says Math and English content remain free while membership adds enhancements. ([Prodigy Game][2]) IXL family pricing is much higher, around **$15.95/month** for Math + Language Arts and **$19.95/month** for core subjects. ([IXL Learning][3]) SplashLearn-style subscriptions often sit around **$7.99–$11.99/month** depending on plan, with some listings lower for annual math-only plans. ([edtechimpact.com][4])

Gojito is earlier-stage and narrower, so it should be cheaper than major platforms.

## My suggested pricing ladder

### Best starting model: one-time founder pass

For your current stage, I’d start with:

**Founder Pass: $9–$15 one-time**

Includes:

* Full current Cakery Bakery
* Calculator Cove beta/full when ready
* All current unlockable content
* Early supporter badge/cosmetic
* Access to new games during beta

This is the least intimidating option. It lets you validate that people will pay without creating subscription pressure.

### Then add a subscription later

Once you have **3+ solid games** or one very deep game plus worksheets/progress reports:

**Gojito Plus: $4.99/month or $39/year**

That is probably the fairest early subscription price.

I would not go above **$6.99/month** until the suite has multiple polished modules, parent dashboards, and regular new content. At the moment, $9.99/month would invite comparison with much larger platforms.

### Teacher/classroom pricing

Later, once classroom features exist:

**Teacher Lite: $29–$49/year**

* One teacher account
* Maybe 20–30 student profiles
* Basic class progress
* Printable worksheets

**Small classroom/school pilot: $99–$199/year**
Only after you have roster/class management. Do not build this first unless a teacher specifically agrees to pilot it.

## What I would do first

I’d launch monetization in this order:

**Phase 1 — Now / near now**
Add a “Support Gojito / Founder Pass coming soon” CTA. Track clicks. Maybe collect emails.

**Phase 2 — After saves + access tiers are reliable**
Offer a **$9.99 Founder Pass**. Keep expectations honest: “early access,” “growing library,” “supports development.”

**Phase 3 — After Cakery Bakery + Calculator Cove feel polished**
Raise Founder Pass to **$14.99–$19.99**, or introduce **$4.99/month / $39/year**.

**Phase 4 — After 3–5 games or meaningful parent tools**
Make subscription the main product.

## My honest recommendation

For Gojito right now, the benchmark is not “is this a complete education platform?” It is:

> Can a parent pay $10 and feel like they got a charming, safe, replayable math game that their kid might actually use?

Once the answer is yes, charge a small Founder Pass.

I’d avoid launching a full subscription until Gojito feels like a **suite**, not just a promising prototype. For the first real monetization test, I’d choose:

**$9.99 Founder Pass**
then later
**$4.99/month or $39/year Gojito Plus**.

[1]: https://www.khanacademy.org/kids?utm_source=chatgpt.com "Free Learning App for Kids Ages 2-8"
[2]: https://www.prodigygame.com/Memberships/math/?utm_source=chatgpt.com "Buy Math Memberships"
[3]: https://www.ixl.com/membership/family/pricing?utm_source=chatgpt.com "IXL for families"
[4]: https://edtechimpact.com/products/splashlearn/?utm_source=chatgpt.com "SplashLearn | Reviews 2026: Features, Price, Alternatives"
