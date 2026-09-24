import EventKit
import EventKitUI
import UIKit
import WebKit

final class EvolvCalendarBridge: NSObject, WKScriptMessageHandler, EKEventEditViewDelegate {
    private let eventStore = EKEventStore()
    private weak var presenter: UIViewController?

    init(presenter: UIViewController) {
        self.presenter = presenter
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "evolvCalendar",
              let body = message.body as? [String: Any] else { return }

        let title = (body["title"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty,
              let startString = body["startDate"] as? String,
              let endString = body["endDate"] as? String,
              let start = ISO8601DateFormatter().date(from: startString),
              let end = ISO8601DateFormatter().date(from: endString),
              end > start else { return }

        let event = EKEvent(eventStore: eventStore)
        event.title = title
        event.startDate = start
        event.endDate = end
        event.notes = body["notes"] as? String
        event.location = body["location"] as? String
        event.calendar = eventStore.defaultCalendarForNewEvents

        let editor = EKEventEditViewController()
        editor.eventStore = eventStore
        editor.event = event
        editor.editViewDelegate = self

        presenter?.present(editor, animated: true)
    }

    func eventEditViewController(
        _ controller: EKEventEditViewController,
        didCompleteWith action: EKEventEditViewAction
    ) {
        controller.dismiss(animated: true)
    }
}
