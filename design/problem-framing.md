# Problem framing

## Domain

Casual group plans with friends: eating out, sports, shopping, etc. Usually these plans are made in a group chat or in person in advance. For example, in a group chat one might say: "KBBQ at 6pm today?" and the three others would reply "sure" "down" etc.  

Showing up to one of these plans involves a chain of small actions that each person does separately: saying yes, remembering, deciding when to leave, getting there, arriving, and then waiting for everyone else. While everyone is in the process of showing up to the plan. the plans current state is unusually unclear (e.g. who is still coming, who has left, whether it is still happening), especially with larger groups.

The stakeholders are the participants: the organizer who made the plan, the on-time people, the late people, and, indirectly, the venues, which for example might hold tables for a headcount and a time. The relationship between each participant is also a stakeholder, since being late and flaking all the time can strain a relationship. 


## Stakeholders

- **Organizer.** The person who proposes the plan and shares it. Wants a real headcount and does not want to chase people individually on the day.
- **On-time attendee.** Shows up when agreed. Pays the cost of everyone else's lateness by standing around, and eventually starts coming late too.
- **Late or undecided attendee.** Says "maybe," or says "omw" before actually leaving. Usually not malicious, just wants a low-effort way to report honestly without a confrontation.
- **Venue.** The restaurant or bowling alley holding a table for a headcount and a time. Gives the table away when the group is incomplete, or seats an incomplete group.
- **The group.** The friendships themselves. Repeated flaking and waiting builds quiet resentment that nobody brings up because each instance feels too small.

## Bad situations

A group of six agree on KBBQ at 6pm. Three people arrive on time, two people arrive ten minutes late, and one person arrives thirty minutes late despite typing "omw" thirty minutes ago and not living very far. At first, the table is held for 15 minutes but due to busyness it is then given away, so the group that arrived on time has to stand outside for half an hour, waiting for the last person to come. Everyone is quite annoyed, but there is not a clear resolution to the issue as the issue seems too small to bring up seriously. 

In another scenario, everyone in the group predicts that everyone else is going to be late, so people start arriving late on purpose to avoid waiting. Thus, the plan starts thirty minutes after the agreed time. The one innocent person who shows up on time is punished, and eventually stops being on time too. 

Eight people agree for bowling next Sunday at 5pm. At 5pm on Saturday one person drops, leading two other people who see that and privately wonder whether the plan is still happening or not. Sunday morning, someone asks "so are we still going?" in the chat and someone replies "I think so?" another replies "I can't make it today sorry." The plan eventually dies because no one is sure if anyone else is going. 


## Corroboration

- A survey of 2,000 UK adults for Privilege Insurance found that only one in five people follow through with every plan they make, and roughly a third of pre-planned meet-ups never happen ([HuffPost UK, 2020](https://www.huffingtonpost.co.uk/entry/our-flaking-habit-has-gotten-out-of-hand-just-say-yes-or-no-to-social-plans_uk_5e4fa22cc5b629695f58aa2c)).
- Data from the IPA found 34% of adults have lied about why they were flaking, rising to 45% of 18 to 34 year olds; 86% say they feel guilty about flaking; and 67% agree technology has made last-minute cancelling easier ([IPA, "Flake news"](https://ipa.co.uk/news/flaking-data)).
- A Michigan State University study of 1,192 people (Chopik et al., 2023) found that how much a cancellation hurts depends on timing, honesty, and the quality of the reason: cancelling at the last minute and lying about it do the most damage ([reported via Yahoo Lifestyle, 2025](https://www.yahoo.com/lifestyle/articles/many-times-too-many-times-100000809.html)).
- Timeleft, which seats strangers at dinners, introduced a no-show penalty fee because no-shows leave tables incomplete and hurt everyone else's experience; a guest is marked a no-show when two tablemates report it, and the status affects future matching ([Timeleft help center](https://help.timeleft.com/hc/en-150/articles/25012703925148-What-Is-the-No-Show-Penalty-Fee)). This is a commercial company concluding that visibility and consequences are needed even among motivated adults.


## Workarounds and comparables

**Workarounds.** Currently, everything happens in the group chat. Meaning people text "omw," "5 min," or "is this still on?" There is no way to tell if any of it is true, and it gets buried under new messages fast. Moreover, people will come purposely late if they think others are always late. Whoever made the plan usually ends up texting each person separately on the day to make sure they are still coming. Some groups just accept that things start half an hour late. In every case, the person who organized the plan and the people who showed up on time suffer. 

**Comparables.**
- *Find My, Life360, and Google Maps ETA sharing* show live location
- *Partiful* handles invitations and RSVPs for hosted events
- *Twist* (2012) shared ETAs with friends and shut down.
- *Puctee* runs meetups with a trust score, opt-in penalties, and location sharing only from 15 minutes before the event. 
- *lateR* sends late fees to friends who arrive late. 
- *Timeleft* uses a paid subscription and a no-show fee 

The issue: everything existing either shares raw location or goes straight to punishment and fines. They do not deal the uncertainty that causes the late cascade, and also require too much setup that leads to many people not wanting to use them. 


## Solution sketch

A simple web app that allows you to track a plan and the participant status, organizer enters location and time and shares a link in the group chat. 

**Before the plan** Each person logs in via their phone number and can choose between going, maybe, or not. "Maybe" has to turn into a real decision by a certain time (for ex. 2pm for a 6pm dinner), and will be reminded via text in advance. Everyone can see the real headcount at any time, so the status of the trip is viewable by all. 

**On the day** When you leave, you tap "leaving." The app records the time and estimates when you will arrive based on how far you are from the place. 

Everyone in the plan will see something like this:

```
KBBQ - 6:00 pm                      4 going | 1 not

GOING
Dylan     here            5:58
Sam       here            6:01
Priya     8 min away      left 5:52
Jordan    hasn't left yet

NOT GOING
Alex
```

