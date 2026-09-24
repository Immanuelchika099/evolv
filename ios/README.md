# Evolv iPhone Calendar bridge

Evolv is currently a Vite/React web app. A normal browser cannot directly write to the iPhone's native Calendar database, so the web app now has a native bridge contract ready for an iOS wrapper.

## What is already integrated in the web app

1. Evolv AI can prepare a calendar event from a natural-language request.
2. The AI does not save anything automatically.
3. Evolv shows a confirmation card with the event title and time.
4. The user must tap Add to Calendar.
5. The web app sends the confirmed event to the native iOS message handler named evolvCalendar when running inside the iOS wrapper.
6. Outside the native wrapper, Evolv falls back to an .ics calendar file.

## Native iOS side

EvolvCalendarBridge.swift uses Apple's EventKitUI EKEventEditViewController. On iOS 17+, this lets the person review, edit, and save the event in Apple's calendar UI without the app requesting calendar database access.

### Xcode wiring

Create/open the native iOS wrapper that hosts the Evolv site in a WKWebView, then:

1. Add ios/EvolvCalendarBridge.swift to the iOS target.
2. Keep one strong reference to EvolvCalendarBridge.
3. Add the bridge as the WKWebView script-message handler named evolvCalendar.
4. The WKWebView should load https://evolv-track.vercel.app.
5. Build and run on an iPhone.
6. When the user confirms an event in Evolv, Apple's Calendar event editor appears. The user makes the final Save decision there.

Example:

    let calendarBridge = EvolvCalendarBridge(presenter: self)
    webView.configuration.userContentController.add(
        calendarBridge,
        name: "evolvCalendar"
    )
    self.calendarBridge = calendarBridge

The bridge must be retained for as long as the WKWebView lives.

## Important

Do not add a calendar permission request just to present EKEventEditViewController on iOS 17+. Apple documents EventKitUI as the preferred path when the app only needs the user to create/edit an event through the system UI.
