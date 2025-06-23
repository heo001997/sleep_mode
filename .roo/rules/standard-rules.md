---
description: 
globs: 
alwaysApply: true
---
# I. My Golden Rules

1. **Confirm** YOU NEED TO SAY THAT you've read *Tu's rules* — work carefully, thoroughly, bias-free; Tu is proud of you.
   
2. **Understand first**
  1. This is a mobile app for Android and iOS.
  2. Read all related material.
  3. Map the **whole flow** before coding.

3. **For every request**
  1. Clarify user intent/request deeply.
  2. Remember to read `.memory_bank.md` so we can see all lessons learned.
  3. Understand the current codebase deeply.
  4. Offer ≥ 2 unbiased solutions (pros / cons).
  5. Recommend the best fit, explain why, then implement.

4. **Log everything** (plans, fixes, lessons) in file **`.memory_bank.md`**.

5. **Test for code consistency**
   1. Build this flutter app again, if it's not good so we comeback to the step 3. **For every request**

---

# II. Workflow

1. **Scratch Pad**
  1. Work in **single-step** mode.
  2. Write the exact next step.
  3. Track progress with `[ ] / [X]`.
  4. Repeat until finished.

2. **Memory Bank**
  1. Store versions, snippets, mistakes, lessons.
  2. For a new task:
    1. Clean the Scratch Pad.
    2. Outline the tasks.
    3. Execute & update progress.

---

1. **Flutter Application**
   1. Flutter SDK ≥ 3.22.0 with null safety and Material 3 support
   2. Dart SDK ≥ 3.3.0
   3. Target platforms: Android, iOS
   4. Architecture: Domain-driven design with feature-first organization

2. **App Structure**
   1. `/features` - Screen-based functionality (home, overlay)
   2. `/core` - Central business logic (services, models, theme)
   3. `/shared` - Reusable UI components
   4. `/config` - App-wide constants

3. **Key Dependencies**
   1. `shared_preferences` - Local storage for user settings
   2. `sensors_plus` - Access to device motion sensors
   3. `wakelock_plus` - Keep screen on during sleep mode

4. **Design System**
   1. Primary color: Soft indigo (#5D5FEF)
   2. Background: Pastel blue (#E6E6FF)
   3. Dark mode background: #121212
   4. Corner radius: 16px for interactive elements
   5. Typography: System fonts (SF Pro/Roboto)

---

# IV. Tools

# Terminal lighter
1. To helps reduce stuck, ALWAYS run `powerlevel10k_plugin_unload; unset PROMPT RPROMPT RPS1 RPS2; PS1='%n@%m:%~%# '` in the first terminal before any running any command.

---

> **Stay laser-focused and make Tu proud.**
