# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Anyone who opens the EntryPoint web address: primarily STI College Davao students who need to register, sign in and use the library from their phone or laptop, plus library staff (librarians, head librarian) who sign in at their own door. The landing page is public and has no single narrow audience; a visitor must understand within seconds what EntryPoint is and where to go next. (Confirmed by the user: "for anyone that will open the system page".)

## Product Purpose
EntryPoint is a web-based library management system for STI College Davao, a BSIT capstone project (proponents: Adlaw, Duray, Pojadas; adviser Dominic R. Bantigue). It replaces the library's physical logbooks, manual borrowing cards and handwritten fine records with one digital platform: real-time book availability, attendance, circulation, reporting. Success for the landing page: a visitor knows what the system is and reaches Sign in or Create account.

## Positioning
A library system built for one school's own desk and students: students sign in with their school email, get approved by a librarian at the desk, and use a Library ID that is scanned for attendance and borrowing. A generic library product could not claim this STI College Davao-specific flow.

## Operating Context
- Student flow: register online with school email and student ID, get approved at the desk by a librarian (bring school ID), then scan in and borrow with the Library ID.
- Staff flow: separate librarian sign-in for attendance, circulation and approving new registrations.
- One account per browser: signed-in users are redirected away from the sign-in pages.
- `/` currently never renders: it redirects signed-in students to their home, signed-in librarians to the dashboard, everyone else to `/login`. The user chose to keep that redirect for signed-in people; only visitors with no session see a landing page.

## Capabilities and Constraints
- Stack (existing): Nuxt (Vue) + Tailwind CSS client in `client/`, Laravel API in `server/`.
- Official modules (capstone proposal): administrative dashboard, user and account management, book cataloging and inventory, circulation, attendance monitoring, resource monitoring (facilities), reporting and analytics, book suggestions and request tracking, engagement (points, streaks, badges, point shop), student self-service portal.
- Explicit limits of the proposal, so the page must not promise them: no barcode/RFID/biometric hardware integration, online only, no procurement, no automated payment collection (fines are recorded, paid offline), no external library integrations. Scoped to STI College Davao only.
- Student data is handled under RA 10173 (Philippine Data Privacy Act of 2012).
- Existing routes: `/login` (students), `/register`, `/librarian/login`.

## Brand Commitments
- Name: EntryPoint. Logo files: `app/assets/css/logo/EntryPointLogoStacked.png` (compass emblem with wordmark) and `EntryPointLogo.png` (wordmark with star in the "o"), both single-colour maroon on transparent; also `public/Logo.svg`.
- Institution named on the existing pages: "STI College Davao Library".
- The user will send visual references for the landing page later; none are confirmed yet.

## Evidence on Hand
- No real photos of the STI Davao library exist yet. The user wants real photos eventually and is unsure whether stock images are acceptable; undecided. Do not fabricate photos, statistics, testimonials, user counts or usage numbers.
- A running app is available for real screenshots of the student and librarian screens (not yet captured or approved for use).

## Contact and Facts for the Page (confirmed by the user, 2026-10-11)
- Library hours: Monday to Friday, 8:00 AM – 12:00 PM and 1:00 PM – 5:00 PM; Saturday and Sunday closed (from the library's own page).
- Location: 4th floor, STI College Davao, #506 Lim Building, J.P. Laurel Avenue, corner Acacia, Davao City, Philippines 8000.
- Contact email: femiajoy.arce@davao.sti.edu
- Team (proponents): Matt Oliver U. Pojadas, Stephen A. Duray, John Lloyd G. Adlaw, Ralph Vincent A. Agang. Adviser: Dominic R. Bantigue.
- Chosen reference ideas (from `Reference Photos/1–4.jpg`, user approved): tonal single-hue palette with a deep footer and serif headline (1); floating app-screenshot arc, two-tone headline, pill buttons, tile grid for modules (2); circle/arc behind the subject, script wordmark with sans text, alternating light and colour bands, colour closing band (3); floating glass pill nav with Login and Get started (4). Photo-led hero (4) only if a real library photo is obtained.

## Product Principles
- Say what the system is and where to go next before anything else; a visitor should never have to find the sign-in.
- Describe only what is built and within the proposal's scope; no invented numbers, quotes or capabilities.
- Both doors stay visible and distinct: students (sign in / create account) and library staff.
- Real content over placeholders: photos and screenshots are used only when real or explicitly approved.
