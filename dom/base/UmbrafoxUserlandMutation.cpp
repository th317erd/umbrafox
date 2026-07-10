/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "UmbrafoxUserlandMutation.h"

#include "mozilla/Preferences.h"
#include "mozilla/dom/BrowsingContext.h"
#include "mozilla/dom/CharacterData.h"
#include "mozilla/dom/Document.h"
#include "mozilla/dom/Element.h"
#include "nsComponentManagerUtils.h"
#include "nsContentUtils.h"
#include "nsIContent.h"
#include "nsIObserverService.h"
#include "nsIWritablePropertyBag2.h"
#include "nsNameSpaceManager.h"
#include "nsServiceManagerUtils.h"

namespace mozilla::dom {

static constexpr char kUmbrafoxUserlandScriptsActivePref[] =
    "umbrafox.userlandScripts.active";
static constexpr char kUmbrafoxUserlandMutationAttemptTopic[] =
    "umbrafox-userland-mutation-attempt";

static uint32_t sUmbrafoxUserlandMutationDispatchDepth = 0;

static bool UmbrafoxUserlandScriptsActive() {
  return Preferences::GetBool(kUmbrafoxUserlandScriptsActivePref, false);
}

bool UmbrafoxUserlandMutation::ShouldDispatchMutation(nsINode* aTarget) {
  if (sUmbrafoxUserlandMutationDispatchDepth ||
      !UmbrafoxUserlandScriptsActive() || !aTarget) {
    return false;
  }
  if (!nsContentUtils::IsSafeToRunScript()) {
    return false;
  }

  Document* doc = aTarget->OwnerDoc();
  if (doc && doc->GetReadyStateEnum() != Document::READYSTATE_INTERACTIVE &&
      doc->GetReadyStateEnum() != Document::READYSTATE_COMPLETE) {
    return false;
  }

  BrowsingContext* browsingContext = doc ? doc->GetBrowsingContext() : nullptr;
  if (!browsingContext) {
    return false;
  }

  nsCOMPtr<nsIObserverService> obsService = services::GetObserverService();
  return obsService &&
         obsService->HasObservers(kUmbrafoxUserlandMutationAttemptTopic);
}

static already_AddRefed<nsIWritablePropertyBag2> CreateMutationBag(
    nsINode* aTarget, const nsACString& aKind) {
  if (!UmbrafoxUserlandMutation::ShouldDispatchMutation(aTarget)) {
    return nullptr;
  }

  Document* doc = aTarget->OwnerDoc();
  BrowsingContext* browsingContext = doc->GetBrowsingContext();

  nsCOMPtr<nsIWritablePropertyBag2> bag =
      do_CreateInstance("@mozilla.org/hash-property-bag;1");
  if (!bag) {
    return nullptr;
  }

  nsresult rv = bag->SetPropertyAsAUTF8String(u"kind"_ns, aKind);
  if (NS_FAILED(rv)) {
    return nullptr;
  }
  rv = bag->SetPropertyAsUint64(u"browsingContextId"_ns, browsingContext->Id());
  if (NS_FAILED(rv)) {
    return nullptr;
  }
  rv = bag->SetPropertyAsInterface(u"target"_ns, ToSupports(aTarget));
  if (NS_FAILED(rv)) {
    return nullptr;
  }
  rv = bag->SetPropertyAsBool(u"cancelled"_ns, false);
  if (NS_FAILED(rv)) {
    return nullptr;
  }

  return bag.forget();
}

static void NotifyMutationObserver(nsIWritablePropertyBag2* aBag) {
  if (!aBag || sUmbrafoxUserlandMutationDispatchDepth > 32) {
    return;
  }

  ++sUmbrafoxUserlandMutationDispatchDepth;
  nsCOMPtr<nsIObserverService> obsService = services::GetObserverService();
  if (obsService) {
    (void)obsService->NotifyObservers(
        aBag, kUmbrafoxUserlandMutationAttemptTopic, nullptr);
  }
  --sUmbrafoxUserlandMutationDispatchDepth;
}

static bool BagCancelled(nsIWritablePropertyBag2* aBag) {
  bool cancelled = false;
  return aBag &&
         NS_SUCCEEDED(aBag->GetPropertyAsBool(u"cancelled"_ns, &cancelled)) &&
         cancelled;
}

static void SetNodeProperty(nsIWritablePropertyBag2* aBag,
                            const nsAString& aName, nsINode* aNode) {
  if (aNode) {
    (void)aBag->SetPropertyAsInterface(aName, ToSupports(aNode));
  }
}

static void SetOptionalStringProperty(nsIWritablePropertyBag2* aBag,
                                      const nsAString& aName,
                                      const nsAString* aValue) {
  if (aValue) {
    (void)aBag->SetPropertyAsAString(aName, *aValue);
  } else {
    (void)aBag->SetPropertyAsAString(aName, u""_ns);
  }
}

static void SetNamespaceProperty(nsIWritablePropertyBag2* aBag,
                                 int32_t aNamespaceID) {
  nsAutoString namespaceURI;
  if (aNamespaceID == kNameSpaceID_None) {
    namespaceURI.SetIsVoid(true);
  } else {
    nsNameSpaceManager::GetInstance()->GetNameSpaceURI(aNamespaceID,
                                                       namespaceURI);
  }
  (void)aBag->SetPropertyAsAString(u"attributeNamespace"_ns, namespaceURI);
}

bool UmbrafoxUserlandMutation::MaybeDispatchChildListMutation(
    nsINode* aTarget, const nsACString& aOperation, nsIContent* aAddedNode,
    nsIContent* aRemovedNode, nsIContent* aPreviousSibling,
    nsIContent* aNextSibling, ChildListDecision* aDecision) {
  if (aDecision) {
    *aDecision = ChildListDecision();
  }

  nsCOMPtr<nsIWritablePropertyBag2> bag =
      CreateMutationBag(aTarget, "childList"_ns);
  if (!bag) {
    return true;
  }

  (void)bag->SetPropertyAsAUTF8String(u"operation"_ns, aOperation);
  SetNodeProperty(bag, u"addedNode"_ns, aAddedNode);
  SetNodeProperty(bag, u"removedNode"_ns, aRemovedNode);
  SetNodeProperty(bag, u"previousSibling"_ns, aPreviousSibling);
  SetNodeProperty(bag, u"nextSibling"_ns, aNextSibling);
  (void)bag->SetPropertyAsBool(u"hasAddedNode"_ns, !!aAddedNode);
  (void)bag->SetPropertyAsBool(u"hasRemovedNode"_ns, !!aRemovedNode);
  (void)bag->SetPropertyAsBool(u"hasPreviousSibling"_ns, !!aPreviousSibling);
  (void)bag->SetPropertyAsBool(u"hasNextSibling"_ns, !!aNextSibling);
  (void)bag->SetPropertyAsBool(u"hasReplacementNode"_ns, false);

  NotifyMutationObserver(bag);

  if (BagCancelled(bag)) {
    if (aDecision) {
      aDecision->mCancelled = true;
    }
    return false;
  }

  bool hasReplacementNode = false;
  if (aDecision &&
      NS_SUCCEEDED(bag->GetPropertyAsBool(u"hasReplacementNode"_ns,
                                          &hasReplacementNode)) &&
      hasReplacementNode) {
    nsCOMPtr<nsINode> replacementNode =
        do_GetProperty(bag, u"replacementNode"_ns);
    aDecision->mReplacementNode = replacementNode;
  }

  return true;
}

bool UmbrafoxUserlandMutation::MaybeDispatchAttributeMutation(
    Element* aTarget, int32_t aNamespaceID, nsAtom* aName,
    const nsAString* aOldValue, nsAString& aNewValue) {
  nsCOMPtr<nsIWritablePropertyBag2> bag =
      CreateMutationBag(aTarget, "attribute"_ns);
  if (!bag) {
    return true;
  }

  nsAutoString attributeName;
  aName->ToString(attributeName);

  (void)bag->SetPropertyAsAString(u"attributeName"_ns, attributeName);
  SetNamespaceProperty(bag, aNamespaceID);
  (void)bag->SetPropertyAsBool(u"hasOldValue"_ns, !!aOldValue);
  (void)bag->SetPropertyAsBool(u"hasNewValue"_ns, true);
  SetOptionalStringProperty(bag, u"oldValue"_ns, aOldValue);
  (void)bag->SetPropertyAsAString(u"newValue"_ns, aNewValue);

  NotifyMutationObserver(bag);

  if (BagCancelled(bag)) {
    return false;
  }

  bool hasNewValue = true;
  if (NS_FAILED(bag->GetPropertyAsBool(u"hasNewValue"_ns, &hasNewValue)) ||
      !hasNewValue) {
    return false;
  }

  nsAutoString newValue;
  if (NS_SUCCEEDED(bag->GetPropertyAsAString(u"newValue"_ns, newValue))) {
    aNewValue = newValue;
  }

  return true;
}

bool UmbrafoxUserlandMutation::MaybeDispatchAttributeRemoval(
    Element* aTarget, int32_t aNamespaceID, nsAtom* aName,
    const nsAString& aOldValue) {
  nsCOMPtr<nsIWritablePropertyBag2> bag =
      CreateMutationBag(aTarget, "attribute"_ns);
  if (!bag) {
    return true;
  }

  nsAutoString attributeName;
  aName->ToString(attributeName);

  (void)bag->SetPropertyAsAString(u"attributeName"_ns, attributeName);
  SetNamespaceProperty(bag, aNamespaceID);
  (void)bag->SetPropertyAsBool(u"hasOldValue"_ns, true);
  (void)bag->SetPropertyAsBool(u"hasNewValue"_ns, false);
  (void)bag->SetPropertyAsAString(u"oldValue"_ns, aOldValue);
  (void)bag->SetPropertyAsAString(u"newValue"_ns, u""_ns);

  NotifyMutationObserver(bag);

  return !BagCancelled(bag);
}

bool UmbrafoxUserlandMutation::MaybeDispatchCharacterDataMutation(
    CharacterData* aTarget, const nsAString& aOldData, nsAString& aNewData) {
  nsCOMPtr<nsIWritablePropertyBag2> bag =
      CreateMutationBag(aTarget, "characterData"_ns);
  if (!bag) {
    return true;
  }

  (void)bag->SetPropertyAsAString(u"oldData"_ns, aOldData);
  (void)bag->SetPropertyAsAString(u"newData"_ns, aNewData);

  NotifyMutationObserver(bag);

  if (BagCancelled(bag)) {
    return false;
  }

  nsAutoString newData;
  if (NS_SUCCEEDED(bag->GetPropertyAsAString(u"newData"_ns, newData))) {
    aNewData = newData;
  }

  return true;
}

}  // namespace mozilla::dom
