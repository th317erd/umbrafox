/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "UmbrafoxClipboard.h"

#include "mozilla/BasicEvents.h"
#include "mozilla/ClearOnShutdown.h"
#include "mozilla/ContentEvents.h"
#include "mozilla/PresShell.h"
#include "mozilla/Services.h"
#include "mozilla/StaticPtr.h"
#include "mozilla/TextControlElement.h"
#include "mozilla/TextEditor.h"
#include "mozilla/TextEvents.h"
#include "mozilla/TimeStamp.h"
#include "mozilla/dom/DataTransfer.h"
#include "mozilla/dom/Document.h"
#include "mozilla/dom/Element.h"
#include "mozilla/dom/Range.h"
#include "mozilla/dom/Selection.h"
#include "nsContentUtils.h"
#include "nsCopySupport.h"
#include "nsFocusManager.h"
#include "nsIContentAnalysis.h"
#include "nsIContentInlines.h"
#include "nsINamed.h"
#include "nsIObserver.h"
#include "nsIObserverService.h"
#include "nsITimer.h"
#include "nsIURI.h"
#include "nsIWritablePropertyBag2.h"
#include "nsPIDOMWindow.h"
#include "nsServiceManagerUtils.h"
#include "nsStubMutationObserver.h"
#include "nsThreadUtils.h"

