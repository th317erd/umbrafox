/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_UmbrafoxClipboard_h
#define mozilla_UmbrafoxClipboard_h

#include "mozilla/EventForwards.h"
#include "mozilla/RefPtr.h"
#include "nsStringFwd.h"

namespace mozilla {
class PendingClipboardRequest;
namespace dom {
class DataTransfer;
class Element;
class Selection;
}  // namespace dom

// Only native controller dispatch establishes this scope. Script execCommand
// suspends it, including when called reentrantly from a clipboard listener.
class MOZ_RAII AutoClipboardCommand final {
 public:
  explicit AutoClipboardCommand(const nsACString& aCommand);
  ~AutoClipboardCommand();
  static void BeforeClipboardEvent(dom::Element&, dom::Selection&,
                                   dom::DataTransfer*, EventMessage);
  static void AfterEvent(dom::Element&, WidgetEvent&, nsEventStatus&);
  static bool CanContinueCopy();
  static bool IsRetryingPaste();

 private:
  friend class PendingClipboardRequest;
  RefPtr<PendingClipboardRequest> mRequest;
  // Borrowed from the enclosing controller scope, which outlives this scope.
  AutoClipboardCommand* mPrevious = nullptr;
  EventMessage mOperation = eVoidEvent;
  bool mActive = false;
  bool mRetry = false;
};

class MOZ_RAII AutoSuspendClipboardCommand final {
 public:
  AutoSuspendClipboardCommand();
  ~AutoSuspendClipboardCommand();
};
}  // namespace mozilla
#endif