namespace mozilla {
using namespace dom;

static AutoClipboardCommand* sCommand;
static uint32_t sSuspended;
static uint32_t sControllerDepth;
static uint64_t sNextRequest;
static StaticRefPtr<PendingClipboardRequest> sPending;

static Element* ExposedElement(Element& aElement) {
  nsIContent* content = &aElement;
  if (content->IsInNativeAnonymousSubtree()) {
    content = content->FindFirstNonChromeOnlyAccessContent();
  }
  return content && content->IsElement() ? content->AsElement() : nullptr;
}

static bool Eligible(Element& aElement) {
  Document* document = aElement.OwnerDoc();
  return aElement.IsInComposedDoc() && !aElement.IsEditable() &&
         !document->IsInDesignMode() && document->IsCurrentActiveDocument() &&
         document->NodePrincipal()->GetIsContentPrincipal() &&
         (document->GetDocumentURI()->SchemeIs("https") ||
          document->GetDocumentURI()->SchemeIs("http"));
}

class PendingClipboardRequest final : public nsStubMutationObserver,
                                      public nsIObserver,
                                      public nsITimerCallback,
                                      public nsINamed {
 public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSIOBSERVER
  NS_DECL_NSITIMERCALLBACK

  NS_IMETHOD GetName(nsACString& aName) override {
    aName.AssignLiteral("PendingClipboardRequest");
    return NS_OK;
  }

  PendingClipboardRequest(Element& aElement, Selection& aSelection,
                          DataTransfer* aDataTransfer, EventMessage aOperation)
      : mDocument(aElement.OwnerDoc()),
        mTarget(&aElement),
        mFocused(nsFocusManager::GetFocusedElementStatic()),
        mSelection(&aSelection),
        mAnchor(aSelection.GetAnchorNode()),
        mFocus(aSelection.GetFocusNode()),
        mAnchorOffset(aSelection.AnchorOffset()),
        mFocusOffset(aSelection.FocusOffset()),
        mOperation(aOperation),
        mCreated(TimeStamp::Now()) {
    mID.AppendInt(++sNextRequest);
    if (aSelection.RangeCount() == 1) {
      mObserved = aSelection.GetRangeAt(0)->GetClosestCommonInclusiveAncestor();
      if (mObserved) {
        mObserved->AddMutationObserver(this);
      }
    }
    if (auto* control = TextControlElement::FromNode(mTarget)) {
      control->GetTextEditorValue(mValue);
      if (mValue.Length() > 1024 * 1024) {
        mValue.Truncate();
        mChanged = true;
      }
      mEditor = control->GetExtantTextEditor();
    }
    if (aDataTransfer && aOperation == ePaste) {
      mClipboard = aDataTransfer->GetClipboardDataSnapshot();
    }
  }

  bool Current() const {
    return (TimeStamp::Now() - mCreated).ToMilliseconds() < 30000 &&
           mDocument->IsCurrentActiveDocument() && mDocument->GetInnerWindow();
  }

  bool Fresh(bool aCheckClipboard = true) const {
    if (aCheckClipboard &&
        (!mClipboard || !mClipboard->IsCurrentForClipboardOverride())) {
      return false;
    }
    if (!Current() || mChanged || !Eligible(*mTarget) || !mObserved ||
        mTarget->OwnerDoc() != mDocument ||
        nsFocusManager::GetFocusedElementStatic() != mFocused ||
        mSelection->RangeCount() != 1 ||
        mSelection->GetAnchorNode() != mAnchor ||
        mSelection->GetFocusNode() != mFocus ||
        mSelection->AnchorOffset() != mAnchorOffset ||
        mSelection->FocusOffset() != mFocusOffset) {
      return false;
    }
    if (auto* control = TextControlElement::FromNode(mTarget)) {
      nsAutoString value;
      control->GetTextEditorValue(value);
      if (value != mValue || control->GetExtantTextEditor() != mEditor ||
          control->State().HasState(ElementState::DISABLED) ||
          (mOperation == ePaste && mEditor && mEditor->IsReadonly())) {
        return false;
      }
    }
    return true;
  }

  void Offer() {
    if (!mCanceled || !Current()) {
      return;
    }
    if (mOperation == eCopy && !nsIContentAnalysis::MightBeActive()) {
      nsCOMPtr<nsIClipboard> clipboard =
          do_GetService("@mozilla.org/widget/clipboard;1");
      if (clipboard) {
        clipboard->GetDataSnapshotSync(
            {"text/plain"_ns}, nsIClipboard::kGlobalClipboard,
            mDocument->GetWindowContext(), getter_AddRefs(mClipboard));
      }
    }
    if (!Current()) {
      return;
    }
    const double remaining =
        30000 - (TimeStamp::Now() - mCreated).ToMilliseconds();
    if (remaining <= 0 || remaining > 30000) {
      return;
    }
    if (sPending) {
      sPending->Clear();
    }
    static bool registered = false;
    if (!registered) {
      ClearOnShutdown(&sPending);
      registered = true;
    }
    sPending = this;
    nsCOMPtr<nsIObserverService> observers = services::GetObserverService();
    if (!observers ||
        NS_FAILED(
            observers->AddObserver(this, "umbrafox-clipboard-action", false)) ||
        NS_FAILED(NS_NewTimerWithCallback(getter_AddRefs(mTimer), this,
                                          uint32_t(remaining),
                                          nsITimer::TYPE_ONE_SHOT))) {
      Clear();
      return;
    }
    nsAutoString data;
    data.AssignLiteral("{\"operation\":\"");
    data.Append(mOperation == eCopy ? u"copy" : u"paste");
    data.AppendLiteral("\",\"requestId\":\"");
    AppendUTF8toUTF16(mID, data);
    data.AppendLiteral("\"}");
    observers->NotifyObservers(mDocument->GetInnerWindow(),
                               "umbrafox-clipboard-canceled", data.get());
  }

  void Clear() {
    RefPtr self = this;
    if (mTimer) {
      mTimer->Cancel();
      mTimer = nullptr;
    }
    if (nsCOMPtr<nsIObserverService> observers =
            services::GetObserverService()) {
      observers->RemoveObserver(this, "umbrafox-clipboard-action");
    }
    if (sPending == this) {
      sPending = nullptr;
    }
  }

  void CharacterDataWillChange(nsIContent*,
                               const CharacterDataChangeInfo&) override {
    mChanged = true;
  }
  void AttributeWillChange(Element*, int32_t, nsAtom*, AttrModType) override {
    mChanged = true;
  }
  void ContentAppended(nsIContent*, const ContentAppendInfo&) override {
    mChanged = true;
  }
  void ContentInserted(nsIContent*, const ContentInsertInfo&) override {
    mChanged = true;
  }
  void ContentWillBeRemoved(nsIContent*, const ContentRemoveInfo&) override {
    mChanged = true;
  }
  void ParentChainChanged(nsIContent*) override { mChanged = true; }

  RefPtr<Document> mDocument;
  RefPtr<Element> mTarget;
  RefPtr<Element> mFocused;
  RefPtr<Selection> mSelection;
  nsCOMPtr<nsINode> mAnchor;
  nsCOMPtr<nsINode> mFocus;
  nsCOMPtr<nsINode> mObserved;
  RefPtr<TextEditor> mEditor;
  nsCOMPtr<nsIClipboardDataSnapshot> mClipboard;
  nsCOMPtr<nsITimer> mTimer;
  nsCString mID;
  nsString mValue;
  uint32_t mAnchorOffset;
  uint32_t mFocusOffset;
  EventMessage mOperation;
  TimeStamp mCreated;
  bool mChanged = false;
  bool mCanceled = false;
  bool mReplayBlocked = false;

 private:
  ~PendingClipboardRequest() {
    if (mObserved) {
      mObserved->RemoveMutationObserver(this);
    }
  }
};

NS_IMPL_ISUPPORTS(PendingClipboardRequest, nsIMutationObserver, nsIObserver,
                  nsITimerCallback, nsINamed)

NS_IMETHODIMP PendingClipboardRequest::Notify(nsITimer*) {
  Clear();
  return NS_OK;
}

NS_IMETHODIMP PendingClipboardRequest::Observe(nsISupports* aSubject,
                                               const char* aTopic,
                                               const char16_t*) {
  nsCOMPtr<nsIWritablePropertyBag2> bag = do_QueryInterface(aSubject);
  if (!bag || strcmp(aTopic, "umbrafox-clipboard-action")) {
    return NS_OK;
  }
  nsAutoCString id, operation, action, windowID, expectedWindowID;
  if (!mDocument->GetInnerWindow()) {
    return NS_OK;
  }
  expectedWindowID.AppendInt(mDocument->GetInnerWindow()->WindowID());
  if (NS_FAILED(bag->GetPropertyAsACString(u"requestId"_ns, id)) || id != mID ||
      NS_FAILED(bag->GetPropertyAsACString(u"operation"_ns, operation)) ||
      !operation.Equals(mOperation == eCopy ? "copy" : "paste") ||
      NS_FAILED(bag->GetPropertyAsACString(u"action"_ns, action)) ||
      NS_FAILED(bag->GetPropertyAsACString(u"innerWindowId"_ns, windowID)) ||
      windowID != expectedWindowID) {
    return NS_OK;
  }
  if (action.EqualsLiteral("validate")) {
    bag->SetPropertyAsBool(u"accepted"_ns, Current());
    return NS_OK;
  }
  if (!action.EqualsLiteral("retry") && !action.EqualsLiteral("discard")) {
    return NS_OK;
  }
  RefPtr self = this;
  Clear();
  if (action.EqualsLiteral("discard")) {
    bag->SetPropertyAsBool(u"accepted"_ns, true);
    return NS_OK;
  }
  if (sCommand || sSuspended || !Fresh()) {
    return NS_OK;
  }
  AutoClipboardCommand command(mOperation == eCopy ? "cmd_copy"_ns
                                                   : "cmd_paste"_ns);
  command.mRequest = this;
  command.mRetry = true;
  bool succeeded = false;
  RefPtr<PresShell> presShell = mDocument->GetPresShell();
  if (presShell && mOperation == eCopy) {
    succeeded = nsCopySupport::FireClipboardEvent(
        eCopy, Some(nsIClipboard::kGlobalClipboard), presShell, mSelection,
        nullptr);
  } else if (presShell && mEditor && !mEditor->IsReadonly()) {
    RefPtr<DataTransfer> data =
        new DataTransfer(mDocument->GetScopeObject(),
                         nsIClipboard::kGlobalClipboard, mClipboard);
    succeeded = NS_SUCCEEDED(
        mEditor->PasteAsAction(nsIClipboard::kGlobalClipboard,
                               EditorBase::DispatchPasteEvent::Yes, data));
    data->ClearAll();
  }
  bag->SetPropertyAsBool(u"accepted"_ns, succeeded && !mReplayBlocked);
  return NS_OK;
}

AutoClipboardCommand::AutoClipboardCommand(const nsACString& aCommand) {
  mPrevious = sCommand;
  sCommand = nullptr;
  if (++sControllerDepth != 1 || sSuspended) {
    return;
  }
  if (aCommand.EqualsLiteral("cmd_copy")) {
    mOperation = eCopy;
  } else if (aCommand.EqualsLiteral("cmd_paste")) {
    mOperation = ePaste;
  } else {
    return;
  }
  sCommand = this;
  mActive = true;
}

AutoClipboardCommand::~AutoClipboardCommand() {
  --sControllerDepth;
  sCommand = mPrevious;
  if (!mActive) {
    return;
  }
  if (mRequest && !mRetry && mRequest->mCanceled) {
    NS_DispatchToCurrentThread(NS_NewRunnableFunction(
        "UmbrafoxClipboardOffer", [request = mRequest] { request->Offer(); }));
  }
}

void AutoClipboardCommand::BeforeClipboardEvent(Element& aTarget,
                                                Selection& aSelection,
                                                DataTransfer* aDataTransfer,
                                                EventMessage aOperation) {
  if (!sCommand || sSuspended || sCommand->mRequest ||
      sCommand->mOperation != aOperation) {
    return;
  }
  Element* target = ExposedElement(aTarget);
  if (target && Eligible(*target)) {
    sCommand->mRequest = new PendingClipboardRequest(*target, aSelection,
                                                     aDataTransfer, aOperation);
  }
}

void AutoClipboardCommand::AfterEvent(Element& aTarget, WidgetEvent& aEvent,
                                      nsEventStatus& aStatus) {
  if (!sCommand || sSuspended || !sCommand->mRequest) {
    return;
  }
  auto& request = *sCommand->mRequest;
  if (ExposedElement(aTarget) != request.mTarget) {
    return;
  }
  const bool clipboard = aEvent.mMessage == request.mOperation;
  const bool pasteInput = request.mOperation == ePaste &&
                          ((aEvent.mMessage == eEditorBeforeInput &&
                            aEvent.AsEditorInputEvent()->mInputType ==
                                EditorInputType::eInsertFromPaste) ||
                           (aEvent.mMessage == eLegacyTextInput &&
                            aEvent.AsLegacyTextEvent()->mInputType ==
                                EditorInputType::eInsertFromPaste));
  if (!clipboard && !pasteInput) {
    return;
  }
  if (!sCommand->mRetry) {
    request.mCanceled |= aEvent.mFlags.mDefaultPreventedByContent;
    return;
  }
  if (aEvent.mFlags.mDefaultPreventedByChrome ||
      !request.Fresh(request.mOperation == ePaste)) {
    request.mReplayBlocked = true;
    aStatus = nsEventStatus_eConsumeNoDefault;
  } else if (aEvent.mFlags.mDefaultPreventedByContent) {
    aStatus = nsEventStatus_eIgnore;
  }
}

bool AutoClipboardCommand::CanContinueCopy() {
  if (!sCommand || sSuspended || !sCommand->mRetry || !sCommand->mRequest) {
    return true;
  }
  bool fresh = sCommand->mRequest->Fresh(false);
  sCommand->mRequest->mReplayBlocked |= !fresh;
  return fresh;
}

bool AutoClipboardCommand::IsRetryingPaste() {
  return sCommand && !sSuspended && sCommand->mRetry &&
         sCommand->mOperation == ePaste;
}

AutoSuspendClipboardCommand::AutoSuspendClipboardCommand() { ++sSuspended; }
AutoSuspendClipboardCommand::~AutoSuspendClipboardCommand() { --sSuspended; }
}  // namespace mozilla
